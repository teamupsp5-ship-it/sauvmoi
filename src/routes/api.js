import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { get, save, uid } from '../store.js';
import {
  EMERGENCY_LIST, COURSES, TRAINING_PATH, RESCUERS,
  PAYMENT_METHODS, TIPS, DEMO_USER,
} from '../data/seed.js';
import { PROTOCOLS } from '../data/protocols.js';
import { EMERGENCY_NUMBERS } from '../data/emergency-numbers.js';
import { analyzeImage } from '../ai.js';
import { supabase } from '../supabase.js';
import { requireAuth } from './auth.js';
import { validateProofDataUrl } from '../validate.js';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { buildMedicalCardSvg, buildUnavailableCardSvg } from '../medical-card.js';

// URL publique du backend, encodée dans le QR médical (image PNG, voir plus
// bas) — même convention que public/api-client.js (BASE hardcodée, override
// possible pour le dev local).
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://sauvmoi.onrender.com';
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

// ─── Signature HMAC de la fiche médicale publique ──────────────────────────
// gen/exp voyagent en clair dans l'URL (route publique sans session, voir
// Décisions techniques dans CLAUDE.md) — sans signature, n'importe qui peut
// appeler /public/medical-card/<id>.png sans le paramètre exp et la fiche ne
// périme jamais, avec les données Supabase toujours à jour (la route relit
// la base à chaque appel). La signature garantit que gen/exp n'ont pas été
// altérés ou retirés par le client ; la révocation (qr_generated_at,
// vérifiée plus bas) garantit en plus qu'une URL signée mais périmée par une
// régénération plus récente ne reste pas valable jusqu'à son exp d'origine.
//
// Échec fermé : sans MEDICAL_CARD_SECRET, ni la génération ni la lecture ne
// doivent fonctionner — jamais de repli silencieux sur un fonctionnement non
// signé, ce serait revenir exactement à la faille corrigée ici.
function getMedicalCardSecret() {
  return process.env.MEDICAL_CARD_SECRET || null;
}

function signMedicalCard(id, gen, exp) {
  const secret = getMedicalCardSecret();
  if (!secret) throw new Error('MEDICAL_CARD_SECRET manquant');
  return createHmac('sha256', secret).update(`${id}:${gen}:${exp}`).digest('hex');
}

const SIG_RE = /^[0-9a-f]{64}$/i;

// Comparaison en temps constant (timingSafeEqual) plutôt que === : une
// comparaison de chaîne naïve sort dès le premier caractère différent, ce
// qui fuit un peu d'information temporelle sur le nombre de caractères
// corrects — sans intérêt pratique ici vu le volume de trafic attendu, mais
// c'est la façon correcte de comparer un HMAC et ça ne coûte rien.
function verifyMedicalCardSignature(id, gen, exp, sig) {
  const secret = getMedicalCardSecret();
  if (!secret || typeof sig !== 'string' || !SIG_RE.test(sig)) return false;
  const expected = createHmac('sha256', secret).update(`${id}:${gen}:${exp}`).digest('hex');
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig.toLowerCase(), 'hex'));
}

