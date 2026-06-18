// Screen 2 — Mode Urgence (mobile only)
// 2a: voice listening + emergency list
// 2b: camera viewfinder + AI detection bottom sheet
// 2c: guidance step-by-step (bonus, reached from 2b "Guidez-moi")

const EMERGENCY_LIST = [
  { id: 'hemo',   name: 'Hémorragie',     en: 'Bleeding',         icon: 'droplets',          tint: 'red' },
  { id: 'chok',   name: 'Étouffement',    en: 'Choking',          icon: 'wind',              tint: 'red' },
  { id: 'unc',    name: 'Inconscience',   en: 'Unconscious',      icon: 'user-x',            tint: 'red' },
  { id: 'burn',   name: 'Brûlure',        en: 'Burn',             icon: 'flame',             tint: 'orange' },
  { id: 'avc',    name: 'AVC',            en: 'Stroke',           icon: 'brain',             tint: 'violet' },
  { id: 'heart',  name: 'Crise cardiaque',en: 'Heart attack',     icon: 'heart-pulse',       tint: 'red' },
  { id: 'acc',    name: 'Accident',       en: 'Accident',         icon: 'car-front',         tint: 'orange' },
  { id: 'mal',    name: 'Malaise',        en: 'Faintness',        icon: 'thermometer',       tint: 'blue' },
  { id: 'conv',   name: 'Convulsion',     en: 'Seizure',          icon: 'zap',               tint: 'violet' },
];

function EmergencyMobile({ nav, lang }) {
  useLucide();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? EMERGENCY_LIST : EMERGENCY_LIST.slice(0, 5);
  return (
    <>
      <StatusBar />
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 0' }}>
        <button
          aria-label="Fermer"
          onClick={() => nav.back()}
          style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="x" size={22} color="var(--sm-ink-700)" />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sm-ink-700)' }}>
          {lang === 'EN' ? 'EN · CI' : 'FR · CI'}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 12px', display: 'flex', flexDirection: 'column' }}>
        {/* Voice hero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 0 8px' }}>
          <button onClick={() => nav.go('chat')} aria-label="Parler" style={{ position: 'relative', width: 130, height: 130 }}>
            <PulseCircle size={130}>
              <Icon name="mic" size={52} strokeWidth={2} />
            </PulseCircle>
          </button>
          <h2 className="sm-serif" style={{ fontSize: 24, marginTop: 22 }}>{T('speak', lang)}</h2>
          <p style={{ fontSize: 13, color: 'var(--sm-ink-500)', fontStyle: 'italic', marginTop: 4 }}>
            {lang === 'EN' ? '"Someone is bleeding", "burned baby"…' : '« Quelqu\'un saigne », « bébé brûlé »…'}
          </p>

          {/* Camera shortcut */}
          <button
            onClick={() => nav.go('emergency_cam')}
            className="sm-btn sm-btn-outline"
            style={{ marginTop: 18, padding: '10px 18px' }}
          >
            <Icon name="camera" size={18} />
            {lang === 'EN' ? 'Or film what you see' : 'Ou filmez ce que vous voyez'}
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 4px 14px', color: 'var(--sm-ink-500)' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--sm-line)' }} />
          <span style={{ fontSize: 12, letterSpacing: '0.04em' }}>{T('or_pick', lang)}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--sm-line)' }} />
        </div>

        {/* Emergency list */}
        <div className="sm-card-flat" style={{ overflow: 'hidden' }}>
          {visible.map((e, i) => (
            <button
              key={e.id}
              onClick={() => nav.go('emergency_guide')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px',
                borderBottom: i < visible.length - 1 ? '1px solid var(--sm-line-soft)' : 'none',
                background: 'white', textAlign: 'left',
              }}
            >
              <div className={'sm-tint-' + e.tint} style={{
                width: 38, height: 38, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={e.icon} size={20} strokeWidth={2} />
              </div>
              <span style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>{lang === 'EN' ? e.en : e.name}</span>
              <Icon name="chevron-right" size={18} color="var(--sm-ink-400)" />
            </button>
          ))}
        </div>

        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              alignSelf: 'center', marginTop: 12,
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 14, fontWeight: 500, color: 'var(--sm-ink-700)',
              padding: '8px 12px',
            }}
          >
            {T('more', lang)} <Icon name="chevron-down" size={16} />
          </button>
        )}
      </div>

      <TabBar active="emergency" onNav={(id) => nav.reset(id)} onSOS={() => nav.go('sos')} />
      <HomeIndicator />
    </>
  );
}

