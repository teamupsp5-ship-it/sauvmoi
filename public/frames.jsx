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
  unavailableId: null, // id pour lequel ni onstart ni onerror ne s'est déclenché — voir speakText
  generation: 0, // incrémenté à chaque appel — annule un speakText resté en attente des voix si une action plus récente a pris la main
  _subs: new Set(),
  subscribe(fn) { this._subs.add(fn); return () => this._subs.delete(fn); },
  emit() { this._subs.forEach((fn) => { try { fn(); } catch {} }); },
};

// Nettoyage markdown → texte brut pour la synthèse vocale. Couvre tout ce que
// renderMarkdown/parseInlineMarkdown (screen-chat.jsx) affichent visuellement
// (gras, titres, listes à puces) plus les constructions markdown que Claude
// peut produire sans que l'app les rende visuellement à part (italique simple
// */_ , listes numérotées, citations, liens, barré, code, lignes
// horizontales) — sans ce complément, ces symboles étaient lus tels quels
// à voix haute même s'ils ne s'affichaient jamais littéralement à l'écran.
function stripMarkdownForSpeech(text) {
  return (text || '')
    // Blocs de code ``` ``` → dé-balise, garde le contenu
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''))
    // Lignes horizontales ---, ***, ___ (3+ caractères identiques seuls sur la ligne)
    .replace(/^([-*_])\1{2,}\s*$/gm, '')
    // Liens [texte](url) → texte seul (l'URL ne doit jamais être lue)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Gras **texte** / __texte__ (avant l'italique simple, sinon ** serait
    // déjà rompu en deux * isolés par le passage suivant)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Italique *texte* / _texte_
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    // Barré ~~texte~~
    .replace(/~~([^~]+)~~/g, '$1')
    // Titres # à ###### en début de ligne
    .replace(/^#{1,6}\s+/gm, '')
    // Listes à puces -, *, + en début de ligne (indentation éventuelle)
    .replace(/^[ \t]*[-*+]\s+/gm, '')
    // Listes numérotées "1. " / "1) " en début de ligne
    .replace(/^[ \t]*\d+[.)]\s+/gm, '')
    // Citations > en début de ligne
    .replace(/^>\s?/gm, '')
    // Code inline `texte` → texte seul
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n+/g, '. ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// speechSynthesis.getVoices() renvoie souvent un tableau vide au tout premier
// appel sur Android — les voix se chargent de façon asynchrone et ne sont
// listées qu'après l'événement 'voiceschanged'. Sans l'attendre, speak()
// peut échouer silencieusement (aucune voix disponible pour l'utterance).
// Timeout de sécurité : certains appareils ne déclenchent jamais cet
// événement (le navigateur a déjà ses voix, ou au contraire n'en aura
// jamais) — on ne bloque pas la lecture indéfiniment pour autant.
function waitForVoices(timeoutMs = 2000) {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) { resolve([]); return; }
    const existing = synth.getVoices();
    if (existing && existing.length > 0) { resolve(existing); return; }
    console.log('[speech] getVoices() vide au premier appel, attente de "voiceschanged"…');
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      synth.onvoiceschanged = null;
      console.warn(`[speech] timeout (${timeoutMs}ms) en attente des voix — poursuite sans confirmation`);
      resolve(synth.getVoices());
    }, timeoutMs);
    synth.onvoiceschanged = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      synth.onvoiceschanged = null;
      console.log(`[speech] "voiceschanged" reçu — ${synth.getVoices().length} voix disponibles`);
      resolve(synth.getVoices());
    };
  });
}

