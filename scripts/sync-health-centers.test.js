#!/usr/bin/env node
// scripts/sync-health-centers.test.js — vérifie la logique de
// sync-health-centers.js (mapping de type, extraction d'une ligne à partir
// d'un feature GeoJSON, pagination) contre des données et un fetch()
// FACTICES, sans aucun appel réseau réel ni écriture Supabase — voir
// l'avertissement dans sync-health-centers.js sur l'incertitude des noms
// de champs réels de l'API healthsites.io (clé pas encore approuvée au
// moment de l'écriture).
//
// Exécution : node scripts/sync-health-centers.test.js

import assert from 'node:assert/strict';
import { resolveType, mapFeatureToRow, fetchAllFeatures } from './sync-health-centers.js';

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok — ${name}`);
  } catch (e) {
    console.error(`  ÉCHEC — ${name}\n    ${e.message}`);
    process.exitCode = 1;
  }
}

console.log('resolveType()');
await test('amenity=hospital -> hopital', () => {
  assert.equal(resolveType({ amenity: 'hospital' }), 'hopital');
});
await test('healthcare=clinic -> clinique (priorité à healthcare sur amenity)', () => {
  assert.equal(resolveType({ amenity: 'hospital', healthcare: 'clinic' }), 'clinique');
});
await test('amenity=pharmacy -> pharmacie', () => {
  assert.equal(resolveType({ amenity: 'pharmacy' }), 'pharmacie');
});
await test('healthcare=dispensary -> centre_sante', () => {
  assert.equal(resolveType({ healthcare: 'dispensary' }), 'centre_sante');
});
await test('tag inconnu -> autre', () => {
  assert.equal(resolveType({ amenity: 'veterinary' }), 'autre');
});
await test('aucun tag -> autre', () => {
  assert.equal(resolveType({}), 'autre');
});
await test('casse insensible', () => {
  assert.equal(resolveType({ amenity: 'HOSPITAL' }), 'hopital');
});

console.log('mapFeatureToRow()');
await test('feature complet (node) -> ligne complète, id "node/<id>"', () => {
  const feature = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [-4.0083, 5.3599] }, // [lng, lat]
    properties: {
      osm_type: 'node',
      osm_id: 123456789,
      name: 'Hôpital Test',
      amenity: 'hospital',
      phone: '+225 07 00 00 00 00',
      'addr:housenumber': '12',
      'addr:street': 'Rue du Commerce',
      'addr:city': 'Abidjan',
    },
  };
  const row = mapFeatureToRow(feature);
  assert.deepEqual(
    { id: row.id, name: row.name, type: row.type, lat: row.lat, lng: row.lng, phone: row.phone, address: row.address, source: row.source },
    {
      id: 'node/123456789',
      name: 'Hôpital Test',
      type: 'hopital',
      lat: 5.3599,
      lng: -4.0083,
      phone: '+225 07 00 00 00 00',
      address: '12 Rue du Commerce',
      source: 'healthsites.io',
    },
  );
  assert.ok(row.synced_at, 'synced_at doit être renseigné');
});

await test('feature way, id prefixé "way/"', () => {
  const feature = {
    geometry: { coordinates: [-3.5, 6.8] },
    properties: { osm_type: 'way', osm_id: 42, amenity: 'pharmacy' },
  };
  const row = mapFeatureToRow(feature);
  assert.equal(row.id, 'way/42');
  assert.equal(row.type, 'pharmacie');
});

await test('nom manquant -> repli générique, pas de plantage', () => {
  const feature = { geometry: { coordinates: [-4, 5] }, properties: { osm_type: 'node', osm_id: 1, amenity: 'clinic' } };
  const row = mapFeatureToRow(feature);
  assert.equal(row.name, 'Établissement de santé');
  assert.equal(row.phone, null);
  assert.equal(row.address, null);
});

await test('adresse via addr:full uniquement', () => {
  const feature = {
    geometry: { coordinates: [-4, 5] },
    properties: { osm_type: 'node', osm_id: 2, 'addr:full': '10 Boulevard Principal, San Pédro' },
  };
  assert.equal(mapFeatureToRow(feature).address, '10 Boulevard Principal, San Pédro');
});

await test('adresse via addr:city seule (pas de rue)', () => {
  const feature = {
    geometry: { coordinates: [-4, 5] },
    properties: { osm_type: 'node', osm_id: 3, 'addr:city': 'San-Pédro' },
  };
  assert.equal(mapFeatureToRow(feature).address, 'San-Pédro');
});

await test('coordonnées manquantes -> null (ligne ignorée par l\'appelant)', () => {
  const feature = { geometry: { coordinates: [] }, properties: { osm_type: 'node', osm_id: 5 } };
  assert.equal(mapFeatureToRow(feature), null);
});

await test('id OSM manquant -> null', () => {
  const feature = { geometry: { coordinates: [-4, 5] }, properties: {} };
  assert.equal(mapFeatureToRow(feature), null);
});

await test('geometry absente -> null, pas d\'exception', () => {
  const feature = { properties: { osm_type: 'node', osm_id: 9 } };
  assert.equal(mapFeatureToRow(feature), null);
});

console.log('fetchAllFeatures() — pagination (fetch() global stubbé, aucun réseau réel)');
const realFetch = global.fetch;

await test('accumule plusieurs pages, s\'arrête sur une page vide', async () => {
  const pages = [
    { features: [{ properties: { osm_id: 1 } }, { properties: { osm_id: 2 } }] },
    { features: [{ properties: { osm_id: 3 } }] },
    { features: [] },
  ];
  let calls = 0;
  global.fetch = async (url) => {
    assert.ok(url.includes('api-key='), 'la clé API doit être dans l\'URL');
    assert.ok(url.includes(encodeURIComponent("Côte d'Ivoire")), 'le pays doit être dans l\'URL');
    const body = pages[calls] ?? { features: [] };
    calls++;
    return { ok: true, status: 200, json: async () => body };
  };
  try {
    const features = await fetchAllFeatures();
    assert.equal(features.length, 3);
    assert.equal(calls, 3, 'doit s\'arrêter dès la page vide (3 appels : 2 pleines + 1 vide), pas continuer indéfiniment');
  } finally {
    global.fetch = realFetch;
  }
});

await test('page unique déjà vide -> aucun établissement, un seul appel', async () => {
  let calls = 0;
  global.fetch = async () => { calls++; return { ok: true, status: 200, json: async () => ({ features: [] }) }; };
  try {
    const features = await fetchAllFeatures();
    assert.equal(features.length, 0);
    assert.equal(calls, 1);
  } finally {
    global.fetch = realFetch;
  }
});

await test('réponse HTTP non-ok -> erreur explicite, pas d\'échec silencieux', async () => {
  global.fetch = async () => ({ ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({}) });
  try {
    await assert.rejects(() => fetchAllFeatures(), /401/);
  } finally {
    global.fetch = realFetch;
  }
});

console.log(`\n${passed} test(s) réussi(s).`);
if (process.exitCode) {
  console.error('Des tests ont échoué (voir ci-dessus).');
} else {
  console.log('Tous les tests sont passés.');
}