// Charge le profil + contacts Supabase pour un id donné et les met en forme
// pour la carte médicale (PNG publique) et la fiche victime (JSON interne à
// l'app) — partagé par les deux routes /public/medical-card/:file ci-dessous.
// qrGeneratedAt (colonne profiles.qr_generated_at, voir supabase/schema.sql)
// sert à la vérification de révocation dans la route publique : mémorise la
// dernière génération réelle de QR pour ce profil, indépendamment de la
// signature de l'URL présentée.
async function loadMedicalCardData(id) {
  const [{ data: profile, error: profileErr }, { data: contactsRows, error: contactsErr }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase.from('emergency_contacts').select('*').eq('user_id', id),
  ]);
  if (profileErr) throw profileErr;
  if (contactsErr) throw contactsErr;
  if (!profile) return null;

  // Même principe que pour le GPS (LOT 1) : ne jamais présenter comme mesuré
  // ce qui ne l'est pas. Une date de naissance absente laisse `dob` null (déjà
  // couvert), mais une date INVALIDE (chaîne corrompue, format inattendu) crée
  // un objet Date "Invalid Date" — toujours truthy — dont la soustraction
  // donne NaN, pas 0. Sans le garde isNaN ci-dessous, ce NaN se propagerait
  // jusqu'à l'affichage. Un âge négatif (date de naissance dans le futur,
  // erreur de saisie) est tout aussi invalide et écarté de la même façon —
  // désormais aussi refusé à la saisie (validate.js), mais une donnée déjà
  // en base avant ce correctif doit rester sans effet ici.
  //
  // ageDays (nombre de jours entiers depuis la naissance) plutôt qu'un
  // décompte en années : lot 7 — un nourrisson né la veille affichait
  // « 0 ans », arithmétiquement exact mais trompeur pour un secouriste
  // pressé. formatAge() (frames.jsx côté frontend, medical-card.js côté
  // PNG) choisit lui-même l'unité adaptée (années / mois+semaines /
  // semaines+jours / jours) à partir de cette seule valeur brute — une
  // fonction de formatage partagée par surface plutôt que de renvoyer un
  // format déjà figé qui ne conviendrait qu'à un cas.
  const dob = profile.birthdate ? new Date(profile.birthdate) : null;
  const rawDays = dob ? Math.floor((Date.now() - dob) / (24 * 3600 * 1000)) : null;
  const ageDays = (rawDays != null && Number.isFinite(rawDays) && rawDays >= 0) ? rawDays : null;
  const allergies = (profile.allergies || '').split(',').map((a) => a.trim()).filter(Boolean);
  const conditions = (profile.conditions || '').split(',').map((c) => c.trim()).filter(Boolean);
  return {
    id,
    nom: profile.name || '',
    ageDays,
    bloodType: profile.blood_type || '',
    // Statut du justificatif (lot 8) — jamais le chemin Storage lui-même :
    // cette fonction alimente à la fois la fiche victime et la carte PNG
    // PUBLIQUES, qui ne doivent montrer que le statut, jamais le document.
    bloodTypeStatus: profile.blood_type_status || 'declared',
    allergies,
    conditions,
    contacts: (contactsRows || []).map((c) => ({ name: c.name, phone: c.phone, relation: c.relation })),
    qrGeneratedAt: profile.qr_generated_at ? new Date(profile.qr_generated_at).getTime() : null,
  };
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const router = Router();

// ─── Config publique (frontend) ──────────────────────────────────────────────
// SUPABASE_ANON_KEY est conçue pour être publique (contrairement à
// SUPABASE_SERVICE_ROLE_KEY, jamais exposée ici) — nécessaire côté navigateur
// pour l'OAuth Google (supabase.auth.signInWithOAuth), qui doit s'exécuter
// depuis le client. Sans templating côté serveur (fichiers statiques purs),
// cette route est le seul moyen de transmettre l'URL/clé au frontend.
router.get('/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
  });
});

// Source unique des numéros d'urgence (voir data/emergency-numbers.js) —
// route publique (aucune donnée sensible) pour que tout écran frontend qui a
// besoin d'afficher SAMU/Pompiers/Police les obtienne d'un seul endroit
// plutôt que de les recoder en dur (cause du lot 7 : SOS et prompt IA
// affichaient deux numéros de police différents).
router.get('/emergency-numbers', (req, res) => {
  res.json(EMERGENCY_NUMBERS);
});

// ─── AUTH : téléphone + OTP (standard Afrique de l'Ouest) ───────────────────
router.post('/auth/request-otp', (req, res) => {
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'phone requis' });
  const code = '123456'; // démo : code fixe (en prod → SMS via agrégateur)
  get().otps[phone] = code;
  save();
  res.json({ sent: true, channel: 'sms', demoCode: code }); // demoCode affiché pour la démo
});

router.post('/auth/verify', (req, res) => {
  const { phone, code } = req.body || {};
  if (get().otps[phone] !== code) return res.status(401).json({ error: 'code invalide' });
  delete get().otps[phone];
  const user = { ...DEMO_USER, phone };
  get().users[user.id] = user;
  save();
  res.json({ token: `demo.${user.id}`, user });
});