// id : identifiant de ce qui parle (index de message, 'voice-live', ...) —
// permet à deux boutons différents de savoir s'ils sont celui en cours de
// lecture. Un second appel avec le même id qui est déjà actif arrête la
// lecture au lieu d'en relancer une (comportement "toggle").
async function speakText(id, text, lang, onEnd) {
  const synth = window.speechSynthesis;
  const wasActive = window.SM_SPEECH.activeId === id;
  if (synth) synth.cancel();
  window.SM_SPEECH.activeId = null;
  window.SM_SPEECH.activeUtterance = null;
  window.SM_SPEECH.unavailableId = null;
  const myGeneration = ++window.SM_SPEECH.generation;
  window.SM_SPEECH.emit();
  if (!synth || wasActive) {
    console.log(`[speech] ${!synth ? 'speechSynthesis indisponible' : 'toggle : lecture déjà active, arrêt'} (id=${id})`);
    onEnd && onEnd();
    return;
  }

  const clean = stripMarkdownForSpeech(text);
  if (!clean) { onEnd && onEnd(); return; }

  console.log(`[speech] démarrage synthèse (id=${id}, ${clean.length} caractères)`);
  await waitForVoices();

  // Une action plus récente (nouveau speakText, stopSpeech) a pris la main
  // pendant l'attente des voix — ne pas démarrer une lecture obsolète.
  if (window.SM_SPEECH.generation !== myGeneration) {
    console.log(`[speech] lecture annulée (id=${id}) — obsolète après l'attente des voix`);
    onEnd && onEnd();
    return;
  }

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

  let started = false;
  const finish = (reason) => {
    console.log(`[speech] fin de synthèse (id=${id}, ${reason})`);
    if (window.SM_SPEECH.activeId === id) {
      window.SM_SPEECH.activeId = null;
      window.SM_SPEECH.activeUtterance = null;
      window.SM_SPEECH.emit();
    }
    onEnd && onEnd();
  };
  utter.onstart = () => {
    started = true;
    if (window.SM_SPEECH.unavailableId === id) { window.SM_SPEECH.unavailableId = null; window.SM_SPEECH.emit(); }
    console.log(`[speech] onstart (id=${id})`);
  };
  utter.onend = () => finish('onend');
  utter.onerror = (e) => { console.warn(`[speech] onerror (id=${id})`, e.error); finish('onerror: ' + e.error); };
  console.log(`[speech] speak() appelé (id=${id}, ${synth.getVoices().length} voix disponibles)`);
  synth.speak(utter);

  // Silence complet : ni onstart ni onerror ne s'est déclenché — la synthèse
  // vocale est probablement indisponible sur cet appareil (observé sur
  // certains WebView/navigateurs). Le signaler plutôt que de rester
  // silencieux sans que l'utilisateur comprenne pourquoi rien ne se passe.
  setTimeout(() => {
    if (!started && window.SM_SPEECH.activeId === id) {
      console.warn(`[speech] aucun onstart/onerror après 3s (id=${id}) — synthèse vocale probablement indisponible sur cet appareil`);
      window.SM_SPEECH.unavailableId = id;
      window.SM_SPEECH.emit();
    }
  }, 3000);
}
function stopSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  window.SM_SPEECH.activeId = null;
  window.SM_SPEECH.activeUtterance = null;
  window.SM_SPEECH.unavailableId = null;
  window.SM_SPEECH.generation++;
  window.SM_SPEECH.emit();
}
function useSpeechActive(id) {
  const [, force] = useState(0);
  useEffect(() => window.SM_SPEECH.subscribe(() => force((n) => n + 1)), []);
  return window.SM_SPEECH.activeId === id;
}
// true si une lecture démarrée pour cet id n'a déclenché aucun événement
// (onstart/onerror) dans les 3s — voir le watchdog dans speakText.
function useSpeechUnavailable(id) {
  const [, force] = useState(0);
  useEffect(() => window.SM_SPEECH.subscribe(() => force((n) => n + 1)), []);
  return window.SM_SPEECH.unavailableId === id;
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

// ── Sexe : valeur stockée (FR, envoyée au backend) vs libellé affiché ──────
// Le formulaire d'inscription et l'écran profil envoient/relisent 'Masculin'
// /'Féminin'/'Autre' tels quels côté backend (valeur canonique, indépendante
// de la langue d'interface active au moment de la saisie) — seul l'AFFICHAGE
// se traduit, via cette fonction, pour ne jamais faire dépendre les données
// stockées de la langue choisie ce jour-là.
function genderLabel(value) {
  if (value === 'Masculin') return t('auth.gender_male');
  if (value === 'Féminin') return t('auth.gender_female');
  if (value === 'Autre') return t('auth.gender_other');
  return value;
}

// Même principe que genderLabel : la difficulté d'un module de formation
// reste stockée/comparée en canonique FR (clé de DIFF_STYLES_T/DIFF_MODULE
// pour les couleurs), seul le libellé affiché est traduit.
function difficultyLabel(value) {
  if (value === 'Facile') return t('common.difficulty_easy');
  if (value === 'Moyen') return t('common.difficulty_medium');
  if (value === 'Difficile') return t('common.difficulty_hard');
  if (value === 'Très difficile') return t('common.difficulty_very_hard');
  return value;
}

function BirthdateField({ value, onChange, label, labelStyle, inputStyle, boxStyle, toggleColor = 'var(--sm-blue)' }) {
  const tr = useTranslation();
  const lbl = label !== undefined ? label : tr('common.birthdate_label');
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
    if (!iso) { setError(tr('common.date_invalid')); onChange(''); }
    else { setError(''); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {lbl && (
          <label style={labelStyle || { fontSize: 13, fontWeight: 600, color: 'var(--sm-ink-700)' }}>
            {lbl}
          </label>
        )}
        <button
          type="button"
          onClick={toggleMode}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: toggleColor, fontFamily: 'inherit' }}
        >
          {mode === 'calendar' ? tr('common.date_input_switch_to_text') : tr('common.date_input_switch_to_calendar')}
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
            placeholder={tr('common.date_placeholder')}
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
// En mode sombre, le texte d'origine (choisi très sombre pour un contraste
// maximal sur le fond pastel clair) tombe sous 2:1 de contraste une fois ce
// même fond assombri (les deux deviennent sombres) — vérifié par calcul
// WCAG. `accent` reste identique aux deux thèmes (demande explicite : les
// couleurs d'accent restent globalement similaires), seuls `bg`/`text`
// changent. Contrastes texte/fond en sombre vérifiés ≥ 6.4:1.
const BANNER_VARIANTS_DARK = {
  success: { bg: '#1C2E16', accent: '#27AE60', text: '#8FDB7A' },
  warning: { bg: '#332B18', accent: '#E67E22', text: '#F2B24A' },
  danger:  { bg: '#3B211F', accent: '#C0392B', text: '#FF8A7A' },
  info:    { bg: '#16232E', accent: '#1565C0', text: '#7FBBF5' },
};

function Banner({ variant = 'info', icon, title, text, stacked = false, children, style }) {
  const theme = useTheme();
  const palette = theme === 'dark' ? BANNER_VARIANTS_DARK : BANNER_VARIANTS;
  const c = palette[variant] || palette.info;
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
        {stacked ? (
          // Titre + description sur deux lignes distinctes — pour un contenu
          // assez long pour que l'enchaînement inline (titre gras suivi du
          // texte dans la même phrase) rende les deux illisibles l'un dans
          // l'autre (ex : Conseil du jour).
          <>
            {title && <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>}
            {text && <div style={{ fontWeight: 400 }}>{text}</div>}
            {children}
          </>
        ) : (
          <>
            {title && <strong style={{ fontWeight: 700 }}>{title} </strong>}
            {text}
            {children}
          </>
        )}
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

// ── Image avec fond de secours en couleur unie ─────────────────────────────
// Réutilisée partout où une photo réelle illustre une carte/un en-tête
// (Conseil du jour, vignette + en-tête de module de formation) : la couleur
// de fond reste visible tant que l'image n'a pas fini de charger (fondu à
// l'apparition, pas de flash blanc) et RESTE affichée si l'image échoue
// (réseau coupé, URL cassée) — jamais d'icône "image cassée" à la place.
function FallbackImage({ src, alt = '', fallbackColor = 'var(--sm-paper-2)', style, imgStyle }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: fallbackColor, ...style }}>
      {!failed && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: loaded ? 1 : 0,
            transition: 'opacity 250ms ease',
            ...imgStyle,
          }}
        />
      )}
    </div>
  );
}

