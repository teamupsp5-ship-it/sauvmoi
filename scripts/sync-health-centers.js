#!/usr/bin/env node
// scripts/sync-health-centers.js — synchronise la table Supabase
// health_centers depuis l'API healthsites.io (données OpenStreetMap,
// licence ODbL — voir CLAUDE.md, section Localisation).
//
// Exécution manuelle :
//   node scripts/sync-health-centers.js
//
// Variables d'environnement requises : HEALTHSITES_API_KEY,
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (ce projet n'utilise pas dotenv,
// voir .env.example — soit exportées dans le shell, soit via
// `node --env-file=.env scripts/sync-health-centers.js` sur Node 20.6+).
//
// Prévu pour être programmé en tâche cron sur o2switch (cPanel → Cron
// Jobs) — script autonome, jamais importé ni appelé par src/server.js.
//
// ⚠️ IMPORTANT — format de réponse non vérifié contre un appel réel :
// au moment où ce script a été écrit, la clé HEALTHSITES_API_KEY n'était
// pas encore approuvée par healthsites.io. Les PARAMÈTRES de requête
// (api-key, page, country, output, flat-properties) viennent de la
// documentation officielle (https://healthsites.io/api/docs/), vérifiée
// directement. Les noms de CHAMPS dans chaque `properties` GeoJSON sont
// en revanche déduits des conventions de tags OpenStreetMap standard
// (amenity, healthcare, name, phone, contact:phone, addr:*) et
// d'exemples communautaires, pas d'une réponse authentifiée observée.
// mapFeatureToRow() ci-dessous est la fonction à ajuster en priorité si
// le tout premier sync réel échoue ou produit des lignes inattendues —
// sa logique est testée avec des données factices dans
// scripts/sync-health-centers.test.js (aucun appel réseau).

import { pathToFileURL } from 'node:url';

// Import DYNAMIQUE (pas statique en tête de fichier, volontairement) :
// src/supabase.js construit son client au chargement du module via
// createClient(SUPABASE_URL, ...), qui échoue immédiatement si ces
// variables sont absentes. En important
// paresseusement, ce fichier reste chargeable pour ses seules fonctions
// pures (resolveType/mapFeatureToRow) par scripts/sync-health-centers.test.js
// sans exiger de vraies variables Supabase pour un test qui ne touche
// jamais réellement la base.
async function getSupabase() {
  const { supabase } = await import('../src/supabase.js');
  return supabase;
}

const API_KEY = process.env.HEALTHSITES_API_KEY;
const COUNTRY = "Côte d'Ivoire";
const BASE_URL = 'https://healthsites.io/api/v3/facilities/';
const BATCH_SIZE = 500; // upsert par lots — une table nationale peut compter plusieurs milliers de lignes, un seul appel risquerait une charge/timeout excessifs
const MAX_PAGES = 500; // garde-fou : arrête la pagination même si l'API ne renvoie jamais de page vide (évite une boucle infinie en tâche cron non surveillée)

// ─── Tags OSM → taxonomie interne ───────────────────────────────────────────
// Mêmes valeurs que la contrainte CHECK sur health_centers.type
// (supabase/schema.sql). `healthcare` est consulté avant `amenity` : plus
// spécifique quand les deux tags sont présents sur un même établissement.
const TYPE_MAP = {
  hospital: 'hopital',
  clinic: 'clinique',
  doctors: 'clinique',
  pharmacy: 'pharmacie',
  health_post: 'centre_sante',
  centre: 'centre_sante',
  community_health_center: 'centre_sante',
  dispensary: 'centre_sante',
};

export function resolveType(properties) {
  const raw = String(properties.healthcare || properties.amenity || '').toLowerCase();
  return TYPE_MAP[raw] || 'autre';
}

// ─── Un feature GeoJSON healthsites.io → une ligne health_centers ──────────
// Défensif par construction (voir l'avertissement en tête de fichier) :
// plusieurs noms de champs plausibles essayés dans l'ordre, jamais
// d'exception levée pour un champ manquant — un feature inexploitable est
// simplement ignoré (retourne null) plutôt que de faire échouer tout le
// sync pour une seule mauvaise ligne.
export function mapFeatureToRow(feature) {
  const props = feature.properties || {};
  const coords = feature.geometry?.coordinates || [];
  const [lng, lat] = coords;
  const osmType = props.osm_type || props.type || 'node';
  const osmId = props.osm_id ?? props.id;

  if (osmId == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const streetAddress = [props['addr:housenumber'], props['addr:street']].filter(Boolean).join(' ');
  const address = props['addr:full'] || streetAddress || props['addr:city'] || null;

  return {
    id: `${osmType}/${osmId}`,
    name: props.name || 'Établissement de santé',
    type: resolveType(props),
    lat,
    lng,
    phone: props.phone || props['contact:phone'] || null,
    address,
    source: 'healthsites.io',
    synced_at: new Date().toISOString(),
  };
}

// ─── Récupération paginée ───────────────────────────────────────────────────
// La documentation officielle ne précise pas de champ "page suivante" ou de
// total explicite (voir avertissement en tête de fichier) — la convention
// suivie ici est d'incrémenter `page` jusqu'à une réponse sans résultat.
export async function fetchAllFeatures() {
  const features = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${BASE_URL}?api-key=${encodeURIComponent(API_KEY)}`
      + `&page=${page}`
      + `&country=${encodeURIComponent(COUNTRY)}`
      + `&output=geojson`
      + `&flat-properties=true`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`healthsites.io a répondu ${res.status} ${res.statusText} à la page ${page}`);
    }
    const body = await res.json();
    const pageFeatures = body.features || [];
    if (pageFeatures.length === 0) break;

    features.push(...pageFeatures);
    console.log(`[sync-health-centers] page ${page} : ${pageFeatures.length} établissement(s) (total cumulé : ${features.length}).`);

    if (page === MAX_PAGES) {
      console.warn(`[sync-health-centers] garde-fou MAX_PAGES (${MAX_PAGES}) atteint — arrêt de la pagination même si l'API avait peut-être encore des résultats. Augmenter MAX_PAGES si ce message apparaît en usage réel.`);
    }
  }
  return features;
}

