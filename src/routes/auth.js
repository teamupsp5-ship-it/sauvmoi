import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase, createAuthClient } from '../supabase.js';
import {
  isNonEmptyString, isOptionalString, isValidEmail, isValidPhone, isValidIsoDate, isNotFutureDate,
  validateImageDataUrl, rejectUnknownFields,
} from '../validate.js';

const router = Router();

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 Mo

// Messages bilingues en dur (pas de paramètre `lang` sur ces routes, et
// screen-auth.jsx affiche `data.error` tel quel) — seul ce message 429 a
// besoin d'être compréhensible dans les deux langues, contrairement aux
// autres erreurs de cette route (toutes en français, convention existante).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes. / Too many login attempts. Please try again in 15 minutes.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives d'inscription. Réessayez dans 1 heure. / Too many registration attempts. Please try again in 1 hour." },
});

// ─── Aides : conversion texte ↔ liste (allergies / antécédents) ────────────
// La table profiles stocke allergies/conditions en texte simple (colonnes
// `text`) ; le frontend attend des tableaux dans medicalRecord — même
// convention que l'ancien backend (store.js), qui séparait déjà sur la virgule.
function splitList(text) {
  return (text || '').split(',').map((s) => s.trim()).filter(Boolean);
}

// session.expires_at (Supabase) est en secondes depuis l'epoch ; le reste de
// l'app (localStorage, Date.now()) travaille en millisecondes.
function sessionExpiresAtMs(session) {
  if (session?.expires_at) return session.expires_at * 1000;
  if (session?.expires_in) return Date.now() + session.expires_in * 1000;
  return Date.now() + 3600 * 1000; // repli : 1h
}

// Accepte les champs médicaux qu'ils soient envoyés à plat (contrat actuel
// de /auth/register : bloodType, height, ... au premier niveau) ou nichés
// sous `medicalRecord` (contrat actuel de PUT /me) ou `medical` — au cas où
// un appelant utilise l'une ou l'autre convention, les deux endpoints les
// retrouvent de la même façon au lieu de silencieusement les ignorer.
// ProfileMedical.save() (screen-profile.jsx) envoie allergies/conditions sous
// forme de TABLEAU (form.allergies.split(',')...), pas de string — cohérent
// avec le contrat medicalRecord.allergies/conditions (tableaux) partout
// ailleurs dans le payload utilisateur. Sans cette normalisation, la
// validation plus bas (isOptionalString, qui exige typeof === 'string')
// rejetait TOUJOURS ces champs en 400 dès qu'ils étaient renseignés — cause
// racine réelle du carnet médical qui ne s'enregistrait jamais.
function normalizeListField(v) {
  return Array.isArray(v) ? v.map((s) => String(s).trim()).filter(Boolean).join(', ') : v;
}

