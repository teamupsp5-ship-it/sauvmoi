// screen-splash.jsx — Écran d'accueil animé avec logo

function SplashScreen({ nav }) {
  const [showTitle, setShowTitle] = React.useState(false);

  React.useEffect(() => {
    if (!document.getElementById('sm-splash-anim')) {
      const style = document.createElement('style');
      style.id = 'sm-splash-anim';
      style.textContent = `
        @keyframes sm-heartbeat {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
        @keyframes sm-fadein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    const t1 = setTimeout(() => setShowTitle(true), 1500);
    const t2 = setTimeout(() => {
      const target = (window.SM.token && window.SM.user) ? 'home' : 'auth';
      nav.reset(target);
    }, 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'white',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <img
        src="logo_1024.png"
        alt="Sauv'Moi"
        style={{
          width: 160, height: 160,
          objectFit: 'contain',
          animation: 'sm-heartbeat 0.6s ease-in-out 3',
        }}
      />
      {showTitle && (
        <div style={{ marginTop: 24, textAlign: 'center', animation: 'sm-fadein 0.5s ease forwards' }}>
          <h1 className="sm-serif" style={{ fontSize: 32, color: 'var(--sm-ink)', margin: 0, letterSpacing: '-0.01em' }}>
            Sauv'Moi
          </h1>
          <p style={{ fontSize: 14, color: 'var(--sm-ink-500)', marginTop: 6, fontFamily: 'var(--font-ui)' }}>
            Premiers secours · partout · toujours
          </p>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SplashScreen });
