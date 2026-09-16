import { Router } from 'express';
import { get, save, uid } from '../store.js';
import { generateReply } from '../ai.js';
import { isNonEmptyString, isOptionalString } from '../validate.js';

const router = Router();

const MAX_MESSAGE_LEN = 2000;

// Historique : seed de conversations pour la sidebar desktop
function seedConversations() {
  const db = get();
  if (Object.keys(db.conversations).length) return;
  const samples = [
    { title: 'Brûlure légère · main', lang: 'FR' },
    { title: 'Doit-on appeler le SAMU ?', lang: 'FR' },
    { title: 'Massage cardiaque · rythme', lang: 'FR' },
    { title: "Crise d'asthme — enfant", lang: 'FR' },
  ];
  for (const s of samples) {
    const id = uid('conv');
    db.conversations[id] = { id, title: s.title, lang: s.lang, messages: [], updatedAt: Date.now() };
  }
  save();
}
seedConversations();

router.get('/conversations', (req, res) => {
  const list = Object.values(get().conversations)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(({ id, title, lang, updatedAt, messages }) => ({ id, title, lang, updatedAt, count: messages.length }));
  res.json(list);
});

router.get('/conversations/:id', (req, res) => {
  const c = get().conversations[req.params.id];
  if (!c) return res.status(404).json({ error: 'conversation inconnue' });
  res.json(c);
});

// POST /api/chat — envoie un message, reçoit la réponse IA
router.post('/chat', async (req, res) => {
  const { message, lang = 'FR', conversationId } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message requis' });
  if (!isNonEmptyString(message, MAX_MESSAGE_LEN)) {
    return res.status(400).json({ error: `Message trop long (${MAX_MESSAGE_LEN} caractères maximum)` });
  }
  if (!isOptionalString(conversationId, 100)) {
    return res.status(400).json({ error: 'Identifiant de conversation invalide' });
  }
  const safeLang = lang === 'EN' ? 'EN' : 'FR';

  const db = get();
  let conv = conversationId && db.conversations[conversationId];
  if (!conv) {
    const id = uid('conv');
    conv = { id, title: message.slice(0, 40), lang: safeLang, messages: [], updatedAt: Date.now() };
    db.conversations[id] = conv;
  }

  conv.messages.push({ role: 'user', content: message, at: Date.now() });
  const ai = await generateReply(conv.messages, safeLang);
  conv.messages.push({ role: 'assistant', content: ai.reply, at: Date.now(), meta: ai });
  conv.updatedAt = Date.now();
  save();

  res.json({ conversationId: conv.id, ...ai });
});

export default router;
