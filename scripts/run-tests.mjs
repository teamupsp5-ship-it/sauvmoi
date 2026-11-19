#!/usr/bin/env node
// scripts/run-tests.mjs — LOT 14a. Lanceur unique pour `npm test`.
//
// Deux familles de fichiers de test coexistent dans ce dépôt (voir CLAUDE.md,
// Dette technique connue) :
//   - "legacy" : script autonome avec un mini-harnais maison (node:assert/
//     strict, exécution directe node <fichier>.test.js, process.exitCode=1
//     en cas d'échec) — convention des lots 7/10/12/13b.
//   - "node:test" (LOT 14a) : vrais tests node:test (certains avec
//     mock.module() pour remplacer Supabase/ai.js) — nécessite
//     --experimental-test-module-mocks.
//
// Ce script lance les deux familles en processus séparés (node:child_process
// spawnSync), affiche un résumé, et sort avec un code non nul si un seul
// fichier échoue — sans dépendre de la façon dont PowerShell/bash enchaînent
// des commandes (portable Windows/Linux : ce projet est développé sous
// Windows et déployé sur o2switch/Linux).

import { spawnSync } from 'node:child_process';

const LEGACY_FILES = [
  'scripts/sync-health-centers.test.js',
  'src/routes/api.medical-card-availability.test.js',
  'src/routes/api.public-base-url.test.js',
  'public/oauth-callback.test.js',
];

const NODE_TEST_FILES = [
  'src/routes/auth.put-me.test.js',
  'src/routes/api.medical-card-qr.test.js',
  'src/routes/chat.route.test.js',
  'src/routes/api.health-centers.test.js',
  'src/schema-consistency.test.js',
];

let failures = 0;

function run(label, args) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    failures++;
    console.error(`✖ ÉCHEC : ${label} (code ${result.status})`);
  }
}

for (const file of LEGACY_FILES) {
  run(file, [file]);
}

for (const file of NODE_TEST_FILES) {
  run(file, ['--experimental-test-module-mocks', '--test', file]);
}

const total = LEGACY_FILES.length + NODE_TEST_FILES.length;
console.log(`\n${'='.repeat(60)}`);
if (failures) {
  console.error(`${failures} fichier(s) de test en échec sur ${total}.`);
  process.exit(1);
} else {
  console.log(`Tous les fichiers de test sont passés (${total}/${total}).`);
}
