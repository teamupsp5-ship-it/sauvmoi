// screen-profile.jsx — Profil v2 · design liste + sous-écrans

const BLOOD_TYPES_P = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
const GENDERS_P     = ['Masculin', 'Féminin', 'Autre'];
const AVATAR_COLORS = ['#1565C0', '#2E6B4F', '#C77A2B', '#6B4F8C', '#E53935'];

// ── Style input édition ──────────────────────────────────────────────────────
const PINP = {
  border: '1.5px solid var(--sm-blue)', outline: 'none',
  background: '#EEF4FF', fontSize: 15, fontFamily: 'inherit',
  color: 'var(--sm-ink)', width: '100%', borderRadius: 8, padding: '9px 11px',
  boxSizing: 'border-box',
};

// ── Calcul complétion profil (/ 12 points) ───────────────────────────────────
function calcCompletion(user, med) {
  const name = user.name || '';
  const parts = name.trim().split(/\s+/);
  const checks = [
    !!parts[0],                                // prénom
    !!(parts[1]),                              // nom
    !!user.birthdate,                          // date naissance
    !!user.gender,                             // sexe
    !!user.email,                              // email
    !!user.phone,                              // téléphone
    !!med.bloodType,                           // groupe sanguin
    !!med.height,                              // taille
    !!med.weight,                              // poids
    (med.allergies   || []).length > 0,        // allergies
    (med.conditions  || []).length > 0,        // antécédents
    (med.emergencyContacts || []).length > 0,  // contact d'urgence
  ];
  return Math.round(checks.filter(Boolean).length / 12 * 100);
}

// ── Composant : ligne de liste ───────────────────────────────────────────────
function ListRow({ icon, iconBg, iconColor, label, right, badge, onClick, last }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', background: 'none', border: 'none', textAlign: 'left',
        borderBottom: last ? 'none' : '0.5px solid var(--sm-line)',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={18} color={iconColor} strokeWidth={1.9} />
        </div>
        {badge && (
          <div style={{ position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: '50%', background: 'var(--sm-red)', border: '1.5px solid white' }} />
        )}
      </div>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--sm-ink)', fontFamily: 'var(--font-ui)' }}>{label}</span>
      {right && <span style={{ fontSize: 13, color: 'var(--sm-ink-400)', fontFamily: 'var(--font-ui)', marginRight: 4 }}>{right}</span>}
      <Icon name="chevron-right" size={18} color="var(--sm-ink-400)" />
    </button>
  );
}

// ── En-tête sous-écran ───────────────────────────────────────────────────────
function SubHeader({ title, nav, right }) {
  return (
    <div style={{
      padding: '16px 20px 14px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: '1px solid var(--sm-line)',
      background: 'linear-gradient(180deg, #f8f9fa, white)',
      flexShrink: 0,
    }}>
      <button onClick={() => goBack(nav)} style={{ background: 'none', border: 'none', padding: '4px', margin: '-4px', cursor: 'pointer' }}>
        <Icon name="arrow-left" size={22} color="var(--sm-ink)" />
      </button>
      <h1 className="sm-serif" style={{ fontSize: 20, flex: 1 }}>{title}</h1>
      {right}
    </div>
  );
}

// ── Barre sticky sauvegarde ──────────────────────────────────────────────────
function SaveBar({ onCancel, onSave, saving }) {
  return (
    <div style={{ flexShrink: 0, background: 'white', borderTop: '1px solid var(--sm-line)', padding: '12px 16px 28px', display: 'flex', gap: 10 }}>
      <button onClick={onCancel} style={{ flex: 1, padding: '13px', borderRadius: 12, background: '#F1F2F4', color: 'var(--sm-ink)', border: 'none', fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
        Annuler
      </button>
      <button onClick={onSave} disabled={saving} style={{ flex: 2, padding: '13px', borderRadius: 12, background: saving ? 'var(--sm-line)' : 'var(--sm-blue)', color: 'white', border: 'none', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-ui)', cursor: saving ? 'default' : 'pointer' }}>
        {saving ? 'Sauvegarde…' : 'Sauvegarder'}
      </button>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function ProfileToast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: 'absolute', top: 70, left: 16, right: 16, zIndex: 300, background: '#2E6B4F', color: 'white', borderRadius: 14, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}>
      <Icon name="check-circle-2" size={20} color="white" />
      <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-ui)' }}>{msg}</span>
    </div>
  );
}

// ── Logique notification partagée ────────────────────────────────────────────
function useNotifications() {
  const [notifs, setNotifs]       = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    window.API.notifications().then(setNotifs).catch(() => {});
  }, []);

  const openNotifs = () => {
    setShowNotifs(true);
    notifs.filter(n => !n.read).forEach(n => window.API.markNotifRead(n.id).catch(() => {}));
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  return { notifs, showNotifs, setShowNotifs, unread, openNotifs };
}

