#!/usr/bin/env node
// src/schema-consistency.test.js — LOT 14a. Compare les colonnes que le
// backend lit/écrit (manifeste ci-dessous, établi à la main en relisant
// src/routes/auth.js, api.js, sos.js, training.js — PAS extrait
// automatiquement du code, voir limite ci-dessous) aux colonnes réellement
// déclarées dans supabase/schema.sql (parsées depuis les blocs `create
// table` ET le bloc MIGRATION `alter table ... add column if not exists`).
//
// Ce que ce test attrape : une colonne dont le code dépend (ex.
// qr_generated_at) qui disparaîtrait ou serait renommée dans schema.sql —
// exactement la classe d'erreur déjà vue en production (migration
// health_centers jamais exécutée -> 500, voir CLAUDE.md, feuille de route).
//
// LIMITE CONNUE (à documenter aussi dans CLAUDE.md, Dette technique connue) :
// le manifeste ci-dessous est établi À LA MAIN (pas par analyse statique du
// code) — si une route future lit/écrit une NOUVELLE colonne sans que ce
// manifeste soit mis à jour, ce test ne le détecte PAS (silence, pas un faux
// positif). Il protège contre schema.sql qui dérive par rapport à un
// manifeste existant, pas contre un manifeste qui devient incomplet. Les
// doublures Supabase des autres tests d'intégration (fake-supabase.js) ont
// la même limite : elles ne valident aucune contrainte SQL réelle (types,
// CHECK, foreign key, RLS) — seul un vrai projet Supabase le ferait.
//
// Exécution : node --test src/schema-consistency.test.js (pas besoin du flag
// --experimental-test-module-mocks, ce fichier ne mocke rien)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const schemaPath = fileURLToPath(new URL('../supabase/schema.sql', import.meta.url));
const sql = readFileSync(schemaPath, 'utf8');

function parseSchemaColumns(sqlText) {
  const columnsByTable = {};

  // Blocs create table (initial + "create table if not exists" du bloc
  // MIGRATION) : un bloc par table, colonnes une par ligne.
  const tableRe = /create table\s+(?:if not exists\s+)?(\w+)\s*\(([\s\S]*?)\n\);/g;
  let m;
  while ((m = tableRe.exec(sqlText))) {
    const [, table, body] = m;
    const set = columnsByTable[table] || (columnsByTable[table] = new Set());
    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('--')) continue;
      const colName = line.split(/\s/)[0].replace(/,$/, '');
      if (colName) set.add(colName);
    }
  }

  // Bloc MIGRATION : colonnes ajoutées après coup sur une base existante.
  const alterRe = /alter table (\w+) add column if not exists (\w+)/g;
  while ((m = alterRe.exec(sqlText))) {
    const [, table, col] = m;
    const set = columnsByTable[table] || (columnsByTable[table] = new Set());
    set.add(col);
  }

  return columnsByTable;
}

const schemaColumns = parseSchemaColumns(sql);

// ─── Manifeste manuel : colonnes réellement lues/écrites par le code ───────
// Établi en relisant src/routes/{auth,api,sos,training}.js (grep sur
// `.from(`/`.select(`/`.eq(`/`.update(`/`.insert(`/`.upsert(` + les accès
// `profile.xxx`/`patch.xxx` correspondants) — voir le commentaire de limite
// en haut de ce fichier.
const CODE_MANIFEST = {
  profiles: [
    'id', 'name', 'phone', 'birthdate', 'gender', 'photo', 'city', 'role', 'lang',
    'blood_type', 'height', 'weight', 'allergies', 'conditions',
    'qr_generated_at',
    'blood_type_status', 'blood_type_proof_path', 'blood_type_verified_at', 'blood_type_verified_by',
    'updated_at',
  ],
  emergency_contacts: ['id', 'user_id', 'name', 'phone', 'relation', 'created_at'],
  training_progress: ['user_id', 'completed_modules', 'scores', 'updated_at'],
  notifications: ['id', 'user_id', 'type', 'from_user', 'message', 'lat', 'lng', 'is_read', 'created_at'],
  health_centers: ['id', 'name', 'type', 'lat', 'lng', 'phone'],
};

test('le parseur SQL a bien trouvé les 5 tables attendues (sanity — un parseur cassé ne doit pas "réussir" silencieusement)', () => {
  for (const table of Object.keys(CODE_MANIFEST)) {
    assert.ok(schemaColumns[table], `table "${table}" absente de schema.sql (ou non reconnue par le parseur)`);
    assert.ok(schemaColumns[table].size >= 3, `table "${table}" : seulement ${schemaColumns[table]?.size ?? 0} colonne(s) détectée(s), parseur probablement cassé`);
  }
});

for (const [table, columns] of Object.entries(CODE_MANIFEST)) {
  test(`table "${table}" — toutes les colonnes lues/écrites par le code existent dans schema.sql`, () => {
    const known = schemaColumns[table] || new Set();
    const missing = columns.filter((c) => !known.has(c));
    assert.deepEqual(missing, [], `colonne(s) utilisée(s) par le code mais absente(s) de schema.sql pour "${table}": ${missing.join(', ')}`);
  });
}
