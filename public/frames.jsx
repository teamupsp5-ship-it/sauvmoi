// Shared frames + primitives for Sauv'Moi prototype.
// PhoneFrame and DesktopFrame each manage their own sub-screen state.

const { useState, useEffect, useRef, useMemo } = React;

// ── Lecture à voix haute partagée (Speech Synthesis) ───────────────────────
// Un seul flux audio possible à la fois côté navigateur : coordination via un
// petit bus global façon window.SM, pour que démarrer une lecture coupe
// automatiquement celle en cours (bulle précédente, mode vocal, etc.) et que
// chaque bouton sache s'il est "actif" sans dupliquer d'état local.
window.SM_SPEECH = {
  activeId: null,
  activeUtterance: null, // garde une référence forte tant que ça parle — voir speakText
  _subs: new Set(),
  subscribe(fn) { this._subs.add(fn); return () => this._subs.delete(fn); },
  emit() { this._subs.forEach((fn) => { try { fn(); } catch {} }); },
};

function stripMarkdownForSpeech(text) {
  return (text || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/`/g, '')
    .replace(/\n+/g, '. ')
    .trim();
}

// id : identifiant de ce qui parle (index de message, 'voice-live', ...) —
// permet à deux boutons différents de savoir s'ils sont celui en cours de
// lecture. Un second appel avec le même id qui est déjà actif arrête la
// lecture au lieu d'en relancer une (comportement "toggle").
function speakText(id, text, lang, onEnd) {
  const synth = window.speechSynthesis;
  const wasActive = window.SM_SPEECH.activeId === id;
  if (synth) synth.cancel();
  window.SM_SPEECH.activeId = null;
  window.SM_SPEECH.activeUtterance = null;
  window.SM_SPEECH.emit();
  if (!synth || wasActive) { onEnd && onEnd(); return; }

  const clean = stripMarkdownForSpeech(text);
  if (!clean) { onEnd && onEnd(); return; }

  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = lang === 'EN' ? 'en-US' : 'fr-FR';
  window.SM_SPEECH.activeId = id;
  // Chrome a un bug documenté où une SpeechSynthesisUtterance sans référence
  // forte ailleurs peut être garbage-collectée en cours de lecture, ce qui
  // tue silencieusement onend — jamais rappelé, donc le mode vocal restait
  // bloqué en "speaking" sans jamais relancer l'écoute. La garder sur
  // SM_SPEECH tant qu'elle parle règle ça.
  window.SM_SPEECH.activeUtterance = utter;
  window.SM_SPEECH.emit();
  const finish = () => {
    if (window.SM_SPEECH.activeId === id) {
      window.SM_SPEECH.activeId = null;
      window.SM_SPEECH.activeUtterance = null;
      window.SM_SPEECH.emit();
    }
    onEnd && onEnd();
  };
  utter.onend = finish;
  utter.onerror = finish;
  synth.speak(utter);
}
function stopSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  window.SM_SPEECH.activeId = null;
  window.SM_SPEECH.activeUtterance = null;
  window.SM_SPEECH.emit();
}
function useSpeechActive(id) {
  const [, force] = useState(0);
  useEffect(() => window.SM_SPEECH.subscribe(() => force((n) => n + 1)), []);
  return window.SM_SPEECH.activeId === id;
}

// ── Lucide icon helper ────────────────────────────────────────────────────
function Icon({ name, size, color, strokeWidth = 1.75, style, className = '' }) {
  // lucide.createIcons() replaces the inner <i data-lucide> with a real <svg> node
  // directly in the DOM, outside React's reconciliation. If Icon rendered that <i>
  // as its own root, React would try to removeChild() a node lucide already swapped
  // out (crash: "the node to be removed is not a child of this node") the moment a
  // sibling reorder forces this Icon to unmount — e.g. StepsPhase's last-step button,
  // whose children flip from [text, Icon] to [Icon, text]. Wrapping in a stable <span>
  // keeps that swap confined to a subtree React never has to remove directly.
  const ref = useRef(null);
  const safeName = (typeof name === 'string' && name) ? name : 'circle';
  useEffect(() => {
    if (window.lucide && ref.current) {
      window.lucide.createIcons({ icons: window.lucide.icons, nameAttr: 'data-lucide', attrs: {} });
    }
  });
  const sz = size ? { width: size, height: size } : null;
  return (
    // key={safeName} on the OUTER span (not the <i>) forces a full remount of
    // this stable subtree whenever the icon name changes, handing lucide a
    // fresh un-converted <i data-lucide> each time — lucide only ever swaps
    // an <i> for an <svg> once, so without this a dynamic name change (e.g.
    // mic ↔ mic-off, pause ↔ play) silently keeps showing the first glyph.
    // Safe against the removeChild crash described above because the parent
    // only ever removes/adds the span itself, which lucide never touches.
    <span
      key={safeName}
      ref={ref}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color || 'currentColor',
        ...(sz || {}),
        ...style,
      }}
    >
      <i data-lucide={safeName} data-stroke-width={strokeWidth} style={sz ? { width: '100%', height: '100%' } : undefined} />
    </span>
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
function PhoneFrame({ initial = 'home', screens, lang = 'FR', onNavReady }) {
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

  // Optionnel : laisse un parent (app-live.jsx) récupérer `nav` pour piloter
  // la navigation depuis l'extérieur (ex: déconnexion forcée sur session
  // Supabase expirée). Ne rien passer = comportement inchangé (canvas.html).
  useEffect(() => { if (onNavReady) onNavReady(nav); }, [nav, onNavReady]);

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

// ── Phone tab bar (Accueil · SOS · Chat · Profil) ───────────────────────────
function TabBar({ active, onNav, onSOS }) {
  const tabs = [
    { id: 'home',      label: 'Accueil',  icon: 'home' },
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

// ── Bouton flottant d'accès rapide au Chat IA ──────────────────────────────
// Réutilisable sur les écrans principaux (voir CLAUDE.md pour la liste).
// ── Date de naissance : bascule calendrier / texte JJ/MM/AAAA ─────────────
// La valeur portée par le parent (`value`) reste toujours au format ISO
// YYYY-MM-DD (ou '' si vide/invalide) — seul l'affichage change selon le mode.
function isoToFRDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}
function frDateToISO(str) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str || '');
  if (!m) return null;
  const day = parseInt(m[1], 10), month = parseInt(m[2], 10), year = parseInt(m[3], 10);
  if (month < 1 || month > 12) return null;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return null;
  if (year < 1900 || year > new Date().getFullYear()) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function formatFRDateInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function BirthdateField({ value, onChange, label = 'Date de naissance', labelStyle, inputStyle, boxStyle, toggleColor = 'var(--sm-blue)' }) {
  const [mode, setMode] = useState('calendar');
  const [textValue, setTextValue] = useState(() => isoToFRDate(value));
  const [error, setError] = useState('');

  function toggleMode() {
    setError('');
    if (mode === 'calendar') {
      setTextValue(isoToFRDate(value));
      setMode('text');
    } else {
      setMode('calendar');
    }
  }

  function handleTextChange(e) {
    const formatted = formatFRDateInput(e.target.value);
    setTextValue(formatted);
    if (error) setError('');
    const iso = frDateToISO(formatted);
    if (iso) onChange(iso);
  }

  function handleTextBlur(e) {
    const current = e.target.value;
    if (!current) { onChange(''); setError(''); return; }
    const iso = frDateToISO(current);
    if (!iso) { setError('Date invalide (JJ/MM/AAAA)'); onChange(''); }
    else { setError(''); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {label && (
          <label style={labelStyle || { fontSize: 13, fontWeight: 600, color: 'var(--sm-ink-700)' }}>
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={toggleMode}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: toggleColor, fontFamily: 'inherit' }}
        >
          {mode === 'calendar' ? 'Saisir en texte' : 'Utiliser le calendrier'}
        </button>
      </div>
      <div style={boxStyle}>
        {mode === 'calendar' ? (
          <input
            type="date"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            style={inputStyle}
          />
        ) : (
          <input
            type="text"
            inputMode="numeric"
            placeholder="JJ/MM/AAAA"
            maxLength={10}
            value={textValue}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            style={inputStyle}
          />
        )}
      </div>
      {error && <span style={{ fontSize: 12, color: 'var(--sm-red)', fontFamily: 'var(--font-ui)' }}>{error}</span>}
    </div>
  );
}

// ── Bandeau/bannière réutilisable (succès, avertissement, erreur, info) ────
const BANNER_VARIANTS = {
  success: { bg: '#EAF3DE', accent: '#27AE60', text: '#145A32' },
  warning: { bg: '#FEF5E7', accent: '#E67E22', text: '#7E5109' },
  danger:  { bg: '#FDEDEC', accent: '#C0392B', text: '#641E16' },
  info:    { bg: '#EBF5FB', accent: '#1565C0', text: '#0D3B73' },
};

function Banner({ variant = 'info', icon, title, text, children, style }) {
  const c = BANNER_VARIANTS[variant] || BANNER_VARIANTS.info;
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      background: c.bg, borderRadius: 14, padding: '16px 16px 16px 20px',
      ...style,
    }}>
      {/* Barre d'accent collée au bord gauche — overflow:hidden sur le
          conteneur la découpe proprement selon les coins arrondis. */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 5, background: c.accent }} />
      {icon && (
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: c.accent + '26' /* ~15% opacité (0x26/0xFF) */,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={17} color={c.accent} strokeWidth={2} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.5, color: c.text, fontFamily: 'var(--font-ui)' }}>
        {title && <strong style={{ fontWeight: 700 }}>{title} </strong>}
        {text}
        {children}
      </div>
    </div>
  );
}

function FloatingChatButton({ nav }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={() => nav.go('chat')}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      aria-label="Ouvrir le chat IA"
      style={{
        // Mesuré : HomeTabBar fait ~91.2px de haut hors safe-area (headless
        // Chrome, safe-area nulle) — 92px arrondi laisse une petite marge.
        // env(safe-area-inset-bottom) s'ajoute par-dessus pour les appareils
        // avec barre d'accueil (HomeTabBar grandit d'autant via son propre
        // padding-bottom incluant la safe-area — voir styles.css) ; sans ce
        // calc(), le bouton restait figé à une distance fixe du bord de
        // l'écran et finissait par chevaucher l'onglet Profil sur ces
        // appareils, la tabbar étant devenue plus haute que lui.
        position: 'fixed', bottom: 'calc(92px + env(safe-area-inset-bottom, 0px))', right: 20, zIndex: 60,
        width: 52, height: 52, borderRadius: '50%', border: 'none',
        background: 'linear-gradient(135deg, var(--sm-red), var(--sm-red-press))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(229,57,53,0.4)',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.12s ease',
      }}
    >
      <Icon name="message-circle-heart" size={22} color="white" strokeWidth={2} />
    </button>
  );
}

Object.assign(window, {
  Icon, useLucide, StatusBar, HomeIndicator, FloatingChatButton,
  PhoneFrame, DesktopFrame, TabBar, LangPill, PulseCircle, Waveform,
  IconTile, NumBadge, T, COPY, BirthdateField, Banner,
  speakText, stopSpeech, useSpeechActive, stripMarkdownForSpeech,
});
