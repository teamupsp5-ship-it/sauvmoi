import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { get, save, uid } from '../store.js';
import {
  EMERGENCY_LIST, COURSES, TRAINING_PATH, RESCUERS,
  PAYMENT_METHODS, TIPS, DEMO_USER,
} from '../data/seed.js';
import { PROTOCOLS } from '../data/protocols.js';
import { HEALTH_CENTERS } from '../data/health-centers.js';
import { analyzeImage } from '../ai.js';
import { supabase } from '../supabase.js';
import { requireAuth } from './auth.js';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { buildMedicalCardSvg, buildUnavailableCardSvg } from '../medical-card.js';

// URL publique du backend, encodée dans le QR médical (image PNG, voir plus
// bas) — même convention que public/api-client.js (BASE hardcodée, override
// possible pour le dev local).
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://sauvmoi.onrender.com';
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

// ─── Signature HMAC de la fiche médicale publique ──────────────────────────
// gen/exp voyagent en clair dans l'URL (route publique sans session, voir
// Décisions techniques dans CLAUDE.md) — sans signature, n'importe qui peut
// appeler /public/medical-card/<id>.png sans le paramètre exp et la fiche ne
// périme jamais, avec les données Supabase toujours à jour (la route relit
// la base à chaque appel). La signature garantit que gen/exp n'ont pas été
// altérés ou retirés par le client ; la révocation (qr_generated_at,
// vérifiée plus bas) garantit en plus qu'une URL signée mais périmée par une
// régénération plus récente ne reste pas valable jusqu'à son exp d'origine.
//
// Échec fermé : sans MEDICAL_CARD_SECRET, ni la génération ni la lecture ne
// doivent fonctionner — jamais de repli silencieux sur un fonctionnement non
// signé, ce serait revenir exactement à la faille corrigée ici.
function getMedicalCardSecret() {
  return process.env.MEDICAL_CARD_SECRET || null;
}

function signMedicalCard(id, gen, exp) {
  const secret = getMedicalCardSecret();
  if (!secret) throw new Error('MEDICAL_CARD_SECRET manquant');
  return createHmac('sha256', secret).update(`${id}:${gen}:${exp}`).digest('hex');
}

const SIG_RE = /^[0-9a-f]{64}$/i;

// Comparaison en temps constant (timingSafeEqual) plutôt que === : une
// comparaison de chaîne naïve sort dès le premier caractère différent, ce
// qui fuit un peu d'information temporelle sur le nombre de caractères
// corrects — sans intérêt pratique ici vu le volume de trafic attendu, mais
// c'est la façon correcte de comparer un HMAC et ça ne coûte rien.
function verifyMedicalCardSignature(id, gen, exp, sig) {
  const secret = getMedicalCardSecret();
  if (!secret || typeof sig !== 'string' || !SIG_RE.test(sig)) return false;
  const expected = createHmac('sha256', secret).update(`${id}:${gen}:${exp}`).digest('hex');
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig.toLowerCase(), 'hex'));
}

// Charge le profil + contacts Supabase pour un id donné et les met en forme
// pour la carte médicale (PNG publique) et la fiche victime (JSON interne à
// l'app) — partagé par les deux routes /public/medical-card/:file ci-dessous.
// qrGeneratedAt (colonne profiles.qr_generated_at, voir supabase/schema.sql)
// sert à la vérification de révocation dans la route publique : mémorise la
// dernière génération réelle de QR pour ce profil, indépendamment de la
// signature de l'URL présentée.
async function loadMedicalCardData(id) {
  const [{ data: profile, error: profileErr }, { data: contactsRows, error: contactsErr }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase.from('emergency_contacts').select('*').eq('user_id', id),
  ]);
  if (profileErr) throw profileErr;
  if (contactsErr) throw contactsErr;
  if (!profile) return null;

  const dob = profile.birthdate ? new Date(profile.birthdate) : null;
  const age = dob ? Math.floor((Date.now() - dob) / (365.25 * 24 * 3600 * 1000)) : null;
  const allergies = (profile.allergies || '').split(',').map((a) => a.trim()).filter(Boolean);
  const conditions = (profile.conditions || '').split(',').map((c) => c.trim()).filter(Boolean);
  return {
    id,
    nom: profile.name || '',
    age,
    bloodType: profile.blood_type || '',
    allergies,
    conditions,
    contacts: (contactsRows || []).map((c) => ({ name: c.name, phone: c.phone, relation: c.relation })),
    qrGeneratedAt: profile.qr_generated_at ? new Date(profile.qr_generated_at).getTime() : null,
  };
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const router = Router();

