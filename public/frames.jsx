// Shared frames + primitives for Sauv'Moi prototype.
// PhoneFrame and DesktopFrame each manage their own sub-screen state.

const { useState, useEffect, useRef, useMemo } = React;

// ── Lucide icon helper ────────────────────────────────────────────────────
function Icon({ name, size, color, strokeWidth = 1.75, style, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.lucide && ref.current) {
      // createIcons replaces <i data-lucide="..."> with the SVG
      window.lucide.createIcons({ icons: window.lucide.icons, nameAttr: 'data-lucide', attrs: {} });
    }
  });
  const sz = size ? { width: size, height: size } : null;
  return (
    <i
      ref={ref}
      data-lucide={name}
      data-stroke-width={strokeWidth}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color || 'currentColor',
        ...(sz || {}),
        ...style,
      }}
    />
  );
}

// Retour cohérent : dépile si possible, sinon revient à home
function goBack(nav) {
  nav.canBack() ? nav.back() : nav.reset('home');
}

// Render lucide on every paint (idempotent)
function useLucide(deps = []) {
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });
}

// ── iOS status bar — rendu nul sur app native (le vrai OS gère sa propre barre)
function StatusBar() { return null; }

// ── iOS bottom indicator — rendu nul sur Android (pas de home indicator)
function HomeIndicator() { return null; }

// ── Phone Frame ─────────────────────────────────────────────────────────
// Holds the current sub-screen for one device; renders the screen via
// the `screens` map.
function PhoneFrame({ initial = 'home', screens, lang = 'FR' }) {
  const [stack, setStack] = useState([initial]);
  const screenId = stack[stack.length - 1];

  const nav = useMemo(() => ({
    go: (id) => setStack(s => [...s, id]),
    replace: (id) => setStack(s => [...s.slice(0, -1), id]),
    back: () => setStack(s => s.length > 1 ? s.slice(0, -1) : s),
    home: () => setStack(['home']),
    reset: (id) => setStack([id]),
    current: screenId,
    canBack: () => stack.length > 1,
  }), [screenId, stack.length]);

  const ScreenComp = screens[screenId] || screens[initial];
  return (
    <div className="sm-frame sm-phone">
      <div className="sm-notch" />
      <div className="sm-screen">
        <ScreenComp nav={nav} lang={lang} />
      </div>
    </div>
  );
}

// ── Desktop Frame ─────────────────────────────────────────────────────────
function DesktopFrame({ initial = 'home', screens, lang = 'FR' }) {
  const [screenId, setScreenId] = useState(initial);
  const nav = useMemo(() => ({
    go: setScreenId,
    replace: setScreenId,
    back: () => setScreenId('home'),
    home: () => setScreenId('home'),
    reset: setScreenId,
    current: screenId,
  }), [screenId]);

  const ScreenComp = screens[screenId] || screens[initial];
  return (
    <div className="sm-frame sm-desktop">
      <div className="sm-desktop-chrome">
        <span className="sm-traffic r" /><span className="sm-traffic y" /><span className="sm-traffic g" />
        <div className="sm-url">app.sauvmoi.ci</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <ScreenComp nav={nav} lang={lang} />
      </div>
    </div>
  );
}

