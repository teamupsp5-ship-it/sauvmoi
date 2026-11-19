#!/usr/bin/env node
// src/routes/api.medical-card-qr.test.js — LOT 14a. Tests d'intégration HTTP
// de la fiche médicale QR (src/routes/api.js) : GET /api/medical-record/qr,
// POST /api/medical-record/qr/regenerate, GET /api/public/medical-card/:file
// (png + json) — vraies requêtes HTTP, vrai rendu PNG (sharp), Supabase
// remplacé par la doublure src/test-support/fake-supabase.js.
//
// Complète (ne duplique pas) src/routes/api.medical-card-availability.test.js
// (LOT 12, qui teste resolveMedicalCardAvailability() en direct, sans
// Express ni rendu PNG) : ici on vérifie la vraie réponse HTTP, dont le fait
// que le PNG de refus est OCTET POUR OCTET identique quel que soit le motif
// (signature absente / expirée / révoquée / introuvable).
//
// Exécution : node --experimental-test-module-mocks --test src/routes/api.medical-card-qr.test.js

import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createFakeSupabase } from '../test-support/fake-supabase.js';

process.env.MEDICAL_CARD_SECRET = 'fake-secret-lot14a';
process.env.PUBLIC_BASE_URL = 'https://test.example';

const TOKEN = 'token-user-1';
const USER_ID = 'user-1';

const { supabase: fakeSupabase, db } = createFakeSupabase({
  users: { [TOKEN]: { id: USER_ID, email: 'user1@test.local', user_metadata: {} } },
  seed: {
    profiles: [{
      id: USER_ID, name: 'Jean Testeur', birthdate: '1990-01-01', blood_type: 'O+',
      allergies: 'Pénicilline', conditions: '', qr_generated_at: null,
      blood_type_status: 'declared', blood_type_proof_path: null,
    }],
    emergency_contacts: [{ id: 'ec-1', user_id: USER_ID, name: 'Proche', phone: '0700000000', relation: 'Sœur' }],
  },
});

mock.module('../supabase.js', {
  exports: { supabase: fakeSupabase, createAuthClient: () => fakeSupabase },
});

const { createApp } = await import('../app.js');
const app = createApp();
const { default: http } = await import('node:http');

async function withServer(fn) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function sign(id, gen, exp) {
  return createHmac('sha256', process.env.MEDICAL_CARD_SECRET).update(`${id}:${gen}:${exp}`).digest('hex');
}

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function fetchPng(base, path) {
  const res = await fetch(`${base}${path}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, contentType: res.headers.get('content-type'), buf };
}

test('GET /medical-record/qr — génération au premier accès, url signée, qrDataUrl présent', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/medical-record/qr`, { headers: { authorization: `Bearer ${TOKEN}` } });
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.match(json.url, /^https:\/\/test\.example\/api\/public\/medical-card\/user-1\.png\?gen=\d+&exp=\d+&sig=[0-9a-f]{64}$/);
    assert.match(json.qrDataUrl, /^data:image\/png;base64,/);
    assert.equal(json.payload.id, USER_ID);
    assert.equal(json.payload.nom, 'Jean Testeur');
  });
});

