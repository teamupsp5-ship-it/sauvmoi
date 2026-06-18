// Screen 4 — SOS géolocalisé · mobile
// 4a: 3-second countdown with cancel
// 4b: confirmation — help is on the way

function SOSCountdown({ nav, lang }) {
  useLucide();
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count <= 0) {
      const t = setTimeout(() => nav.replace('sos_confirm'), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  const R = 100;
  const C = 2 * Math.PI * R;
  const elapsed = 3 - count; // 0..3
  const progress = elapsed / 3;
  const dashoffset = C * progress;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'var(--sm-red)',
      color: 'white',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Concentric wave rings */}
      {[300, 460, 620, 780].map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: s, height: s,
          left: '50%', top: '46%',
          marginLeft: -s/2, marginTop: -s/2,
          borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.18)',
          opacity: 1 - i * 0.18,
          animation: `sm-pulse-halo 2.4s var(--ease) infinite`,
          animationDelay: `${i * 0.4}s`,
        }} />
      ))}

      <StatusBar light />
      {/* Header */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 0' }}>
        <button onClick={() => nav.back()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={20} color="white" />
        </button>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{T('sos_in', lang)}</span>
        <div style={{ width: 36, height: 36 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', position: 'relative', zIndex: 2 }}>
        {/* Progress ring + number */}
        <div style={{ position: 'relative', width: 220, height: 220 }}>
          <svg width={220} height={220} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={110} cy={110} r={R} fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
            <circle
              cx={110} cy={110} r={R}
              fill="none"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={dashoffset}
              style={{ transition: 'stroke-dashoffset 980ms linear' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="sm-serif" style={{ fontSize: 96, fontWeight: 500, lineHeight: 1 }}>
              {Math.max(0, count)}
            </span>
            <span style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>{T('seconds', lang)}</span>
          </div>
        </div>

        <h2 className="sm-serif" style={{ fontSize: 24, marginTop: 36, textAlign: 'center', maxWidth: 280 }}>
          {T('sos_sending', lang)}
        </h2>

        <div style={{ marginTop: 20, display: 'flex', gap: 14, alignItems: 'center', fontSize: 13, opacity: 0.85 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="map-pin" size={14} /> Cocody · Riviera 2
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="signal" size={14} /> GPS ±8 m
          </span>
        </div>
      </div>

      {/* Cancel button */}
      <div style={{ padding: '14px 28px 30px', position: 'relative', zIndex: 2 }}>
        <button
          onClick={() => nav.home()}
          className="sm-btn sm-btn-outline-white"
          style={{ width: '100%', padding: '18px', fontSize: 16, fontWeight: 700, minHeight: 56 }}
        >
          {T('cancel', lang)}
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, opacity: 0.7, marginTop: 10 }}>
          {lang === 'EN' ? 'Maintain pressure on the cancel button to abort' : 'Vous pouvez annuler à tout moment'}
        </p>
      </div>
      <HomeIndicator light />
    </div>
  );
}

// ── 4b · Confirmation ─────────────────────────────────────────────────────
function SOSConfirm({ nav, lang }) {
  useLucide();
  return (
    <>
      <StatusBar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 0' }}>
        <button onClick={() => nav.home()} style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={20} color="var(--sm-ink-700)" />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sm-red)' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--sm-red)', marginRight: 6, verticalAlign: 'middle' }} className="sm-blink" />
          Alerte active
        </span>
        <button style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="more-horizontal" size={20} color="var(--sm-ink-700)" />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
        {/* Success */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '14px 0 22px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--sm-green)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 22px rgba(46,107,79,0.3)',
            marginBottom: 16,
          }}>
            <Icon name="check" size={36} strokeWidth={2.2} />
          </div>
          <h2 className="sm-serif" style={{ fontSize: 26 }}>{T('help_coming', lang)}</h2>
          <p style={{ fontSize: 14, color: 'var(--sm-ink-500)', marginTop: 6 }}>{T('sent_to', lang)}</p>
        </div>

        {/* Card 1 — SAMU */}
        <div className="sm-card" style={{ padding: 16, marginBottom: 10, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: 'var(--sm-red)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="ambulance" size={24} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, lineHeight: 1.3 }}>
            <div className="sm-serif" style={{ fontSize: 17 }}>SAMU 185</div>
            <div style={{ fontSize: 12, color: 'var(--sm-ink-500)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--sm-green)' }} />
              Reçu · ETA 4 min
            </div>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--sm-soft-green)', color: 'var(--sm-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="check" size={16} strokeWidth={2.4} />
          </div>
        </div>

        {/* Card 2 — Proches */}
        <div className="sm-card" style={{ padding: 16, marginBottom: 10, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: 'var(--sm-soft-red)', color: 'var(--sm-red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="heart" size={22} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, lineHeight: 1.3 }}>
            <div className="sm-serif" style={{ fontSize: 17 }}>Proches notifiés</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div style={{ display: 'flex' }}>
                {[0,1,2].map(i => (
                  <div key={i} className="sm-photo-placeholder" style={{
                    width: 22, height: 22, borderRadius: '50%',
                    marginLeft: i > 0 ? -7 : 0,
                    border: '2px solid white', fontSize: 9, fontWeight: 600,
                    color: 'var(--sm-ink)',
                  }}>
                    <span style={{ position: 'relative', zIndex: 1 }}>{['M','A','K'][i]}</span>
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--sm-ink-500)' }}>Mamadou en route · 8 min</span>
            </div>
          </div>
        </div>

        {/* Card 3 — Secouristes */}
        <div className="sm-card" style={{ padding: 16, marginBottom: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: 'var(--sm-soft-green)', color: 'var(--sm-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="map-pin" size={22} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, lineHeight: 1.3 }}>
            <div className="sm-serif" style={{ fontSize: 17 }}>12 secouristes alertés</div>
            <div style={{ fontSize: 12, color: 'var(--sm-ink-500)', marginTop: 2 }}>
              3 ont accepté · le plus proche à 200 m
            </div>
          </div>
        </div>

        {/* Mini-map */}
        <div className="sm-card" style={{ overflow: 'hidden', marginBottom: 18, padding: 0 }}>
          <div style={{ height: 160, position: 'relative', background: '#E8E2D2' }}>
            {/* fake map: grid lines */}
            <svg viewBox="0 0 390 160" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <defs>
                <pattern id="mapgrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0L0 0L0 40" fill="none" stroke="#D2C8AE" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="390" height="160" fill="url(#mapgrid)" />
              <path d="M -20 110 C 60 80, 200 130, 320 60 L 410 100 L 410 160 L -20 160 Z" fill="#DCE7DA" opacity="0.6" />
              <path d="M 0 80 C 80 60, 180 100, 280 70 L 410 90" fill="none" stroke="#A8B6C5" strokeWidth="3" />
              <path d="M 30 30 C 100 50, 180 30, 240 50" fill="none" stroke="#A8B6C5" strokeWidth="2" strokeDasharray="3 3" />
              {/* SAMU pin */}
              <g transform="translate(280 50)">
                <circle r="20" fill="rgba(229,57,53,0.18)" />
                <circle r="11" fill="var(--sm-red)" />
                <text y="4" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">S</text>
              </g>
              {/* User pin */}
              <g transform="translate(170 95)">
                <circle r="22" fill="rgba(74,144,194,0.18)" />
                <circle r="9" fill="var(--sm-blue)" stroke="white" strokeWidth="3" />
              </g>
              {/* Rescuer pins */}
              <g transform="translate(120 75)"><circle r="7" fill="var(--sm-green)" stroke="white" strokeWidth="2" /></g>
              <g transform="translate(200 60)"><circle r="7" fill="var(--sm-green)" stroke="white" strokeWidth="2" /></g>
              <g transform="translate(220 100)"><circle r="7" fill="var(--sm-green)" stroke="white" strokeWidth="2" /></g>
            </svg>
            <div style={{
              position: 'absolute', left: 10, bottom: 10,
              background: 'white', padding: '6px 10px', borderRadius: 999,
              fontSize: 11, fontWeight: 600,
              boxShadow: 'var(--shadow-1)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name="navigation" size={12} color="var(--sm-blue)" />
              ETA ambulance · 4 min
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="sm-btn sm-btn-outline" style={{ flex: 1 }}>
            <Icon name="map" size={18} /> {T('view_map', lang)}
          </button>
          <button onClick={() => nav.home()} className="sm-btn sm-btn-outline-red" style={{ flex: 1 }}>
            <Icon name="x-circle" size={18} /> {T('cancel_all', lang)}
          </button>
        </div>
      </div>

      <HomeIndicator />
    </>
  );
}

Object.assign(window, { SOSCountdown, SOSConfirm });
