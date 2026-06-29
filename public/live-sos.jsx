// live-sos.jsx — Module SOS vivant (GPS réel, Leaflet, WhatsApp, hasAccount)
// Surcharge SOSCountdown et SOSConfirm de screen-sos.jsx

// ── URL WhatsApp géolocalisé ──────────────────────────────────────────────────
function buildWaUrl(phone, userName, lat, lng) {
  const clean = phone.replace(/^\+/, '').replace(/\s/g, '');
  const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const msg = `🚨 ALERTE URGENCE - Sauv'Moi\n${userName} a déclenché une alerte SOS.\nPosition : https://maps.google.com/?q=${lat},${lng}\nHeure : ${now}`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

// ── 4a · Compte à rebours + état idle ─────────────────────────────────────────
function SOSCountdown({ nav }) {
  useLucide();
  const [phase, setPhase] = useState('idle'); // 'idle' | 'counting' | 'fired'
  const [count, setCount] = useState(5);
  const gpsRef = useRef({ lat: 5.354, lng: -3.987, label: 'Abidjan' });

  const handleStart = () => {
    setPhase('counting');
    setCount(5);
    // GPS démarre ici, résultat disponible pendant les 5s
    navigator.geolocation?.getCurrentPosition(
      p => { gpsRef.current = { lat: p.coords.latitude, lng: p.coords.longitude, label: 'Position GPS' }; },
      () => {},
      { timeout: 4500, enableHighAccuracy: true }
    );
  };

  const handleCancel = () => { setPhase('idle'); setCount(5); };

  useEffect(() => {
    if (phase !== 'counting') return;
    if (count <= 0) {
      setPhase('fired');
      window.API.sosTrigger(gpsRef.current)
        .then(a => {
          window.SM.sos = { alertId: a.alertId, contacts: a.contacts || [], lat: a.lat, lng: a.lng };
          window.SM.emit();
          setTimeout(() => nav.replace('sos_confirm'), 200);
        })
        .catch(e => {
          console.warn('[SOS] trigger échoué:', e.message);
          setPhase('idle');
        });
      return;
    }
    navigator.vibrate?.(200);
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count]);

  // ── État idle ─────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--sm-line)', background: 'linear-gradient(180deg, #f8f9fa, white)', flexShrink: 0 }}>
          <button onClick={() => goBack(nav)} style={{ background: 'none', border: 'none', padding: '4px', margin: '-4px', cursor: 'pointer' }}>
            <Icon name="arrow-left" size={22} color="var(--sm-ink)" />
          </button>
          <h1 className="sm-serif" style={{ fontSize: 20, flex: 1 }}>Urgence SOS</h1>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 32px' }}>
          {/* Grand bouton SOS pulsant */}
          <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(231,76,60,0.1)', animation: 'sos-ring 2.2s ease-out infinite' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 164, height: 164, borderRadius: '50%', background: 'rgba(231,76,60,0.16)', animation: 'sos-ring 2.2s ease-out infinite', animationDelay: '0.7s' }} />
            <button
              onClick={handleStart}
              style={{
                position: 'relative', zIndex: 1,
                width: 140, height: 140, borderRadius: '50%',
                background: 'linear-gradient(135deg, #E74C3C, #C0392B)',
                border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(192,57,43,0.45)',
                transition: 'transform 0.1s ease',
              }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Icon name="siren" size={42} color="white" strokeWidth={2} />
              <span style={{ fontSize: 20, fontWeight: 700, marginTop: 6, fontFamily: 'var(--font-ui)', letterSpacing: '0.06em', color: 'white' }}>SOS</span>
            </button>
          </div>

          <p style={{ fontSize: 14, color: 'var(--sm-ink-500)', textAlign: 'center', marginBottom: 40 }}>
            Appuyez en cas d'urgence
          </p>

          <h3 className="sm-serif" style={{ fontSize: 16, marginBottom: 14, width: '100%' }}>Numéros d'urgence</h3>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'SAMU',     number: '185', icon: 'ambulance', color: 'var(--sm-red)',  bg: 'var(--sm-red-soft)' },
              { label: 'Pompiers', number: '180', icon: 'flame',     color: '#E67E22',        bg: '#FEF5EC' },
              { label: 'Police',   number: '110', icon: 'shield',    color: 'var(--sm-blue)', bg: 'var(--sm-blue-soft)' },
            ].map(item => (
              <a key={item.number} href={'tel:' + item.number} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ padding: '14px 16px', borderRadius: 'var(--sm-radius)', background: 'white', boxShadow: 'var(--sm-shadow)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={item.icon} size={22} color={item.color} strokeWidth={1.9} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sm-ink)', fontFamily: 'var(--font-ui)' }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--sm-ink-500)', marginTop: 2 }}>Appel direct · {item.number}</div>
                  </div>
                  <Icon name="phone" size={18} color={item.color} />
                </div>
              </a>
            ))}
          </div>
        </div>
        <HomeTabBar active="sos" nav={nav} />
      </div>
    );
  }

  // ── Compte à rebours (phase 'counting' ou 'fired') ────────────────────────
  const R = 90, C = 2 * Math.PI * R;
  const dashoffset = C * (count / 5);

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <p style={{ fontSize: 14, color: 'var(--sm-ink-500)', marginBottom: 40, textAlign: 'center' }}>
        {phase === 'fired' ? 'Alerte envoyée…' : 'Alerte SOS en cours d\'envoi…'}
      </p>
      <div style={{ position: 'relative', width: 220, height: 220, marginBottom: 48 }}>
        <svg width={220} height={220} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={110} cy={110} r={R} fill="var(--sm-red-soft)" stroke="rgba(192,57,43,0.12)" strokeWidth="2" />
          <circle cx={110} cy={110} r={R} fill="none" stroke="var(--sm-red)" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={dashoffset} style={{ transition: 'stroke-dashoffset 980ms linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 72, fontWeight: 700, color: 'var(--sm-red)', fontFamily: 'var(--font-ui)', lineHeight: 1 }}>{Math.max(0, count)}</span>
          <span style={{ fontSize: 13, color: 'var(--sm-ink-500)', marginTop: 6 }}>secondes</span>
        </div>
      </div>
      {phase === 'counting' && (
        <button
          onClick={handleCancel}
          style={{
            width: '100%', maxWidth: 340, padding: '16px',
            borderRadius: 'var(--sm-radius)', border: '2px solid var(--sm-red)',
            background: 'white', color: 'var(--sm-red)',
            fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-ui)',
            cursor: 'pointer', letterSpacing: '0.04em',
            boxShadow: '0 2px 8px rgba(192,57,43,0.12)',
          }}
        >
          ANNULER
        </button>
      )}
    </div>
  );
}

