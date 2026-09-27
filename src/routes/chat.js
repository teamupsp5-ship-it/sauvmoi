import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { get, save, uid } from '../store.js';
import { generateReply } from '../ai.js';
import { isNonEmptyString, isOptionalString } from '../validate.js';
import { requireAuth } from './auth.js';

const router = Router();

const MAX_MESSAGE_LEN = 2000;

// Décision produit : le chat IA exige désormais un compte (requireAuth
// ci-dessous). Combiné à un CORS ouvert, cette route était auparavant
// appelable en boucle depuis n'importe quel site sans authentification —
// coût direct (API Anthropic payante) et abus sans aucune limite.
//
// Limite par utilisateur authentifié plutôt que par IP (keyGenerator lit
// req.user.id, posé par requireAuth qui s'exécute avant ce middleware) :
// plus juste qu'une IP partagée (réseau d'entreprise, NAT mobile...) et
// plus difficile à contourner qu'une IP puisqu'il faut un compte par
// tentative. Même convention que loginLimiter/registerLimiter
// (routes/auth.js) : express-rate-limit, message bilingue FR/EN.
//
// req.user est censé être TOUJOURS présent ici (requireAuth s'exécute
// avant et rejette sinon) — le `|| req.ip` n'est qu'un filet de sécurité
// pour un cas qui ne devrait jamais survenir. express-rate-limit ne peut
// pas le savoir statiquement : sans ipKeyGenerator(), un req.ip IPv6 brut
// n'est pas regroupé par sous-réseau, donc un client IPv6 pourrait changer
// d'adresse dans son bloc /64 pour contourner la limite à chaque requête —
// coût direct ici, cette route appelle l'API Claude (payante). Avertissement
// ERR_ERL_KEY_GEN_IPV6 résolu en enveloppant le repli avec ipKeyGenerator
// (regroupe par /56 par défaut, même comportement que le keyGenerator par
// défaut de la librairie — voir loginLimiter/registerLimiter, qui n'ont
// jamais eu ce défaut car ils utilisent ce défaut plutôt qu'un keyGenerator
// personnalisé).
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: { error: 'Trop de messages envoyés. Réessayez dans quelques minutes. / Too many messages sent. Please try again in a few minutes.' },
});

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

// POST /api/chat — envoie un message, reçoit la réponse IA. requireAuth
// avant chatLimiter : le keyGenerator du limiteur a besoin de req.user.id.
router.post('/chat', requireAuth, chatLimiter, async (req, res) => {
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