// ─── Config publique (frontend) ──────────────────────────────────────────────
// SUPABASE_ANON_KEY est conçue pour être publique (contrairement à
// SUPABASE_SERVICE_ROLE_KEY, jamais exposée ici) — nécessaire côté navigateur
// pour l'OAuth Google (supabase.auth.signInWithOAuth), qui doit s'exécuter
// depuis le client. Sans templating côté serveur (fichiers statiques purs),
// cette route est le seul moyen de transmettre l'URL/clé au frontend.
router.get('/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
  });
});

// ─── AUTH : téléphone + OTP (standard Afrique de l'Ouest) ───────────────────
router.post('/auth/request-otp', (req, res) => {
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'phone requis' });
  const code = '123456'; // démo : code fixe (en prod → SMS via agrégateur)
  get().otps[phone] = code;
  save();
  res.json({ sent: true, channel: 'sms', demoCode: code }); // demoCode affiché pour la démo
});

router.post('/auth/verify', (req, res) => {
  const { phone, code } = req.body || {};
  if (get().otps[phone] !== code) return res.status(401).json({ error: 'code invalide' });
  delete get().otps[phone];
  const user = { ...DEMO_USER, phone };
  get().users[user.id] = user;
  save();
  res.json({ token: `demo.${user.id}`, user });
});

// GET /me et PUT /me ont été déplacés dans routes/auth.js (requireAuth +
// table Supabase profiles) — l'ancien /me ici ignorait complètement
// l'utilisateur connecté et ne mutait que le DEMO_USER partagé.

// ─── ACCUEIL ────────────────────────────────────────────────────────────────
router.get('/home', (req, res) => {
  const now = new Date();
  res.json({
    greeting: `Bonjour ${DEMO_USER.name.split(' ')[0]}`,
    date: now.toISOString(),
    city: DEMO_USER.city,
    tipOfDay: TIPS[0],
    quick: {
      training: DEMO_USER.training,
      rescuersNearby: RESCUERS.length,
      medical: { bloodType: DEMO_USER.medicalRecord.bloodType, allergies: DEMO_USER.medicalRecord.allergies.length },
    },
  });
});

router.get('/tips', (req, res) => res.json(TIPS));

// ─── URGENCES & PROTOCOLES ───────────────────────────────────────────────────
router.get('/emergencies', (req, res) => res.json(EMERGENCY_LIST));

router.get('/protocols/:id', (req, res) => {
  const p = PROTOCOLS[req.params.id];
  if (!p) return res.status(404).json({ error: 'protocole inconnu' });
  res.json({ ...p, disclaimer: "Contenu pédagogique. En urgence vitale, appelez le 185." });
});

router.post('/vision/analyze', (req, res) => {
  // En prod : recevoir une image et appeler un modèle de vision.
  res.json(analyzeImage());
});

// ─── FORMATIONS ──────────────────────────────────────────────────────────────
router.get('/training/path', (req, res) => res.json(TRAINING_PATH));

router.get('/training/courses', (req, res) => {
  const { filter } = req.query;
  let list = COURSES;
  if (filter === 'free') list = COURSES.filter((c) => c.tag === 'free');
  if (filter === 'premium') list = COURSES.filter((c) => c.tag === 'premium');
  res.json(list);
});

router.get('/training/me', (req, res) => res.json(DEMO_USER.training));

router.post('/training/progress', (req, res) => {
  const { xp = 0 } = req.body || {};
  DEMO_USER.training.xp += xp;
  res.json(DEMO_USER.training);
});

// ─── PAIEMENTS Mobile Money (simulés) ────────────────────────────────────────
router.get('/payments/methods', (req, res) => res.json(PAYMENT_METHODS));

