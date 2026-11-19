#!/usr/bin/env node
// src/routes/chat.route.test.js — LOT 14a. Tests d'intégration HTTP de
// POST /api/chat (src/routes/chat.js) : vraies requêtes HTTP contre l'app
// Express réelle (src/app.js). Supabase remplacé par la doublure
// src/test-support/fake-supabase.js (requireAuth) ; src/ai.js remplacé par
// une fausse generateReply() ("l'API simulée" demandée) — aucun appel réseau
// réel vers l'API Anthropic.
//
// Limite du rate limit testé : chatLimiter (routes/chat.js) utilise req.user.id
// comme clé -> chaque utilisateur de test a son propre quota, ce qui permet
// de tester le cas passant et le cas 429 dans le même fichier sans qu'ils ne
// s'interfèrent (voir userA/userB ci-dessous).
//
// Exécution : node --experimental-test-module-mocks --test src/routes/chat.route.test.js

import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeSupabase } from '../test-support/fake-supabase.js';

const TOKEN_A = 'token-user-a'; // dédié au test 429 (consomme tout son quota)
const TOKEN_B = 'token-user-b'; // dédié au cas passant, quota intact

const { supabase: fakeSupabase } = createFakeSupabase({
  users: {
    [TOKEN_A]: { id: 'user-a', email: 'a@test.local', user_metadata: {} },
    [TOKEN_B]: { id: 'user-b', email: 'b@test.local', user_metadata: {} },
  },
});

mock.module('../supabase.js', {
  exports: { supabase: fakeSupabase, createAuthClient: () => fakeSupabase },
});

const FAKE_REPLY = { reply: 'Réponse simulée de test.', suggestedActions: [], protocolRef: null, source: 'fake-test' };
mock.module('../ai.js', {
  exports: { generateReply: async () => FAKE_REPLY },
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

async function postChat(base, token, body) {
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

test('POST /api/chat — sans jeton -> 401', async () => {
  await withServer(async (base) => {
    const { status, json } = await postChat(base, null, { message: 'bonjour' });
    assert.equal(status, 401);
    assert.match(json.error, /authentification/i);
  });
});

test('POST /api/chat — cas passant, réponse de l\'IA simulée (pas de réseau réel)', async () => {
  await withServer(async (base) => {
    const { status, json } = await postChat(base, TOKEN_B, { message: 'Que faire en cas de brûlure ?' });
    assert.equal(status, 200);
    assert.equal(json.reply, FAKE_REPLY.reply);
    assert.equal(json.source, 'fake-test');
    assert.ok(json.conversationId);
  });
});

test('POST /api/chat — limite de débit (30/15min/utilisateur) -> 429 à la 31e requête', async () => {
  await withServer(async (base) => {
    let last;
    for (let i = 0; i < 31; i++) {
      last = await postChat(base, TOKEN_A, { message: `message ${i}` });
      if (last.status === 429) break;
    }
    assert.equal(last.status, 429);
    assert.match(last.json.error, /trop de messages/i);
  });
});

test('POST /api/chat — message absent -> 400', async () => {
  await withServer(async (base) => {
    const { status, json } = await postChat(base, TOKEN_B, {});
    assert.equal(status, 400);
    assert.match(json.error, /message requis/i);
  });
});
