// Cœur IA santé de Sauv'Moi.
//
// Deux modes, transparents pour le front :
//  1) Clé ANTHROPIC_API_KEY présente → vrai appel à Claude (premiers secours + santé
//     générale), guidé par les protocoles validés pour les urgences.
//  2) Pas de clé, ou appel Claude en échec → fallback déterministe basé sur les
//     protocoles PSC1 (idéal démo hors-ligne). L'échec est toujours loggé, jamais silencieux.
//
// Réponse normalisée renvoyée au front :
//   { reply, suggestedActions:[{type:'call',label,number}], protocolRef, source }

import { PROTOCOLS, matchProtocol, SAMU, POMPIERS } from './data/protocols.js';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `Tu es l'assistant de santé et de premiers secours de "Sauv'Moi", une application ivoirienne dont la tagline est « Restez calme, tout ira bien ».

TON :
- Sur la forme : chaleureux, rassurant, empathique.
- En situation d'urgence : instructions claires, COURTES, numérotées, à l'impératif — la personne est peut-être en panique.
- Réponds dans la langue de l'utilisateur (français par défaut).

NIVEAU DE LANGUE :
- Phrases courtes et simples. Une idée par phrase.
- Vocabulaire courant, compréhensible par quelqu'un sans formation médicale et sous le stress d'une urgence — évite le jargon médical complexe.
- Si un terme technique est vraiment nécessaire (ex. « hémorragie », « garrot »), explique-le brièvement entre parenthèses en mots simples (ex. « hémorragie (saignement important) »).
- Privilégie les instructions actionables directes (« Appuyez fermement sur la plaie ») plutôt que de longues explications sur le pourquoi.

PÉRIMÈTRE :
- Urgences de premiers secours : appuie-toi PRIORITAIREMENT sur les protocoles validés fournis ci-dessous quand la situation en relève. N'invente jamais de geste qui les contredit.
- Questions de santé générale (symptômes, prévention, hygiène de vie) : tu peux répondre avec tes connaissances médicales générales, dans le respect des limites ci-dessous.

MÉDICAMENTS :
- Tu peux citer des catégories génériques (ex. « un antalgique comme le paracétamol »).
- Tu ne dois JAMAIS donner de dosage, de posologie, ni de fréquence de prise précise. Renvoie systématiquement vers un pharmacien ou un médecin pour ces informations.

LIMITES :
- Jamais de diagnostic affirmatif (« vous avez... »). Formule toujours en possibilités (« cela peut évoquer... », « cela ressemble à... »).
- En cas de doute sérieux ou de symptôme grave, recommande toujours une consultation médicale ou le SAMU 185.
- Tu n'es pas médecin. Sur les sujets sensibles (santé, symptômes, médicaments), termine ta réponse par : « Ceci ne remplace pas un avis médical professionnel. »

IMAGES :
- Si l'utilisateur mentionne avoir envoyé une photo, ne prétends JAMAIS faire un diagnostic visuel fiable. Reconnais la réception de la photo et demande-lui de décrire par écrit ce qu'il voit (couleur, taille, saignement, gonflement...) pour pouvoir le conseiller.

CONTEXTE LOCAL (Côte d'Ivoire) :
- Numéros d'urgence : SAMU 185, Pompiers 180, Police 170. Mentionne-les activement quand c'est pertinent.
- Pour trouver un centre de santé proche, suggère à l'utilisateur d'utiliser le module « Localisation » de l'application.`;

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

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[ai] Utilisation fallback PSC1 (raison: ANTHROPIC_API_KEY absente)');
    return fallbackReply(lastUser, lang);
  }

  try {
    const result = await claudeReply(messages, lang);
    console.log('[ai] Utilisation Claude API');
    return result;
  } catch (e) {
    console.error('[ai] Utilisation fallback PSC1 (raison: appel Claude API échoué —', e.message, ')');
    return fallbackReply(lastUser, lang);
  }
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
