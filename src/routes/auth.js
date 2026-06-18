import { Router } from 'express';
import { get, save, uid } from '../store.js';
import { DEMO_USER } from '../data/seed.js';

const router = Router();

// ─── Connexion email + mot de passe ─────────────────────────────────────────
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email et mot de passe requis' });

  const db = get();
  const existing = Object.values(db.users).find(u => u.email === email);
  if (existing) {
    // Démo : on accepte n'importe quel mot de passe pour un compte existant
    return res.json({ token: `demo.${existing.id}`, user: existing });
  }

  // Premier login : crée un profil démo lié à cet email
  const user = { ...DEMO_USER, id: uid('usr'), email: email.trim() };
  db.users[user.id] = user;
  save();
  res.json({ token: `demo.${user.id}`, user });
});

// ─── Inscription complète (email + mot de passe + données médicales) ─────────
router.post('/auth/register', (req, res) => {
  const {
    name, email, phone, password,
    birthdate, gender,
    bloodType, height, weight, conditions, allergies,
    emergencyContact,
  } = req.body || {};

  if (!name || !email || !password)
    return res.status(400).json({ error: 'nom, email et mot de passe requis' });

  const ecContacts = emergencyContact?.name
    ? [{ name: emergencyContact.name, phone: emergencyContact.phone || '', relation: 'proche' }]
    : DEMO_USER.medicalRecord.emergencyContacts;

  const allergyList = allergies
    ? allergies.split(',').map(a => a.trim()).filter(Boolean)
    : [];

  const id = uid('usr');
  const user = {
    ...DEMO_USER,
    id,
    name: name.trim(),
    email: email.trim(),
    phone: phone || '',
    birthdate: birthdate || '',
    gender: gender || '',
    medicalRecord: {
      ...DEMO_USER.medicalRecord,
      bloodType: bloodType || '',
      height: height ? Number(height) : null,
      weight: weight ? Number(weight) : null,
      conditions: conditions ? [conditions] : [],
      allergies: allergyList,
      emergencyContacts: ecContacts,
    },
  };

  get().users[id] = user;
  save();
  res.json({ token: `demo.${id}`, user });
});

// ─── Anciens endpoints OTP conservés pour compatibilité ─────────────────────
router.post('/auth/request-otp', (req, res) => {
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'phone requis' });
  const code = '123456';
  get().otps[phone] = code;
  save();
  res.json({ sent: true, channel: 'sms', demoCode: code });
});

router.post('/auth/verify', (req, res) => {
  const { phone, code } = req.body || {};
  if (!phone || !code) return res.status(400).json({ error: 'phone et code requis' });
  if (get().otps[phone] !== code) return res.status(401).json({ error: 'code invalide' });
  delete get().otps[phone];
  const pending = (get().pendingRegistrations || {})[phone];
  const user = { ...DEMO_USER, phone, name: pending?.name || DEMO_USER.name };
  if (pending) delete get().pendingRegistrations[phone];
  get().users[user.id] = user;
  save();
  res.json({ token: `demo.${user.id}`, user });
});

export default router;
