#!/usr/bin/env node
// src/routes/api.health-centers.test.js — LOT 14a. Tests d'intégration HTTP
// de GET /api/health-centers (src/routes/api.js) : vraies requêtes HTTP
// contre l'app Express réelle (src/app.js), Supabase remplacé par la
// doublure src/test-support/fake-supabase.js.
//
// Exécution : node --experimental-test-module-mocks --test src/routes/api.health-centers.test.js

import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeSupabase } from '../test-support/fake-supabase.js';

// Trois centres à des distances croissantes depuis le point de référence
// (Abidjan, 5.3599/-4.0083) — permet de vérifier le tri par distance.
const { supabase: fakeSupabase, db } = createFakeSupabase({
  seed: {
    health_centers: [
      { id: 'seed/far', name: 'Centre lointain (San Pédro)', type: 'hopital', lat: 4.7476, lng: -6.6352, phone: null },
      { id: 'seed/near', name: 'Centre proche (Abidjan centre)', type: 'clinique', lat: 5.36, lng: -4.01, phone: '0700000000' },
      { id: 'seed/mid', name: 'Centre moyen', type: 'pharmacie', lat: 5.5, lng: -4.2, phone: null },
    ],
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

test('GET /api/health-centers — avec lat/lng, triés par distance croissante', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/health-centers?lat=5.3599&lng=-4.0083`);
    const list = await res.json();
    assert.equal(res.status, 200);
    assert.equal(list.length, 3);
    assert.equal(list[0].id, 'seed/near');
    assert.ok(list[0].distanceKm < list[1].distanceKm);
    assert.ok(list[1].distanceKm < list[2].distanceKm);
    assert.equal(list[2].id, 'seed/far');
  });
});

test('GET /api/health-centers — sans lat/lng, distanceKm null pour tous, pas de tri forcé', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/health-centers`);
    const list = await res.json();
    assert.equal(res.status, 200);
    assert.equal(list.length, 3);
    assert.ok(list.every((c) => c.distanceKm === null));
  });
});

test('GET /api/health-centers — erreur Supabase -> 500, JAMAIS une liste vide silencieuse', async () => {
  const originalFrom = fakeSupabase.from;
  fakeSupabase.from = (table) => {
    if (table !== 'health_centers') return originalFrom(table);
    return {
      select() {
        return Promise.resolve({ data: null, error: { message: 'relation "health_centers" does not exist', code: '42P01' } });
      },
    };
  };
  try {
    await withServer(async (base) => {
      const res = await fetch(`${base}/api/health-centers`);
      const json = await res.json();
      assert.equal(res.status, 500);
      assert.notEqual(res.status, 200, 'une erreur Supabase ne doit jamais se présenter comme un succès à liste vide');
      assert.match(json.error, /indisponible/i);
    });
  } finally {
    fakeSupabase.from = originalFrom;
  }
});