// ─── Écriture Supabase, par lots ────────────────────────────────────────────
async function upsertInBatches(rows) {
  const supabase = await getSupabase();
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('health_centers').upsert(batch, { onConflict: 'id' });
    if (error) {
      throw new Error(`upsert Supabase échoué (lot ${Math.floor(i / BATCH_SIZE) + 1}, lignes ${i + 1}-${i + batch.length}) : ${error.message}`);
    }
    done += batch.length;
    console.log(`[sync-health-centers] lot ${Math.floor(i / BATCH_SIZE) + 1} synchronisé (${done}/${rows.length}).`);
  }
  return done;
}

async function main() {
  if (!API_KEY) {
    console.error('[sync-health-centers] HEALTHSITES_API_KEY manquante dans l\'environnement — abandon.');
    process.exit(1);
  }

  console.log(`[sync-health-centers] Récupération des établissements de santé pour ${COUNTRY}...`);
  const features = await fetchAllFeatures();
  console.log(`[sync-health-centers] ${features.length} établissement(s) récupéré(s) depuis healthsites.io.`);

  const rows = features.map(mapFeatureToRow).filter(Boolean);
  const skipped = features.length - rows.length;
  if (skipped > 0) {
    console.warn(`[sync-health-centers] ${skipped} établissement(s) ignoré(s) (identifiant ou coordonnées manquants/invalides).`);
  }

  if (rows.length === 0) {
    // N'écrit jamais une table vide par erreur (ex. réponse API inattendue,
    // format de champs différent de ce qui est supposé ici) — mieux vaut un
    // échec explicite qui laisse la table telle quelle (seed manuel ou
    // dernier sync réussi) qu'une purge silencieuse.
    console.error('[sync-health-centers] Aucune ligne exploitable dans la réponse — abandon SANS écrire dans Supabase.');
    process.exit(1);
  }

  const synced = await upsertInBatches(rows);
  console.log(`[sync-health-centers] Terminé : ${features.length} établissement(s) récupéré(s), ${synced} synchronisé(s) (insérés ou mis à jour) dans Supabase.`);
}

// N'exécute le sync réel que si ce fichier est lancé directement
// (`node scripts/sync-health-centers.js`) — pas quand il est importé pour
// ses fonctions pures (resolveType/mapFeatureToRow), ex. par
// scripts/sync-health-centers.test.js, qui ne doit jamais déclencher un
// vrai appel réseau ni toucher Supabase. Comparaison via pathToFileURL
// (pas une simple concaténation `file://${...}`) : sur Windows,
// import.meta.url utilise des slashs avant-arrière et un préfixe
// `file:///C:/...` alors que process.argv[1] reste au format natif
// `C:\...\` — une concaténation directe ne matche jamais sur cette
// plateforme.
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((e) => {
    console.error('[sync-health-centers] Échec :', e.message);
    process.exit(1);
  });
}
