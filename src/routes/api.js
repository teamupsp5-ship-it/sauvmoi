import { Router } from 'express';
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
  try {
    const [{ data: profile, error: profileErr }, { data: contactsRows, error: contactsErr }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', req.user.id).maybeSingle(),
      supabase.from('emergency_contacts').select('*').eq('user_id', req.user.id),
    ]);
    if (profileErr) throw profileErr;
    if (contactsErr) throw contactsErr;

    const now = Date.now();
    const SIX_MONTHS = 6 * 30 * 24 * 60 * 60 * 1000;
    const dob = profile?.birthdate ? new Date(profile.birthdate) : null;
    const age = dob ? Math.floor((now - dob) / (365.25 * 24 * 3600 * 1000)) : null;
    const allergies = (profile?.allergies || '').split(',').map((a) => a.trim()).filter(Boolean);
    const payload = {
      id: req.user.id,
      nom: profile?.name || '',
      age,
      bloodType: profile?.blood_type || '',
      allergies,
      contacts: (contactsRows || []).map((c) => ({ name: c.name, phone: c.phone, relation: c.relation })),
      generatedAt: now,
      expiresAt: now + SIX_MONTHS,
    };
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
