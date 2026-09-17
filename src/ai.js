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

import { PROTOCOLS, matchProtocol, SAMU, POMPIERS, POLICE } from './data/protocols.js';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT_FR = `Tu es l'assistant de santé et de premiers secours de "Sauv'Moi", une application ivoirienne dont la tagline est « Restez calme, tout ira bien ».

TON :
- Sur la forme : chaleureux, rassurant, empathique.
- En situation d'urgence : instructions claires, COURTES, numérotées, à l'impératif — la personne est peut-être en panique.

LANGUE :
- Tu dois TOUJOURS répondre entièrement en français, sans aucun mot ou expression en anglais, quelle que soit la langue du message de l'utilisateur, sauf instruction contraire explicite de sa part.
- Si l'utilisateur écrit en anglais ou dans une autre langue, réponds quand même en français par défaut.
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
- En cas de doute sérieux ou de symptôme grave, recommande toujours une consultation médicale ou le SAMU ${SAMU}.
- Tu n'es pas médecin. Sur les sujets sensibles (santé, symptômes, médicaments), termine ta réponse par : « Ceci ne remplace pas un avis médical professionnel. »

IMAGES :
- Si l'utilisateur mentionne avoir envoyé une photo, ne prétends JAMAIS faire un diagnostic visuel fiable. Reconnais la réception de la photo et demande-lui de décrire par écrit ce qu'il voit (couleur, taille, saignement, gonflement...) pour pouvoir le conseiller.

CONTEXTE LOCAL (Côte d'Ivoire) :
- Numéros d'urgence : SAMU ${SAMU}, Pompiers ${POMPIERS}, Police ${POLICE}. Mentionne-les activement quand c'est pertinent.
- Pour trouver un centre de santé proche, suggère à l'utilisateur d'utiliser le module « Localisation » de l'application.

RÉFÉRENCE :
- Les protocoles fournis ci-dessous sont rédigés en français — utilise-les comme référence interne, mais rédige TOUJOURS ta réponse entièrement en français.`;

// Version anglaise du même prompt — mêmes règles de sécurité (pas de
// diagnostic affirmatif, pas de dosage précis, mêmes numéros d'urgence
// ivoiriens qui ne changent pas selon la langue). Les protocoles injectés
// dans PROTOCOLES VALIDÉS restent en français (contenu Phase 2, voir
// protocols.js) — la note RÉFÉRENCE ci-dessous demande explicitement à
// Claude de ne jamais laisser passer de français dans sa réponse malgré ça.
const SYSTEM_PROMPT_EN = `You are the health and first-aid assistant for "Sauv'Moi", an Ivorian app whose tagline is "Stay calm, everything will be alright".

TONE:
- Warm, reassuring, empathetic.
- In an emergency: clear, SHORT, numbered instructions, imperative mood — the person may be panicking.

LANGUAGE:
- You must ALWAYS respond entirely in English, with no French words or expressions, regardless of the language of the user's message, unless they explicitly ask otherwise.
- If the user writes in French or another language, still respond in English by default.
- Short, simple sentences. One idea per sentence.
- Everyday vocabulary, understandable by someone with no medical training who is under the stress of an emergency — avoid complex medical jargon.
- If a technical term is really necessary (e.g. "hemorrhage", "tourniquet"), briefly explain it in parentheses using simple words (e.g. "hemorrhage (heavy bleeding)").
- Prefer direct, actionable instructions ("Press firmly on the wound") over long explanations of why.

SCOPE:
- First-aid emergencies: rely PRIMARILY on the validated protocols provided below when the situation matches one. Never invent a step that contradicts them.
- General health questions (symptoms, prevention, lifestyle): you may answer using your general medical knowledge, within the limits below.

MEDICATION:
- You may mention generic categories (e.g. "a painkiller like paracetamol/acetaminophen").
- You must NEVER give a precise dose, dosage, or frequency of intake. Always refer the user to a pharmacist or doctor for that information.

LIMITS:
- Never give an affirmative diagnosis ("you have..."). Always phrase things as possibilities ("this could suggest...", "this sounds like...").
- In case of serious doubt or a severe symptom, always recommend medical consultation or calling SAMU ${SAMU}.
- You are not a doctor. On sensitive topics (health, symptoms, medication), end your response with: "This does not replace professional medical advice."

IMAGES:
- If the user mentions having sent a photo, NEVER claim to make a reliable visual diagnosis. Acknowledge receiving the photo and ask them to describe in writing what they see (color, size, bleeding, swelling...) so you can advise them.

LOCAL CONTEXT (Côte d'Ivoire):
- Emergency numbers: SAMU ${SAMU}, Fire department ${POMPIERS}, Police ${POLICE}. Mention them proactively when relevant.
- To find a nearby health center, suggest the user use the app's "Location" module.

REFERENCE:
- The protocols provided below are written in French for internal reference only — you must still write your ENTIRE response in English, translating any protocol details you use.`;

function protocolsAsContext() {
  return Object.values(PROTOCOLS)
    .map((p) => `### ${p.name} (gravité: ${p.severity})\n${p.steps.map((s, i) => `${i + 1}. ${s.title} — ${s.desc}`).join('\n')}`)
    .join('\n\n');
}

function actionsFor(protocol, lang) {
  const a = [{ type: 'call', label: lang === 'EN' ? `Call SAMU ${SAMU}` : `Appeler le SAMU ${SAMU}`, number: SAMU }];
  if (protocol && (protocol.id === 'burn' || protocol.id === 'acc')) {
    a.push({ type: 'call', label: lang === 'EN' ? `Firefighters ${POMPIERS}` : `Pompiers ${POMPIERS}`, number: POMPIERS });
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
    return { reply, suggestedActions: actionsFor(null, lang), protocolRef: null, source: 'fallback' };
  }
  const first = p.steps[0];
  const reply = lang === 'EN'
    ? `${p.en}. Stay calm. First: ${first.desc} I'll guide you step by step. If it's serious, call ${SAMU}.`
    : `${p.name}. Restez calme. D'abord : ${first.desc} Je vous guide étape par étape. Si c'est grave, appelez le ${SAMU}.`;
  return { reply, suggestedActions: actionsFor(p, lang), protocolRef: p.id, source: 'fallback' };
}

// ---- Appel Claude (clé présente) -------------------------------------------
async function claudeReply(messages, lang) {
  const systemPrompt = lang === 'EN' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_FR;
  const protocolsHeading = lang === 'EN' ? 'VALIDATED PROTOCOLS (French, internal reference)' : 'PROTOCOLES VALIDÉS';
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
      system: `${systemPrompt}\n\n${protocolsHeading} :\n${protocolsAsContext()}`,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const reply = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const p = matchProtocol(lastUser?.content || '');
  return { reply, suggestedActions: actionsFor(p, lang), protocolRef: p?.id || null, source: 'claude' };
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
