import { Router } from 'express';
import { supabase, createAuthClient } from '../supabase.js';

const router = Router();

// ─── Aides : conversion texte ↔ liste (allergies / antécédents) ────────────
// La table profiles stocke allergies/conditions en texte simple (colonnes
// `text`) ; le frontend attend des tableaux dans medicalRecord — même
// convention que l'ancien backend (store.js), qui séparait déjà sur la virgule.
function splitList(text) {
  return (text || '').split(',').map((s) => s.trim()).filter(Boolean);
}

// Accepte les champs médicaux qu'ils soient envoyés à plat (contrat actuel
// de /auth/register : bloodType, height, ... au premier niveau) ou nichés
// sous `medicalRecord` (contrat actuel de PUT /me) ou `medical` — au cas où
// un appelant utilise l'une ou l'autre convention, les deux endpoints les
// retrouvent de la même façon au lieu de silencieusement les ignorer.
function extractMedicalFields(body) {
  const nested = (body && (body.medicalRecord || body.medical)) || null;
  const src = nested || body || {};
  return {
    bloodType: src.bloodType,
    height: src.height,
    weight: src.weight,
    conditions: src.conditions,
    allergies: src.allergies,
  };
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
    emergencyContact, emergencyContacts,
  } = req.body || {};
  const { bloodType, height, weight, conditions, allergies } = extractMedicalFields(req.body || {});

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
    // Le trigger SQL handle_new_user a déjà créé une ligne (name, phone) dans
    // profiles au moment où admin.createUser() a résolu — l'insertion et le
    // trigger font partie de la même transaction Postgres côté GoTrue, donc
    // c'est garanti synchrone à ce stade.
    //
    // On complète cette ligne via upsert plutôt qu'un update conditionnel :
    // un .update().eq('id', ...) qui ne matche aucune ligne (trigger en
    // retard, RLS mal configurée, etc.) réussit SILENCIEUSEMENT côté
    // PostgREST — error === null mais 0 ligne affectée — ce qui correspond
    // exactement au bug observé (compte créé, champs jamais enregistrés,
    // aucune erreur remontée). L'upsert avec onConflict sur la clé primaire
    // s'applique que la ligne existe déjà (cas normal, effet = update) ou
    // pas encore (filet de sécurité, effet = insert) — et .select() permet
    // de vérifier qu'une ligne a bien été écrite avant de continuer.
    const { data: updatedProfile, error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
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
      }, { onConflict: 'id' })
      .select()
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!updatedProfile) throw new Error('Le profil n\'a pas pu être enregistré (aucune ligne retournée par Supabase)');

    // Diagnostic : compare ce qui a été envoyé à ce que Supabase a réellement
    // stocké/retourné pour les champs médicaux — utile si ce bug (champs
    // médicaux vides après inscription) devait se reproduire malgré la
    // correction ci-dessus.
    console.log('[auth] register — médical envoyé:', { bloodType, height, weight, conditions, allergies });
    console.log('[auth] register — médical stocké:', {
      blood_type: updatedProfile.blood_type, height: updatedProfile.height, weight: updatedProfile.weight,
      allergies: updatedProfile.allergies, conditions: updatedProfile.conditions,
    });

    // Le frontend actuel envoie un seul contact (emergencyContact) ; on
    // accepte aussi un tableau (emergencyContacts) pour rester compatible
    // si l'inscription permet un jour plusieurs contacts d'emblée.
    const contactsToInsert = Array.isArray(emergencyContacts)
      ? emergencyContacts.filter((c) => c && c.name)
      : (emergencyContact?.name ? [emergencyContact] : []);

    if (contactsToInsert.length) {
      const { error: contactErr } = await supabase.from('emergency_contacts').insert(
        contactsToInsert.slice(0, 5).map((c) => ({
          user_id: authUser.id,
          name: c.name,
          phone: c.phone || '',
          relation: c.relation || 'Proche',
        }))
      );
      if (contactErr) throw contactErr;
    }

    // Client jetable dédié : ne jamais faire ce signIn sur le client
    // service_role partagé (voir avertissement dans supabase.js).
    const { data: signInData, error: signInErr } = await createAuthClient().auth.signInWithPassword({
      email: email.trim(), password,
    });
    if (signInErr) throw signInErr;

    const { profile, contacts } = await fetchProfileAndContacts(authUser.id);
    res.json({ token: signInData.session.access_token, user: toUserPayload(authUser, profile, contacts) });
  } catch (e) {
    console.error('[auth] finalisation inscription échouée pour', authUser.id, ':', e.message);
    res.status(500).json({ error: e.message || "Erreur lors de la finalisation de l'inscription" });
  }
});

// ─── Connexion email + mot de passe ─────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email et mot de passe requis' });

  // Client jetable dédié : ne jamais faire ce signIn sur le client
  // service_role partagé (voir avertissement dans supabase.js).
  const { data, error } = await createAuthClient().auth.signInWithPassword({ email: email.trim(), password });
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
  // extractMedicalFields lit medicalRecord.* (contrat réel du frontend) mais
  // retombe aussi sur medical.* ou des champs à plat si jamais envoyés ainsi.
  const { bloodType, height, weight, conditions, allergies } = extractMedicalFields(req.body || {});

  const patch = { updated_at: new Date().toISOString() };
  if (name !== undefined) patch.name = name;
  if (phone !== undefined) patch.phone = phone;
  if (birthdate !== undefined) patch.birthdate = birthdate || null;
  if (gender !== undefined) patch.gender = gender;
  if (photo !== undefined) patch.photo = photo;
  if (bloodType !== undefined) patch.blood_type = bloodType;
  if (height !== undefined) patch.height = height !== null && height !== '' ? Number(height) : null;
  if (weight !== undefined) patch.weight = weight !== null && weight !== '' ? Number(weight) : null;
  if (allergies !== undefined) patch.allergies = Array.isArray(allergies) ? allergies.join(', ') : allergies;
  if (conditions !== undefined) patch.conditions = Array.isArray(conditions) ? conditions.join(', ') : conditions;

  try {
    if (Object.keys(patch).length > 1) {
      // Même garde-fou que POST /auth/register : .update() seul réussit
      // silencieusement (error === null) même s'il ne matche aucune ligne.
      // .select() + vérification transforme ce cas en erreur explicite au
      // lieu de laisser le profil inchangé sans le signaler.
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', req.user.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!updatedProfile) throw new Error('Profil introuvable pour cet utilisateur — mise à jour non appliquée');

      console.log('[auth] PUT /me — médical envoyé:', { bloodType, height, weight, conditions, allergies });
      console.log('[auth] PUT /me — médical stocké:', {
        blood_type: updatedProfile.blood_type, height: updatedProfile.height, weight: updatedProfile.weight,
        allergies: updatedProfile.allergies, conditions: updatedProfile.conditions,
      });
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
    console.error('[auth] PUT /me échoué pour', req.user.id, ':', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