// Bandeau compact "déclaré, non vérifié" — appliqué à chaque donnée médicale
// saisie par l'utilisateur sans aucun contrôle (groupe sanguin, allergies,
// antécédents), partout où elle est affichée : fiche victime après scan QR
// (screen-victim-card.jsx) ET récapitulatif du propriétaire sur son propre
// écran QR (screen-qr-code.jsx) — un secouriste doit pouvoir distinguer une
// donnée déclarée d'une donnée vérifiée avant d'agir dessus, quel que soit
// l'écran. Volontairement lisible (texte bilingue via t(), icône, couleur
// d'alerte) plutôt qu'un astérisque discret — c'est une information de
// sécurité, pas un détail cosmétique. Définie ici (primitives partagées)
// plutôt que dans un seul des deux écrans, pour éviter la duplication.
function DeclaredNotVerifiedNote({ t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
      <Icon name="info" size={13} color="#92400E" />
      <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>
        {t('victim.declared_not_verified')}
      </span>
    </div>
  );
}

// Justificatif de groupe sanguin (lot 8) — même principe que
// DeclaredNotVerifiedNote ci-dessus (icône + texte en toutes lettres, jamais
// la couleur seule) mais à TROIS états au lieu d'un seul, spécifique au
// groupe sanguin (seule donnée avec un justificatif attachable — allergies
// et antécédents restent sur DeclaredNotVerifiedNote, inchangé) :
//   - "declared" (aucun justificatif)      → ambre, comme avant
//   - "pending"  (justificatif fourni)     → ORANGE — un ajout de fichier
//     n'est jamais une validation, ce statut ne doit jamais ressembler à un
//     succès
//   - "verified" (validé par un médecin)   → VERT — inatteignable par
//     aucune route existante aujourd'hui, voir routes/api.js
// Partagée par screen-qr-code.jsx (propre récapitulatif) et
// screen-victim-card.jsx (fiche après scan), même composant plutôt que deux
// implémentations locales.
function BloodTypeStatusNote({ t, status }) {
  const info = status === 'verified'
    ? { icon: 'shield-check', color: '#1B7A3D', textKey: 'victim.blood_type_verified' }
    : status === 'pending'
    ? { icon: 'clock', color: '#B7530A', textKey: 'victim.blood_type_pending' }
    : { icon: 'info', color: '#92400E', textKey: 'victim.declared_not_verified' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
      <Icon name={info.icon} size={13} color={info.color} />
      <span style={{ fontSize: 12, fontWeight: 600, color: info.color }}>
        {t(info.textKey)}
      </span>
    </div>
  );
}

