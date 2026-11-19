// src/test-support/fake-supabase.js — LOT 14a. Fausse implémentation du
// client Supabase (service_role), utilisée UNIQUEMENT par les tests
// d'intégration HTTP (node:test) dans src/routes/*.test.js. Chaque fichier de
// test l'installe via mock.module('../supabase.js', { exports: {...} })
// AVANT d'importer src/app.js (et donc les routes) — voir chaque fichier de
// test pour l'ordre exact, obligatoire pour que le mock soit effectif.
//
// Portée volontairement limitée au sous-ensemble du query builder PostgREST
// réellement appelé par les routes (.select/.eq/.order/.update/.insert/
// .upsert/.delete/.maybeSingle, plus .storage.from().remove (stub) et
// .auth.getUser) — PAS une ré-implémentation de PostgREST/Supabase Auth.
//
// LIMITE CONNUE (documentée aussi dans CLAUDE.md, Dette technique connue) :
// cette doublure ne valide ni les types de colonnes, ni les contraintes SQL
// (CHECK, foreign key, NOT NULL...), ni les policies RLS d'un vrai projet
// Supabase — elle ne détecte donc PAS une vraie erreur de schéma (table ou
// colonne absente côté Supabase réel, contrainte violée). Elle vérifie que
// les ROUTES appellent le client avec la forme attendue et réagissent
// correctement au contenu de { data, error } renvoyé, rien de plus.

function matchesFilters(row, filters) {
  return filters.every(([col, val]) => row[col] === val);
}

class FakeQueryBuilder {
  constructor(table, db) {
    this.table = table;
    this.db = db;
    this.filters = [];
    this.op = 'select';
    this.payload = null;
    this.payloadRows = null;
    this.onConflict = 'id';
    this.returning = false;
    this.orderCol = null;
    this.orderAsc = true;
  }

  select() { this.returning = true; return this; }
  eq(col, val) { this.filters.push([col, val]); return this; }
  order(col, { ascending = true } = {}) { this.orderCol = col; this.orderAsc = ascending; return this; }
  update(patch) { this.op = 'update'; this.payload = patch; return this; }
  delete() { this.op = 'delete'; return this; }
  insert(rows) { this.op = 'insert'; this.payloadRows = Array.isArray(rows) ? rows : [rows]; return this; }
  upsert(rows, opts) {
    this.op = 'upsert';
    this.payloadRows = Array.isArray(rows) ? rows : [rows];
    this.onConflict = opts?.onConflict || 'id';
    return this;
  }

  _rows() { return this.db[this.table] || (this.db[this.table] = []); }

  _execute() {
    const table = this._rows();
    switch (this.op) {
      case 'select': {
        let rows = table.filter((r) => matchesFilters(r, this.filters));
        if (this.orderCol) {
          const col = this.orderCol, asc = this.orderAsc;
          rows = [...rows].sort((a, b) => {
            if (a[col] === b[col]) return 0;
            return (a[col] > b[col] ? 1 : -1) * (asc ? 1 : -1);
          });
        }
        return { data: rows, error: null };
      }
      case 'update': {
        const matched = table.filter((r) => matchesFilters(r, this.filters));
        matched.forEach((r) => Object.assign(r, this.payload));
        return { data: this.returning ? matched : null, error: null };
      }
      case 'delete': {
        const matched = table.filter((r) => matchesFilters(r, this.filters));
        this.db[this.table] = table.filter((r) => !matchesFilters(r, this.filters));
        return { data: this.returning ? matched : null, error: null };
      }
      case 'insert': {
        const inserted = this.payloadRows.map((r) => ({ ...r }));
        table.push(...inserted);
        return { data: this.returning ? inserted : null, error: null };
      }
      case 'upsert': {
        const result = [];
        for (const row of this.payloadRows) {
          const existing = table.find((r) => r[this.onConflict] === row[this.onConflict]);
          if (existing) { Object.assign(existing, row); result.push(existing); } else {
            const copy = { ...row };
            table.push(copy);
            result.push(copy);
          }
        }
        return { data: this.returning ? result : null, error: null };
      }
      default:
        return { data: null, error: { message: `fake-supabase: opération inconnue "${this.op}"` } };
    }
  }

  // Thenable : permet `await supabase.from(t)....` même sans .maybeSingle()
  // explicite (ex. `await supabase.from('notifications').insert({...})`).
  then(onFulfilled, onRejected) {
    try {
      return Promise.resolve(this._execute()).then(onFulfilled, onRejected);
    } catch (e) {
      return Promise.reject(e).then(onFulfilled, onRejected);
    }
  }

  maybeSingle() {
    const { data, error } = this._execute();
    if (error) return Promise.resolve({ data: null, error });
    const rows = data || [];
    if (rows.length > 1) {
      return Promise.resolve({ data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } });
    }
    return Promise.resolve({ data: rows[0] || null, error: null });
  }

  single() {
    const { data, error } = this._execute();
    if (error) return Promise.resolve({ data: null, error });
    const rows = data || [];
    if (rows.length !== 1) {
      return Promise.resolve({ data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } });
    }
    return Promise.resolve({ data: rows[0], error: null });
  }
}

// Stub minimal — aucune route couverte par les tests LOT 14a n'exerce
// réellement le contenu du Storage (upload/download de justificatif de
// groupe sanguin, hors périmètre) ; ces méthodes existent seulement pour que
// le code appelant (ex. PUT /me quand bloodType change) ne plante pas avec
// "is not a function" s'il les atteint incidemment.
function createFakeStorage() {
  return {
    from() {
      return {
        async remove() { return { data: null, error: null }; },
        async upload() { return { data: { path: 'fake/path' }, error: null }; },
        async download() { return { data: null, error: { message: 'fake-supabase: download non simulé' } }; },
      };
    },
  };
}

// users : objet { [bearerToken]: { id, email, user_metadata } }
export function createFakeSupabase({ users = {}, seed = {} } = {}) {
  const db = {
    profiles: [], emergency_contacts: [], training_progress: [], notifications: [], health_centers: [],
    ...seed,
  };

  const usersByToken = new Map(Object.entries(users));

  const supabase = {
    from(table) { return new FakeQueryBuilder(table, db); },
    storage: createFakeStorage(),
    auth: {
      async getUser(token) {
        const user = usersByToken.get(token);
        if (!user) return { data: { user: null }, error: { message: 'invalid or expired token' } };
        return { data: { user }, error: null };
      },
      admin: {
        async createUser() { return { data: { user: null }, error: { message: 'fake-supabase: admin.createUser non simulé' } }; },
        async updateUserById() { return { data: null, error: null }; },
      },
    },
  };

  return {
    supabase,
    db,
    registerUser(token, user) { usersByToken.set(token, user); },
  };
}
