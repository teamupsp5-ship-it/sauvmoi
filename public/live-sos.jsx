// Écrans SOS "vivants" — surchargent SOSCountdown / SOSConfirm.
// Le compte à rebours déclenche une vraie alerte ; la confirmation suit le WebSocket en direct.

function SOSCountdown({ nav, lang }) {
  useLucide();
  const SM = window.useSM();
  const [count, setCount] = useState(3);
  const firedRef = useRef(false);

  useEffect(() => {
    if (count <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        // Déclenche l'alerte réelle puis ouvre l'écran de suivi
        window.API.sosTrigger({ lat: 5.354, lng: -3.987, label: 'Cocody · Riviera 2' })
          .then((a) => {
            SM.sos = { alertId: a.alertId, samu: a.samu, relatives: a.relatives, rescuers: a.rescuers, rescuersAccepted: 0, eta: a.samu?.etaMin, status: a.status, ws: null };
            SM.emit();
          })
          .catch((e) => console.warn('[SOS] trigger échoué:', e.message))
          .finally(() => { const t = setTimeout(() => nav.replace('sos_confirm'), 350); });
      }
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  const R = 100, C = 2 * Math.PI * R;
  const dashoffset = C * ((3 - count) / 3);

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--sm-red)', color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {[300, 460, 620, 780].map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: s, height: s, left: '50%', top: '46%', marginLeft: -s / 2, marginTop: -s / 2, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.18)', opacity: 1 - i * 0.18, animation: 'sm-pulse-halo 2.4s var(--ease) infinite', animationDelay: `${i * 0.4}s` }} />
      ))}
      <StatusBar light />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 0' }}>
        <button onClick={() => nav.back()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={20} color="white" />
        </button>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{T('sos_in', lang)}</span>
        <div style={{ width: 36, height: 36 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative', width: 220, height: 220 }}>
          <svg width={220} height={220} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={110} cy={110} r={R} fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
            <circle cx={110} cy={110} r={R} fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={dashoffset} style={{ transition: 'stroke-dashoffset 980ms linear' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="sm-serif" style={{ fontSize: 96, fontWeight: 500, lineHeight: 1 }}>{Math.max(0, count)}</span>
            <span style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>{T('seconds', lang)}</span>
          </div>
        </div>
        <h2 className="sm-serif" style={{ fontSize: 24, marginTop: 36, textAlign: 'center', maxWidth: 280 }}>{T('sos_sending', lang)}</h2>
        <div style={{ marginTop: 20, display: 'flex', gap: 14, alignItems: 'center', fontSize: 13, opacity: 0.85 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="map-pin" size={14} /> Cocody · Riviera 2</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="signal" size={14} /> GPS ±8 m</span>
        </div>
      </div>

      <div style={{ padding: '14px 28px 30px', position: 'relative', zIndex: 2 }}>
        <button onClick={() => nav.home()} className="sm-btn sm-btn-outline-white" style={{ width: '100%', padding: '18px', fontSize: 16, fontWeight: 700, minHeight: 56 }}>{T('cancel', lang)}</button>
        <p style={{ textAlign: 'center', fontSize: 11, opacity: 0.7, marginTop: 10 }}>{lang === 'EN' ? 'You can cancel at any time' : 'Vous pouvez annuler à tout moment'}</p>
      </div>
      <HomeIndicator light />
    </div>
  );
}

// ── 4b · Confirmation suivie en direct via WebSocket ────────────────────────
function SOSConfirm({ nav, lang }) {
  useLucide();
  const SM = window.useSM();

  useEffect(() => {
    if (!SM.sos.alertId || SM.sos.ws) return;
    const ws = window.API.sosSocket(SM.sos.alertId, (ev) => {
      const s = SM.sos;
      if (ev.type === 'samu') { s.samu = { ...s.samu, status: ev.status, etaMin: ev.etaMin }; s.eta = ev.etaMin; }
      if (ev.type === 'eta') s.eta = ev.etaMin;
      if (ev.type === 'rescuer') s.rescuersAccepted = ev.accepted;
      if (ev.type === 'relative') s.relatives = s.relatives.map((r) => r.name === ev.name ? { ...r, status: ev.status, etaMin: ev.etaMin } : r);
      if (ev.type === 'arrived') s.status = 'arrived';
      SM.emit();
    });
    SM.sos.ws = ws;
    return () => { try { ws.close(); } catch {} SM.sos.ws = null; };
  }, [SM.sos.alertId]);

  const eta = SM.sos.eta != null ? SM.sos.eta : 4;
  const samuStatus = SM.sos.samu?.status === 'received' ? 'Reçu' : 'En cours…';
  const relative = SM.sos.relatives && SM.sos.relatives[0];
  const accepted = SM.sos.rescuersAccepted || 0;
  const total = (SM.sos.rescuers && SM.sos.rescuers.length) || 12;

  return (
    <>
      <StatusBar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 0' }}>
        <button onClick={() => nav.home()} style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={20} color="var(--sm-ink-700)" />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sm-red)' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--sm-red)', marginRight: 6, verticalAlign: 'middle' }} className="sm-blink" />
          {SM.sos.status === 'arrived' ? 'Secours sur place' : 'Alerte active'}
        </span>
        <button style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="more-horizontal" size={20} color="var(--sm-ink-700)" />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '14px 0 22px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--sm-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 22px rgba(46,107,79,0.3)', marginBottom: 16 }}>
            <Icon name="check" size={36} strokeWidth={2.2} />
          </div>
          <h2 className="sm-serif" style={{ fontSize: 26 }}>{T('help_coming', lang)}</h2>
          <p style={{ fontSize: 14, color: 'var(--sm-ink-500)', marginTop: 6 }}>{T('sent_to', lang)}</p>
        </div>

        {/* SAMU (live) */}
        <div className="sm-card" style={{ padding: 16, marginBottom: 10, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--sm-red)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="ambulance" size={24} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, lineHeight: 1.3 }}>
            <div className="sm-serif" style={{ fontSize: 17 }}>SAMU 185</div>
            <div style={{ fontSize: 12, color: 'var(--sm-ink-500)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--sm-green)' }} />
              {samuStatus} · ETA {eta} min
            </div>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--sm-soft-green)', color: 'var(--sm-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={16} strokeWidth={2.4} />
          </div>
        </div>

        {/* Proches (live) */}
        <div className="sm-card" style={{ padding: 16, marginBottom: 10, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--sm-soft-red)', color: 'var(--sm-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="heart" size={22} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, lineHeight: 1.3 }}>
            <div className="sm-serif" style={{ fontSize: 17 }}>Proches notifiés</div>
            <div style={{ fontSize: 12, color: 'var(--sm-ink-500)', marginTop: 4 }}>
              {relative && relative.status === 'on_the_way'
                ? `${relative.name.split(' ')[0]} en route · ${relative.etaMin || 8} min`
                : (SM.sos.relatives && SM.sos.relatives.length ? `${SM.sos.relatives.length} contact(s) prévenu(s)` : 'Notification en cours…')}
            </div>
          </div>
        </div>

        {/* Secouristes (live) */}
        <div className="sm-card" style={{ padding: 16, marginBottom: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--sm-soft-green)', color: 'var(--sm-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="map-pin" size={22} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, lineHeight: 1.3 }}>
            <div className="sm-serif" style={{ fontSize: 17 }}>{total} secouristes alertés</div>
            <div style={{ fontSize: 12, color: 'var(--sm-ink-500)', marginTop: 2 }}>
              {accepted > 0 ? `${accepted} ont accepté · le plus proche à 200 m` : 'En attente de réponse…'}
            </div>
          </div>
          {accepted > 0 && <span className="sm-serif" style={{ fontSize: 22, color: 'var(--sm-green)' }}>{accepted}</span>}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="sm-btn sm-btn-outline" style={{ flex: 1 }}><Icon name="map" size={18} /> {T('view_map', lang)}</button>
          <button onClick={() => { if (SM.sos.alertId) window.API.sosCancel(SM.sos.alertId).catch(() => {}); nav.home(); }} className="sm-btn sm-btn-outline-red" style={{ flex: 1 }}>
            <Icon name="x-circle" size={18} /> {T('cancel_all', lang)}
          </button>
        </div>
      </div>
      <HomeIndicator />
    </>
  );
}

Object.assign(window, { SOSCountdown, SOSConfirm });
