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
  const { lat, lng, label } = req.body || {};
  // Deux cas distincts, jamais confondus : position ABSENTE (le client n'a
  // pas pu obtenir de GPS — acceptée, l'alerte part quand même sans
  // coordonnées plutôt que de bloquer un utilisateur en détresse) vs
  // position FOURNIE MAIS INVALIDE (rejetée avec 400) — safety-critical,
  // mieux vaut échouer clairement qu'envoyer une position erronée aux
  // secours/contacts sans que personne ne le remarque. Ne jamais fabriquer
  // de coordonnées par défaut (ex. Abidjan) : un défaut silencieux a
  // exactement la même forme qu'une vraie position GPS, donc rien ne permet
  // de le distinguer une fois parti vers les secours/contacts.
  const hasLat = lat !== undefined && lat !== null;
  const hasLng = lng !== undefined && lng !== null;
  if (hasLat !== hasLng) {
    return res.status(400).json({ error: 'Position GPS incomplète' });
  }
  const hasPosition = hasLat && hasLng;
  if (hasPosition && !isValidLatLng(lat, lng)) {
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
          lat: hasPosition ? lat : null,
          lng: hasPosition ? lng : null,
        });
        if (notifErr) console.warn('[sos] notification non enregistrée:', notifErr.message);
      }
      contacts.push({ name: c.name, phone: c.phone, relation: c.relation, hasAccount });
    }

    const db = get();
    const id = uid('sos');
    db.sosAlerts[id] = {
      id, status: 'active', userId, createdAt: Date.now(),
      location: hasPosition ? { lat, lng, label: label || null } : null,
      contacts,
    };
    save();
    res.json({ alertId: id, contacts, lat: hasPosition ? lat : null, lng: hasPosition ? lng : null });
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