// ── Phone tab bar (Accueil · Urgence · SOS · Chat · Profil) ────────────────
function TabBar({ active, onNav, onSOS }) {
  const tabs = [
    { id: 'home',      label: 'Accueil',  icon: 'home' },
    { id: 'emergency', label: 'Urgence',  icon: 'shield-alert' },
    { id: 'sos',       label: 'SOS',      icon: 'siren', special: true },
    { id: 'chat',      label: 'Chat IA',  icon: 'sparkles' },
    { id: 'profile',   label: 'Profil',   icon: 'user' },
  ];
  return (
    <div className="sm-tabbar">
      {tabs.map(t => {
        const isActive = t.id === active;
        if (t.special) {
          return (
            <button key={t.id} className="sm-tab is-sos" onClick={() => (onSOS ? onSOS() : onNav(t.id))}>
              <div className="sm-tab-icon"><Icon name={t.icon} size={26} /></div>
              <span style={{ marginTop: 2, fontWeight: 600, color: 'var(--sm-red)' }}>{t.label}</span>
            </button>
          );
        }
        return (
          <button key={t.id} className={'sm-tab' + (isActive ? ' is-active' : '')} onClick={() => onNav(t.id)}>
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Language toggle pill (FR/EN simple bilingual) ─────────────────────────
function LangPill({ lang, onChange, dark }) {
  // For the prototype just FR / EN.
  return (
    <button
      onClick={() => onChange && onChange(lang === 'FR' ? 'EN' : 'FR')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 9px', borderRadius: 999,
        border: '1px solid ' + (dark ? 'rgba(255,255,255,.3)' : 'var(--sm-line)'),
        background: dark ? 'rgba(255,255,255,.08)' : 'transparent',
        color: dark ? 'white' : 'var(--sm-ink)',
        fontSize: 12, fontWeight: 600,
      }}
    >
      <Icon name="globe" size={14} />
      {lang}
    </button>
  );
}

// ── Translated copy helper ────────────────────────────────────────────────
// Lightweight FR/EN switch for a handful of strings, to demonstrate bilingual
const COPY = {
  hello: { FR: 'Bonjour Aïcha', EN: 'Hello Aïcha' },
  hello_short: { FR: 'Bonjour', EN: 'Hello' },
  whats_happening: { FR: 'Que se passe-t-il ?', EN: 'What is happening?' },
  whats_examples: { FR: '« Quelqu\'un saigne », « il s\'étouffe »…', EN: '"Someone is bleeding", "they\'re choking"…' },
  emergency_mode: { FR: 'Mode urgence', EN: 'Emergency mode' },
  ask_ai: { FR: 'Demander à l\'IA', EN: 'Ask the AI' },
  learn: { FR: 'Apprendre', EN: 'Learn' },
  my_qr: { FR: 'Mon QR', EN: 'My QR' },
  tip_of_day: { FR: 'Conseil du jour', EN: 'Tip of the day' },
  pls: { FR: 'Position latérale de sécurité', EN: 'Recovery position' },
  read_by: { FR: 'lu par 2 348 personnes', EN: 'read by 2,348 people' },
  speak: { FR: 'Dites ce qui arrive', EN: 'Say what is happening' },
  or_pick: { FR: '— ou choisissez —', EN: '— or pick —' },
  more: { FR: '+ 4 autres', EN: '+ 4 others' },
  hands_free: { FR: 'Mode mains-libres', EN: 'Hands-free mode' },
  ai_listening: { FR: 'L\'IA vous écoute… parlez normalement', EN: 'The AI is listening… speak normally' },
  ai_speaks: { FR: 'IA · parle', EN: 'AI · speaking' },
  ai_says: { FR: 'L\'IA dit :', EN: 'The AI says:' },
  sos_in: { FR: 'SOS dans', EN: 'SOS in' },
  seconds: { FR: 'secondes', EN: 'seconds' },
  sos_sending: { FR: 'Alerte SOS en cours d\'envoi', EN: 'Sending SOS alert' },
  cancel: { FR: 'Annuler', EN: 'Cancel' },
  help_coming: { FR: 'Aide en chemin', EN: 'Help is on the way' },
  sent_to: { FR: 'L\'alerte a été envoyée à 16 personnes', EN: 'Alert sent to 16 people' },
  view_map: { FR: 'Voir sur la carte', EN: 'View on map' },
  cancel_all: { FR: 'Tout annuler', EN: 'Cancel all' },
  resume: { FR: 'Reprendre', EN: 'Resume' },
};
function T(key, lang) { const m = COPY[key]; return m ? (m[lang] || m.FR) : key; }

// ── Concentric pulse halo (re-usable) ──────────────────────────────────────
function PulseCircle({ size = 130, color = 'var(--sm-red)', children, haloColor }) {
  const haloStyle = (delay) => ({
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: `2px solid ${haloColor || color}`,
    animation: 'sm-pulse-halo 2s var(--ease) infinite',
    animationDelay: delay + 's',
    pointerEvents: 'none',
  });
  return (
    <div style={{
      position: 'relative',
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={haloStyle(0)} />
      <div style={haloStyle(0.66)} />
      <div style={haloStyle(1.33)} />
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        background: color,
        boxShadow: '0 8px 28px rgba(229,57,53,.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white',
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Waveform animated bars ────────────────────────────────────────────────
function Waveform({ bars = 12, color = 'currentColor', height = 28, barWidth = 3 }) {
  return (
    <div className="sm-wave" style={{ color, height }}>
      {Array.from({ length: bars }).map((_, i) => {
        const delay = (i * 0.08) % 1.2;
        const baseHeight = 8 + (Math.sin(i * 1.7) * 0.5 + 0.5) * 14;
        return (
          <span key={i} className="sm-wave-bar" style={{
            width: barWidth,
            animationDelay: `-${delay}s`,
            height: baseHeight, // base; animation overrides
          }} />
        );
      })}
    </div>
  );
}

// ── Soft icon tile (used in quick-access grids) ──────────────────────────
function IconTile({ tint, icon, size = 24 }) {
  return (
    <div className={'sm-tint-' + tint} style={{
      width: 44, height: 44, borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name={icon} size={size} strokeWidth={1.9} />
    </div>
  );
}

// Round badge for step numbers, etc.
function NumBadge({ n, color = 'var(--sm-ink)', textColor = 'white' }) {
  return (
    <span style={{
      width: 24, height: 24, borderRadius: '50%',
      background: color, color: textColor,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700,
    }}>{n}</span>
  );
}

Object.assign(window, {
  Icon, useLucide, StatusBar, HomeIndicator,
  PhoneFrame, DesktopFrame, TabBar, LangPill, PulseCircle, Waveform,
  IconTile, NumBadge, T, COPY,
});
