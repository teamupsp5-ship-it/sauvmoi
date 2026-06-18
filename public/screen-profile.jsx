// screen-profile.jsx — Profil utilisateur + carnet médical + paramètres

const BLOOD_TYPES_P = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
const GENDERS_P = ['Masculin', 'Féminin', 'Autre'];
const AVATAR_COLORS = ['#E53935', '#4A90C2', '#2E6B4F', '#C77A2B', '#6B4F8C'];

// ── Styles partagés ────────────────────────────────────────────────────────
// Style de base pour les lignes de lecture
function PSection({ title, children }) {
  return (
    <div style={{ padding: '0 14px 18px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sm-ink-400)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8, paddingLeft: 2 }}>
        {title}
      </div>
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--sm-line)', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function PRow({ label, value, last, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: last ? 'none' : '1px solid var(--sm-line)' }}>
      {label && <span style={{ fontSize: 13, color: 'var(--sm-ink-500)', width: 100, flexShrink: 0 }}>{label}</span>}
      <div style={{ flex: 1, fontSize: 15, color: 'var(--sm-ink)' }}>
        {children !== undefined ? children : (value || <span style={{ color: 'var(--sm-ink-400)' }}>—</span>)}
      </div>
    </div>
  );
}

// Style des inputs en mode édition — bordure bleue + fond bleuté
const PINP = {
  border: '1.5px solid var(--sm-blue)',
  outline: 'none',
  background: '#eef4ff',
  fontSize: 15,
  fontFamily: 'inherit',
  color: 'var(--sm-ink)',
  width: '100%',
  borderRadius: 8,
  padding: '8px 10px',
};

// Ligne de champ éditable avec label bleu et fond bleuté
function PField({ label, value, onChange, type = 'text', placeholder, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: last ? 'none' : '1px solid var(--sm-line)', background: '#f4f8ff' }}>
      <span style={{ fontSize: 13, color: 'var(--sm-blue)', width: 100, flexShrink: 0, fontWeight: 600 }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '—'}
        style={PINP}
      />
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
function ProfileScreen({ nav }) {
  useLucide();
  const SM = window.useSM();
  const photoRef = useRef(null);

  const [editing, setEditing]       = useState(false);
  const [form, setForm]             = useState(null);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState('');
  const [showLogout, setShowLogout] = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [pwForm, setPwForm]         = useState({ old: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading]   = useState(false);
  const [pwMsg, setPwMsg]           = useState('');

  const user = SM.user || {};
  const med  = user.medicalRecord || {};

  const initials = (user.name || 'SM').split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
  const avatarBg = AVATAR_COLORS[(initials.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  // ── Mode édition ──────────────────────────────────────────────────────────
  function startEdit() {
    setForm({
      name:       user.name || '',
      birthdate:  user.birthdate || '',
      gender:     user.gender || '',
      email:      user.email || '',
      phone:      user.phone || '',
      bloodType:  med.bloodType || '',
      height:     med.height ? String(med.height) : '',
      weight:     med.weight ? String(med.weight) : '',
      allergies:  (med.allergies || []).join(', '),
      conditions: (med.conditions || []).join(', '),
      contacts:   (med.emergencyContacts || []).map(c => ({ ...c })),
    });
    setEditing(true);
  }

  function cancelEdit() { setEditing(false); setForm(null); }
  function setF(k) { return v => setForm(f => ({ ...f, [k]: v })); }

  async function saveProfile() {
    if (!form) return;
    setSaving(true);
    const payload = {
      name:      form.name.trim(),
      birthdate: form.birthdate,
      gender:    form.gender,
      phone:     form.phone.trim(),
      medicalRecord: {
        bloodType:         form.bloodType,
        height:            form.height ? Number(form.height) : null,
        weight:            form.weight ? Number(form.weight) : null,
        allergies:         form.allergies.split(',').map(a => a.trim()).filter(Boolean),
        conditions:        form.conditions.split(',').map(c => c.trim()).filter(Boolean),
        emergencyContacts: form.contacts.filter(c => c.name && c.name.trim()),
      },
    };
    let updated = { ...user, ...payload };
    try {
      const res = await window.API.updateMe(payload);
      updated = { ...updated, ...res };
    } catch {}
    window.SM.user = updated;
    localStorage.setItem('sm_user', JSON.stringify(updated));
    window.SM.emit();
    setSaving(false);
    setEditing(false);
    setForm(null);
    setToast('Profil mis à jour !');
    setTimeout(() => setToast(''), 2500);
  }

  // ── Photo avatar ──────────────────────────────────────────────────────────
  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const max = 200;
      const scale = Math.min(max / img.width, max / img.height, 1);
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

  // ── Contacts d'urgence ────────────────────────────────────────────────────
  function addContact() {
    if (!form || form.contacts.length >= 5) return;
    setForm(f => ({ ...f, contacts: [...f.contacts, { name: '', phone: '', relation: '' }] }));
  }
  function removeContact(i) {
    setForm(f => ({ ...f, contacts: f.contacts.filter((_, idx) => idx !== i) }));
  }
  function updateContact(i, key, val) {
    setForm(f => {
      const contacts = f.contacts.map((c, idx) => idx === i ? { ...c, [key]: val } : c);
      return { ...f, contacts };
    });
  }

  // ── Déconnexion ───────────────────────────────────────────────────────────
  function logout() {
    localStorage.removeItem('sm_token');
    localStorage.removeItem('sm_user');
    window.SM.token = null;
    window.SM.user  = null;
    window.SM.home  = null;
    window.SM.emit();
    nav.reset('auth');
  }

  // ── Changement de mot de passe ────────────────────────────────────────────
  async function changePassword() {
    if (!pwForm.next || pwForm.next.length < 6) return setPwMsg('Minimum 6 caractères');
    if (pwForm.next !== pwForm.confirm) return setPwMsg('Les mots de passe ne correspondent pas');
    setPwLoading(true); setPwMsg('');
    try {
      const base = (window.API && window.API.base) || '';
      const res  = await fetch(base + '/api/auth/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ oldPassword: pwForm.old, newPassword: pwForm.next }),
      });
      const data = await res.json();
      setPwMsg(res.ok ? 'Mot de passe modifié ✓' : (data.error || 'Erreur'));
      if (res.ok) setPwForm({ old: '', next: '', confirm: '' });
    } catch { setPwMsg('Erreur réseau'); }
    finally   { setPwLoading(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--sm-paper)', display: 'flex', flexDirection: 'column' }}>

      {/* En-tête fixe */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 10px', background: 'white', borderBottom: '1px solid var(--sm-line)', flexShrink: 0 }}>
        <button onClick={() => nav.back()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sm-paper-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="arrow-left" size={18} />
        </button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>
          {editing ? <span style={{ color: 'var(--sm-blue)' }}>Mode édition</span> : 'Mon profil'}
        </span>
        {!editing ? (
          <button onClick={startEdit} style={{ padding: '6px 16px', borderRadius: 8, background: 'var(--sm-red)', border: 'none', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Modifier
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sm-blue)', animation: 'sm-pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 12, color: 'var(--sm-blue)', fontWeight: 600 }}>Édition</span>
          </div>
        )}
      </div>

      {/* Corps scrollable — padding-bottom supplémentaire si barre sticky visible */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: editing ? 110 : 40 }}>

        {/* ── Avatar + nom ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 14px 20px' }}>
          <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
          <button onClick={() => photoRef.current?.click()} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {user.photo ? (
              <img src={user.photo} alt="avatar" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: 'var(--shadow-2)' }} />
            ) : (
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: 'var(--shadow-2)' }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: 'white', fontFamily: 'var(--font-display)' }}>{initials}</span>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'var(--sm-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
              <Icon name="camera" size={13} color="white" />
            </div>
          </button>
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{user.name || 'Utilisateur'}</div>
            <div style={{ fontSize: 13, color: 'var(--sm-ink-500)', marginTop: 3 }}>{user.email || ''}</div>
          </div>
        </div>

        {/* ── Informations personnelles ── */}
        <PSection title="Informations personnelles">
          {!editing ? (
            <>
              <PRow label="Nom & prénom" value={user.name} />
              <PRow label="Date de naissance" value={user.birthdate || null} />
              <PRow label="Sexe" value={user.gender || null} />
              <PRow label="Email" value={user.email || null} />
              <PRow label="Téléphone" value={user.phone || null} last />
            </>
          ) : (
            <>
              <PField label="Nom & prénom" value={form.name} onChange={setF('name')} placeholder="Aïcha Koné" />
              <PField label="Naissance" value={form.birthdate} onChange={setF('birthdate')} type="date" />
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--sm-line)', background: '#f4f8ff' }}>
                <div style={{ fontSize: 13, color: 'var(--sm-blue)', marginBottom: 8, fontWeight: 600 }}>Sexe</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {GENDERS_P.map(g => (
                    <button key={g} type="button" onClick={() => setF('gender')(g)} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', background: form.gender === g ? 'var(--sm-blue)' : 'white', color: form.gender === g ? 'white' : 'var(--sm-ink)', border: `1.5px solid ${form.gender === g ? 'var(--sm-blue)' : 'var(--sm-line)'}` }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <PField label="Email" value={form.email} onChange={setF('email')} type="email" />
              <PField label="Téléphone" value={form.phone} onChange={setF('phone')} type="tel" placeholder="+225 07 00 00 00" last />
            </>
          )}
        </PSection>

        {/* ── Profil médical ── */}
        <PSection title="Profil médical">
          {!editing ? (
            <>
              <PRow label="Groupe sanguin">
                {med.bloodType ? (
                  <span style={{ padding: '3px 12px', borderRadius: 999, background: 'var(--sm-soft-red)', color: 'var(--sm-red)', fontWeight: 700, fontSize: 14 }}>{med.bloodType}</span>
                ) : null}
              </PRow>
              <PRow label="Taille / Poids" value={med.height || med.weight ? `${med.height || '?'} cm · ${med.weight || '?'} kg` : null} />
              <PRow label="Allergies" value={(med.allergies || []).join(', ') || null} />
              <PRow label="Antécédents" value={(med.conditions || []).join(', ') || null} last />
            </>
          ) : (
            <>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--sm-line)', background: '#f4f8ff' }}>
                <div style={{ fontSize: 13, color: 'var(--sm-blue)', marginBottom: 8, fontWeight: 600 }}>Groupe sanguin</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {BLOOD_TYPES_P.map(bt => (
                    <button key={bt} type="button" onClick={() => setF('bloodType')(bt)} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', background: form.bloodType === bt ? 'var(--sm-red)' : 'white', color: form.bloodType === bt ? 'white' : 'var(--sm-ink)', border: `1.5px solid ${form.bloodType === bt ? 'var(--sm-red)' : 'var(--sm-line)'}` }}>
                      {bt}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--sm-line)', background: '#f4f8ff' }}>
                <div style={{ padding: '10px 16px', borderRight: '1px solid var(--sm-line)' }}>
                  <div style={{ fontSize: 12, color: 'var(--sm-blue)', marginBottom: 6, fontWeight: 600 }}>Taille (cm)</div>
                  <input type="number" value={form.height} onChange={e => setF('height')(e.target.value)} placeholder="170" min="50" max="250" style={{ ...PINP }} />
                </div>
                <div style={{ padding: '10px 16px' }}>
                  <div style={{ fontSize: 12, color: 'var(--sm-blue)', marginBottom: 6, fontWeight: 600 }}>Poids (kg)</div>
                  <input type="number" value={form.weight} onChange={e => setF('weight')(e.target.value)} placeholder="65" min="1" max="300" style={{ ...PINP }} />
                </div>
              </div>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--sm-line)', background: '#f4f8ff' }}>
                <div style={{ fontSize: 12, color: 'var(--sm-blue)', marginBottom: 6, fontWeight: 600 }}>Allergies (séparées par virgule)</div>
                <input value={form.allergies} onChange={e => setF('allergies')(e.target.value)} placeholder="Pénicilline, Arachides…" style={{ ...PINP, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ padding: '10px 16px', background: '#f4f8ff' }}>
                <div style={{ fontSize: 12, color: 'var(--sm-blue)', marginBottom: 6, fontWeight: 600 }}>Antécédents médicaux</div>
                <textarea value={form.conditions} onChange={e => setF('conditions')(e.target.value)} placeholder="Diabète, hypertension…" rows={2} style={{ ...PINP, resize: 'none', lineHeight: 1.5, width: '100%', boxSizing: 'border-box' }} />
              </div>
            </>
          )}
        </PSection>

        {/* ── Contacts d'urgence ── */}
        <PSection title="Contacts d'urgence">
          {!editing ? (
            (med.emergencyContacts || []).length === 0 ? (
              <PRow last><span style={{ color: 'var(--sm-ink-400)', fontSize: 14 }}>Aucun contact renseigné</span></PRow>
            ) : (
              (med.emergencyContacts || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < (med.emergencyContacts.length - 1) ? '1px solid var(--sm-line)' : 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--sm-soft-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="user" size={17} color="var(--sm-blue)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--sm-ink-500)' }}>{c.relation ? c.relation + ' · ' : ''}{c.phone}</div>
                  </div>
                  <a href={'tel:' + c.phone} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sm-soft-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                    <Icon name="phone" size={16} color="var(--sm-green)" />
                  </a>
                </div>
              ))
            )
          ) : (
            <>
              {form.contacts.map((c, i) => (
                <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--sm-line)', background: '#f4f8ff', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--sm-blue)', fontWeight: 700 }}>Contact {i + 1}</span>
                    <button onClick={() => removeContact(i)} style={{ background: 'none', border: 'none', color: 'var(--sm-red)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Supprimer</button>
                  </div>
                  <input value={c.name} onChange={e => updateContact(i, 'name', e.target.value)} placeholder="Nom du contact" style={{ ...PINP, boxSizing: 'border-box' }} />
                  <input value={c.phone} onChange={e => updateContact(i, 'phone', e.target.value)} placeholder="+225 07 00 00 00" type="tel" style={{ ...PINP, boxSizing: 'border-box' }} />
                  <input value={c.relation || ''} onChange={e => updateContact(i, 'relation', e.target.value)} placeholder="Relation (époux, sœur…)" style={{ ...PINP, boxSizing: 'border-box' }} />
                </div>
              ))}
              {form.contacts.length < 5 && (
                <button onClick={addContact} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: 'var(--sm-blue)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="plus" size={16} color="var(--sm-blue)" /> Ajouter un contact
                </button>
              )}
            </>
          )}
        </PSection>

        {/* ── QR Code médical ── */}
        {!editing && (
          <PSection title="QR Code médical">
            <button onClick={() => nav.go('qr_code')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--sm-soft-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="qr-code" size={24} color="var(--sm-blue)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Voir mon QR Code médical</div>
                <div style={{ fontSize: 12, color: 'var(--sm-ink-500)', marginTop: 2 }}>Montrez-le aux secours en cas d'urgence</div>
              </div>
              <Icon name="arrow-right" size={18} color="var(--sm-ink-400)" />
            </button>
          </PSection>
        )}

        {/* ── Paramètres (masqués en mode édition pour réduire le scroll) ── */}
        {!editing && (
          <PSection title="Paramètres">

            <button onClick={() => { setShowPw(v => !v); setPwMsg(''); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--sm-line)', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--sm-paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="lock" size={17} color="var(--sm-ink-500)" />
              </div>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>Changer le mot de passe</span>
              <Icon name={showPw ? 'chevron-up' : 'chevron-down'} size={17} color="var(--sm-ink-400)" />
            </button>

            {showPw && (
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--sm-line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Ancien',        key: 'old',     placeholder: '••••••••' },
                  { label: 'Nouveau',       key: 'next',    placeholder: 'Min. 6 caractères' },
                  { label: 'Confirmation',  key: 'confirm', placeholder: '••••••••' },
                ].map(f => (
                  <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, color: 'var(--sm-ink-500)', fontWeight: 600 }}>{f.label}</label>
                    <input type="password" value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ ...PINP, border: '1.5px solid var(--sm-line)', background: 'var(--sm-paper)' }} />
                  </div>
                ))}
                {pwMsg && <p style={{ fontSize: 13, color: pwMsg.includes('✓') ? 'var(--sm-green)' : 'var(--sm-red)', margin: 0 }}>{pwMsg}</p>}
                <button onClick={changePassword} disabled={pwLoading} style={{ padding: '11px', borderRadius: 10, background: 'var(--sm-ink)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                  {pwLoading ? 'Modification…' : 'Modifier le mot de passe'}
                </button>
              </div>
            )}

            <button onClick={() => nav.go('terms')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--sm-line)', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--sm-paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="file-text" size={17} color="var(--sm-ink-500)" />
              </div>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>Conditions générales</span>
              <Icon name="arrow-right" size={17} color="var(--sm-ink-400)" />
            </button>

            <button onClick={() => setShowLogout(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--sm-soft-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="log-out" size={17} color="var(--sm-red)" />
              </div>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--sm-red)' }}>Se déconnecter</span>
            </button>
          </PSection>
        )}

      </div>{/* fin corps scrollable */}

      {/* ── Barre d'actions sticky en mode édition ── */}
      {editing && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '2px solid var(--sm-blue)', padding: '12px 14px 32px', display: 'flex', gap: 10, zIndex: 20 }}>
          <button onClick={cancelEdit} style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'var(--sm-paper-2)', color: 'var(--sm-ink-600)', border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={saveProfile} disabled={saving} style={{ flex: 2, padding: '13px', borderRadius: 12, background: saving ? 'var(--sm-line)' : 'var(--sm-red)', color: 'white', border: 'none', fontWeight: 700, fontSize: 15, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      )}

      {/* ── Toast succès ── */}
      {toast && (
        <div style={{ position: 'absolute', top: 65, left: 14, right: 14, zIndex: 200, background: '#2e6b4f', color: 'white', borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}>
          <Icon name="check-circle-2" size={20} color="white" />
          <span style={{ fontWeight: 700, fontSize: 14 }}>{toast}</span>
        </div>
      )}

      {/* ── Modal confirmation déconnexion ── */}
      {showLogout && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,22,40,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }}>
          <div style={{ width: '100%', background: 'white', borderRadius: '20px 20px 0 0', padding: '28px 20px 36px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--sm-line)', margin: '0 auto 22px' }} />
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--sm-soft-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Icon name="log-out" size={26} color="var(--sm-red)" />
            </div>
            <h3 className="sm-serif" style={{ fontSize: 20, textAlign: 'center', marginBottom: 8 }}>Se déconnecter ?</h3>
            <p style={{ fontSize: 14, color: 'var(--sm-ink-500)', textAlign: 'center', marginBottom: 24 }}>
              Vous devrez vous reconnecter pour accéder à l'application.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={logout} style={{ padding: '14px', borderRadius: 12, background: 'var(--sm-red)', color: 'white', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                Confirmer la déconnexion
              </button>
              <button onClick={() => setShowLogout(false)} style={{ padding: '14px', borderRadius: 12, background: 'var(--sm-paper-2)', color: 'var(--sm-ink)', border: 'none', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

Object.assign(window, { ProfileScreen });