function extractMedicalFields(body) {
  const nested = (body && (body.medicalRecord || body.medical)) || null;
  const src = nested || body || {};
  return {
    bloodType: src.bloodType,
    height: src.height,
    weight: src.weight,
    conditions: normalizeListField(src.conditions),
    allergies: normalizeListField(src.allergies),
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
router.post('/auth/register', registerLimiter, async (req, res) => {
  const {
    name, email, phone, password,
    birthdate, gender,
    emergencyContact, emergencyContacts,
    website, // honeypot — voir plus bas, jamais utilisé pour autre chose
  } = req.body || {};
  const { bloodType, height, weight, conditions, allergies } = extractMedicalFields(req.body || {});

  // Honeypot anti-bot : champ absent du formulaire visible (posé masqué côté
  // frontend, voir screen-auth.jsx), donc toujours vide pour un humain — un
  // bot qui remplit aveuglément tous les champs le remplit, lui. Rejet
  // silencieux (pas de détail sur la raison réelle) avant tout appel
  // Supabase, pour ne pas gaspiller de quota ni révéler la détection.
  if (website) {
    console.warn('[auth] inscription bloquée (honeypot rempli)');
    return res.status(400).json({ error: 'Requête invalide' });
  }

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'nom, email et mot de passe requis' });
  }
  if (!isNonEmptyString(name, 100)) {
    return res.status(400).json({ error: 'Nom invalide (100 caractères maximum)' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Adresse email invalide' });
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 200) {
    return res.status(400).json({ error: 'Mot de passe : 6 caractères minimum' });
  }
  if (!isOptionalString(phone, 30) || (phone && !isValidPhone(phone))) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide' });
  }
  if (birthdate && !isValidIsoDate(birthdate)) {
    return res.status(400).json({ error: 'Date de naissance invalide' });
  }
  if (birthdate && !isNotFutureDate(birthdate)) {
    return res.status(400).json({ error: 'La date de naissance ne peut pas être dans le futur' });
  }
  if (!isOptionalString(gender, 30) || !isOptionalString(bloodType, 10)
    || !isOptionalString(conditions, 1000) || !isOptionalString(allergies, 1000)) {
    return res.status(400).json({ error: 'Champ du profil médical invalide' });
  }
  if (height !== undefined && height !== null && height !== '' && !(Number(height) >= 30 && Number(height) <= 250)) {
    return res.status(400).json({ error: 'Taille invalide (30 à 250 cm)' });
  }
  if (weight !== undefined && weight !== null && weight !== '' && !(Number(weight) >= 1 && Number(weight) <= 400)) {
    return res.status(400).json({ error: 'Poids invalide (1 à 400 kg)' });
  }
  const contactsToValidate = Array.isArray(emergencyContacts) ? emergencyContacts
    : (emergencyContact?.name ? [emergencyContact] : []);
  if (contactsToValidate.some((c) => c && (
    !isOptionalString(c.name, 100) || !isOptionalString(c.phone, 30) || !isOptionalString(c.relation, 50)
    || (c.phone && !isValidPhone(c.phone))
  ))) {
    return res.status(400).json({ error: 'Contact d\'urgence invalide' });
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
    res.json({
      token: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
      expiresAt: sessionExpiresAtMs(signInData.session),
      user: toUserPayload(authUser, profile, contacts),
    });
  } catch (e) {
    console.error('[auth] finalisation inscription échouée pour', authUser.id, ':', e.message);
    res.status(500).json({ error: e.message || "Erreur lors de la finalisation de l'inscription" });
  }
});

// ─── Connexion email + mot de passe ─────────────────────────────────────────
router.post('/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email et mot de passe requis' });
  if (!isValidEmail(email) || typeof password !== 'string' || password.length > 200) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  // Client jetable dédié : ne jamais faire ce signIn sur le client
  // service_role partagé (voir avertissement dans supabase.js).
  const { data, error } = await createAuthClient().auth.signInWithPassword({ email: email.trim(), password });
  if (error) return res.status(401).json({ error: 'Identifiants incorrects' });

  try {
    const { profile, contacts } = await fetchProfileAndContacts(data.user.id);
    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: sessionExpiresAtMs(data.session),
      user: toUserPayload(data.user, profile, contacts),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Rafraîchissement de session ────────────────────────────────────────────
router.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken requis' });

  // Client jetable dédié : même raison que pour signInWithPassword — ne
  // jamais faire d'opération de gestion de session sur le client
  // service_role partagé (voir avertissement dans supabase.js).
  const { data, error } = await createAuthClient().auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data?.session) {
    return res.status(401).json({ error: 'Session expirée, reconnexion nécessaire' });
  }

  res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: sessionExpiresAtMs(data.session),
  });
});

