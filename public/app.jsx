// app.jsx — Sauv'Moi prototype root
// Assembles all screens onto a DesignCanvas, hosts Tweaks panel.

const ProfileMobile = ({ nav }) => {
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
};

// Screen registry: every PhoneFrame uses this whole map so any nav.go(id)
// from any screen works (cross-flow navigation feels real).
const PHONE_SCREENS = {
  auth:             AuthScreen,
  register:         RegisterScreen,
  home:             HomeMobile,
  qr_scanner:       QrScannerScreen,
  chat:             ChatListening,
  chat_response:    ChatResponse,
  sos:              SOSCountdown,
  sos_confirm:      SOSConfirm,
  training:         TrainingMobile,
  profile:          ProfileMobile,
};

const DESKTOP_SCREENS = {
  home:     HomeDesktop,
  chat:     ChatDesktop,
  training: TrainingDesktop,
  // Desktop fall-back for a nav target that only exists on mobile
  sos: HomeDesktop,
};

// ─── Tweak-aware wrapper ──────────────────────────────────────────────────
function applyTweaks(t) {
  const root = document.documentElement;
  // Accent color
  root.style.setProperty('--sm-accent', t.accent);
  // Density via font-size scale
  const dens = { compacte: 14.5, standard: 16, confortable: 17.5 }[t.density] || 16;
  root.style.setProperty('--sm-density-fs', dens + 'px');
  // Animations
  const animOn = t.animations !== 'sobres';
  root.style.setProperty('--sm-anim-play', animOn ? 'running' : 'paused');
  // Dark
  if (t.dark) document.body.classList.add('sm-dark');
  else document.body.classList.remove('sm-dark');
}

function App() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  React.useEffect(() => { applyTweaks(t); }, [t]);
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  // Apply accent color as global override of --sm-red where appropriate
  React.useEffect(() => {
    const id = '__sm-accent-style';
    let el = document.getElementById(id);
    if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
    // Only override the primary-CTA red on light accent options that aren't red,
    // so we don't recolor the emergency-critical UI. Subtle override of buttons,
    // halos and progress bars.
    el.textContent = t.accent === '#E53935' ? '' : `
      .sm-btn-primary { background: ${t.accent} !important; }
      .sm-btn-outline-red { border-color: ${t.accent} !important; color: ${t.accent} !important; }
    `;
  }, [t.accent]);

  return (
    <>
      <DesignCanvas>
        <DCSection id="auth" title="0 · Authentification" subtitle="Connexion OTP par SMS · inscription">
          <DCArtboard id="auth-login" label="0a · Connexion" width={390} height={844}>
            <PhoneFrame initial="auth" screens={PHONE_SCREENS} lang={t.lang} />
          </DCArtboard>
          <DCArtboard id="auth-register" label="0b · Inscription" width={390} height={844}>
            <PhoneFrame initial="register" screens={PHONE_SCREENS} lang={t.lang} />
          </DCArtboard>
        </DCSection>

        <DCSection id="home" title="1 · Accueil" subtitle="Voice-first hub · l'IA d'abord, l'urgence à un tap">
          <DCArtboard id="home-mobile" label="Mobile · 390 × 844" width={390} height={844}>
            <PhoneFrame initial="home" screens={PHONE_SCREENS} lang={t.lang} />
          </DCArtboard>
          <DCArtboard id="home-desktop" label="Desktop · 1440 × 900" width={1440} height={900}>
            <DesktopFrame initial="home" screens={DESKTOP_SCREENS} lang={t.lang} />
          </DCArtboard>
        </DCSection>

        <DCSection id="chat" title="2 · Chat IA médical" subtitle="Orbe vocal mains-libres · la voix avant l'écran">
          <DCArtboard id="chat-listen" label="3a · Écoute" width={390} height={844}>
            <PhoneFrame initial="chat" screens={PHONE_SCREENS} lang={t.lang} />
          </DCArtboard>
          <DCArtboard id="chat-resp" label="3b · Réponse IA" width={390} height={844}>
            <PhoneFrame initial="chat_response" screens={PHONE_SCREENS} lang={t.lang} />
          </DCArtboard>
          <DCArtboard id="chat-desktop" label="Desktop · conversation complète" width={1440} height={900}>
            <DesktopFrame initial="chat" screens={DESKTOP_SCREENS} lang={t.lang} />
          </DCArtboard>
        </DCSection>

        <DCSection id="sos" title="3 · SOS géolocalisé" subtitle="Compte à rebours annulable · faux positifs évités">
          <DCArtboard id="sos-count" label="4a · Compte à rebours" width={390} height={844}>
            <PhoneFrame initial="sos" screens={PHONE_SCREENS} lang={t.lang} />
          </DCArtboard>
          <DCArtboard id="sos-conf" label="4b · Aide en chemin" width={390} height={844}>
            <PhoneFrame initial="sos_confirm" screens={PHONE_SCREENS} lang={t.lang} />
          </DCArtboard>
        </DCSection>

        <DCSection id="training" title="4 · Formations & certifications" subtitle="Parcours gamifié style Duolingo · 5 min par jour">
          <DCArtboard id="train-mobile" label="Mobile · parcours zigzag" width={390} height={844}>
            <PhoneFrame initial="training" screens={PHONE_SCREENS} lang={t.lang} />
          </DCArtboard>
          <DCArtboard id="train-desktop" label="Desktop · catalogue" width={1440} height={900}>
            <DesktopFrame initial="training" screens={DESKTOP_SCREENS} lang={t.lang} />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks · Sauv'Moi">
        <TweakSection label="Apparence" />
        <TweakColor
          label="Couleur d'accent"
          value={t.accent}
          options={['#E53935', '#4A90C2', '#2E6B4F']}
          onChange={(v) => setTweak('accent', v)}
        />
        <TweakRadio
          label="Densité"
          value={t.density}
          options={['compacte', 'standard', 'confortable']}
          onChange={(v) => setTweak('density', v)}
        />
        <TweakRadio
          label="Animations"
          value={t.animations}
          options={['sobres', 'standard', 'riches']}
          onChange={(v) => setTweak('animations', v)}
        />
        <TweakSection label="Aperçu" />
        <TweakRadio
          label="Langue"
          value={t.lang}
          options={['FR', 'EN']}
          onChange={(v) => setTweak('lang', v)}
        />
        <TweakSection label="À propos" />
        <div style={{ fontSize: 11, color: 'rgba(41,38,27,.65)', lineHeight: 1.5 }}>
          Prototype hi-fi pour démo hackathon « L'IA et le service universel des télécommunications TIC ».
          5 écrans phares, mobile + desktop. Glissez le canvas, double-cliquez sur un cadre pour le plein écran.
        </div>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

// Re-create lucide icons after every render burst (some are mounted async)
setInterval(() => { if (window.lucide) window.lucide.createIcons(); }, 800);