// GET /me et PUT /me ont été déplacés dans routes/auth.js (requireAuth +
// table Supabase profiles) — l'ancien /me ici ignorait complètement
// l'utilisateur connecté et ne mutait que le DEMO_USER partagé.

// ─── ACCUEIL ────────────────────────────────────────────────────────────────
router.get('/home', (req, res) => {
  const now = new Date();
  res.json({
    greeting: `Bonjour ${DEMO_USER.name.split(' ')[0]}`,
    date: now.toISOString(),
    city: DEMO_USER.city,
    tipOfDay: TIPS[0],
    quick: {
      training: DEMO_USER.training,
      rescuersNearby: RESCUERS.length,
      medical: { bloodType: DEMO_USER.medicalRecord.bloodType, allergies: DEMO_USER.medicalRecord.allergies.length },
    },
  });
});

router.get('/tips', (req, res) => res.json(TIPS));

// ─── URGENCES & PROTOCOLES ───────────────────────────────────────────────────
router.get('/emergencies', (req, res) => res.json(EMERGENCY_LIST));

router.get('/protocols/:id', (req, res) => {
  const p = PROTOCOLS[req.params.id];
  if (!p) return res.status(404).json({ error: 'protocole inconnu' });
  res.json({ ...p, disclaimer: "Contenu pédagogique. En urgence vitale, appelez le 185." });
});

router.post('/vision/analyze', (req, res) => {
  // En prod : recevoir une image et appeler un modèle de vision.
  res.json(analyzeImage());
});

// ─── FORMATIONS ──────────────────────────────────────────────────────────────
router.get('/training/path', (req, res) => res.json(TRAINING_PATH));

router.get('/training/courses', (req, res) => {
  const { filter } = req.query;
  let list = COURSES;
  if (filter === 'free') list = COURSES.filter((c) => c.tag === 'free');
  if (filter === 'premium') list = COURSES.filter((c) => c.tag === 'premium');
  res.json(list);
});

router.get('/training/me', (req, res) => res.json(DEMO_USER.training));

router.post('/training/progress', (req, res) => {
  const { xp = 0 } = req.body || {};
  DEMO_USER.training.xp += xp;
  res.json(DEMO_USER.training);
});

// ─── PAIEMENTS Mobile Money (simulés) ────────────────────────────────────────
router.get('/payments/methods', (req, res) => res.json(PAYMENT_METHODS));

router.post('/payments/initiate', (req, res) => {
  const { courseId, method, phone } = req.body || {};
  const course = COURSES.find((c) => c.id === courseId);
  if (!course) return res.status(404).json({ error: 'cours inconnu' });
  if (!PAYMENT_METHODS.some((m) => m.id === method)) return res.status(400).json({ error: 'moyen de paiement invalide' });
  const id = uid('pay');
  const payment = {
    id, courseId, method, phone,
    amountFcfa: course.priceFcfa,
    status: 'pending',
    ussdPrompt: method === 'visa' ? null : 'Validez la transaction sur votre téléphone (#144#)',
    createdAt: Date.now(),
  };
  get().payments[id] = payment;
  save();
  res.json(payment);
});

// callback simulé (en prod : webhook de l'agrégateur type CinetPay/PayDunya)
router.post('/payments/:id/confirm', (req, res) => {
  const p = get().payments[req.params.id];
  if (!p) return res.status(404).json({ error: 'paiement inconnu' });
  p.status = 'success';
  p.confirmedAt = Date.now();
  save();
  res.json(p);
});

router.get('/payments/:id', (req, res) => {
  const p = get().payments[req.params.id];
  if (!p) return res.status(404).json({ error: 'paiement inconnu' });
  res.json(p);
});

// ─── CARNET MÉDICAL & QR ─────────────────────────────────────────────────────
router.get('/medical-record', (req, res) => res.json(DEMO_USER.medicalRecord));

