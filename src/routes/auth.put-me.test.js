#!/usr/bin/env node
// src/routes/auth.put-me.test.js — LOT 14a. Tests d'intégration HTTP de
// PUT /api/me (src/routes/auth.js) : vraies requêtes HTTP contre l'app
// Express réelle (src/app.js), Supabase remplacé par la doublure
// src/test-support/fake-supabase.js (mock.module, voir node --experimental-
// test-module-mocks dans le script npm test).
//
// Payloads calqués EXACTEMENT sur ceux envoyés par le frontend réel (voir
// public/screen-profile.jsx) :
//   - ProfilePersonal.save()   -> { name, birthdate, gender, phone }
//   - ProfileMedical.save()    -> { medicalRecord: { bloodType, height,
//     weight, allergies: string[], conditions: string[] } } — un champ texte
//     vide donne un TABLEAU VIDE après .split(',').filter(Boolean), jamais
//     une chaîne vide envoyée telle quelle.
//
// Exécution : node --experimental-test-module-mocks --test src/routes/auth.put-me.test.js

import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeSupabase } from '../test-support/fake-supabase.js';

const TOKEN = 'token-user-1';
const USER_ID = 'user-1';

const { supabase: fakeSupabase, db } = createFakeSupabase({
  users: { [TOKEN]: { id: USER_ID, email: 'user1@test.local', user_metadata: {} } },
  seed: {
    profiles: [{
      id: USER_ID, name: '', phone: '', birthdate: null, gender: '', photo: null,
      blood_type: '', height: null, weight: null, allergies: '', conditions: '',
      blood_type_status: 'declared', blood_type_proof_path: null,
      blood_type_verified_at: null, blood_type_verified_by: null,
    }],
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

async function putMe(base, token, body) {
  const res = await fetch(`${base}/api/me`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

test('PUT /me — profil complet (infos perso), 200, écho exact', async () => {
  await withServer(async (base) => {
    const { status, json } = await putMe(base, TOKEN, {
      name: 'Aïcha Koné', birthdate: '1990-05-12', gender: 'F', phone: '+225 07 00 00 00 00',
    });
    assert.equal(status, 200);
    assert.equal(json.name, 'Aïcha Koné');
    assert.equal(json.birthdate, '1990-05-12');
    assert.equal(json.gender, 'F');
    assert.equal(json.phone, '+225 07 00 00 00 00');
  });
});

test('PUT /me — carnet médical complet (allergies/conditions en tableaux), 200, round-trip en tableaux', async () => {
  await withServer(async (base) => {
    const { status, json } = await putMe(base, TOKEN, {
      medicalRecord: {
        bloodType: 'O+', height: 165, weight: 60,
        allergies: ['Pénicilline', 'Arachide'],
        conditions: ['Asthme'],
      },
    });
    assert.equal(status, 200);
    assert.equal(json.medicalRecord.bloodType, 'O+');
    assert.equal(json.medicalRecord.height, 165);
    assert.equal(json.medicalRecord.weight, 60);
    assert.deepEqual(json.medicalRecord.allergies, ['Pénicilline', 'Arachide']);
    assert.deepEqual(json.medicalRecord.conditions, ['Asthme']);
  });
});

test('PUT /me — profil vide (chaînes vides, aucune erreur), 200', async () => {
  await withServer(async (base) => {
    const { status, json } = await putMe(base, TOKEN, { name: '', birthdate: '', gender: '', phone: '' });
    assert.equal(status, 200);
    assert.equal(json.name, '');
    assert.equal(json.birthdate, '');
    assert.equal(json.phone, '');
  });
});

test('PUT /me — carnet médical avec tableaux vides (exactement ce que le frontend envoie pour un champ texte vidé), 200', async () => {
  await withServer(async (base) => {
    const { status, json } = await putMe(base, TOKEN, {
      medicalRecord: { bloodType: '', height: null, weight: null, allergies: [], conditions: [] },
    });
    assert.equal(status, 200);
    assert.equal(json.medicalRecord.bloodType, '');
    assert.equal(json.medicalRecord.height, null);
    assert.equal(json.medicalRecord.weight, null);
    assert.deepEqual(json.medicalRecord.allergies, []);
    assert.deepEqual(json.medicalRecord.conditions, []);
  });
});

test('PUT /me — type invalide : name en nombre -> 400 message clair', async () => {
  await withServer(async (base) => {
    const { status, json } = await putMe(base, TOKEN, { name: 12345 });
    assert.equal(status, 400);
    assert.match(json.error, /nom/i);
  });
});

test('PUT /me — type invalide : height non numérique -> 400 "Taille invalide"', async () => {
  await withServer(async (base) => {
    const { status, json } = await putMe(base, TOKEN, { medicalRecord: { height: 'pas un nombre' } });
    assert.equal(status, 400);
    assert.match(json.error, /taille/i);
  });
});

test('PUT /me — champ non autorisé (role) -> 400, jamais appliqué', async () => {
  await withServer(async (base) => {
    const { status, json } = await putMe(base, TOKEN, { role: 'admin' });
    assert.equal(status, 400);
    assert.match(json.error, /non autorisé/i);
  });
});

test('PUT /me — sans jeton -> 401, profil non modifié', async () => {
  await withServer(async (base) => {
    const before = db.profiles.find((p) => p.id === USER_ID).name;
    const { status, json } = await putMe(base, null, { name: 'Ne devrait jamais être écrit' });
    assert.equal(status, 401);
    assert.match(json.error, /authentification/i);
    assert.equal(db.profiles.find((p) => p.id === USER_ID).name, before);
  });
});
