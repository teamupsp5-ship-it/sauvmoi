import { Router } from 'express';
import { get, save, uid } from '../store.js';
import { DEMO_USER } from '../data/seed.js';

const router = Router();

// POST /api/sos/trigger — déclenche une alerte réelle, vérifie hasAccount, crée notifications
router.post('/sos/trigger', (req, res) => {
  const { lat = 5.354, lng = -3.987, label = 'Abidjan' } = req.body || {};
  const db = get();
  const id = uid('sos');

  const contacts = DEMO_USER.medicalRecord.emergencyContacts.map(c => {
    const registeredUser = Object.values(db.users).find(u => u.phone === c.phone);
    const hasAccount = !!registeredUser;
    if (hasAccount && registeredUser) {
      const notifId = uid('notif');
      if (!db.notifications) db.notifications = {};
      db.notifications[notifId] = {
        id: notifId,
        userId: registeredUser.id,
        alertId: id,
        message: `🚨 ${DEMO_USER.name.split(' ')[0]} a déclenché une alerte SOS`,
        lat, lng,
        createdAt: Date.now(),
        read: false,
      };
    }
    return { name: c.name, phone: c.phone, relation: c.relation, hasAccount };
  });

  db.sosAlerts[id] = { id, status: 'active', userId: DEMO_USER.id, createdAt: Date.now(), location: { lat, lng, label }, contacts };
  save();
  res.json({ alertId: id, contacts, lat, lng });
});

router.get('/sos/:id/status', (req, res) => {
  const a = get().sosAlerts[req.params.id];
  if (!a) return res.status(404).json({ error: 'alerte inconnue' });
  res.json(a);
});

router.post('/sos/:id/cancel', (req, res) => {
  const a = get().sosAlerts[req.params.id];
  if (!a) return res.status(404).json({ error: 'alerte inconnue' });
  a.status = 'cancelled';
  save();
  res.json({ ok: true });
});

export default router;