router.put('/medical-record', (req, res) => {
  DEMO_USER.medicalRecord = { ...DEMO_USER.medicalRecord, ...(req.body || {}) };
  res.json(DEMO_USER.medicalRecord);
});

// Construit la réponse {payload, qrDataUrl, url} pour un id/gen déjà connus
// (soit rechargés depuis qr_generated_at, soit tout juste écrits par une
// régénération) — partagé par GET /medical-record/qr et
// POST /medical-record/qr/regenerate pour ne pas dupliquer la construction
// de l'URL signée. exp est TOUJOURS dérivé de gen (jamais de Date.now()) :
// c'est ce qui garantit que l'URL — donc le contenu du QR affiché — reste
// strictement identique tant que gen ne change pas, même consultée des
// dizaines de fois.
async function buildQrResponse(userId, gen, data) {
  const expiresAt = gen + SIX_MONTHS_MS;
  const payload = { ...(data || { id: userId, nom: '', ageDays: null, bloodType: '', bloodTypeStatus: 'declared', allergies: [], conditions: [], contacts: [] }), generatedAt: gen, expiresAt };
  const sig = signMedicalCard(userId, gen, expiresAt);
  const url = `${PUBLIC_BASE_URL}/api/public/medical-card/${userId}.png?gen=${gen}&exp=${expiresAt}&sig=${sig}`;
  const qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
  return { payload, qrDataUrl, url };
}

// Lecture pure : NE régénère jamais. Ouvrir l'écran "Mon QR médical" ne doit
// pas invalider une carte déjà imprimée — seule une régénération EXPLICITE
// (POST .../regenerate ci-dessous) doit écrire un nouveau qr_generated_at.
// Si aucun QR n'a jamais été généré pour ce profil, celui-ci en crée un une
// seule fois (premier accès à l'écran) ; sinon elle réutilise tel quel
// l'horodatage déjà stocké, donc la même URL/signature à chaque appel.
router.get('/medical-record/qr', requireAuth, async (req, res) => {
  // Échec fermé : jamais de QR non signé émis, quoi qu'il arrive.
  if (!getMedicalCardSecret()) {
    console.error('[medical-card] MEDICAL_CARD_SECRET absent — génération de QR refusée (échec fermé)');
    return res.status(500).json({ error: 'Configuration serveur invalide — QR médical indisponible' });
  }
  res.set('Cache-Control', 'no-store'); // données de santé — jamais en cache
  res.set('Pragma', 'no-cache');
  try {
    const data = await loadMedicalCardData(req.user.id);
    let gen = data?.qrGeneratedAt;
    if (gen == null) {
      gen = Date.now();
      const { error: revokeErr } = await supabase
        .from('profiles')
        .update({ qr_generated_at: new Date(gen).toISOString() })
        .eq('id', req.user.id);
      if (revokeErr) throw revokeErr;
    }
    res.json(await buildQrResponse(req.user.id, gen, data));
  } catch (e) {
    res.status(500).json({ error: 'Génération QR échouée', detail: e.message });
  }
});

// Régénération EXPLICITE — seule route qui écrit un nouveau qr_generated_at.
// Invalide immédiatement toute carte imprimée ou partagée précédemment (la
// route publique refuse tout gen antérieur à cette nouvelle valeur, voir
// plus bas) : le frontend doit exiger une confirmation explicite de
// l'utilisateur avant d'appeler cette route (voir screen-qr-code.jsx).
router.post('/medical-record/qr/regenerate', requireAuth, async (req, res) => {
  if (!getMedicalCardSecret()) {
    console.error('[medical-card] MEDICAL_CARD_SECRET absent — régénération de QR refusée (échec fermé)');
    return res.status(500).json({ error: 'Configuration serveur invalide — QR médical indisponible' });
  }
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  try {
    const gen = Date.now();
    // Même garde-fou anti-échec-silencieux que le reste de l'app (voir
    // PUT /me) : .select() + vérification qu'une ligne a bien été retournée.
    const { data: updatedProfile, error: revokeErr } = await supabase
      .from('profiles')
      .update({ qr_generated_at: new Date(gen).toISOString() })
      .eq('id', req.user.id)
      .select()
      .maybeSingle();
    if (revokeErr) throw revokeErr;
    if (!updatedProfile) throw new Error('Profil introuvable pour cet utilisateur — régénération non appliquée');

    const data = await loadMedicalCardData(req.user.id);
    res.json(await buildQrResponse(req.user.id, gen, data));
  } catch (e) {
    res.status(500).json({ error: 'Régénération du QR échouée', detail: e.message });
  }
});

