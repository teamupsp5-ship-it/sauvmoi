import { Router } from 'express';
import { get, save, uid } from '../store.js';
import { RESCUERS, DEMO_USER } from '../data/seed.js';
import { SAMU } from '../data/protocols.js';

const router = Router();

// Bus d'événements SOS → poussés aux clients WebSocket abonnés
const listeners = new Map(); // alertId -> Set<ws>
const tickers = new Map();   // alertId -> interval handle (hors de l'objet alerte, jamais sérialisé)

export function subscribe(alertId, ws) {
  if (!listeners.has(alertId)) listeners.set(alertId, new Set());
  listeners.get(alertId).add(ws);
  ws.on('close', () => listeners.get(alertId)?.delete(ws));
}

function emit(alertId, event) {
  const set = listeners.get(alertId);
  if (!set) return;
  const msg = JSON.stringify(event);
  for (const ws of set) { try { ws.send(msg); } catch {} }
}

// Simulation temps réel : SAMU reçoit, secouristes acceptent, ETA défile.
function runSimulation(alert) {
  const eta = { value: 6 }; // minutes

  setTimeout(() => {
    alert.samu.status = 'received';
    alert.samu.etaMin = 4;
    save();
    emit(alert.id, { type: 'samu', status: 'received', etaMin: 4, number: SAMU });
  }, 1500);

  // Proche en route
  setTimeout(() => {
    alert.relatives[0].status = 'on_the_way';
    alert.relatives[0].etaMin = 8;
    save();
    emit(alert.id, { type: 'relative', name: alert.relatives[0].name, status: 'on_the_way', etaMin: 8 });
  }, 2500);

  // Secouristes qui acceptent un par un
  [0, 1, 2].forEach((i, k) => {
    setTimeout(() => {
      const r = alert.rescuers[i];
      r.status = 'accepted';
      alert.rescuersAccepted = (alert.rescuersAccepted || 0) + 1;
      save();
      emit(alert.id, { type: 'rescuer', id: r.id, name: r.name, status: 'accepted', distanceM: r.distanceM, accepted: alert.rescuersAccepted });
    }, 2000 + k * 1800);
  });

  // ETA ambulance qui décompte
  const ticker = setInterval(() => {
    eta.value -= 1;
    alert.samu.etaMin = Math.max(0, eta.value);
    if (eta.value <= 0) {
      clearInterval(tickers.get(alert.id));
      tickers.delete(alert.id);
      alert.status = 'arrived';
      save();
      emit(alert.id, { type: 'arrived', message: 'Les secours sont sur place.' });
      return;
    }
    emit(alert.id, { type: 'eta', etaMin: eta.value });
  }, 4000);

  tickers.set(alert.id, ticker);
}

// POST /api/sos/trigger — déclenche l'alerte (après le compte à rebours côté front)
router.post('/sos/trigger', (req, res) => {
  const { lat = 5.354, lng = -3.987, label = 'Abidjan' } = req.body || {};
  const db = get();
  const id = uid('sos');

  // Pour chaque contact d'urgence, vérifier s'il a un compte Sauv'Moi
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

  const alert = {
    id,
    status: 'active',
    userId: DEMO_USER.id,
    createdAt: Date.now(),
    location: { lat, lng, label, accuracyM: 8 },
    samu: { number: SAMU, status: 'notified', etaMin: 6 },
    relatives: contacts.map(c => ({ name: c.name, phone: c.phone, status: 'notified', hasAccount: c.hasAccount })),
    rescuers: RESCUERS.map((r) => ({ ...r, status: 'alerted' })),
    rescuersAlerted: RESCUERS.length,
    rescuersAccepted: 0,
    contacts,
  };
  db.sosAlerts[id] = alert;
  save();
  runSimulation(alert);
  res.json({ alertId: id, contacts, ...alert });
});

router.get('/sos/:id/status', (req, res) => {
  const a = get().sosAlerts[req.params.id];
  if (!a) return res.status(404).json({ error: 'alerte inconnue' });
  res.json(a);
});

router.post('/sos/:id/cancel', (req, res) => {
  const a = get().sosAlerts[req.params.id];
  if (!a) return res.status(404).json({ error: 'alerte inconnue' });
  clearInterval(tickers.get(a.id));
  tickers.delete(a.id);
  a.status = 'cancelled';
  save();
  emit(a.id, { type: 'cancelled' });
  res.json({ ok: true });
});

router.get('/rescuers/nearby', (req, res) => {
  res.json(RESCUERS);
});

export default router;
