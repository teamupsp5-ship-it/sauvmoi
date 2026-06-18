import { Router } from 'express';
import { get, save, uid } from '../store.js';
import {
  EMERGENCY_LIST, COURSES, TRAINING_PATH, RESCUERS,
  PAYMENT_METHODS, TIPS, DEMO_USER,
} from '../data/seed.js';
import { PROTOCOLS } from '../data/protocols.js';
import { analyzeImage } from '../ai.js';

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

router.get('/medical-record/qr', (req, res) => {
  // Payload minimal qu'un secouriste peut scanner (en prod : signé + lien court)
  const payload = {
    name: DEMO_USER.name,
    bloodType: DEMO_USER.medicalRecord.bloodType,
    allergies: DEMO_USER.medicalRecord.allergies,
    contacts: DEMO_USER.medicalRecord.emergencyContacts,
  };
  const data = encodeURIComponent(JSON.stringify(payload));
  res.json({
    payload,
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${data}`,
  });
});

export default router;