router.post('/payments/initiate', (req, res) => {
  const { courseId, method, phone } = req.body || {};
  const course = COURSES.find((c) => c.id === courseId);
  if (!course) return res.status(404).json({ error: 'cours inconnu' });
  if (!PAYMENT_METHODS.some((m) => m.id === method)) return res.status(400).json({ error: 'moyen de paiement invalide' });
  const id = uid('pay');
  const payment = {
    id, courseId, method, phone,
    amountFcfa: course.priceFcfa,
    status: 'pending',
    ussdPrompt: method === 'visa' ? null : 'Validez la transaction sur votre téléphone (#144#)',
    createdAt: Date.now(),
  };
  get().payments[id] = payment;
  save();
  res.json(payment);
});

// callback simulé (en prod : webhook de l'agrégateur type CinetPay/PayDunya)
router.post('/payments/:id/confirm', (req, res) => {
  const p = get().payments[req.params.id];
  if (!p) return res.status(404).json({ error: 'paiement inconnu' });
  p.status = 'success';
  p.confirmedAt = Date.now();
  save();
  res.json(p);
});

router.get('/payments/:id', (req, res) => {
  const p = get().payments[req.params.id];
  if (!p) return res.status(404).json({ error: 'paiement inconnu' });
  res.json(p);
});

// ─── CARNET MÉDICAL & QR ─────────────────────────────────────────────────────
router.get('/medical-record', (req, res) => res.json(DEMO_USER.medicalRecord));

router.put('/medical-record', (req, res) => {
  DEMO_USER.medicalRecord = { ...DEMO_USER.medicalRecord, ...(req.body || {}) };
  res.json(DEMO_USER.medicalRecord);
});

router.get('/medical-record/qr', requireAuth, async (req, res) => {
  // Échec fermé : jamais de QR non signé émis, quoi qu'il arrive.
  if (!getMedicalCardSecret()) {
    console.error('[medical-card] MEDICAL_CARD_SECRET absent — génération de QR refusée (échec fermé)');
    return res.status(500).json({ error: 'Configuration serveur invalide — QR médical indisponible' });
  }
  try {
    const data = await loadMedicalCardData(req.user.id);
    const now = Date.now();
    const expiresAt = now + SIX_MONTHS_MS;
    const payload = { ...(data || { id: req.user.id, nom: '', age: null, bloodType: '', allergies: [], conditions: [], contacts: [] }), generatedAt: now, expiresAt };

    // Révocation réelle : mémorise l'horodatage de CETTE génération sur le
    // profil. La route publique refuse toute URL (même valablement signée)
    // dont le gen est antérieur à cette valeur — c'est ce qui invalide
    // vraiment un ancien QR dès qu'un nouveau est généré. La signature seule
    // ne suffit pas : une URL signée volée resterait valide jusqu'à son exp
    // d'origine sans ce contrôle.
    const { error: revokeErr } = await supabase
      .from('profiles')
      .update({ qr_generated_at: new Date(now).toISOString() })
      .eq('id', req.user.id);
    if (revokeErr) throw revokeErr;

    // Le QR encode une URL vers l'image PNG publique (chargement instantané,
    // aucune app tierce requise pour lire du JSON brut — un scanner
    // d'appareil photo standard ouvre directement l'image) plutôt que du
    // JSON brut. gen/exp voyagent en query string car cette route publique
    // ne peut pas dépendre d'une session pour retrouver la date de
    // génération du QR — sig (HMAC de id:gen:exp) garantit qu'ils n'ont pas
    // été altérés ou retirés côté client (voir signMedicalCard ci-dessus).
    const sig = signMedicalCard(req.user.id, now, expiresAt);
    const url = `${PUBLIC_BASE_URL}/api/public/medical-card/${req.user.id}.png?gen=${now}&exp=${expiresAt}&sig=${sig}`;
    const qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    res.json({ payload, qrDataUrl, url });
  } catch (e) {
    res.status(500).json({ error: 'Génération QR échouée', detail: e.message });
  }
});

