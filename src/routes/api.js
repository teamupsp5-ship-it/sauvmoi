import { Router } from 'express';
import { get, save, uid } from '../store.js';
import {
  EMERGENCY_LIST, COURSES, TRAINING_PATH, RESCUERS,
  PAYMENT_METHODS, TIPS, DEMO_USER,
} from '../data/seed.js';
import { PROTOCOLS } from '../data/protocols.js';
import { HEALTH_CENTERS } from '../data/health-centers.js';
import { analyzeImage } from '../ai.js';
import QRCode from 'qrcode';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const router = Router();

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

router.get('/me', (req, res) => res.json(DEMO_USER));

router.put('/me', (req, res) => {
  const { name, phone, birthdate, gender, photo, medicalRecord } = req.body || {};
  if (name !== undefined) DEMO_USER.name = name;
  if (phone !== undefined) DEMO_USER.phone = phone;
  if (birthdate !== undefined) DEMO_USER.birthdate = birthdate;
  if (gender !== undefined) DEMO_USER.gender = gender;
  if (photo !== undefined) DEMO_USER.photo = photo;
  if (medicalRecord) DEMO_USER.medicalRecord = { ...DEMO_USER.medicalRecord, ...medicalRecord };
  const db = get();
  if (db.users['u_demo']) Object.assign(db.users['u_demo'], DEMO_USER);
  save();
  res.json(DEMO_USER);
});

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

router.get('/medical-record/qr', async (req, res) => {
  const now = Date.now();
  const SIX_MONTHS = 6 * 30 * 24 * 60 * 60 * 1000;
  const dob = DEMO_USER.birthdate ? new Date(DEMO_USER.birthdate) : null;
  const age = dob ? Math.floor((now - dob) / (365.25 * 24 * 3600 * 1000)) : null;
  const payload = {
    id: DEMO_USER.id,
    nom: DEMO_USER.name,
    age,
    bloodType: DEMO_USER.medicalRecord.bloodType,
    allergies: DEMO_USER.medicalRecord.allergies,
    contacts: DEMO_USER.medicalRecord.emergencyContacts,
    generatedAt: now,
    expiresAt: now + SIX_MONTHS,
  };
  try {
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload), { width: 300, margin: 2 });
    res.json({ payload, qrDataUrl });
  } catch (e) {
    res.status(500).json({ error: 'Génération QR échouée', detail: e.message });
  }
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
router.get('/notifications', (req, res) => {
  const db = get();
  const notifs = Object.values(db.notifications || {})
    .filter(n => n.userId === 'u_demo')
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(notifs);
});

router.post('/notifications/:id/read', (req, res) => {
  const db = get();
  const n = (db.notifications || {})[req.params.id];
  if (!n) return res.status(404).json({ error: 'notification inconnue' });
  n.read = true;
  save();
  res.json({ ok: true });
});

export default router;