// Formate une date (ISO YYYY-MM-DD ou timestamp) en toutes lettres dans la
// langue active ("16 mars 2027" / "March 16, 2027") — même formatage partout
// où une date est montrée à l'utilisateur (expiration du QR médical, fiche
// victime, date de naissance dans les infos personnelles) plutôt que la
// valeur ISO brute, qui n'a de sens que pour une machine (lot 7 : l'écran
// infos perso affichait "2026-09-16" alors que l'écran QR savait déjà
// formater "16 mars 2027").
function formatDate(value, lang) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Formate un âge (en jours entiers depuis la naissance) dans l'unité adaptée
// à sa magnitude — jamais un format qui suggère une précision ou une
// plausibilité qu'il n'a pas (lot 7 : un nourrisson né la veille affichait
// « 0 ans », arithmétiquement exact mais trompeur pour un secouriste pressé
// qui pourrait y lire un adulte). Quatre paliers, mêmes seuils que la
// version française de src/medical-card.js (deux implémentations parce que
// backend et frontend ne partagent pas de module dans ce projet sans
// bundler — voir CLAUDE.md) :
//   - 2 ans et plus            → années ("34 ans")
//   - 2 semaines à < 2 ans     → mois + semaines ("2 mois et 3 semaines")
//   - 1 à < 2 semaines         → semaines + jours ("1 semaine et 4 jours")
//   - moins d'1 semaine        → jours seuls ("3 jours")
// Une unité à zéro n'est jamais affichée à côté d'une autre (jamais
// "0 semaine et 3 jours") — filtré par .filter(Boolean) plutôt que par des
// branches séparées par palier, une seule logique pour tous les cas.
// Utilisée par screen-qr-code.jsx ET screen-victim-card.jsx (une seule
// fonction partagée, pas deux implémentations frontend distinctes).
function formatAge(ageDays, lang) {
  const isEn = lang === 'en';
  const years = Math.floor(ageDays / 365.25);
  if (years >= 2) return isEn ? `${years} years` : `${years} ans`;

  let parts;
  if (ageDays >= 14) {
    const months = Math.floor(ageDays / 30);
    const weeks = Math.floor((ageDays - months * 30) / 7);
    parts = isEn
      ? [months > 0 ? `${months} month${months > 1 ? 's' : ''}` : null, weeks > 0 ? `${weeks} week${weeks > 1 ? 's' : ''}` : null]
      : [months > 0 ? `${months} mois` : null, weeks > 0 ? `${weeks} semaine${weeks > 1 ? 's' : ''}` : null];
  } else if (ageDays >= 7) {
    const weeks = Math.floor(ageDays / 7);
    const days = ageDays - weeks * 7;
    parts = isEn
      ? [weeks > 0 ? `${weeks} week${weeks > 1 ? 's' : ''}` : null, days > 0 ? `${days} day${days > 1 ? 's' : ''}` : null]
      : [weeks > 0 ? `${weeks} semaine${weeks > 1 ? 's' : ''}` : null, days > 0 ? `${days} jour${days > 1 ? 's' : ''}` : null];
  } else {
    parts = [isEn ? `${ageDays} day${ageDays !== 1 ? 's' : ''}` : `${ageDays} jour${ageDays !== 1 ? 's' : ''}`];
  }
  return parts.filter(Boolean).join(isEn ? ' and ' : ' et ');
}

