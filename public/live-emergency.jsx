// EmergencyGuide "vivant" — charge le protocole pertinent depuis le backend
// (selon le contexte : protocole détecté par le chat, sinon hémorragie par défaut).

function EmergencyGuide({ nav, lang }) {
  useLucide();
  const SM = window.useSM();
  const [step, setStep] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [proto, setProto] = useState(null);

  useEffect(() => {
    const id = (SM.chat && SM.chat.protocolRef) || 'hemo';
    window.API.protocol(id).then(setProto).catch(() => setProto(null));
  }, []);

  useEffect(() => {
    const i = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const STEPS = (proto && proto.steps) || [{ title: 'Chargement…', desc: '', icon: 'loader' }];
  const name = (proto && proto.name) || 'Premiers secours';
  const cur = STEPS[Math.min(step, STEPS.length - 1)];
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <>
      <div style={{ background: 'var(--sm-red)', color: 'white', paddingBottom: 14 }}>
        <StatusBar light />
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
          <button onClick={() => nav.home()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={20} color="white" />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>{name} · guidage</div>
            <div className="sm-serif sm-mono" style={{ fontSize: 28, lineHeight: 1, marginTop: 2, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{mm}:{ss}</div>
          </div>
          <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="volume-2" size={18} color="white" />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 16px', background: 'var(--sm-paper)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, marginRight: i < STEPS.length - 1 ? 6 : 0, background: i <= step ? 'var(--sm-red)' : 'var(--sm-line)' }} />
          ))}
        </div>

        <div className="sm-eyebrow" style={{ marginBottom: 6 }}>Étape {step + 1} / {STEPS.length}</div>

        <div className="sm-photo-placeholder" style={{ height: 170, borderRadius: 12, marginBottom: 18 }}>
          <Icon name={cur.icon || 'heart-pulse'} size={56} />
        </div>

        <h2 className="sm-serif" style={{ fontSize: 24, marginBottom: 10 }}>{cur.title}</h2>
        <p style={{ fontSize: 15, color: 'var(--sm-ink-700)', lineHeight: 1.5, marginBottom: 18 }}>{cur.desc}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: 'var(--sm-soft-blue)', color: 'var(--sm-blue)', marginBottom: 18 }}>
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

Object.assign(window, { EmergencyGuide });
