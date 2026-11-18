#!/usr/bin/env node
// public/oauth-callback.test.js — LOT 13b. Teste l'extraction pure de
// code/erreur depuis une URL de callback OAuth (oauth-callback.js), sans
// WebView ni Capacitor ni réseau réel.
//
// Exécution : node public/oauth-callback.test.js

import assert from 'node:assert/strict';

await import('./oauth-callback.js');
const { parseOAuthCallbackUrl } = globalThis;

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok — ${name}`);
  } catch (e) {
    console.error(`  ÉCHEC — ${name}\n    ${e.message}`);
    process.exitCode = 1;
  }
}

test('URL de succès (?code=...) -> code extrait, pas d\'erreur', () => {
  const r = parseOAuthCallbackUrl('ci.sauvmoi.app://auth-callback?code=abc123');
  assert.equal(r.code, 'abc123');
  assert.equal(r.error, null);
  assert.equal(r.errorDescription, null);
});

test('code + sb_flow_id (plusieurs flux PKCE concurrents) -> code toujours extrait, flow id ignoré', () => {
  const r = parseOAuthCallbackUrl('ci.sauvmoi.app://auth-callback?code=abc123&sb_flow_id=xyz');
  assert.equal(r.code, 'abc123');
});

test('refus explicite côté Google (?error=access_denied) -> error + description extraits, pas de code', () => {
  const r = parseOAuthCallbackUrl('ci.sauvmoi.app://auth-callback?error=access_denied&error_description=User%20denied%20access');
  assert.equal(r.code, null);
  assert.equal(r.error, 'access_denied');
  assert.equal(r.errorDescription, 'User denied access');
});

test('aucun paramètre -> tout null (ex. app rouverte autrement)', () => {
  const r = parseOAuthCallbackUrl('ci.sauvmoi.app://auth-callback');
  assert.equal(r.code, null);
  assert.equal(r.error, null);
  assert.equal(r.errorDescription, null);
});

test('URL complètement malformée -> tout null, jamais d\'exception', () => {
  const r = parseOAuthCallbackUrl('pas-du-tout-une-url');
  assert.equal(r.code, null);
  assert.equal(r.error, null);
  assert.equal(r.errorDescription, null);
});

test('fonctionne aussi avec un schéma https (ex. web, pour réutilisation éventuelle)', () => {
  const r = parseOAuthCallbackUrl('https://sauvmoi.com/?code=web123');
  assert.equal(r.code, 'web123');
});

console.log(`\n${passed} test(s) réussi(s).`);
if (process.exitCode) {
  console.error('Des tests ont échoué.');
}