// ─── Carte médicale publique (image PNG) ─────────────────────────────────────
// Aucune authentification : c'est le contenu même du QR imprimé/affiché,
// destiné à être lu par un appareil photo/scanner tiers, pas seulement par
// l'app Sauv'Moi. Route à deux formats sur le même id :
//   .png  → image rasterisée (usage principal, scan externe)
//   .json → mêmes données en JSON (utilisé par screen-qr-scanner.jsx pour
//           afficher la fiche riche EN INTERNE sans réanalyser une image)
//
// Quatre motifs de refus (signature absente/invalide, expirée, révoquée)
// plus le cas profil introuvable partagent tous la MÊME réponse générique
// (voir sendUnavailable) : ne jamais laisser un appelant distinguer lequel
// s'applique en sondant l'URL. Le détail exact part uniquement dans les logs
// serveur (console.warn/error), jamais dans la réponse HTTP.
router.get('/public/medical-card/:file', async (req, res) => {
  const m = /^([^.]+)\.(png|json)$/.exec(req.params.file);
  if (!m) return res.status(400).json({ error: 'Format invalide' });
  const [, id, format] = m;

  const sendUnavailable = async (reason) => {
    console.warn(`[medical-card] fiche refusée (${reason}) — id: ${id}`);
    if (format === 'json') return res.status(404).json({ error: 'Fiche indisponible' });
    const svg = buildUnavailableCardSvg('Fiche indisponible');
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    res.type('image/png');
    return res.send(png);
  };

  // Échec fermé : sans secret, impossible de vérifier quoi que ce soit —
  // refuse tout plutôt que de servir une fiche non authentifiée.
  if (!getMedicalCardSecret()) {
    console.error('[medical-card] MEDICAL_CARD_SECRET absent — lecture refusée (échec fermé)');
    return sendUnavailable('secret serveur non configuré');
  }

  const { gen: genRaw, exp: expRaw, sig } = req.query;
  if (!genRaw || !expRaw || !sig) return sendUnavailable('gen/exp/sig manquants');

  const gen = Number(genRaw);
  const exp = Number(expRaw);
  if (!Number.isFinite(gen) || !Number.isFinite(exp)) return sendUnavailable('gen/exp non numériques');

  // Signature vérifiée AVANT toute autre décision : gen/exp ne sont dignes
  // de confiance qu'une fois authentifiés — les utiliser pour la vérif
  // d'expiration avant la signature reviendrait à faire confiance à des
  // valeurs qu'un client peut fabriquer librement (exactement le bug corrigé
  // ici : un exp retiré ou falsifié ne doit jamais être exploitable).
  if (!verifyMedicalCardSignature(id, gen, exp, sig)) return sendUnavailable('signature invalide ou absente');

  if (Date.now() > exp) return sendUnavailable('expirée');

  let data = null;
  try {
    data = await loadMedicalCardData(id);
  } catch (e) {
    console.error('[medical-card] chargement échoué pour', id, ':', e.message);
    return sendUnavailable('erreur de chargement');
  }
  if (!data) return sendUnavailable('profil introuvable');

  // Révocation : un QR régénéré depuis (qr_generated_at plus récent que le
  // gen de cette URL) invalide toute ancienne URL, même signée et non
  // expirée — voir le commentaire sur GET /medical-record/qr ci-dessus.
  if (data.qrGeneratedAt != null && gen < data.qrGeneratedAt) return sendUnavailable('révoquée par une régénération plus récente');

  if (format === 'json') {
    return res.json({ ...data, generatedAt: gen, expiresAt: exp });
  }
  const svg = buildMedicalCardSvg({ ...data, generatedAt: gen, expiresAt: exp });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  res.type('image/png');
  res.send(png);
});

// ─── CENTRES DE SANTÉ ────────────────────────────────────────────────────────
router.get('/health-centers', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const hasCoords = !isNaN(lat) && !isNaN(lng);
  const list = HEALTH_CENTERS.map(c => ({
    ...c,
    distanceKm: hasCoords ? haversineKm(lat, lng, c.lat, c.lng) : null,
  }));
  if (hasCoords) list.sort((a, b) => a.distanceKm - b.distanceKm);
  res.json(list);
});

// ─── NOTIFICATIONS IN-APP ────────────────────────────────────────────────────
// Alimentées par routes/sos.js (insert dans la table Supabase `notifications`
// quand un contact d'urgence a lui-même un compte Sauv'Moi).
router.get('/notifications', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map((n) => ({
    id: n.id, userId: n.user_id, type: n.type, fromUser: n.from_user,
    message: n.message, lat: n.lat, lng: n.lng,
    createdAt: n.created_at, read: n.is_read,
  })));
});

router.post('/notifications/:id/read', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
