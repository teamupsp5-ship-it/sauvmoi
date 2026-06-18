// Stockage ultra-léger : en mémoire + persistance fichier JSON.
// Aucune base de données à installer — parfait pour une démo d'1 heure.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', '.data', 'db.json');

const empty = {
  users: {},
  conversations: {},   // id -> { id, title, lang, messages:[], updatedAt }
  sosAlerts: {},       // id -> alert
  payments: {},        // id -> payment
  otps: {},            // phone -> code
};

let db = structuredClone(empty);

export function load() {
  try {
    if (existsSync(DB_PATH)) db = { ...structuredClone(empty), ...JSON.parse(readFileSync(DB_PATH, 'utf8')) };
  } catch (e) {
    console.warn('[store] lecture échouée, repart à zéro:', e.message);
  }
}

let saveTimer = null;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      mkdirSync(dirname(DB_PATH), { recursive: true });
      // Ignore les champs non-sérialisables (ex: handles de timers préfixés "_")
      const json = JSON.stringify(db, (k, v) => (k.startsWith('_') ? undefined : v), 2);
      writeFileSync(DB_PATH, json);
    } catch (e) {
      console.warn('[store] écriture échouée:', e.message);
    }
  }, 150);
}

export function get() { return db; }
export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
