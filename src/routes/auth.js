import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// ─── Aides : conversion texte ↔ liste (allergies / antécédents) ────────────
// La table profiles stocke allergies/conditions en texte simple (colonnes
// `text`) ; le frontend attend des tableaux dans medicalRecord — même
// convention que l'ancien backend (store.js), qui séparait déjà sur la virgule.
function splitList(text) {
  return (text || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function toUserPayload(authUser, profile, contacts) {
  const p = profile || {};
  return {
    id: authUser.id,
    email: authUser.email,
    name: p.name || '',
    phone: p.phone || '',
    birthdate: p.birthdate || '',
    gender: p.gender || '',
    photo: p.photo || null,
    city: p.city || 'Abidjan',
    role: p.role || 'Citoyen',
    lang: p.lang || 'FR',
    medicalRecord: {
      bloodType: p.blood_type || '',
      height: p.height ?? null,
      weight: p.weight ?? null,
      allergies: splitList(p.allergies),
      conditions: splitList(p.conditions),
      emergencyContacts: (contacts || []).map((c) => ({
        name: c.name, phone: c.phone, relation: c.relation || '',
      })),
    },
  };
}

async function fetchProfileAndContacts(userId) {
  const [{ data: profile, error: profileErr }, { data: contacts, error: contactsErr }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('emergency_contacts').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
  ]);
  if (profileErr) throw profileErr;
  if (contactsErr) throw contactsErr;
  return { profile, contacts: contacts || [] };
}

// ─── Middleware : vérifie le token Supabase, attache req.user (uuid) ───────
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentification requise' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: 'Session invalide ou expirée' });

  req.user = data.user;
  next();
}

// ─── Inscription complète (email + mot de passe + données médicales) ───────
router.post('/auth/register', async (req, res) => {
  const {
    name, email, phone, password,
    birthdate, gender,
    bloodType, height, weight, conditions, allergies,
    emergencyContact,
  } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'nom, email et mot de passe requis' });
  }

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { name: name.trim(), phone: phone || '' },
  });
  if (createErr) {
    const isConflict = /already been registered|already exists/i.test(createErr.message || '');
    return res.status(isConflict ? 409 : 400).json({ error: createErr.message || "Échec de l'inscription" });
  }
  const authUser = created.user;

  try {
    // Le trigger SQL handle_new_user a déjà créé une ligne vide dans profiles.
    const { error: profileErr } = await supabase.from('profiles').update({
      name: name.trim(),
      phone: phone || '',
      birthdate: birthdate || null,
      gender: gender || '',
      blood_type: bloodType || '',
      height: height ? Number(height) : null,
      weight: weight ? Number(weight) : null,
      conditions: conditions || '',
      allergies: allergies || '',
      updated_at: new Date().toISOString(),
    }).eq('id', authUser.id);
    if (profileErr) throw profileErr;

    if (emergencyContact?.name) {
      const { error: contactErr } = await supabase.from('emergency_contacts').insert({
        user_id: authUser.id,
        name: emergencyContact.name,
        phone: emergencyContact.phone || '',
        relation: 'Proche',
      });
      if (contactErr) throw contactErr;
    }

    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(), password,
    });
    if (signInErr) throw signInErr;

    const { profile, contacts } = await fetchProfileAndContacts(authUser.id);
    res.json({ token: signInData.session.access_token, user: toUserPayload(authUser, profile, contacts) });
  } catch (e) {
    res.status(500).json({ error: e.message || "Erreur lors de la finalisation de l'inscription" });
  }
});

// ─── Connexion email + mot de passe ─────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email et mot de passe requis' });

  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return res.status(401).json({ error: 'Identifiants incorrects' });

  try {
    const { profile, contacts } = await fetchProfileAndContacts(data.user.id);
    res.json({ token: data.session.access_token, user: toUserPayload(data.user, profile, contacts) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Changement de mot de passe ─────────────────────────────────────────────
router.post('/auth/change-password', requireAuth, async (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Nouveau mot de passe : 6 caractères minimum' });
  }

  const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password: newPassword });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── Profil : lecture ────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { profile, contacts } = await fetchProfileAndContacts(req.user.id);
    res.json(toUserPayload(req.user, profile, contacts));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Profil : mise à jour (infos perso, photo, carnet médical, contacts) ───
router.put('/me', requireAuth, async (req, res) => {
  const { name, phone, birthdate, gender, photo, medicalRecord } = req.body || {};

  const patch = { updated_at: new Date().toISOString() };
  if (name !== undefined) patch.name = name;
  if (phone !== undefined) patch.phone = phone;
  if (birthdate !== undefined) patch.birthdate = birthdate || null;
  if (gender !== undefined) patch.gender = gender;
  if (photo !== undefined) patch.photo = photo;
  if (medicalRecord) {
    if (medicalRecord.bloodType !== undefined) patch.blood_type = medicalRecord.bloodType;
    if (medicalRecord.height !== undefined) patch.height = medicalRecord.height;
    if (medicalRecord.weight !== undefined) patch.weight = medicalRecord.weight;
    if (medicalRecord.allergies !== undefined) {
      patch.allergies = Array.isArray(medicalRecord.allergies) ? medicalRecord.allergies.join(', ') : medicalRecord.allergies;
    }
    if (medicalRecord.conditions !== undefined) {
      patch.conditions = Array.isArray(medicalRecord.conditions) ? medicalRecord.conditions.join(', ') : medicalRecord.conditions;
    }
  }

  try {
    if (Object.keys(patch).length > 1) {
      const { error } = await supabase.from('profiles').update(patch).eq('id', req.user.id);
      if (error) throw error;
    }

    // Contacts d'urgence : remplacement complet (l'écran ProfileContacts
    // envoie toujours la liste entière), plafonné à 5 côté serveur.
    if (medicalRecord && Array.isArray(medicalRecord.emergencyContacts)) {
      const clean = medicalRecord.emergencyContacts
        .filter((c) => c.name && c.name.trim())
        .slice(0, 5);

      const { error: delErr } = await supabase.from('emergency_contacts').delete().eq('user_id', req.user.id);
      if (delErr) throw delErr;

      if (clean.length) {
        const { error: insErr } = await supabase.from('emergency_contacts').insert(
          clean.map((c) => ({ user_id: req.user.id, name: c.name.trim(), phone: c.phone || '', relation: c.relation || '' }))
        );
        if (insErr) throw insErr;
      }
    }

    const { profile, contacts } = await fetchProfileAndContacts(req.user.id);
    res.json(toUserPayload(req.user, profile, contacts));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
