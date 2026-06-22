// screen-auth.jsx — Connexion et inscription Sauv'Moi

// ── Constantes de style partagées ─────────────────────────────────────────
const AUTH_INP = {
  width: '100%', border: 'none', outline: 'none',
  fontSize: 15, fontFamily: 'inherit', background: 'transparent', color: 'var(--sm-ink)',
};
const AUTH_BOX = {
  border: '1.5px solid var(--sm-line)', borderRadius: 12,
  padding: '12px 14px', background: 'white',
};

// ── Wrapper champ de formulaire ────────────────────────────────────────────
function FieldWrap({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--sm-ink-700)' }}>
          {label}
        </label>
      )}
      <div style={AUTH_BOX}>{children}</div>
    </div>
  );
}

// ── Icône Google (SVG inline — Lucide n'a pas de logo Google) ─────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ── Icône Apple (SVG inline) ───────────────────────────────────────────────
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

// ── Utilitaire de connexion au backend ────────────────────────────────────
async function authFetch(path, body) {
  const base = (window.API && window.API.base) || '';
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

function applySession(data, nav) {
  if (data.token) {
    window.SM.token = data.token;
    localStorage.setItem('sm_token', data.token);
  }
  if (data.user) {
    window.SM.user = data.user;
    localStorage.setItem('sm_user', JSON.stringify(data.user));
    window.SM.emit();
  }
  nav.reset('home');
}

// ════════════════════════════════════════════════════════════════════════════
// ÉCRAN DE CONNEXION
// ════════════════════════════════════════════════════════════════════════════
function AuthScreen({ nav }) {
  useLucide();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleLogin(e) {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Remplissez tous les champs');
    setLoading(true); setError('');
    try {
      const { ok, data } = await authFetch('/api/auth/login', { email: email.trim(), password });
      if (!ok) { setError(data.error || 'Identifiants incorrects'); return; }
      applySession(data, nav);
    } catch {
      setError('Erreur réseau — vérifiez que le serveur est lancé.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--sm-paper)' }}>
      <div style={{ padding: '52px 28px 40px', display: 'flex', flexDirection: 'column' }}>

        {/* ── Logo ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 42 }}>
          <img
            src="logo_80.png"
            alt="Sauv'Moi"
            style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 16, borderRadius: 22, boxShadow: '0 8px 28px rgba(10,22,40,.15)' }}
          />
          <h1 className="sm-serif" style={{ fontSize: 30, marginBottom: 6 }}>Sauv'Moi</h1>
          <p style={{ fontSize: 14, color: 'var(--sm-ink-500)', textAlign: 'center', lineHeight: 1.4 }}>
            Restez calme, tout ira bien
          </p>
        </div>

        {/* ── Formulaire ── */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FieldWrap label="Adresse e-mail">
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              style={AUTH_INP}
            />
          </FieldWrap>

          <FieldWrap label="Mot de passe">
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              style={AUTH_INP}
            />
          </FieldWrap>

          {error && (
            <p style={{ fontSize: 12, color: 'var(--sm-red)', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            className="sm-btn sm-btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 4 }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        {/* ── Séparateur ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--sm-line)' }} />
          <span style={{ fontSize: 13, color: 'var(--sm-ink-400)', fontWeight: 500 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--sm-line)' }} />
        </div>

        {/* ── Boutons sociaux ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '13px 20px', borderRadius: 999, width: '100%',
              background: 'white', border: '1.5px solid var(--sm-line)',
              fontSize: 15, fontWeight: 600, fontFamily: 'inherit', color: 'var(--sm-ink)',
              cursor: 'pointer',
            }}
          >
            <GoogleIcon />
            Continuer avec Google
          </button>

          <button
            type="button"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '13px 20px', borderRadius: 999, width: '100%',
              background: 'var(--sm-ink)', border: 'none',
              fontSize: 15, fontWeight: 600, fontFamily: 'inherit', color: 'white',
              cursor: 'pointer',
            }}
          >
            <AppleIcon />
            Continuer avec Apple
          </button>
        </div>

        {/* ── Lien inscription ── */}
        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: 'var(--sm-ink-500)' }}>
          Pas encore de compte ?{' '}
          <button
            type="button"
            onClick={() => nav.go('register')}
            style={{ background: 'none', border: 'none', color: 'var(--sm-red)', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: 0 }}
          >
            S'inscrire
          </button>
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ÉCRAN D'INSCRIPTION EN 2 ÉTAPES
// ════════════════════════════════════════════════════════════════════════════
const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
const GENDERS = ['Masculin', 'Féminin'];

function RegisterScreen({ nav }) {
  useLucide();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const [form, setForm] = React.useState({
    // Étape 1 — Infos personnelles
    name: '', birthdate: '', gender: '',
    email: '', phone: '', password: '', confirm: '',
    // Étape 2 — Profil médical
    bloodType: '', height: '', weight: '',
    conditions: '', allergies: '',
    ecName: '', ecPhone: '',
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const pick = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Validation étape 1 ────────────────────────────────────────────────────
  function validateStep1() {
    if (!form.name.trim())     return 'Le nom est requis';
    if (!form.email.trim())    return "L'adresse e-mail est requise";
    if (!form.password)        return 'Le mot de passe est requis';
    if (form.password.length < 6) return 'Mot de passe : 6 caractères minimum';
    if (form.password !== form.confirm) return 'Les mots de passe ne correspondent pas';
    return null;
  }

  function goStep2(e) {
    e.preventDefault();
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  }

  // ── Soumission finale ──────────────────────────────────────────────────────
  async function doRegister() {
    setLoading(true); setError('');
    try {
      const { ok, data } = await authFetch('/api/auth/register', {
        name:      form.name.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim(),
        password:  form.password,
        birthdate: form.birthdate,
        gender:    form.gender,
        bloodType: form.bloodType,
        height:    form.height   || null,
        weight:    form.weight   || null,
        conditions: form.conditions,
        allergies:  form.allergies,
        emergencyContact: form.ecName ? { name: form.ecName, phone: form.ecPhone } : null,
      });
      if (!ok) { setError(data.error || "Erreur lors de l'inscription"); return; }
      applySession(data, nav);
    } catch {
      setError('Erreur réseau — vérifiez que le serveur est lancé.');
    } finally {
      setLoading(false);
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--sm-paper)' }}>

      {/* ── En-tête avec progression ── */}
      <div style={{
        padding: '18px 24px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--sm-line)',
      }}>
        <button
          onClick={() => step === 1 ? nav.back() : (setStep(1), setError(''))}
          style={{ padding: 8, margin: -8, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        >
          <Icon name="arrow-left" size={22} color="var(--sm-ink)" />
        </button>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: 'var(--sm-ink-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
            Étape {step} sur 2
          </p>
          <h2 className="sm-serif" style={{ fontSize: 19 }}>
            {step === 1 ? 'Informations personnelles' : 'Profil médical'}
          </h2>
        </div>

        {/* Indicateur de progression */}
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {[1, 2].map(n => (
            <div key={n} style={{
              height: 4, borderRadius: 2,
              width: n === step ? 22 : 8,
              background: n <= step ? 'var(--sm-red)' : 'var(--sm-line)',
              transition: 'all 250ms ease',
            }} />
          ))}
        </div>
      </div>

      {/* ── Corps scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px 36px' }}>

        {/* ════ ÉTAPE 1 ════ */}
        {step === 1 && (
          <form onSubmit={goStep2} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <FieldWrap label="Nom & prénom">
              <input
                type="text" placeholder="Aïcha Koné"
                value={form.name} onChange={set('name')}
                style={AUTH_INP}
              />
            </FieldWrap>

            <FieldWrap label="Date de naissance">
              <input
                type="date"
                value={form.birthdate} onChange={set('birthdate')}
                style={AUTH_INP}
              />
            </FieldWrap>

            {/* Sexe — sélection visuelle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--sm-ink-700)' }}>Sexe</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {GENDERS.map(g => (
                  <button
                    key={g} type="button"
                    onClick={() => pick('gender', g)}
                    style={{
                      flex: 1, padding: '11px', borderRadius: 12,
                      fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                      transition: 'all 150ms ease',
                      background: form.gender === g ? 'var(--sm-ink)' : 'white',
                      color: form.gender === g ? 'white' : 'var(--sm-ink)',
                      border: `1.5px solid ${form.gender === g ? 'var(--sm-ink)' : 'var(--sm-line)'}`,
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <FieldWrap label="Adresse e-mail">
              <input
                type="email" placeholder="votre@email.com"
                value={form.email} onChange={set('email')}
                autoComplete="email" style={AUTH_INP}
              />
            </FieldWrap>

            <FieldWrap label="Téléphone">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, color: 'var(--sm-ink-500)', fontWeight: 500, flexShrink: 0 }}>🇨🇮 +225</span>
                <input
                  type="tel" placeholder="07 00 00 00 00"
                  value={form.phone} onChange={set('phone')}
                  style={AUTH_INP}
                />
              </div>
            </FieldWrap>

            <FieldWrap label="Mot de passe">
              <input
                type="password" placeholder="Minimum 6 caractères"
                value={form.password} onChange={set('password')}
                autoComplete="new-password" style={AUTH_INP}
              />
            </FieldWrap>

            <FieldWrap label="Confirmer le mot de passe">
              <input
                type="password" placeholder="••••••••"
                value={form.confirm} onChange={set('confirm')}
                autoComplete="new-password" style={AUTH_INP}
              />
            </FieldWrap>

            {error && <p style={{ fontSize: 12, color: 'var(--sm-red)', margin: 0 }}>{error}</p>}

            <button type="submit" className="sm-btn sm-btn-primary" style={{ width: '100%', marginTop: 4 }}>
              Continuer →
            </button>

            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--sm-ink-500)', margin: 0 }}>
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => nav.back()}
                style={{ background: 'none', border: 'none', color: 'var(--sm-red)', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: 0 }}
              >
                Se connecter
              </button>
            </p>
          </form>
        )}

        {/* ════ ÉTAPE 2 ════ */}
        {step === 2 && (
          <form onSubmit={e => { e.preventDefault(); doRegister(); }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <p style={{ fontSize: 13, color: 'var(--sm-ink-500)', margin: 0 }}>
              Ces informations permettent aux secouristes de mieux vous aider en cas d'urgence.
              Tous les champs sont facultatifs.
            </p>

            {/* Groupe sanguin — chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--sm-ink-700)' }}>Groupe sanguin</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {BLOOD_TYPES.map(bt => (
                  <button
                    key={bt} type="button"
                    onClick={() => pick('bloodType', bt)}
                    style={{
                      padding: '8px 16px', borderRadius: 999,
                      fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                      transition: 'all 150ms ease',
                      background: form.bloodType === bt ? 'var(--sm-red)' : 'white',
                      color: form.bloodType === bt ? 'white' : 'var(--sm-ink)',
                      border: `1.5px solid ${form.bloodType === bt ? 'var(--sm-red)' : 'var(--sm-line)'}`,
                    }}
                  >
                    {bt}
                  </button>
                ))}
              </div>
            </div>

            {/* Taille + Poids en colonne */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FieldWrap label="Taille (cm)">
                <input
                  type="number" placeholder="170"
                  value={form.height} onChange={set('height')}
                  min="50" max="250" style={AUTH_INP}
                />
              </FieldWrap>
              <FieldWrap label="Poids (kg)">
                <input
                  type="number" placeholder="65"
                  value={form.weight} onChange={set('weight')}
                  min="1" max="300" style={AUTH_INP}
                />
              </FieldWrap>
            </div>

            {/* Antécédents */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--sm-ink-700)' }}>Antécédents médicaux</label>
              <div style={{ ...AUTH_BOX }}>
                <textarea
                  placeholder="Ex : diabète, hypertension, asthme…"
                  value={form.conditions} onChange={set('conditions')}
                  rows={3} style={{ ...AUTH_INP, resize: 'none', lineHeight: 1.55 }}
                />
              </div>
            </div>

            {/* Allergies */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--sm-ink-700)' }}>Allergies</label>
              <div style={{ ...AUTH_BOX }}>
                <textarea
                  placeholder="Ex : pénicilline, arachides, latex…"
                  value={form.allergies} onChange={set('allergies')}
                  rows={2} style={{ ...AUTH_INP, resize: 'none', lineHeight: 1.55 }}
                />
              </div>
            </div>

            {/* Contact d'urgence */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--sm-ink-700)' }}>Contact d'urgence</label>
              <div style={{ ...AUTH_BOX }}>
                <input
                  type="text" placeholder="Nom du contact (ex : Mamadou Koné)"
                  value={form.ecName} onChange={set('ecName')}
                  style={AUTH_INP}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...AUTH_BOX }}>
                <span style={{ fontSize: 14, color: 'var(--sm-ink-500)', fontWeight: 500, flexShrink: 0 }}>🇨🇮 +225</span>
                <input
                  type="tel" placeholder="07 00 00 00 00"
                  value={form.ecPhone} onChange={set('ecPhone')}
                  style={AUTH_INP}
                />
              </div>
            </div>

            {error && <p style={{ fontSize: 12, color: 'var(--sm-red)', margin: 0 }}>{error}</p>}

            <button
              type="submit"
              className="sm-btn sm-btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: 4 }}
            >
              {loading ? 'Création du compte…' : 'Créer mon compte'}
            </button>

            <button
              type="button"
              className="sm-btn sm-btn-outline"
              disabled={loading}
              onClick={doRegister}
              style={{ width: '100%' }}
            >
              Passer cette étape
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { AuthScreen, RegisterScreen });