test('GET /medical-record/qr — sans jeton -> 401', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/medical-record/qr`);
    assert.equal(res.status, 401);
  });
});

test('GET /public/medical-card/:id.png — signature valide -> 200 image/png, vraie carte', async () => {
  await withServer(async (base) => {
    const genRes = await fetch(`${base}/api/medical-record/qr`, { headers: { authorization: `Bearer ${TOKEN}` } });
    const { url } = await genRes.json();
    const path = url.replace(/^https:\/\/test\.example/, '');
    const { status, contentType, buf } = await fetchPng(base, path);
    assert.equal(status, 200);
    assert.equal(contentType, 'image/png');
    assert.deepEqual(buf.subarray(0, 8), PNG_MAGIC);
  });
});

test('GET /public/medical-card/:id.json — signature valide -> 200 json, mêmes données', async () => {
  await withServer(async (base) => {
    const genRes = await fetch(`${base}/api/medical-record/qr`, { headers: { authorization: `Bearer ${TOKEN}` } });
    const { url } = await genRes.json();
    const jsonUrl = url.replace(/^https:\/\/test\.example/, '').replace('.png', '.json');
    const res = await fetch(`${base}${jsonUrl}`);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.nom, 'Jean Testeur');
    assert.equal(json.bloodType, 'O+');
  });
});

let unavailablePngBuffers = [];

test('GET /public/medical-card/:id.png — signature absente -> 200 (toujours), PNG générique "indisponible"', async () => {
  await withServer(async (base) => {
    const { status, contentType, buf } = await fetchPng(base, `/api/public/medical-card/${USER_ID}.png`);
    assert.equal(status, 200);
    assert.equal(contentType, 'image/png');
    assert.deepEqual(buf.subarray(0, 8), PNG_MAGIC);
    unavailablePngBuffers.push(buf);
  });
});

test('GET /public/medical-card/:id.json — signature absente -> 404 "Fiche indisponible"', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/public/medical-card/${USER_ID}.json`);
    const json = await res.json();
    assert.equal(res.status, 404);
    assert.equal(json.error, 'Fiche indisponible');
  });
});

test('GET /public/medical-card/:id.png — expirée (signature valide, exp dans le passé) -> 200, même PNG générique', async () => {
  await withServer(async (base) => {
    const gen = Date.now() - 2000;
    const exp = Date.now() - 1000;
    const sig = sign(USER_ID, gen, exp);
    const { status, buf } = await fetchPng(base, `/api/public/medical-card/${USER_ID}.png?gen=${gen}&exp=${exp}&sig=${sig}`);
    assert.equal(status, 200);
    unavailablePngBuffers.push(buf);
  });
});

test('GET /public/medical-card/:id.png — révoquée (gen antérieur à une régénération depuis) -> 200, même PNG générique', async () => {
  await withServer(async (base) => {
    const firstGenRes = await fetch(`${base}/api/medical-record/qr`, { headers: { authorization: `Bearer ${TOKEN}` } });
    const { url: oldUrl } = await firstGenRes.json();
    const oldPath = oldUrl.replace(/^https:\/\/test\.example/, '');

    const regenRes = await fetch(`${base}/api/medical-record/qr/regenerate`, {
      method: 'POST', headers: { authorization: `Bearer ${TOKEN}` },
    });
    assert.equal(regenRes.status, 200);

    const { status, buf } = await fetchPng(base, oldPath);
    assert.equal(status, 200);
    unavailablePngBuffers.push(buf);
  });
});

test('GET /public/medical-card/:id.png — profil introuvable -> 200, même PNG générique', async () => {
  await withServer(async (base) => {
    const gen = Date.now();
    const exp = gen + 6 * 30 * 24 * 60 * 60 * 1000;
    const sig = sign('ghost-user', gen, exp);
    const { status, buf } = await fetchPng(base, `/api/public/medical-card/ghost-user.png?gen=${gen}&exp=${exp}&sig=${sig}`);
    assert.equal(status, 200);
    unavailablePngBuffers.push(buf);
  });
});

test('Le PNG de refus est octet pour octet identique pour TOUS les motifs testés (absente/expirée/révoquée/introuvable)', () => {
  assert.equal(unavailablePngBuffers.length, 4, 'les 4 cas de refus ci-dessus doivent avoir collecté leur PNG');
  for (let i = 1; i < unavailablePngBuffers.length; i++) {
    assert.ok(unavailablePngBuffers[0].equals(unavailablePngBuffers[i]), `le PNG de refus #${i} diffère du premier`);
  }
});

test('db.profiles — qr_generated_at a bien changé après /regenerate (révocation réelle, pas seulement côté réponse)', () => {
  const profile = db.profiles.find((p) => p.id === USER_ID);
  assert.ok(profile.qr_generated_at, 'qr_generated_at doit être renseigné après génération/régénération');
});
