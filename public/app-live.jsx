// app-live.jsx — point d'entrée de l'APPLICATION RÉELLE.
// Session persistante : lecture localStorage avant le premier render.

(function restoreSession() {
  try {
    const token = localStorage.getItem('sm_token');
    const user  = JSON.parse(localStorage.getItem('sm_user') || 'null');
    if (token && user) { window.SM.token = token; window.SM.user = user; }
  } catch {}
})();

const PHONE_SCREENS = {
  splash:           window.SplashScreen,
  auth:             window.AuthScreen,
  register:         window.RegisterScreen,
  home:             window.HomeMobile,
  qr_scanner:       window.QrScannerScreen,
  chat:             window.ChatListening,
  chat_response:    window.ChatListening,
  sos:              window.SOSCountdown,
  sos_confirm:      window.SOSConfirm,
  training:         window.TrainingMobile,
  training_module:  window.TrainingModuleScreen,
  map:              window.MapScreen,
  profile:          window.ProfileScreen,
  profile_personal: window.ProfilePersonal,
  profile_medical:  window.ProfileMedical,
  profile_contacts: window.ProfileContacts,
  qr_code:          window.QrCodeScreen,
  terms:            window.TermsScreen,
  victim_card:      window.VictimCardScreen,
};

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
  const initialScreen = 'splash';
  const navRef = React.useRef(null);

  React.useEffect(() => { applyTweaks(t); window.SM.bootstrap(); }, []);
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  // Refresh implicite (voir api-client.js req()) qui échoue en cours de
  // session — ex: refresh_token lui-même expiré/révoqué — met SM.sessionExpired
  // à true et vide déjà le localStorage. Ici on redirige proprement vers la
  // connexion dès que ça arrive, quel que soit l'écran affiché à ce moment.
  //
  // Pas de tableau de dépendances : useSM() renvoie toujours window.SM (même
  // référence, muté en place), donc [SM] ne changerait jamais aux yeux de
  // React et cet effet ne se redéclencherait qu'au montage. On le laisse
  // s'exécuter à chaque rendu — SM.sessionExpired étant repassé à false
  // immédiatement après lecture, le check reste sans effet la plupart du
  // temps (même pattern que useLucide() ailleurs dans l'app).
  React.useEffect(() => {
    if (SM.sessionExpired && navRef.current) {
      window.SM.sessionExpired = false;
      navRef.current.reset('auth');
    }
  });

  return (
    <div className="sm-live" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {SM.offline && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, background: '#7a1414', color: 'white', padding: '8px 14px', fontSize: 13, fontFamily: 'var(--font-ui, sans-serif)', textAlign: 'center' }}>
          Backend injoignable — mode hors-ligne actif.
        </div>
      )}
      <PhoneFrame
        initial={initialScreen}
        screens={PHONE_SCREENS}
        lang={t.lang}
        onNavReady={(nav) => { navRef.current = nav; }}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<LiveApp />);
setInterval(() => { if (window.lucide) window.lucide.createIcons(); }, 800);
