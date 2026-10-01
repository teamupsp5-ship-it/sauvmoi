#!/usr/bin/env node
// src/routes/api.public-base-url.test.js — vérifie getPublicBaseUrl()
// (src/routes/api.js), le garde-fou qui empêche tout QR médical d'encoder
// une URL inattendue. Deux comportements sous test, demandés explicitement
// (LOT 10, migration sauvmoi.com) :
//   - en production (NODE_ENV=production), une valeur absente ou invalide
//     (pas https://) doit renvoyer null — jamais un repli silencieux —
//     pour que les routes appelantes répondent 503 plutôt que de générer
//     un QR avec une mauvaise URL.
//   - hors production, le repli http://localhost:PORT reste accepté.
//
// SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY/MEDICAL_CARD_SECRET
// sont posées à des valeurs factices AVANT l'import de api.js — ce module
// construit un client Supabase au chargement (src/supabase.js), qui exige un
// SUPABASE_URL au format URL valide même sans jamais appeler le réseau.
//
// Exécution : node src/routes/api.public-base-url.test.js

import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://fake-project.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key';
process.env.SUPABASE_ANON_KEY = 'fake-anon-key';
process.env.MEDICAL_CARD_SECRET = 'fake-secret';

const { isValidPublicBaseUrl, getPublicBaseUrl } = await import('./api.js');

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

// Isole chaque cas : NODE_ENV et PUBLIC_BASE_URL remis à zéro après chaque test.
function withEnv(nodeEnv, publicBaseUrl, fn) {
  const prevNodeEnv = process.env.NODE_ENV;
  const prevPublicBaseUrl = process.env.PUBLIC_BASE_URL;
  const prevConsoleError = console.error;
  const prevConsoleWarn = console.warn;
  console.error = () => {}; // logs attendus dans ces cas, pas du bruit de test
  console.warn = () => {};
  try {
    if (nodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = nodeEnv;
    if (publicBaseUrl === undefined) delete process.env.PUBLIC_BASE_URL; else process.env.PUBLIC_BASE_URL = publicBaseUrl;
    return fn();
  } finally {
    console.error = prevConsoleError;
    console.warn = prevConsoleWarn;
    if (prevNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = prevNodeEnv;
    if (prevPublicBaseUrl === undefined) delete process.env.PUBLIC_BASE_URL; else process.env.PUBLIC_BASE_URL = prevPublicBaseUrl;
  }
}

console.log('isValidPublicBaseUrl()');
await test('https://... -> valide', () => {
  assert.equal(isValidPublicBaseUrl('https://sauvmoi.com'), true);
});
await test('http://... -> invalide (https obligatoire)', () => {
  assert.equal(isValidPublicBaseUrl('http://sauvmoi.com'), false);
});
await test('absent (undefined) -> invalide', () => {
  assert.equal(isValidPublicBaseUrl(undefined), false);
});
await test('chaîne vide -> invalide', () => {
  assert.equal(isValidPublicBaseUrl(''), false);
});

console.log('getPublicBaseUrl() — production');
await test('absente en production -> null (échec fermé, pas de repli)', () => {
  withEnv('production', undefined, () => {
    assert.equal(getPublicBaseUrl(), null);
  });
});
await test('invalide (http://, pas https://) en production -> null', () => {
  withEnv('production', 'http://sauvmoi.com', () => {
    assert.equal(getPublicBaseUrl(), null);
  });
});
await test('valide en production -> renvoyée telle quelle', () => {
  withEnv('production', 'https://sauvmoi.com', () => {
    assert.equal(getPublicBaseUrl(), 'https://sauvmoi.com');
  });
});

console.log('getPublicBaseUrl() — hors production');
await test('absente hors production -> repli http://localhost:PORT', () => {
  withEnv('development', undefined, () => {
    const prevPort = process.env.PORT;
    delete process.env.PORT;
    try {
      assert.equal(getPublicBaseUrl(), 'http://localhost:3000');
    } finally {
      if (prevPort === undefined) delete process.env.PORT; else process.env.PORT = prevPort;
    }
  });
});
await test('absente hors production -> repli respecte PORT', () => {
  withEnv('development', undefined, () => {
    const prevPort = process.env.PORT;
    process.env.PORT = '4242';
    try {
      assert.equal(getPublicBaseUrl(), 'http://localhost:4242');
    } finally {
      if (prevPort === undefined) delete process.env.PORT; else process.env.PORT = prevPort;
    }
  });
});
await test('valide hors production -> renvoyée telle quelle (pas de repli)', () => {
  withEnv(undefined, 'https://sauvmoi.com', () => {
    assert.equal(getPublicBaseUrl(), 'https://sauvmoi.com');
  });
});

console.log(`\n${passed} test(s) réussi(s).`);
if (process.exitCode) {
  console.error('Des tests ont échoué.');
}
