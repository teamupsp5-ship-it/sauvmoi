#!/usr/bin/env node
// src/routes/api.medical-card-availability.test.js — LOT 12, diagnostic du
// refus de la fiche médicale publique (GET /api/public/medical-card/:file).
// Un cas par motif canonique (signature invalide / expiré / révoqué /
// introuvable / autre), plus quelques variantes à l'intérieur de chaque
// catégorie pour couvrir chaque branche réelle de resolveMedicalCardAvailability
// (src/routes/api.js) — aucun appel réseau réel, aucune écriture Supabase :
// loadData est injecté (stub), la signature HMAC est recalculée ici avec le
// même secret factice que celui posé dans process.env avant l'import.
//
// Exécution : node src/routes/api.medical-card-availability.test.js

import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

process.env.SUPABASE_URL = 'https://fake-project.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key';
process.env.SUPABASE_ANON_KEY = 'fake-anon-key';
process.env.MEDICAL_CARD_SECRET = 'fake-secret-lot12';

const { resolveMedicalCardAvailability } = await import('./api.js');

// Recalculée indépendamment (même formule documentée que signMedicalCard,
// src/routes/api.js : HMAC SHA-256 de "id:gen:exp") plutôt que d'exporter la
// fonction de signature elle-même — ne sert qu'à produire des URLs de test
// valablement signées pour isoler les branches APRÈS la vérification de
// signature (expiration, révocation, profil introuvable).
function sign(id, gen, exp) {
  return createHmac('sha256', process.env.MEDICAL_CARD_SECRET).update(`${id}:${gen}:${exp}`).digest('hex');
}

const ID = 'test-profile-1';
const FUTURE = Date.now() + 6 * 30 * 24 * 60 * 60 * 1000; // ~6 mois, non expiré
const PAST = Date.now() - 1000; // déjà expiré

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

async function withSecret(value, fn) {
  const prev = process.env.MEDICAL_CARD_SECRET;
  try {
    if (value === undefined) delete process.env.MEDICAL_CARD_SECRET; else process.env.MEDICAL_CARD_SECRET = value;
    return await fn();
  } finally {
    if (prev === undefined) delete process.env.MEDICAL_CARD_SECRET; else process.env.MEDICAL_CARD_SECRET = prev;
  }
}

console.log("Motif 'autre'");
await test('MEDICAL_CARD_SECRET absent -> autre (échec fermé, avant toute autre vérification)', async () => {
  await withSecret(undefined, async () => {
    const r = await resolveMedicalCardAvailability({ id: ID, genRaw: '1', expRaw: String(FUTURE), sig: 'peu-importe' });
    assert.equal(r.ok, false);
    assert.equal(r.category, 'autre');
  });
});
await test('loadData() lève une exception (ex. panne Supabase) -> autre', async () => {
  const gen = 1000, exp = FUTURE;
  const sig = sign(ID, gen, exp);
  const loadData = async () => { throw new Error('panne Supabase simulée'); };
  const r = await resolveMedicalCardAvailability({ id: ID, genRaw: String(gen), expRaw: String(exp), sig, loadData });
  assert.equal(r.ok, false);
  assert.equal(r.category, 'autre');
});

console.log("Motif 'signature_invalide'");
await test('gen/exp/sig manquants -> signature_invalide', async () => {
  const r = await resolveMedicalCardAvailability({ id: ID, genRaw: '', expRaw: '', sig: '' });
  assert.equal(r.ok, false);
  assert.equal(r.category, 'signature_invalide');
});
await test('gen/exp non numériques -> signature_invalide', async () => {
  const r = await resolveMedicalCardAvailability({ id: ID, genRaw: 'abc', expRaw: 'def', sig: 'x'.repeat(64) });
  assert.equal(r.ok, false);
  assert.equal(r.category, 'signature_invalide');
});
await test('signature fausse (ne correspond pas à id:gen:exp) -> signature_invalide', async () => {
  const gen = 1000, exp = FUTURE;
  const r = await resolveMedicalCardAvailability({ id: ID, genRaw: String(gen), expRaw: String(exp), sig: '0'.repeat(64) });
  assert.equal(r.ok, false);
  assert.equal(r.category, 'signature_invalide');
});

console.log("Motif 'expiree'");
await test('exp dans le passé, signature valide -> expiree', async () => {
  const gen = 1000;
  const sig = sign(ID, gen, PAST);
  const r = await resolveMedicalCardAvailability({ id: ID, genRaw: String(gen), expRaw: String(PAST), sig });
  assert.equal(r.ok, false);
  assert.equal(r.category, 'expiree');
});

console.log("Motif 'introuvable'");
await test('profil introuvable (loadData renvoie null), signature valide, non expirée -> introuvable', async () => {
  const gen = 1000, exp = FUTURE;
  const sig = sign(ID, gen, exp);
  const loadData = async () => null;
  const r = await resolveMedicalCardAvailability({ id: ID, genRaw: String(gen), expRaw: String(exp), sig, loadData });
  assert.equal(r.ok, false);
  assert.equal(r.category, 'introuvable');
});

console.log("Motif 'revoquee'");
await test('qr_generated_at plus récent que gen -> revoquee', async () => {
  const gen = 1000, exp = FUTURE;
  const sig = sign(ID, gen, exp);
  const loadData = async () => ({ qrGeneratedAt: gen + 1 });
  const r = await resolveMedicalCardAvailability({ id: ID, genRaw: String(gen), expRaw: String(exp), sig, loadData });
  assert.equal(r.ok, false);
  assert.equal(r.category, 'revoquee');
});

console.log('Cas passant (aucun refus)');
await test('signature valide, non expirée, profil trouvé, gen >= qr_generated_at -> ok', async () => {
  const gen = 2000, exp = FUTURE;
  const sig = sign(ID, gen, exp);
  const loadData = async () => ({ qrGeneratedAt: gen, nom: 'Test' });
  const r = await resolveMedicalCardAvailability({ id: ID, genRaw: String(gen), expRaw: String(exp), sig, loadData });
  assert.equal(r.ok, true);
  assert.equal(r.data.nom, 'Test');
});

console.log(`\n${passed} test(s) réussi(s).`);
if (process.exitCode) {
  console.error('Des tests ont échoué.');
}