// ── 4b · Confirmation avec carte Leaflet réelle ────────────────────────────────
function SOSConfirm({ nav }) {
  useLucide();
  const sos = window.SM?.sos || {};
  const lat = sos.lat ?? 5.354;
  const lng = sos.lng ?? -3.987;
  const contacts = sos.contacts || [];
  const user = window.SM?.user;
  const prenom = (user?.prenom || user?.name?.split(' ')[0] || 'Vous').trim();

  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Carte Leaflet — montée une seule fois
  useEffect(() => {
    const L = window.L;
    if (!L || !mapDivRef.current || mapInstanceRef.current) return;

    const map = L.map(mapDivRef.current, { zoomControl: false, attributionControl: false })
      .setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const icon = L.divIcon({
      className: '',
      html: '<div style="width:22px;height:22px;border-radius:50%;background:#C0392B;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(`📍 Position de ${prenom}`)
      .openPopup();

    mapInstanceRef.current = map;
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  }, []);

  const handleCancel = () => {
    if (sos.alertId) window.API.sosCancel(sos.alertId).catch(() => {});
    window.SM.sos = { alertId: null, contacts: [], lat: null, lng: null };
    window.SM.emit();
    nav.reset('home');
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header fixe ── */}
      <div style={{ flexShrink: 0, background: 'white', borderBottom: '1px solid var(--sm-line)' }}>
        <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sm-red)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <span className="sm-blink" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--sm-red)' }} />
            Alerte active
          </span>
          <button onClick={() => nav.reset('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <Icon name="x" size={20} color="var(--sm-ink-400)" />
          </button>
        </div>
        {/* Bouton SAMU sticky */}
        <div style={{ padding: '0 16px 14px' }}>
          <a href="tel:185" style={{ textDecoration: 'none', display: 'block' }}>
            <button style={{
              width: '100%', padding: '14px', borderRadius: 'var(--sm-radius)',
              background: 'var(--sm-red)', color: 'white', border: 'none',
              fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-ui)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(192,57,43,0.3)',
            }}>
              <Icon name="phone" size={20} color="white" strokeWidth={2.2} />
              📞 Appeler le SAMU — 185
            </button>
          </a>
        </div>
      </div>

      {/* ── Corps scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>

        {/* Carte succès */}
        <div style={{ background: '#EAFAF1', borderRadius: 'var(--sm-radius)', padding: '16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#27AE60', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="check" size={26} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1E8449', fontFamily: 'var(--font-ui)' }}>✅ Alerte déclenchée</div>
            <div style={{ fontSize: 13, color: '#27AE60', marginTop: 2 }}>Votre position a été enregistrée</div>
          </div>
        </div>

        {/* Carte Leaflet */}
        <div style={{ borderRadius: 'var(--sm-radius)', overflow: 'hidden', marginBottom: 16, boxShadow: 'var(--sm-shadow)' }}>
          <div ref={mapDivRef} style={{ width: '100%', height: 220 }} />
        </div>

        {/* Contacts d'urgence */}
        {contacts.length > 0 && (
          <>
            <h3 className="sm-serif" style={{ fontSize: 16, marginBottom: 12 }}>Contacts d'urgence</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {contacts.map(c => (
                <div key={c.phone} style={{ background: 'white', borderRadius: 'var(--sm-radius)', boxShadow: 'var(--sm-shadow)', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: c.hasAccount ? 0 : 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--sm-red-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--sm-red)', fontFamily: 'var(--font-ui)' }}>{c.name.charAt(0)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sm-ink)', fontFamily: 'var(--font-ui)' }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>{c.relation}</div>
                    </div>
                    {c.hasAccount && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EAFAF1', borderRadius: 999, padding: '4px 10px', flexShrink: 0 }}>
                        <Icon name="check" size={12} color="#27AE60" strokeWidth={2.5} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#27AE60', fontFamily: 'var(--font-ui)' }}>Notifié dans l'app</span>
                      </div>
                    )}
                  </div>
                  {!c.hasAccount && (
                    <a href={buildWaUrl(c.phone, prenom, lat, lng)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                      <button style={{
                        width: '100%', padding: '11px 14px', borderRadius: 'var(--sm-radius)',
                        background: '#25D366', color: 'white', border: 'none',
                        fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-ui)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,211,102,0.3)',
                      }}>
                        <Icon name="message-circle" size={18} color="white" strokeWidth={2} />
                        Alerter via WhatsApp
                      </button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Numéros d'urgence */}
        <h3 className="sm-serif" style={{ fontSize: 16, marginBottom: 12 }}>Intervention immédiate</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <a href="tel:185" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '14px 16px', borderRadius: 'var(--sm-radius)', background: 'white', boxShadow: 'var(--sm-shadow)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--sm-red-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="ambulance" size={22} color="var(--sm-red)" strokeWidth={1.9} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sm-ink)', fontFamily: 'var(--font-ui)' }}>📞 Appeler le SAMU</div>
                <div style={{ fontSize: 13, color: 'var(--sm-ink-500)', marginTop: 2 }}>Numéro d'urgence · 185</div>
              </div>
              <Icon name="phone" size={18} color="var(--sm-red)" />
            </div>
          </a>
          <a href="tel:180" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '14px 16px', borderRadius: 'var(--sm-radius)', background: 'white', boxShadow: 'var(--sm-shadow)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: '#FEF5EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="flame" size={22} color="#E67E22" strokeWidth={1.9} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sm-ink)', fontFamily: 'var(--font-ui)' }}>📞 Appeler les Pompiers</div>
                <div style={{ fontSize: 13, color: 'var(--sm-ink-500)', marginTop: 2 }}>Numéro d'urgence · 180</div>
              </div>
              <Icon name="phone" size={18} color="#E67E22" />
            </div>
          </a>
        </div>

        {/* Bouton annuler */}
        <button
          onClick={handleCancel}
          style={{
            width: '100%', padding: '14px', borderRadius: 'var(--sm-radius)',
            border: '2px solid var(--sm-red)', background: 'white', color: 'var(--sm-red)',
            fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-ui)',
            cursor: 'pointer', letterSpacing: '0.03em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Icon name="x-circle" size={18} color="var(--sm-red)" />
          Annuler l'alerte
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { SOSCountdown, SOSConfirm });