// ── Bottom sheet : notifications ─────────────────────────────────────────────
function NotifSheet({ notifs, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(10,22,40,0.4)' }} />
      <div style={{ background: 'white', borderRadius: '20px 20px 0 0', maxHeight: '78%', display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 30px rgba(0,0,0,0.12)' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E0E0E0', margin: '12px auto 0', flexShrink: 0 }} />
        <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid var(--sm-line)' }}>
          <h2 className="sm-serif" style={{ fontSize: 18 }}>Alertes reçues</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}>
            <Icon name="x" size={20} color="var(--sm-ink-400)" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 32px' }}>
          {notifs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--sm-ink-500)', fontSize: 14, fontFamily: 'var(--font-ui)' }}>Aucune alerte pour le moment</div>
          ) : notifs.map(n => (
            <div key={n.id} style={{ padding: '14px 16px', borderRadius: 'var(--sm-radius)', background: 'white', boxShadow: 'var(--sm-shadow)', marginBottom: 10, display: 'flex', gap: 12, alignItems: 'flex-start', opacity: n.read ? 0.65 : 1 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--sm-red-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="siren" size={20} color="var(--sm-red)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--sm-ink)', lineHeight: 1.4, fontFamily: 'var(--font-ui)' }}>{n.message}</div>
                <div style={{ fontSize: 12, color: 'var(--sm-ink-500)', marginTop: 4 }}>
                  {new Date(n.createdAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                </div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sm-red)', flexShrink: 0, marginTop: 5 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL — PROFIL (liste)
// ════════════════════════════════════════════════════════════════════════════
function ProfileScreen({ nav }) {
  useLucide();
  const SM = window.useSM();

  const { notifs, showNotifs, setShowNotifs, unread, openNotifs } = useNotifications();
  const [showLogout, setShowLogout] = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [pwForm, setPwForm]         = useState({ old: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading]   = useState(false);
  const [pwMsg, setPwMsg]           = useState('');
  const [toast, setToast]           = useState('');
  const photoRef = useRef(null);

  const user = SM.user || {};
  const med  = user.medicalRecord || {};
  const completion   = calcCompletion(user, med);
  const contactCount = (med.emergencyContacts || []).length;
  const initials     = (user.name || 'SM').split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
  const avatarBg     = AVATAR_COLORS[(initials.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const medIncomplete = !med.bloodType || !(med.allergies || []).length;

  // ── Photo upload ──────────────────────────────────────────────────────────
  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const max = 200, scale = Math.min(max / img.width, max / img.height, 1);
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const b64 = canvas.toDataURL('image/jpeg', 0.82);
      const updated = { ...window.SM.user, photo: b64 };
      window.SM.user = updated;
      localStorage.setItem('sm_user', JSON.stringify(updated));
      window.SM.emit();
      window.API.updateMe({ photo: b64 }).catch(() => {});
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  }

  // ── Déconnexion ───────────────────────────────────────────────────────────
  function logout() {
    localStorage.removeItem('sm_token');
    localStorage.removeItem('sm_user');
    window.SM.token = null; window.SM.user = null; window.SM.home = null;
    window.SM.emit(); nav.reset('auth');
  }

  // ── Changement de mot de passe ────────────────────────────────────────────
  async function changePassword() {
    if (!pwForm.next || pwForm.next.length < 6) return setPwMsg('Minimum 6 caractères');
    if (pwForm.next !== pwForm.confirm)        return setPwMsg('Les mots de passe ne correspondent pas');
    setPwLoading(true); setPwMsg('');
    try {
      const base = window.API?.base || '';
      const res  = await fetch(base + '/api/auth/change-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ oldPassword: pwForm.old, newPassword: pwForm.next }) });
      const data = await res.json();
      setPwMsg(res.ok ? 'Mot de passe modifié ✓' : (data.error || 'Erreur'));
      if (res.ok) { setPwForm({ old: '', next: '', confirm: '' }); setTimeout(() => setShowPw(false), 1200); }
    } catch { setPwMsg('Erreur réseau'); }
    finally { setPwLoading(false); }
  }

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#F4F6F9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── En-tête ────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px 14px', display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderBottom: '1px solid var(--sm-line)', flexShrink: 0 }}>
        <img src="logo_80.png" alt="Sauv'Moi" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 8 }} />
        <h1 className="sm-serif" style={{ fontSize: 20, flex: 1 }}>Profil</h1>
        {/* Cloche notifications */}
        <button onClick={openNotifs} style={{ position: 'relative', background: 'none', border: 'none', padding: '6px', cursor: 'pointer' }}>
          <Icon name="bell" size={22} color="var(--sm-ink)" />
          {unread > 0 && (
            <div style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'var(--sm-red)', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid white', fontFamily: 'var(--font-ui)' }}>
              {unread > 9 ? '9+' : unread}
            </div>
          )}
        </button>
      </div>

      {/* ── Corps scrollable ────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Carte profil ─────────────────────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: 'var(--sm-radius)', boxShadow: 'var(--sm-shadow)', padding: '18px 18px 20px' }}>
          <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Avatar cliquable → upload photo */}
            <button onClick={() => photoRef.current?.click()} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
              {user.photo ? (
                <img src={user.photo} alt="avatar" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }} />
              ) : (
                <div style={{ width: 70, height: 70, borderRadius: '50%', background: `linear-gradient(135deg, #1565C0, #0D47A1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: '0 2px 12px rgba(21,101,192,0.3)' }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: 'white', fontFamily: 'var(--font-ui)' }}>{initials}</span>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 1, right: 1, width: 22, height: 22, borderRadius: '50%', background: 'var(--sm-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                <Icon name="camera" size={11} color="white" />
              </div>
            </button>
            {/* Nom + téléphone */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--sm-ink)', fontFamily: 'var(--font-ui)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || 'Utilisateur'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--sm-ink-500)', marginTop: 3, fontFamily: 'var(--font-ui)' }}>
                {user.phone || user.email || '—'}
              </div>
            </div>
          </div>

          {/* Barre de progression / badge complet */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: completion < 100 ? 8 : 0 }}>
              <span style={{ fontSize: 13, color: 'var(--sm-ink-500)', fontFamily: 'var(--font-ui)' }}>Profil complété</span>
              {completion < 100 ? (
                <span style={{ fontSize: 13, fontWeight: 700, color: '#27500A', fontFamily: 'var(--font-ui)' }}>{completion}%</span>
              ) : (
                <div style={{ background: '#EAF3DE', borderRadius: 999, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="check" size={13} color="#27500A" strokeWidth={2.5} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#27500A', fontFamily: 'var(--font-ui)' }}>Profil complet</span>
                </div>
              )}
            </div>
            {completion < 100 && (
              <div style={{ height: 7, borderRadius: 999, background: '#F1F2F4', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: completion + '%', borderRadius: 999, background: 'linear-gradient(90deg, #639922, #27500A)', transition: 'width 0.6s ease' }} />
              </div>
            )}
          </div>
        </div>

        {/* ── Carte sections ───────────────────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: 'var(--sm-radius)', boxShadow: 'var(--sm-shadow)', overflow: 'hidden' }}>
          <ListRow
            icon="user" iconBg="#EBF5FB" iconColor="#1565C0"
            label="Informations personnelles"
            onClick={() => nav.go('profile_personal')}
          />
          <ListRow
            icon="briefcase-medical" iconBg="#FDEDEC" iconColor="#C0392B"
            label="Profil médical"
            badge={medIncomplete}
            right={medIncomplete ? <span style={{ fontSize: 12, fontWeight: 600, color: '#D85A30', fontFamily: 'var(--font-ui)' }}>À compléter</span> : null}
            onClick={() => nav.go('profile_medical')}
          />
          <ListRow
            icon="phone" iconBg="#F1F2F4" iconColor="var(--sm-ink)"
            label="Contacts d'urgence"
            right={contactCount + '/5'}
            onClick={() => nav.go('profile_contacts')}
          />
          <ListRow
            icon="qr-code" iconBg="#F1F2F4" iconColor="var(--sm-ink)"
            label="QR Code médical"
            right={
              <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--sm-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="qr-code" size={13} color="white" />
              </div>
            }
            onClick={() => nav.go('qr_code')}
          />
          <ListRow
            icon="key" iconBg="#F1F2F4" iconColor="var(--sm-ink)"
            label="Changer le mot de passe"
            onClick={() => { setShowPw(true); setPwMsg(''); }}
          />
          <ListRow
            icon="file-text" iconBg="#F1F2F4" iconColor="var(--sm-ink)"
            label="Conditions générales"
            onClick={() => nav.go('terms')}
            last
          />
        </div>

        {/* ── Carte déconnexion ────────────────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: 'var(--sm-radius)', boxShadow: 'var(--sm-shadow)', overflow: 'hidden' }}>
          <button onClick={() => setShowLogout(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FDEDEC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="log-out" size={18} color="#C0392B" strokeWidth={1.9} />
            </div>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#C0392B', fontFamily: 'var(--font-ui)' }}>Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* ── Bottom sheet : mot de passe ──────────────────────────────────── */}
      {showPw && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowPw(false)} style={{ flex: 1, background: 'rgba(10,22,40,0.4)' }} />
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 20px 36px', boxShadow: '0 -4px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E0E0E0', margin: '0 auto 18px' }} />
            <h3 className="sm-serif" style={{ fontSize: 19, marginBottom: 16 }}>Changer le mot de passe</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ label: 'Mot de passe actuel', key: 'old', ph: '••••••••' }, { label: 'Nouveau mot de passe', key: 'next', ph: 'Min. 6 caractères' }, { label: 'Confirmation', key: 'confirm', ph: '••••••••' }].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, color: 'var(--sm-ink-500)', fontWeight: 600, fontFamily: 'var(--font-ui)', display: 'block', marginBottom: 5 }}>{f.label}</label>
                  <input type="password" value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} style={{ ...PINP, border: '1.5px solid var(--sm-line)', background: 'white' }} />
                </div>
              ))}
              {pwMsg && <p style={{ fontSize: 13, margin: 0, color: pwMsg.includes('✓') ? '#27AE60' : 'var(--sm-red)', fontFamily: 'var(--font-ui)' }}>{pwMsg}</p>}
              <button onClick={changePassword} disabled={pwLoading} style={{ padding: '13px', borderRadius: 12, background: 'var(--sm-blue)', color: 'white', border: 'none', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-ui)', cursor: pwLoading ? 'default' : 'pointer' }}>
                {pwLoading ? 'Modification…' : 'Modifier le mot de passe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom sheet : notifications ─────────────────────────────────── */}
      {showNotifs && <NotifSheet notifs={notifs} onClose={() => setShowNotifs(false)} />}

      {/* ── Modal déconnexion ─────────────────────────────────────────────── */}
      {showLogout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
          <div style={{ width: '100%', background: 'white', borderRadius: '20px 20px 0 0', padding: '28px 20px 40px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--sm-line)', margin: '0 auto 22px' }} />
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FDEDEC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Icon name="log-out" size={26} color="#C0392B" />
            </div>
            <h3 className="sm-serif" style={{ fontSize: 20, textAlign: 'center', marginBottom: 8 }}>Se déconnecter ?</h3>
            <p style={{ fontSize: 14, color: 'var(--sm-ink-500)', textAlign: 'center', marginBottom: 24, fontFamily: 'var(--font-ui)', lineHeight: 1.5 }}>
              Vous devrez vous reconnecter pour accéder à l'application.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={logout} style={{ padding: '14px', borderRadius: 12, background: '#C0392B', color: 'white', border: 'none', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
                Confirmer la déconnexion
              </button>
              <button onClick={() => setShowLogout(false)} style={{ padding: '14px', borderRadius: 12, background: '#F1F2F4', color: 'var(--sm-ink)', border: 'none', fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <ProfileToast msg={toast} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SOUS-ÉCRAN : INFORMATIONS PERSONNELLES
// ════════════════════════════════════════════════════════════════════════════
function ProfilePersonal({ nav }) {
  useLucide();
  const SM = window.useSM();
  const user = SM.user || {};

  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState('');

  const nameParts = (user.name || '').trim().split(/\s+/);
  const prenom = nameParts[0] || '';
  const nom    = nameParts.slice(1).join(' ');

  function startEdit() {
    setForm({ prenom, nom, birthdate: user.birthdate || '', gender: user.gender || '', email: user.email || '', phone: user.phone || '' });
    setEditing(true);
  }
  function cancelEdit() { setEditing(false); setForm(null); }
  const setF = k => v => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form) return;
    setSaving(true);
    const name = [form.prenom.trim(), form.nom.trim()].filter(Boolean).join(' ');
    const payload = { name, birthdate: form.birthdate, gender: form.gender, phone: form.phone.trim() };
    const updated = { ...window.SM.user, ...payload };
    try { const res = await window.API.updateMe(payload); Object.assign(updated, res); } catch {}
    window.SM.user = updated;
    localStorage.setItem('sm_user', JSON.stringify(updated));
    window.SM.emit();
    setSaving(false); setEditing(false); setForm(null);
    setToast('Informations mises à jour !');
    setTimeout(() => setToast(''), 2500);
  }

  const Val = ({ v }) => (
    <span style={{ fontSize: 15, color: v ? 'var(--sm-ink)' : 'var(--sm-ink-400)', fontFamily: 'var(--font-ui)' }}>
      {v || '—'}
    </span>
  );

  const rows = editing ? null : [
    { label: 'Prénom',           val: prenom           },
    { label: 'Nom',              val: nom               },
    { label: 'Date de naissance',val: user.birthdate    },
    { label: 'Sexe',             val: user.gender       },
    { label: 'Email',            val: user.email        },
    { label: 'Téléphone',        val: user.phone        },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#F4F6F9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SubHeader
        title="Informations personnelles"
        nav={nav}
        right={!editing && (
          <button onClick={startEdit} style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--sm-blue)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
            Modifier
          </button>
        )}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ background: 'white', borderRadius: 'var(--sm-radius)', boxShadow: 'var(--sm-shadow)', overflow: 'hidden' }}>

          {/* ── Mode lecture ── */}
          {!editing && rows.map((r, i) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < rows.length - 1 ? '0.5px solid var(--sm-line)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--sm-ink-500)', width: 130, flexShrink: 0, fontFamily: 'var(--font-ui)' }}>{r.label}</span>
              <Val v={r.val} />
            </div>
          ))}

          {/* ── Mode édition ── */}
          {editing && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '0.5px solid var(--sm-line)' }}>
                {[{ label: 'Prénom', key: 'prenom', ph: 'Aïcha' }, { label: 'Nom', key: 'nom', ph: 'Kouassi' }].map((f, i) => (
                  <div key={f.key} style={{ padding: '12px 14px', borderRight: i === 0 ? '0.5px solid var(--sm-line)' : 'none', background: '#F4F8FF' }}>
                    <div style={{ fontSize: 12, color: 'var(--sm-blue)', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: 6 }}>{f.label}</div>
                    <input value={form[f.key]} onChange={e => setF(f.key)(e.target.value)} placeholder={f.ph} style={{ ...PINP }} />
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--sm-line)', background: '#F4F8FF' }}>
                <div style={{ fontSize: 12, color: 'var(--sm-blue)', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: 6 }}>Date de naissance</div>
                <input type="date" value={form.birthdate} onChange={e => setF('birthdate')(e.target.value)} style={{ ...PINP }} />
              </div>
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--sm-line)', background: '#F4F8FF' }}>
                <div style={{ fontSize: 12, color: 'var(--sm-blue)', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: 8 }}>Sexe</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {GENDERS_P.map(g => (
                    <button key={g} type="button" onClick={() => setF('gender')(g)} style={{ flex: 1, padding: '9px 4px', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-ui)', cursor: 'pointer', background: form.gender === g ? 'var(--sm-blue)' : 'white', color: form.gender === g ? 'white' : 'var(--sm-ink)', border: `1.5px solid ${form.gender === g ? 'var(--sm-blue)' : 'var(--sm-line)'}` }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--sm-line)', background: '#F4F8FF' }}>
                <div style={{ fontSize: 12, color: 'var(--sm-blue)', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: 6 }}>Email</div>
                <input type="email" value={form.email} onChange={e => setF('email')(e.target.value)} placeholder="exemple@email.com" style={{ ...PINP }} />
              </div>
              <div style={{ padding: '12px 16px', background: '#F4F8FF' }}>
                <div style={{ fontSize: 12, color: 'var(--sm-blue)', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: 6 }}>Téléphone</div>
                <input type="tel" value={form.phone} onChange={e => setF('phone')(e.target.value)} placeholder="+225 07 00 00 00" style={{ ...PINP }} />
              </div>
            </>
          )}
        </div>
      </div>

      {editing && <SaveBar onCancel={cancelEdit} onSave={save} saving={saving} />}
      <ProfileToast msg={toast} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SOUS-ÉCRAN : PROFIL MÉDICAL
// ════════════════════════════════════════════════════════════════════════════
function ProfileMedical({ nav }) {
  useLucide();
  const SM = window.useSM();
  const user = SM.user || {};
  const med  = user.medicalRecord || {};

  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState('');

  function startEdit() {
    setForm({
      bloodType:  med.bloodType  || '',
      height:     med.height     ? String(med.height) : '',
      weight:     med.weight     ? String(med.weight) : '',
      allergies:  (med.allergies  || []).join(', '),
      conditions: (med.conditions || []).join(', '),
    });
    setEditing(true);
  }
  function cancelEdit() { setEditing(false); setForm(null); }
  const setF = k => v => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form) return;
    setSaving(true);
    const medPayload = {
      bloodType:  form.bloodType,
      height:     form.height     ? Number(form.height)  : null,
      weight:     form.weight     ? Number(form.weight)  : null,
      allergies:  form.allergies.split(',').map(a => a.trim()).filter(Boolean),
      conditions: form.conditions.split(',').map(c => c.trim()).filter(Boolean),
    };
    const updated = { ...window.SM.user, medicalRecord: { ...med, ...medPayload } };
    try { await window.API.updateMe({ medicalRecord: medPayload }); } catch {}
    window.SM.user = updated;
    localStorage.setItem('sm_user', JSON.stringify(updated));
    window.SM.emit();
    setSaving(false); setEditing(false); setForm(null);
    setToast('Profil médical mis à jour !');
    setTimeout(() => setToast(''), 2500);
  }

  const rows = [
    { label: 'Groupe sanguin', render: () => med.bloodType ? (
      <span style={{ padding: '3px 12px', borderRadius: 999, background: 'var(--sm-red-soft)', color: 'var(--sm-red)', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-ui)' }}>{med.bloodType}</span>
    ) : <span style={{ color: 'var(--sm-ink-400)', fontFamily: 'var(--font-ui)' }}>—</span> },
    { label: 'Taille / Poids', val: (med.height || med.weight) ? `${med.height || '?'} cm · ${med.weight || '?'} kg` : null },
    { label: 'Allergies',      val: (med.allergies  || []).join(', ') || null },
    { label: 'Antécédents',    val: (med.conditions || []).join(', ') || null },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#F4F6F9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SubHeader
        title="Profil médical"
        nav={nav}
        right={!editing && (
          <button onClick={startEdit} style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--sm-blue)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
            Modifier
          </button>
        )}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <div style={{ background: 'white', borderRadius: 'var(--sm-radius)', boxShadow: 'var(--sm-shadow)', overflow: 'hidden' }}>

          {/* ── Lecture ── */}
          {!editing && rows.map((r, i) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < rows.length - 1 ? '0.5px solid var(--sm-line)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--sm-ink-500)', width: 130, flexShrink: 0, fontFamily: 'var(--font-ui)' }}>{r.label}</span>
              {r.render ? r.render() : (
                <span style={{ fontSize: 15, color: r.val ? 'var(--sm-ink)' : 'var(--sm-ink-400)', fontFamily: 'var(--font-ui)' }}>{r.val || '—'}</span>
              )}
            </div>
          ))}

          {/* ── Édition ── */}
          {editing && (
            <>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--sm-line)', background: '#F4F8FF' }}>
                <div style={{ fontSize: 12, color: 'var(--sm-blue)', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: 10 }}>Groupe sanguin</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {BLOOD_TYPES_P.map(bt => (
                    <button key={bt} type="button" onClick={() => setF('bloodType')(bt)} style={{ padding: '7px 14px', borderRadius: 999, fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-ui)', cursor: 'pointer', background: form.bloodType === bt ? 'var(--sm-red)' : 'white', color: form.bloodType === bt ? 'white' : 'var(--sm-ink)', border: `1.5px solid ${form.bloodType === bt ? 'var(--sm-red)' : 'var(--sm-line)'}` }}>
                      {bt}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '0.5px solid var(--sm-line)' }}>
                {[{ label: 'Taille (cm)', key: 'height', ph: '170', min: 50, max: 250 }, { label: 'Poids (kg)', key: 'weight', ph: '65', min: 1, max: 300 }].map((f, i) => (
                  <div key={f.key} style={{ padding: '12px 14px', borderRight: i === 0 ? '0.5px solid var(--sm-line)' : 'none', background: '#F4F8FF' }}>
                    <div style={{ fontSize: 12, color: 'var(--sm-blue)', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: 6 }}>{f.label}</div>
                    <input type="number" value={form[f.key]} onChange={e => setF(f.key)(e.target.value)} placeholder={f.ph} min={f.min} max={f.max} style={{ ...PINP }} />
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--sm-line)', background: '#F4F8FF' }}>
                <div style={{ fontSize: 12, color: 'var(--sm-blue)', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: 6 }}>Allergies (séparées par virgule)</div>
                <input value={form.allergies} onChange={e => setF('allergies')(e.target.value)} placeholder="Pénicilline, Arachides…" style={{ ...PINP }} />
              </div>
              <div style={{ padding: '12px 16px', background: '#F4F8FF' }}>
                <div style={{ fontSize: 12, color: 'var(--sm-blue)', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: 6 }}>Antécédents médicaux</div>
                <textarea value={form.conditions} onChange={e => setF('conditions')(e.target.value)} placeholder="Diabète, hypertension…" rows={3} style={{ ...PINP, resize: 'none', lineHeight: 1.55 }} />
              </div>
            </>
          )}
        </div>
      </div>

      {editing && <SaveBar onCancel={cancelEdit} onSave={save} saving={saving} />}
      <ProfileToast msg={toast} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SOUS-ÉCRAN : CONTACTS D'URGENCE
// ════════════════════════════════════════════════════════════════════════════
function ProfileContacts({ nav }) {
  useLucide();
  const SM = window.useSM();
  const user = SM.user || {};
  const med  = user.medicalRecord || {};

  const [editing, setEditing] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [saving, setSaving]    = useState(false);
  const [toast, setToast]      = useState('');

  function startEdit() {
    setContacts((med.emergencyContacts || []).map(c => ({ ...c })));
    setEditing(true);
  }
  function cancelEdit() { setEditing(false); setContacts([]); }

  function addContact()       { if (contacts.length < 5) setContacts(cs => [...cs, { name: '', phone: '', relation: '' }]); }
  function removeContact(i)   { setContacts(cs => cs.filter((_, idx) => idx !== i)); }
  function updateContact(i, k, v) { setContacts(cs => cs.map((c, idx) => idx === i ? { ...c, [k]: v } : c)); }

  async function save() {
    setSaving(true);
    const clean = contacts.filter(c => c.name && c.name.trim());
    const updated = { ...window.SM.user, medicalRecord: { ...med, emergencyContacts: clean } };
    try { await window.API.updateMe({ medicalRecord: { emergencyContacts: clean } }); } catch {}
    window.SM.user = updated;
    localStorage.setItem('sm_user', JSON.stringify(updated));
    window.SM.emit();
    setSaving(false); setEditing(false); setContacts([]);
    setToast('Contacts mis à jour !');
    setTimeout(() => setToast(''), 2500);
  }

  const savedContacts = med.emergencyContacts || [];

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#F4F6F9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SubHeader
        title="Contacts d'urgence"
        nav={nav}
        right={!editing && (
          <button onClick={startEdit} style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--sm-blue)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
            Modifier
          </button>
        )}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── Lecture ── */}
        {!editing && (
          savedContacts.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 'var(--sm-radius)', boxShadow: 'var(--sm-shadow)', padding: '32px 20px', textAlign: 'center' }}>
              <Icon name="users" size={36} color="var(--sm-ink-400)" strokeWidth={1.5} />
              <p style={{ fontSize: 14, color: 'var(--sm-ink-500)', marginTop: 12, fontFamily: 'var(--font-ui)' }}>
                Aucun contact d'urgence renseigné
              </p>
            </div>
          ) : savedContacts.map((c, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 'var(--sm-radius)', boxShadow: 'var(--sm-shadow)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--sm-blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--sm-blue)', fontFamily: 'var(--font-ui)' }}>{(c.name || '?')[0]}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sm-ink)', fontFamily: 'var(--font-ui)' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--sm-ink-500)', marginTop: 2, fontFamily: 'var(--font-ui)' }}>
                  {c.relation ? c.relation + ' · ' : ''}{c.phone}
                </div>
              </div>
              <a href={'tel:' + c.phone} style={{ width: 38, height: 38, borderRadius: '50%', background: '#EAFAF1', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                <Icon name="phone" size={17} color="#27AE60" />
              </a>
            </div>
          ))
        )}

        {/* ── Édition ── */}
        {editing && (
          <>
            {contacts.map((c, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 'var(--sm-radius)', boxShadow: 'var(--sm-shadow)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sm-blue)', fontFamily: 'var(--font-ui)' }}>Contact {i + 1}</span>
                  <button onClick={() => removeContact(i)} style={{ background: 'none', border: 'none', color: 'var(--sm-red)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-ui)' }}>
                    Supprimer
                  </button>
                </div>
                <input value={c.name} onChange={e => updateContact(i, 'name', e.target.value)} placeholder="Nom du contact" style={{ ...PINP }} />
                <input value={c.phone} onChange={e => updateContact(i, 'phone', e.target.value)} placeholder="+225 07 00 00 00" type="tel" style={{ ...PINP }} />
                <input value={c.relation || ''} onChange={e => updateContact(i, 'relation', e.target.value)} placeholder="Relation (époux, sœur…)" style={{ ...PINP }} />
              </div>
            ))}

            {contacts.length < 5 && (
              <button onClick={addContact} style={{ background: 'white', border: '2px dashed var(--sm-line)', borderRadius: 'var(--sm-radius)', padding: '14px', color: 'var(--sm-blue)', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-ui)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon name="plus" size={18} color="var(--sm-blue)" />
                Ajouter un contact ({contacts.length}/5)
              </button>
            )}
          </>
        )}
      </div>

      {editing && <SaveBar onCancel={cancelEdit} onSave={save} saving={saving} />}
      <ProfileToast msg={toast} />
    </div>
  );
}

Object.assign(window, { ProfileScreen, ProfilePersonal, ProfileMedical, ProfileContacts });