// ── 2b — Camera viewfinder ────────────────────────────────────────────────
function EmergencyCamera({ nav, lang }) {
  useLucide();
  const [showDetect, setShowDetect] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowDetect(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      color: 'white',
    }}>
      {/* Faux viewfinder background — gradient + noise feel */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 70% at 60% 35%, #2a2520 0%, #14110d 60%, #050505 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 8px)`,
      }} />
      {/* Suggestion of a forearm shape with faux wound */}
      <svg viewBox="0 0 390 600" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, opacity: 0.85 }}>
        <defs>
          <linearGradient id="skin" x1="0" x2="1">
            <stop offset="0" stopColor="#b08862" />
            <stop offset="1" stopColor="#6e4a30" />
          </linearGradient>
          <radialGradient id="wound" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#7a1414" />
            <stop offset="0.5" stopColor="#3d0808" />
            <stop offset="1" stopColor="#3d0808" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M -20 420 C 120 320, 240 360, 410 280 L 410 600 L -20 600 Z" fill="url(#skin)" opacity="0.85" />
        <ellipse cx="190" cy="330" rx="40" ry="22" fill="url(#wound)" />
      </svg>

      <StatusBar light />

      {/* Top chrome */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 0', zIndex: 5 }}>
        <button onClick={() => nav.back()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrow-left" size={20} color="white" />
        </button>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 999,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          fontSize: 12, fontWeight: 600, color: 'white',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sm-red)' }} className="sm-blink" />
          {lang === 'EN' ? 'Live analysis' : 'Analyse en direct'}
        </div>
        <button onClick={() => nav.back()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={20} color="white" />
        </button>
      </div>

      {/* Detection frame */}
      {showDetect && (
        <div style={{
          position: 'absolute',
          left: 90, top: 280, width: 200, height: 130,
          border: '2px dashed var(--sm-red)',
          borderRadius: 8,
          zIndex: 4,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.15) inset',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: -34,
            background: 'var(--sm-red)', color: 'white',
            padding: '4px 10px', borderRadius: 6,
            fontSize: 11, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 12px rgba(229,57,53,.4)',
          }}>
            <Icon name="target" size={12} />
            {lang === 'EN' ? 'Wound detected — bleeding' : 'Plaie détectée — hémorragie'}
          </div>
          {/* Corners */}
          {[
            { top: -2, left: -2, borderTop: '3px solid white', borderLeft: '3px solid white' },
            { top: -2, right: -2, borderTop: '3px solid white', borderRight: '3px solid white' },
            { bottom: -2, left: -2, borderBottom: '3px solid white', borderLeft: '3px solid white' },
            { bottom: -2, right: -2, borderBottom: '3px solid white', borderRight: '3px solid white' },
          ].map((s, i) => (
            <span key={i} style={{ position: 'absolute', width: 14, height: 14, ...s }} />
          ))}
        </div>
      )}

      {/* Bottom sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6 }}>
        <div style={{
          background: 'var(--sm-paper)',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          padding: '20px 22px 30px',
          color: 'var(--sm-ink)',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.25)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: -10, marginBottom: 14 }}>
            <span style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--sm-line)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'var(--sm-soft-blue)', color: 'var(--sm-blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="sparkles" size={14} strokeWidth={2} />
            </div>
            <span className="sm-eyebrow" style={{ color: 'var(--sm-blue)' }}>IA · 94 % certaine</span>
          </div>
          <h2 className="sm-serif" style={{ fontSize: 21, marginBottom: 6 }}>
            {lang === 'EN' ? 'Wound on arm · moderate bleeding' : 'Plaie au bras · hémorragie modérée'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--sm-ink-500)', marginBottom: 18 }}>
            {lang === 'EN'
              ? 'Apply firm pressure with a clean cloth. Lift the arm if possible.'
              : 'Appliquez une pression ferme avec un linge propre. Levez le bras si possible.'}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => nav.replace('emergency_guide')} className="sm-btn sm-btn-outline" style={{ flex: 1 }}>
              <Icon name="check" size={18} />
              {lang === 'EN' ? 'Confirm' : 'Confirmer'}
            </button>
            <button onClick={() => nav.replace('emergency_guide')} className="sm-btn sm-btn-primary" style={{ flex: 1.4 }}>
              <Icon name="hand" size={18} />
              {lang === 'EN' ? 'Guide me' : 'Guidez-moi'}
            </button>
          </div>
        </div>
        <HomeIndicator light />
      </div>
    </div>
  );
}

// ── 2c — Step-by-step guidance (bonus) ────────────────────────────────────
function EmergencyGuide({ nav, lang }) {
  useLucide();
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const STEPS = [
    { title: 'Appliquez une pression ferme', desc: 'Avec un linge propre, appuyez fortement sur la plaie. Ne retirez pas le linge même s\'il s\'imbibe.', icon: 'hand' },
    { title: 'Maintenez la pression 10 min', desc: 'Ne soulevez pas pour vérifier. Comptez avec le chronomètre. Parlez à la personne.', icon: 'timer' },
    { title: 'Surélevez le membre', desc: 'Si possible, levez le bras au-dessus du niveau du cœur pour ralentir le saignement.', icon: 'move-up' },
    { title: 'Appelez le SAMU 185', desc: 'L\'aide est en chemin. Restez calme et continuez la pression jusqu\'à leur arrivée.', icon: 'phone' },
  ];
  const cur = STEPS[step];
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <>
      {/* Red header with timer */}
      <div style={{ background: 'var(--sm-red)', color: 'white', paddingBottom: 14 }}>
        <StatusBar light />
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
          <button onClick={() => nav.home()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={20} color="white" />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>Hémorragie · guidage</div>
            <div className="sm-serif sm-mono" style={{ fontSize: 28, lineHeight: 1, marginTop: 2, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{mm}:{ss}</div>
          </div>
          <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="volume-2" size={18} color="white" />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 16px', background: 'var(--sm-paper)' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2, marginRight: i < STEPS.length - 1 ? 6 : 0,
              background: i <= step ? 'var(--sm-red)' : 'var(--sm-line)',
            }} />
          ))}
        </div>

        <div className="sm-eyebrow" style={{ marginBottom: 6 }}>Étape {step + 1} / {STEPS.length}</div>

        <div className="sm-photo-placeholder" style={{ height: 170, borderRadius: 12, marginBottom: 18 }}>
          <Icon name={cur.icon} size={56} />
        </div>

        <h2 className="sm-serif" style={{ fontSize: 24, marginBottom: 10 }}>{cur.title}</h2>
        <p style={{ fontSize: 15, color: 'var(--sm-ink-700)', lineHeight: 1.5, marginBottom: 18 }}>{cur.desc}</p>

        {/* AI voice prompt */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: 12, borderRadius: 10,
          background: 'var(--sm-soft-blue)', color: 'var(--sm-blue)',
          marginBottom: 18,
        }}>
          <Icon name="sparkles" size={16} />
          <span style={{ fontSize: 13, color: 'var(--sm-ink-700)', flex: 1 }}>L'IA vous parle en continu. Touchez pour relancer la voix.</span>
          <Waveform bars={6} height={20} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="sm-btn sm-btn-outline" style={{ flex: 1 }}>
              <Icon name="arrow-left" size={18} /> Précédent
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="sm-btn sm-btn-primary" style={{ flex: 1.4 }}>
              Étape suivante <Icon name="arrow-right" size={18} />
            </button>
          ) : (
            <button onClick={() => nav.replace('sos')} className="sm-btn sm-btn-primary" style={{ flex: 1.4 }}>
              <Icon name="phone" size={18} /> Appeler le SAMU
            </button>
          )}
        </div>
      </div>
      <HomeIndicator />
    </>
  );
}

Object.assign(window, { EmergencyMobile, EmergencyCamera, EmergencyGuide });