// Repli affiché tant que GET /api/emergency-numbers n'a pas répondu (ou s'il
// échoue) : recopie volontairement les valeurs actuelles de
// src/data/emergency-numbers.js (source unique, lot 7 — avant ce lot, SOS et
// le prompt IA affichaient deux numéros de police différents, 110 et 170).
// `tel:` n'a besoin d'aucun accès réseau : un écran SOS ne doit jamais
// attendre un aller-retour pour afficher un numéro qui compose très bien
// hors ligne — l'appel réseau ne fait que confirmer/corriger silencieusement
// si la source venait à changer. Si emergency-numbers.js change un jour,
// mettre ce repli à jour en même temps.
const EMERGENCY_NUMBERS_FALLBACK = { samu: '185', pompiers: '180', police: '110' };

// Hook partagé par tous les écrans qui affichent les numéros d'urgence (SOS,
// accueil, CGU, fiche victime) — un seul point d'implémentation plutôt que
// de dupliquer le repli + l'appel réseau dans chacun.
function useEmergencyNumbers() {
  const [nums, setNums] = useState(EMERGENCY_NUMBERS_FALLBACK);
  useEffect(() => { window.API.emergencyNumbers().then(setNums).catch(() => {}); }, []);
  return nums;
}

Object.assign(window, {
  Icon, useLucide, StatusBar, HomeIndicator, FloatingChatButton,
  PhoneFrame, DesktopFrame, TabBar, LangPill, PulseCircle, Waveform,
  IconTile, NumBadge, T, COPY, BirthdateField, Banner, FallbackImage,
  DeclaredNotVerifiedNote, BloodTypeStatusNote, EMERGENCY_NUMBERS_FALLBACK, useEmergencyNumbers, formatAge, formatDate,
  speakText, stopSpeech, useSpeechActive, useSpeechUnavailable, stripMarkdownForSpeech,
});
