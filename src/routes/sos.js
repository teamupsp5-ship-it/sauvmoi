import { Router } from 'express';
import { get, save, uid } from '../store.js';
import { supabase } from '../supabase.js';
import { requireAuth } from './auth.js';
import { isValidLatLng, isOptionalString } from '../validate.js';

const router = Router();

// POST /api/sos/trigger — déclenche une alerte réelle, vérifie hasAccount
// (recherche d'un profil Supabase dont le téléphone correspond), crée une
// notification in-app pour chaque contact qui en a un.
router.post('/sos/trigger', requireAuth, async (req, res) => {
  const { lat = 5.354, lng = -3.987, label = 'Abidjan' } = req.body || {};
  // Contrairement aux autres validations de l'app (qui retombent sur une
  // valeur par défaut), une position GPS invalide est rejetée plutôt
  // qu'silencieusement remplacée par Abidjan par défaut — ce module est
  // safety-critical, mieux vaut un 400 explicite qu'une position erronée
  // envoyée aux secours/contacts sans que personne ne le remarque.
  if (!isValidLatLng(lat, lng)) {
    return res.status(400).json({ error: 'Position GPS invalide' });
  }
  if (!isOptionalString(label, 100)) {
    return res.status(400).json({ error: 'Libellé de position invalide' });
  }
  const userId = req.user.id;

  try {
    const [{ data: senderProfile }, { data: contactRows, error: contactsErr }] = await Promise.all([
      supabase.from('profiles').select('name').eq('id', userId).maybeSingle(),
      supabase.from('emergency_contacts').select('*').eq('user_id', userId),
    ]);
    if (contactsErr) throw contactsErr;

    const senderName = senderProfile?.name || req.user.email || 'Un proche';

    const contacts = [];
    for (const c of (contactRows || [])) {
      const { data: matchedProfile, error: matchErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', c.phone)
        .maybeSingle();
      if (matchErr) throw matchErr;

      const hasAccount = !!matchedProfile;
      if (hasAccount) {
        const { error: notifErr } = await supabase.from('notifications').insert({
          user_id: matchedProfile.id,
          type: 'sos',
          from_user: senderName,
          message: `🚨 ${senderName} a déclenché une alerte SOS`,
          lat, lng,
        });
        if (notifErr) console.warn('[sos] notification non enregistrée:', notifErr.message);
      }
      contacts.push({ name: c.name, phone: c.phone, relation: c.relation, hasAccount });
    }

    const db = get();
    const id = uid('sos');
    db.sosAlerts[id] = { id, status: 'active', userId, createdAt: Date.now(), location: { lat, lng, label }, contacts };
    save();
    res.json({ alertId: id, contacts, lat, lng });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