// ─── Synchronisation après connexion Google (OAuth côté navigateur) ────────
// Le flux OAuth (supabase.auth.signInWithOAuth côté client, voir
// public/supabase-client.js) produit déjà une session Supabase valide dans le
// navigateur — pas besoin d'en émettre une nouvelle ici, requireAuth se
// contente de vérifier le token reçu. Le trigger SQL handle_new_user a déjà
// créé la ligne profiles au premier login Google (comme pour tout nouvel
// auth.users) ; cette route ne fait que backfiller name/photo depuis
// user_metadata (fourni par Google : full_name/name, avatar_url/picture) si
// ces champs sont encore vides, puis renvoie le payload utilisateur habituel.
router.post('/auth/google-sync', requireAuth, async (req, res) => {
  try {
    const authUser = req.user;
    const meta = authUser.user_metadata || {};
    const { profile, contacts } = await fetchProfileAndContacts(authUser.id);

    const patch = {};
    if (!profile?.name && (meta.full_name || meta.name)) {
      patch.name = meta.full_name || meta.name;
    }
    if (!profile?.photo && (meta.avatar_url || meta.picture)) {
      patch.photo = meta.avatar_url || meta.picture;
    }

    let finalProfile = profile;
    if (Object.keys(patch).length) {
      // upsert plutôt qu'update : même garde-fou qu'à l'inscription (voir
      // /auth/register) — un update() qui ne matche aucune ligne réussirait
      // silencieusement côté PostgREST.
      const { data: updated, error } = await supabase
        .from('profiles')
        .upsert({ id: authUser.id, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'id' })
        .select()
        .maybeSingle();
      if (error) throw error;
      finalProfile = updated || profile;
    }

    res.json({ user: toUserPayload(authUser, finalProfile, contacts) });
  } catch (e) {
    console.error('[auth] google-sync échoué pour', req.user?.id, ':', e.message);
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

// Whitelist explicite des champs modifiables via cette route — un futur
// `...body` ajouté par erreur ne pourrait plus faire fuiter un champ non
// prévu (role, id, email...) : rejeté ici avant même d'atteindre la logique
// de patch. `medical`/`emergencyContact` restent acceptés au singulier pour
// les mêmes raisons de compatibilité que extractMedicalFields ci-dessus.
const ME_TOP_FIELDS = ['name', 'phone', 'birthdate', 'gender', 'photo', 'medicalRecord', 'medical', 'emergencyContacts', 'emergencyContact'];
const ME_MEDICAL_FIELDS = ['bloodType', 'height', 'weight', 'conditions', 'allergies', 'emergencyContacts', 'emergencyContact'];

// ─── Profil : mise à jour (infos perso, photo, carnet médical, contacts) ───
router.put('/me', requireAuth, async (req, res) => {
  const body = req.body || {};

  const unknownTop = rejectUnknownFields(body, ME_TOP_FIELDS);
  if (unknownTop) {
    return res.status(400).json({ error: `Champ(s) non autorisé(s) : ${unknownTop.join(', ')}` });
  }
  const nestedMedical = body.medicalRecord || body.medical;
  if (nestedMedical && typeof nestedMedical === 'object') {
    const unknownMed = rejectUnknownFields(nestedMedical, ME_MEDICAL_FIELDS);
    if (unknownMed) {
      return res.status(400).json({ error: `Champ(s) médical(aux) non autorisé(s) : ${unknownMed.join(', ')}` });
    }
  }

  const { name, phone, birthdate, gender, photo, medicalRecord } = body;
  // extractMedicalFields lit medicalRecord.* (contrat réel du frontend) mais
  // retombe aussi sur medical.* ou des champs à plat si jamais envoyés ainsi.
  const { bloodType, height, weight, conditions, allergies } = extractMedicalFields(body);

  if (!isOptionalString(name, 100)) return res.status(400).json({ error: 'Nom invalide (100 caractères maximum)' });
  if (!isOptionalString(phone, 30) || (phone && !isValidPhone(phone))) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide' });
  }
  if (birthdate && !isValidIsoDate(birthdate)) return res.status(400).json({ error: 'Date de naissance invalide' });
  if (birthdate && !isNotFutureDate(birthdate)) return res.status(400).json({ error: 'La date de naissance ne peut pas être dans le futur' });
  if (!isOptionalString(gender, 30)) return res.status(400).json({ error: 'Genre invalide' });
  if (!isOptionalString(bloodType, 10)) return res.status(400).json({ error: 'Groupe sanguin invalide' });
  if (!isOptionalString(conditions, 1000) || !isOptionalString(allergies, 1000)) {
    return res.status(400).json({ error: 'Champ médical trop long' });
  }
  if (height !== undefined && height !== null && height !== '' && !(Number(height) >= 30 && Number(height) <= 250)) {
    return res.status(400).json({ error: 'Taille invalide (30 à 250 cm)' });
  }
  if (weight !== undefined && weight !== null && weight !== '' && !(Number(weight) >= 1 && Number(weight) <= 400)) {
    return res.status(400).json({ error: 'Poids invalide (1 à 400 kg)' });
  }
  if (photo !== undefined && photo !== null && photo !== '') {
    const check = validateImageDataUrl(photo, MAX_PHOTO_BYTES);
    if (!check.ok) return res.status(400).json({ error: check.error });
  }

  // Contacts d'urgence : accepte emergencyContacts (tableau) ou
  // emergencyContact (objet unique), à plat OU nichés sous medicalRecord —
  // même contrat que /auth/register — pour que PUT /me se comporte de façon
  // cohérente quelle que soit la forme envoyée par l'appelant. `null` veut
  // dire "aucun contact fourni dans cette requête" (on ne touche pas aux
  // contacts existants) ; un tableau (même vide) veut dire "remplace tout".
  const rawContacts = Array.isArray(body.emergencyContacts) ? body.emergencyContacts
    : Array.isArray(medicalRecord?.emergencyContacts) ? medicalRecord.emergencyContacts
    : body.emergencyContact?.name ? [body.emergencyContact]
    : medicalRecord?.emergencyContact?.name ? [medicalRecord.emergencyContact]
    : null;

  if (rawContacts !== null && rawContacts.length > 5) {
    return res.status(400).json({ error: 'Maximum 5 contacts d\'urgence' });
  }
  if (rawContacts !== null && rawContacts.some((c) => c && (
    !isOptionalString(c.name, 100) || !isOptionalString(c.phone, 30) || !isOptionalString(c.relation, 50)
    || (c.phone && !isValidPhone(c.phone))
  ))) {
    return res.status(400).json({ error: 'Contact d\'urgence invalide' });
  }

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

    // Contacts d'urgence : remplacement complet (delete puis insert), déjà
    // validé <= 5 plus haut.
    if (rawContacts !== null) {
      const clean = rawContacts.filter((c) => c && c.name && c.name.trim());

      const { error: delErr } = await supabase.from('emergency_contacts').delete().eq('user_id', req.user.id);
      if (delErr) throw delErr;

      if (clean.length) {
        // .select() permet de vérifier que l'insert a bien écrit le nombre
        // de lignes attendu — même garde-fou anti-échec-silencieux que pour
        // le profil (une insertion filtrée par RLS réussirait autrement
        // sans erreur, en insérant 0 ligne).
        const { data: insertedContacts, error: insErr } = await supabase.from('emergency_contacts').insert(
          clean.map((c) => ({ user_id: req.user.id, name: c.name.trim(), phone: c.phone || '', relation: c.relation || '' }))
        ).select();
        if (insErr) throw insErr;
        if (!insertedContacts || insertedContacts.length !== clean.length) {
          throw new Error(`Contacts d'urgence partiellement enregistrés (${insertedContacts?.length ?? 0}/${clean.length})`);
        }
      }

      console.log('[auth] PUT /me — contacts remplacés pour', req.user.id, ':', clean.length);
    }

    const { profile, contacts } = await fetchProfileAndContacts(req.user.id);
    res.json(toUserPayload(req.user, profile, contacts));
  } catch (e) {
    console.error('[auth] PUT /me échoué pour', req.user.id, ':', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