const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 Mo, même limite que la photo de profil

// Extension déduite du MIME déjà validé (jamais du nom de fichier fourni par
// le client — tout arrive en data URL, sans nom) : sert au chemin de
// stockage et au Content-Type de relecture.
const PROOF_EXT_BY_MIME = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf',
};

// ─── Justificatif de groupe sanguin (lot 8) ──────────────────────────────────
// Bucket Storage PRIVÉ 'blood-type-proofs' (voir supabase/schema.sql) —
// jamais d'URL publique ni de lien signé transmis au client : chaque accès
// passe par une de ces trois routes, avec requireAuth, et le chemin
// s'appuie toujours sur req.user.id (jamais un id fourni par le client) —
// un compte ne peut donc jamais, même en trafiquant la requête, atteindre
// le chemin de stockage d'un autre.
router.post('/medical-record/blood-type-proof', requireAuth, async (req, res) => {
  const { file } = req.body || {};
  const check = validateProofDataUrl(file, MAX_PROOF_BYTES);
  if (!check.ok) return res.status(400).json({ error: check.error });

  try {
    const { data: current } = await supabase
      .from('profiles')
      .select('blood_type_proof_path')
      .eq('id', req.user.id)
      .maybeSingle();

    const ext = PROOF_EXT_BY_MIME[check.mime];
    const path = `${req.user.id}/proof.${ext}`;
    const buffer = Buffer.from(file.slice(file.indexOf(',') + 1), 'base64');

    // Ancien fichier supprimé s'il avait une extension différente — upsert
    // écrase déjà le même chemin, mais pas un chemin différent (ex. un
    // ancien PDF remplacé par un JPEG ne serait jamais nettoyé sinon).
    if (current?.blood_type_proof_path && current.blood_type_proof_path !== path) {
      await supabase.storage.from('blood-type-proofs').remove([current.blood_type_proof_path]);
    }

    const { error: uploadErr } = await supabase.storage
      .from('blood-type-proofs')
      .upload(path, buffer, { contentType: check.mime, upsert: true });
    if (uploadErr) throw uploadErr;

    // Un ajout de justificatif n'est JAMAIS une validation : statut "en
    // attente" jusqu'à ce qu'un médecin l'examine (aucune interface de
    // validation n'existe encore, voir blood_type_verified_by) — jamais
    // "vérifié" ici, même si l'écriture réussit.
    const { data: updatedProfile, error: updateErr } = await supabase
      .from('profiles')
      .update({
        blood_type_status: 'pending',
        blood_type_proof_path: path,
        blood_type_verified_at: null,
        blood_type_verified_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select()
      .maybeSingle();
    if (updateErr) throw updateErr;
    if (!updatedProfile) throw new Error('Profil introuvable pour cet utilisateur — justificatif non enregistré');

    res.json({ bloodTypeStatus: updatedProfile.blood_type_status, hasBloodTypeProof: true });
  } catch (e) {
    console.error('[api] upload justificatif groupe sanguin échoué pour', req.user.id, ':', e.message);
    res.status(500).json({ error: "Échec de l'envoi du justificatif" });
  }
});

router.delete('/medical-record/blood-type-proof', requireAuth, async (req, res) => {
  try {
    const { data: current } = await supabase
      .from('profiles')
      .select('blood_type_proof_path')
      .eq('id', req.user.id)
      .maybeSingle();

    if (current?.blood_type_proof_path) {
      const { error: removeErr } = await supabase.storage.from('blood-type-proofs').remove([current.blood_type_proof_path]);
      if (removeErr) throw removeErr;
    }

    const { data: updatedProfile, error: updateErr } = await supabase
      .from('profiles')
      .update({
        blood_type_status: 'declared',
        blood_type_proof_path: null,
        blood_type_verified_at: null,
        blood_type_verified_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select()
      .maybeSingle();
    if (updateErr) throw updateErr;
    if (!updatedProfile) throw new Error('Profil introuvable pour cet utilisateur — retrait non appliqué');

    res.json({ bloodTypeStatus: updatedProfile.blood_type_status, hasBloodTypeProof: false });
  } catch (e) {
    console.error('[api] retrait justificatif groupe sanguin échoué pour', req.user.id, ':', e.message);
    res.status(500).json({ error: 'Échec du retrait du justificatif' });
  }
});

// Lecture du document lui-même — jamais d'URL publique/signée transmise au
// client : le backend télécharge depuis Storage (service_role) et relaie les
// octets directement. requireAuth authentifie l'appelant ; le chemin relu
// vient de LA LIGNE profiles du même req.user.id (jamais d'id fourni par le
// client), donc structurellement impossible d'atteindre le justificatif
// d'un autre compte via cette route.
router.get('/medical-record/blood-type-proof', requireAuth, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('blood_type_proof_path')
      .eq('id', req.user.id)
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!profile?.blood_type_proof_path) return res.status(404).json({ error: 'Aucun justificatif' });

    const { data: fileData, error: downloadErr } = await supabase.storage
      .from('blood-type-proofs')
      .download(profile.blood_type_proof_path);
    if (downloadErr) throw downloadErr;

    const ext = profile.blood_type_proof_path.split('.').pop();
    const mime = Object.entries(PROOF_EXT_BY_MIME).find(([, e]) => e === ext)?.[0] || 'application/octet-stream';
    const buffer = Buffer.from(await fileData.arrayBuffer());
    res.type(mime);
    res.send(buffer);
  } catch (e) {
    console.error('[api] lecture justificatif groupe sanguin échouée pour', req.user.id, ':', e.message);
    res.status(500).json({ error: 'Lecture du justificatif échouée' });
  }
});

// ─── Carte médicale publique (image PNG) ─────────────────────────────────────
// Aucune authentification : c'est le contenu même du QR imprimé/affiché,
// destiné à être lu par un appareil photo/scanner tiers, pas seulement par
// l'app Sauv'Moi. Route à deux formats sur le même id :
//   .png  → image rasterisée (usage principal, scan externe)
//   .json → mêmes données en JSON (utilisé par screen-qr-scanner.jsx pour
//           afficher la fiche riche EN INTERNE sans réanalyser une image)
//
// Quatre motifs de refus (signature absente/invalide, expirée, révoquée)
// plus le cas profil introuvable partagent tous la MÊME réponse générique
// (voir sendUnavailable) : ne jamais laisser un appelant distinguer lequel
// s'applique en sondant l'URL. Le détail exact part uniquement dans les logs
// serveur (console.warn/error), jamais dans la réponse HTTP.
router.get('/public/medical-card/:file', async (req, res) => {
  // Des données de santé n'ont pas à séjourner dans un cache — y compris sur
  // les réponses de refus, qui portent quand même un `Fiche indisponible`.
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  const m = /^([^.]+)\.(png|json)$/.exec(req.params.file);
  if (!m) return res.status(400).json({ error: 'Format invalide' });
  const [, id, format] = m;

  const sendUnavailable = async (reason) => {
    console.warn(`[medical-card] fiche refusée (${reason}) — id: ${id}`);
    if (format === 'json') return res.status(404).json({ error: 'Fiche indisponible' });
    const svg = buildUnavailableCardSvg('Fiche indisponible');
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    res.type('image/png');
    return res.send(png);
  };

  // Échec fermé : sans secret, impossible de vérifier quoi que ce soit —
  // refuse tout plutôt que de servir une fiche non authentifiée.
  if (!getMedicalCardSecret()) {
    console.error('[medical-card] MEDICAL_CARD_SECRET absent — lecture refusée (échec fermé)');
    return sendUnavailable('secret serveur non configuré');
  }

  const { gen: genRaw, exp: expRaw, sig } = req.query;
  if (!genRaw || !expRaw || !sig) return sendUnavailable('gen/exp/sig manquants');

  const gen = Number(genRaw);
  const exp = Number(expRaw);
  if (!Number.isFinite(gen) || !Number.isFinite(exp)) return sendUnavailable('gen/exp non numériques');

  // Signature vérifiée AVANT toute autre décision : gen/exp ne sont dignes
  // de confiance qu'une fois authentifiés — les utiliser pour la vérif
  // d'expiration avant la signature reviendrait à faire confiance à des
  // valeurs qu'un client peut fabriquer librement (exactement le bug corrigé
  // ici : un exp retiré ou falsifié ne doit jamais être exploitable).
  if (!verifyMedicalCardSignature(id, gen, exp, sig)) return sendUnavailable('signature invalide ou absente');

  if (Date.now() > exp) return sendUnavailable('expirée');

  let data = null;
  try {
    data = await loadMedicalCardData(id);
  } catch (e) {
    console.error('[medical-card] chargement échoué pour', id, ':', e.message);
    return sendUnavailable('erreur de chargement');
  }
  if (!data) return sendUnavailable('profil introuvable');

  // Révocation : un QR régénéré depuis (qr_generated_at plus récent que le
  // gen de cette URL) invalide toute ancienne URL, même signée et non
  // expirée — voir le commentaire sur GET /medical-record/qr ci-dessus.
  if (data.qrGeneratedAt != null && gen < data.qrGeneratedAt) return sendUnavailable('révoquée par une régénération plus récente');

  if (format === 'json') {
    return res.json({ ...data, generatedAt: gen, expiresAt: exp });
  }
  const svg = buildMedicalCardSvg({ ...data, generatedAt: gen, expiresAt: exp });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  res.type('image/png');
  res.send(png);
});

// ─── CENTRES DE SANTÉ ────────────────────────────────────────────────────────
// Couverture nationale (Côte d'Ivoire), alimentée par
// scripts/sync-health-centers.js depuis l'API healthsites.io (données
// OpenStreetMap, licence ODbL — voir CLAUDE.md) — remplace l'ancienne liste
// statique de 20 centres de San Pédro (src/data/health-centers.js, laissé
// en place mais plus lu ici). Même calcul de distance (haversineKm) et même
// forme de réponse JSON qu'avant ce changement, à une exception près :
// `available24h` n'existe pas dans la table health_centers (aucune donnée
// fiable pour ce champ dans la source OSM) et n'apparaît donc plus dans la
// réponse — le filtre "24h" de screen-map.jsx (inchangé, hors périmètre de
// ce lot) ne retournera donc plus aucun résultat, faute de donnée à filtrer.
router.get('/health-centers', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const hasCoords = !isNaN(lat) && !isNaN(lng);

  const { data, error } = await supabase
    .from('health_centers')
    .select('id, name, type, lat, lng, phone');
  if (error) {
    console.error('[health-centers] lecture Supabase échouée:', error.message);
    return res.status(500).json({ error: 'Centres de santé indisponibles' });
  }

  const list = data.map(c => ({
    ...c,
    distanceKm: hasCoords ? haversineKm(lat, lng, c.lat, c.lng) : null,
  }));
  if (hasCoords) list.sort((a, b) => a.distanceKm - b.distanceKm);
  res.json(list);
});

// ─── NOTIFICATIONS IN-APP ────────────────────────────────────────────────────
// Alimentées par routes/sos.js (insert dans la table Supabase `notifications`
// quand un contact d'urgence a lui-même un compte Sauv'Moi).
router.get('/notifications', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map((n) => ({
    id: n.id, userId: n.user_id, type: n.type, fromUser: n.from_user,
    message: n.message, lat: n.lat, lng: n.lng,
    createdAt: n.created_at, read: n.is_read,
  })));
});

router.post('/notifications/:id/read', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
