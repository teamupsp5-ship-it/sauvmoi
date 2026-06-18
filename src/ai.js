// Cœur IA médical de Sauv'Moi.
//
// Deux modes, transparents pour le front :
//  1) Clé ANTHROPIC_API_KEY présente → appelle Claude, BRIDÉ par les protocoles validés
//     (l'IA ne peut pas inventer de gestes dangereux : elle s'appuie sur PROTOCOLS).
//  2) Pas de clé → fallback déterministe basé sur les protocoles (idéal démo hors-ligne).
//
// Réponse normalisée renvoyée au front :
//   { reply, suggestedActions:[{type:'call',label,number}], protocolRef, source }

import { PROTOCOLS, matchProtocol, SAMU, POMPIERS } from './data/protocols.js';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `Tu es l'assistant de premiers secours de "Sauv'Moi", une application ivoirienne.
Règles ABSOLUES :
- Tu t'appuies UNIQUEMENT sur les protocoles validés fournis ci-dessous. N'invente jamais de geste médical.
- Pour toute situation potentiellement vitale, recommande TOUJOURS d'appeler le SAMU 185 (ou les pompiers 180).
- Réponses TRÈS courtes, calmes, à l'impératif, étape par étape. La personne est peut-être en panique.
- Tu n'es pas médecin et tu le rappelles brièvement si pertinent.
- Réponds dans la langue de l'utilisateur (français par défaut).
Numéros d'urgence Côte d'Ivoire : SAMU 185, Pompiers 180, Police 170.`;

function protocolsAsContext() {
  return Object.values(PROTOCOLS)
    .map((p) => `### ${p.name} (gravité: ${p.severity})\n${p.steps.map((s, i) => `${i + 1}. ${s.title} — ${s.desc}`).join('\n')}`)
    .join('\n\n');
}

function actionsFor(protocol) {
  const a = [{ type: 'call', label: `Appeler le SAMU ${SAMU}`, number: SAMU }];
  if (protocol && (protocol.id === 'burn' || protocol.id === 'acc')) {
    a.push({ type: 'call', label: `Pompiers ${POMPIERS}`, number: POMPIERS });
  }
  return a;
}

// ---- Fallback déterministe (pas de clé API) --------------------------------
function fallbackReply(message, lang) {
  const p = matchProtocol(message);
  if (!p) {
    const reply = lang === 'EN'
      ? `I'm here to help. Briefly describe what's happening (e.g. "someone is bleeding", "he's choking"). For any life-threatening emergency, call ${SAMU} (SAMU) now.`
      : `Je suis là pour vous aider. Décrivez brièvement ce qui se passe (ex. « quelqu'un saigne », « il s'étouffe »). En cas d'urgence vitale, appelez le ${SAMU} (SAMU) tout de suite.`;
    return { reply, suggestedActions: actionsFor(null), protocolRef: null, source: 'fallback' };
  }
  const first = p.steps[0];
  const reply = lang === 'EN'
    ? `${p.en}. Stay calm. First: ${first.desc} I'll guide you step by step. If it's serious, call ${SAMU}.`
    : `${p.name}. Restez calme. D'abord : ${first.desc} Je vous guide étape par étape. Si c'est grave, appelez le ${SAMU}.`;
  return { reply, suggestedActions: actionsFor(p), protocolRef: p.id, source: 'fallback' };
}

// ---- Appel Claude (clé présente) -------------------------------------------
async function claudeReply(messages, lang) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system: `${SYSTEM_PROMPT}\n\nPROTOCOLES VALIDÉS :\n${protocolsAsContext()}`,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const reply = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const p = matchProtocol(lastUser?.content || '');
  return { reply, suggestedActions: actionsFor(p), protocolRef: p?.id || null, source: 'claude' };
}

export async function generateReply(messages, lang = 'FR') {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await claudeReply(messages, lang);
    } catch (e) {
      console.warn('[ai] Claude indisponible, fallback protocoles:', e.message);
    }
  }
  return fallbackReply(lastUser, lang);
}

// Analyse "caméra" (scriptée pour la démo — branchez un modèle de vision plus tard)
export function analyzeImage() {
  return {
    label: 'Plaie au bras · hémorragie modérée',
    labelEn: 'Wound on arm · moderate bleeding',
    confidence: 0.94,
    protocolRef: 'hemo',
    advice: PROTOCOLS.hemo.steps[0].desc,
  };
}
