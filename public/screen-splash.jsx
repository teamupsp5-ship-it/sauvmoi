// screen-splash.jsx — Animation "Révélation Vitale"

function SplashScreen({ nav }) {
  const [phase, setPhase] = React.useState(0);
  const ecgRef = React.useRef(null);

  // Keyframes injectés une seule fois
  React.useEffect(() => {
    if (!document.getElementById('sm-splash-kf')) {
      const s = document.createElement('style');
      s.id = 'sm-splash-kf';
      s.textContent = `
        @keyframes sp-circle {
          from { transform: translate(-50%,-50%) scale(0); }
          to   { transform: translate(-50%,-50%) scale(1); }
        }
        @keyframes sp-logo {
          from { opacity:0; transform:scale(0.35); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes sp-fadein {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `;
      document.head.appendChild(s);
    }

    const t0 = setTimeout(() => setPhase(1), 1500);
    const t1 = setTimeout(() => setPhase(2), 2800);
    const t2 = setTimeout(() => setPhase(3), 4500);
    const t3 = setTimeout(() => {
      const target = (window.SM.token && window.SM.user) ? 'home' : 'auth';
      nav.reset(target);
    }, 6500);

    return () => [t0, t1, t2, t3].forEach(clearTimeout);
  }, []);

  // Déclenche le tracé ECG dès que le path est monté (phase 2)
  React.useEffect(() => {
    if (phase === 2 && ecgRef.current) {
      const len = ecgRef.current.getTotalLength();
      ecgRef.current.style.strokeDasharray = len;
      ecgRef.current.style.strokeDashoffset = len;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (ecgRef.current) {
          ecgRef.current.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)';
          ecgRef.current.style.strokeDashoffset = '0';
        }
      }));
    }
  }, [phase]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>

      {/* ── Fond rouge (base, phase 0) ── */}
      <div style={{ position: 'absolute', inset: 0, background: '#C0392B' }} />

      {/* ── Cercle blanc qui s'agrandit depuis le centre ── */}
      {phase === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: '200vmax', height: '200vmax',
          borderRadius: '50%', background: 'white',
          animation: 'sp-circle 1.5s cubic-bezier(0.4,0,0.2,1) forwards',
          pointerEvents: 'none',
        }} />
      )}

      {/* ── Fond blanc plein (phase 1+) ── */}
      {phase >= 1 && (
        <div style={{ position: 'absolute', inset: 0, background: 'white' }} />
      )}

      {/* ── Contenu centré ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>

        {/* Logo */}
        {phase >= 1 && (
          <img
            src="logo_1024.png"
            alt="Sauv'Moi"
            style={{
              width: 140, height: 140, objectFit: 'contain',
              opacity: 0,
              animation: 'sp-logo 0.9s cubic-bezier(0.34,1.3,0.64,1) forwards',
            }}
          />
        )}

        {/* Tracé ECG — dessiné de gauche à droite */}
        {phase >= 2 && (
          <svg
            width="280" height="60" viewBox="0 0 280 60"
            style={{ marginTop: 18, overflow: 'visible' }}
          >
            <path
              ref={ecgRef}
              d="M0,30 L35,30 L45,24 L52,30 L58,33 L65,3 L72,55 L80,30 L110,30 L118,20 L132,30 L280,30"
              fill="none"
              stroke="#C0392B"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Titre */}
        {phase >= 2 && (
          <h1 style={{
            margin: '18px 0 0', fontSize: 34, fontWeight: 700,
            color: '#0A1628', textAlign: 'center',
            fontFamily: "'Poppins', 'Public Sans', sans-serif",
            letterSpacing: '-0.02em',
            opacity: 0,
            animation: 'sp-fadein 0.8s ease 0.3s forwards',
          }}>
            Sauv'Moi
          </h1>
        )}

        {/* Sous-titre */}
        {phase >= 3 && (
          <p style={{
            marginTop: 8, fontSize: 14,
            color: '#5B6677', textAlign: 'center',
            fontFamily: "'Poppins', 'Public Sans', sans-serif",
            opacity: 0,
            animation: 'sp-fadein 0.9s ease forwards',
          }}>
            Premiers secours · partout · toujours
          </p>
        )}

      </div>
    </div>
  );
}

Object.assign(window, { SplashScreen });
