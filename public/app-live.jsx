// app-live.jsx — point d'entrée de l'APPLICATION RÉELLE (et non le design canvas).
// Affiche un seul téléphone plein écran, branché au backend.

const PHONE_SCREENS = {
  auth: window.AuthScreen,
  register: window.RegisterScreen,
  home: window.HomeMobile,
  qr_scanner: window.QrScannerScreen,
  emergency: window.EmergencyMobile,
  emergency_cam: window.EmergencyCamera,
  emergency_guide: window.EmergencyGuide,
  chat: window.ChatListening,
  chat_response: window.ChatListening,
  sos: window.SOSCountdown,
  sos_confirm: window.SOSConfirm,
  training: window.TrainingMobile,
  profile: ProfileMobileLive,
};

function ProfileMobileLive({ nav }) {
  useLucide();
  return (
    <>
      <StatusBar />
      <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 14 }}>
        <Icon name="construction" size={48} color="var(--sm-ink-400)" />
        <h2 className="sm-serif" style={{ fontSize: 22 }}>Profil & carnet médical</h2>
        <p style={{ fontSize: 14, color: 'var(--sm-ink-500)' }}>Déprioritisé pour cette V1 — focus sur les 5 écrans phares.</p>
        <button onClick={() => nav.home()} className="sm-btn sm-btn-outline">Revenir à l'accueil</button>
      </div>
      <TabBar active="profile" onNav={(id) => nav.reset(id === 'profile' ? 'home' : id)} onSOS={() => nav.go('sos')} />
      <HomeIndicator />
    </>
  );
}

function applyTweaks(t) {
  const root = document.documentElement;
  root.style.setProperty('--sm-accent', t.accent);
  const dens = { compacte: 14.5, standard: 16, confortable: 17.5 }[t.density] || 16;
  root.style.setProperty('--sm-density-fs', dens + 'px');
  root.style.setProperty('--sm-anim-play', t.animations !== 'sobres' ? 'running' : 'paused');
  document.body.classList.toggle('sm-dark', !!t.dark);
}

function LiveApp() {
  const t = window.TWEAK_DEFAULTS;
  const SM = window.useSM();
  React.useEffect(() => { applyTweaks(t); window.SM.bootstrap(); }, []);
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  return (
    <div className="sm-live" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {SM.offline && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, background: '#7a1414', color: 'white', padding: '8px 14px', fontSize: 13, fontFamily: 'var(--font-ui, sans-serif)', textAlign: 'center' }}>
          Backend injoignable — lancez <code>npm start</code> puis rechargez.
        </div>
      )}
      <PhoneFrame initial="auth" screens={PHONE_SCREENS} lang={t.lang} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<LiveApp />);
setInterval(() => { if (window.lucide) window.lucide.createIcons(); }, 800);
