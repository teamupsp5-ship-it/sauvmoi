// live-chat.jsx — Chat IA connecté au backend + fallback PSC1 local.
// Surcharge ChatListening et ChatResponse définis dans screen-chat.jsx.

// ── Protocoles PSC1 embarqués (fallback quand le backend est injoignable) ──
const _PSC1 = [
  {
    kw: ['saigne','sang','hémorragie','hémorragi','plaie','coupure','bless','blood','bleeding','cut','wound'],
    reply: 'Hémorragie. Restez calme.\n1. Appuyez fermement sur la plaie avec un linge propre.\n2. Maintenez la pression 10 min sans soulever.\n3. Surélevez le membre si possible.\nAppelez le SAMU 185.',
    actions: [
      { type: 'call', label: 'Appeler SAMU 185', number: '185' },
      { type: 'call', label: 'Pompiers 180', number: '180' },
    ],
  },
  {
    kw: ['étouffe','etouffe','avale de travers','gorge','heimlich','choke','choking'],
    reply: 'Étouffement. Agissez vite.\n1. Si la personne tousse : laissez-la tousser.\n2. Sinon : 5 claques fermes dans le dos.\n3. 5 compressions abdominales (Heimlich).\nAlternez et appelez le 185.',
    actions: [{ type: 'call', label: 'Appeler SAMU 185', number: '185' }],
  },
  {
    kw: ['inconscient','évanoui','evanouie','tombé','répond plus','ne répond','unconscious','passed out','fainted'],
    reply: 'Inconscience. Vite !\n1. Parlez fort, secouez les épaules.\n2. Vérifiez la respiration 10 secondes.\n3. Respire → Position Latérale de Sécurité.\n4. Ne respire pas → 185 + massage cardiaque.',
    actions: [{ type: 'call', label: 'Appeler SAMU 185', number: '185' }],
  },
  {
    kw: ['brûlé','brule','brûlure','feu','eau chaude','huile chaude','burn','burned','scald'],
    reply: 'Brûlure. Agissez immédiatement.\n1. Eau tiède (15-25 °C) pendant 15 min. Pas de glace.\n2. Retirez bijoux et vêtements (sauf ce qui colle).\n3. Couvrez d\'un linge propre humide.\nSi grave (large, profonde, visage) : appelez le 185.',
    actions: [
      { type: 'call', label: 'Appeler SAMU 185', number: '185' },
      { type: 'call', label: 'Pompiers 180', number: '180' },
    ],
  },
  {
    kw: ['avc','attaque cérébrale','visage tordu','paralysé','parle mal','stroke','face droop'],
    reply: 'AVC suspecté. Test V.I.T.E :\n• Visage : sourire asymétrique ?\n• Inertie : un bras retombe ?\n• Trouble de la parole : mots déformés ?\nSi oui → appelez le 185 IMMÉDIATEMENT. Notez l\'heure.',
    actions: [{ type: 'call', label: 'Appeler SAMU 185', number: '185' }],
  },
  {
    kw: ['cardiaque','cœur','coeur','douleur poitrine','thorax','heart attack','chest pain'],
    reply: 'Crise cardiaque suspectée.\n1. Mettez au repos, demi-assis, jambes pliées. Desserrez les vêtements.\n2. Appelez le 185 maintenant. Ne raccrochez pas.\n3. Si perd connaissance : massage cardiaque 100-120/min.',
    actions: [{ type: 'call', label: 'Appeler SAMU 185', number: '185' }],
  },
];

function _localFallback(text) {
  const t = (text || '').toLowerCase();
  for (const p of _PSC1) {
    if (p.kw.some((k) => t.includes(k))) {
      return { reply: p.reply, suggestedActions: p.actions, source: 'local' };
    }
  }
  return {
    reply: 'Je suis là pour vous aider. Décrivez brièvement ce qui se passe\n(ex. « quelqu\'un saigne », « il s\'étouffe », « elle ne répond plus »).\nEn cas d\'urgence vitale, appelez le 185 (SAMU) tout de suite.',
    suggestedActions: [{ type: 'call', label: 'Appeler SAMU 185', number: '185' }],
    source: 'local',
  };
}

// ── Overlay mode vocal continu ──────────────────────────────────────────────
const VOICE_STATE_META = {
  listening: { emoji: '🎙️', label: 'Je vous écoute', color: 'var(--sm-red)', icon: 'mic' },
  thinking:  { emoji: '💭', label: 'Je réfléchis',    color: 'var(--sm-blue)', icon: 'brain' },
  speaking:  { emoji: '🔊', label: 'Je réponds',      color: 'var(--sm-green)', icon: 'volume-2' },
  paused:    { emoji: '⏸️', label: 'En pause',         color: 'var(--sm-ink-400)', icon: 'pause' },
  error:     { emoji: '⚠️', label: 'Problème micro',   color: 'var(--sm-red)', icon: 'mic-off' },
};

function VoiceModeOverlay({ voiceState, voiceError, voiceInterim, voicePaused, lastAssistantText, lang, onTogglePause, onExit }) {
  useLucide();
  const meta = VOICE_STATE_META[voiceState] || VOICE_STATE_META.listening;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', gap: 22, overflowY: 'auto',
      background: 'linear-gradient(180deg, #F7F9FC, #EEF3FA)',
    }}>
      <PulseCircle size={140} color={meta.color} haloColor={meta.color}>
        <Icon name={meta.icon} size={44} color="white" />
      </PulseCircle>

      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--sm-ink)' }}>
          {meta.emoji} {meta.label}
        </div>

        {voiceState === 'listening' && voiceInterim && (
          <div style={{ fontSize: 14, color: 'var(--sm-ink-500)', marginTop: 10, maxWidth: 280, lineHeight: 1.5, marginLeft: 'auto', marginRight: 'auto' }}>
            « {voiceInterim} »
          </div>
        )}

        {voiceState === 'error' && voiceError && (
          <div style={{ fontSize: 13, color: 'var(--sm-red)', marginTop: 10, maxWidth: 280, lineHeight: 1.5, marginLeft: 'auto', marginRight: 'auto' }}>
            {voiceError}
          </div>
        )}

        {/* Dernière réponse IA — même composant de bulle qu'en mode texte, avec
            son propre bouton "lire à voix haute" (id partagé 'voice-live' avec
            la lecture automatique : cliquer dessus coupe la lecture en cours). */}
        {lastAssistantText && voiceState !== 'error' && (voiceState === 'speaking' || voiceState === 'paused') && (
          <div style={{ textAlign: 'left', marginTop: 16, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            <ChatAIBubble id="voice-live" lang={lang} text={lastAssistantText} actions={[]} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
        {voiceState !== 'error' && (
          <button
            onClick={onTogglePause}
            title={voicePaused ? 'Reprendre' : 'Mettre en pause'}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'white', border: '1.5px solid var(--sm-line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: 'var(--sm-shadow)',
            }}
          >
            <Icon name={voicePaused ? 'play' : 'pause'} size={20} color="var(--sm-ink)" />
          </button>
        )}

        <button
          onClick={onExit}
          style={{
            padding: '0 22px', height: 52, borderRadius: 26,
            background: 'var(--sm-ink)', color: 'white', border: 'none',
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
          }}
        >
          <Icon name="x" size={17} color="white" />
          Quitter le mode vocal
        </button>
      </div>

      {voiceState === 'error' && (
        <p style={{ fontSize: 12, color: 'var(--sm-ink-400)', textAlign: 'center', maxWidth: 260 }}>
          Utilisez le mode texte classique pour continuer la conversation.
        </p>
      )}
    </div>
  );
}

// ── Écran chat live ────────────────────────────────────────────────────────
function ChatListening({ nav, lang }) {
  useLucide();
  const fileRef = useRef(null);
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'Bonjour ! Je suis votre assistant de premiers secours. Décrivez ce qui se passe, je vous guide.',
    actions: [],
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [convId, setConvId] = useState(null);
  const [offline, setOffline] = useState(false);

  // ── Mode vocal continu ────────────────────────────────────────────────────
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState('listening'); // listening | thinking | speaking | paused | error
  const [voiceError, setVoiceError] = useState('');
  const [voiceInterim, setVoiceInterim] = useState('');
  const [voicePaused, setVoicePaused] = useState(false);
  const [lastAssistantText, setLastAssistantText] = useState('');

  const voiceRecRef = useRef(null);
  const voiceModeRef = useRef(false);
  const voicePausedRef = useRef(false);
  const voiceFatalRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef('');
  const speechWatchdogRef = useRef(null);

  // Scroll automatique vers le dernier message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Coupe proprement le micro/la voix si l'écran est démonté en plein mode vocal.
  useEffect(() => () => {
    voiceModeRef.current = false;
    clearTimeout(silenceTimerRef.current);
    clearTimeout(speechWatchdogRef.current);
    try { voiceRecRef.current && voiceRecRef.current.stop(); } catch {}
    stopSpeech();
  }, []);

  async function send(text, imageUrl) {
    const msg = (text !== undefined ? text : input).trim();
    if (!msg || loading) return null;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg, image: imageUrl }]);
    setLoading(true);

    let result;
    try {
      result = await window.API.chat(msg, lang || 'FR', convId);
      if (result.conversationId) setConvId(result.conversationId);
      setOffline(false);
    } catch (err) {
      if (err && err.isNetworkError) {
        // Vraie panne réseau (hors-ligne) : protocoles PSC1 embarqués côté client.
        result = _localFallback(msg);
        setOffline(true);
      } else {
        // Le serveur a répondu mais en erreur — ce n'est pas du hors-ligne,
        // ne pas prétendre le contraire avec le fallback local.
        result = {
          reply: 'Une erreur est survenue côté serveur. Réessayez dans un instant.\nEn cas d\'urgence vitale, appelez directement le 185 (SAMU).',
          suggestedActions: [{ type: 'call', label: 'Appeler SAMU 185', number: '185' }],
          source: 'error',
        };
        setOffline(false);
      }
    }

    setMessages(prev => [...prev, {
      role: 'assistant',
      text: result.reply,
      actions: result.suggestedActions || [],
    }]);
    setLoading(false);
    setLastAssistantText(result.reply);
    return result;
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  // Saisie vocale ponctuelle : ne fait que remplir le champ de texte — c'est
  // toujours le bouton d'envoi qui déclenche l'envoi, comme au clavier.
  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setInput('Reconnaissance vocale non disponible — tapez votre message.');
      return;
    }
    const rec = new SR();
    rec.lang = lang === 'EN' ? 'en-US' : 'fr-FR';
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    try { rec.start(); } catch { setListening(false); }
  }

  // ── Mode vocal continu : écoute → envoi → lecture → écoute… ───────────────
  function startVoiceListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceState('error');
      setVoiceError('Reconnaissance vocale non supportée par ce navigateur.');
      return;
    }
    voiceFatalRef.current = false;
    transcriptRef.current = '';
    setVoiceInterim('');

    const rec = new SR();
    voiceRecRef.current = rec;
    rec.lang = lang === 'EN' ? 'en-US' : 'fr-FR';
    rec.continuous = true;
    rec.interimResults = true;

    const resetSilenceTimer = (delay) => {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => { try { rec.stop(); } catch {} }, delay || 1500);
    };

    rec.onstart = () => { setVoiceState('listening'); resetSilenceTimer(); };
    rec.onresult = (e) => {
      let finalChunk = '', interimChunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalChunk += e.results[i][0].transcript;
        else interimChunk += e.results[i][0].transcript;
      }
      if (finalChunk) transcriptRef.current += finalChunk;
      setVoiceInterim((transcriptRef.current + interimChunk).trim());
      resetSilenceTimer();
    };
    // Signal complémentaire de fin de phrase — laisse une courte marge pour
    // qu'un résultat final en cours d'arrivée soit bien pris en compte.
    rec.onspeechend = () => resetSilenceTimer(400);
    rec.onerror = (e) => {
      clearTimeout(silenceTimerRef.current);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        voiceFatalRef.current = true;
        setVoiceState('error');
        setVoiceError("Micro refusé — autorisez l'accès au micro dans les réglages du navigateur, ou utilisez le mode texte.");
      } else if (e.error === 'no-speech' || e.error === 'aborted') {
        // rien entendu, ou arrêt volontaire déclenché par le timer — silencieux, onend gère la suite
      } else {
        voiceFatalRef.current = true;
        setVoiceState('error');
        setVoiceError('Erreur du micro — utilisez le mode texte.');
      }
    };
    rec.onend = () => {
      clearTimeout(silenceTimerRef.current);
      if (!voiceModeRef.current || voicePausedRef.current || voiceFatalRef.current) return;
      const finalText = transcriptRef.current.trim();
      transcriptRef.current = '';
      setVoiceInterim('');
      if (finalText) handleVoiceUtterance(finalText);
      else startVoiceListening();
    };

    try { rec.start(); } catch {
      setVoiceState('error');
      setVoiceError('Impossible de démarrer le micro.');
    }
  }

  async function handleVoiceUtterance(text) {
    setVoiceState('thinking');
    const result = await send(text);
    if (!voiceModeRef.current || voicePausedRef.current) return;
    if (!result) { startVoiceListening(); return; }
    setVoiceState('speaking');

    // onEnd doit être appelé exactement une fois — soit par la vraie fin de
    // lecture (speakText), soit par le filet de sécurité ci-dessous si le
    // navigateur ne rappelle jamais onend (bug Chrome documenté : une
    // utterance sans référence forte peut être garbage-collectée en cours
    // de lecture, ce qui bloquait silencieusement le cycle en "speaking").
    let resumed = false;
    const resumeListening = () => {
      if (resumed) return;
      resumed = true;
      clearTimeout(speechWatchdogRef.current);
      if (!voiceModeRef.current || voicePausedRef.current) return;
      startVoiceListening();
    };

    const estimatedMs = Math.min(Math.max(result.reply.length * 70, 4000), 25000);
    speechWatchdogRef.current = setTimeout(resumeListening, estimatedMs);

    speakText('voice-live', result.reply, lang, resumeListening);
  }

  function enterVoiceMode() {
    setVoiceError('');
    setVoiceInterim('');
    setVoicePaused(false);
    voicePausedRef.current = false;
    voiceModeRef.current = true;
    setVoiceMode(true);
    startVoiceListening();
  }

  function exitVoiceMode() {
    voiceModeRef.current = false;
    voiceFatalRef.current = false;
    clearTimeout(silenceTimerRef.current);
    clearTimeout(speechWatchdogRef.current);
    try { voiceRecRef.current && voiceRecRef.current.stop(); } catch {}
    stopSpeech();
    setVoiceMode(false);
    setVoiceState('listening');
    setVoicePaused(false);
    setVoiceInterim('');
  }

  // Un seul clic suffit à interrompre le cycle en cours, quel que soit
  // l'état (écoute, réflexion, lecture) : coupe le micro, la voix, et le
  // filet de sécurité de reprise — voicePausedRef passe à true avant tout
  // le reste, donc même un onEnd qui arrive juste après ce clic ne relance
  // pas l'écoute (voir les gardes dans handleVoiceUtterance/startVoiceListening).
  function toggleVoicePause() {
    if (voicePaused) {
      voicePausedRef.current = false;
      setVoicePaused(false);
      startVoiceListening();
    } else {
      voicePausedRef.current = true;
      setVoicePaused(true);
      clearTimeout(silenceTimerRef.current);
      clearTimeout(speechWatchdogRef.current);
      try { voiceRecRef.current && voiceRecRef.current.stop(); } catch {}
      stopSpeech();
      setVoiceState('paused');
    }
  }

  function handleImage(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    // Pas d'analyse d'image côté app — la photo s'affiche dans la bulle pour
    // contexte visuel, mais c'est le message texte qui part vers l'IA. Le system
    // prompt lui demande de ne jamais prétendre diagnostiquer la photo et de
    // plutôt demander une description écrite.
    const previewUrl = URL.createObjectURL(file);
    send('Voici une photo de la situation.', previewUrl);
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--sm-paper)', display: 'flex', flexDirection: 'column' }}>

      {/* Bannière hors-ligne */}
      {offline && (
        <div style={{ background: '#92400e', color: 'white', padding: '5px 14px', fontSize: 12, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0 }}>
          <Icon name="wifi-off" size={12} color="white" />
          Mode hors-ligne — protocoles PSC1 locaux actifs
        </div>
      )}

      {/* En-tête */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px 10px',
        background: 'white',
        borderBottom: '1px solid var(--sm-line)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => nav.go('home')}
          style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sm-paper-2)', border: 'none', flexShrink: 0, cursor: 'pointer' }}
        >
          <Icon name="arrow-left" size={18} />
        </button>

        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--sm-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="sparkles" size={17} color="white" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Assistant Sauv'Moi</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: offline ? '#ef4444' : '#22c55e', transition: 'background 0.4s' }} />
            <span style={{ fontSize: 12, color: 'var(--sm-ink-500)' }}>
              {offline ? 'Hors ligne' : 'En ligne'}
            </span>
          </div>
        </div>

        <button
          onClick={enterVoiceMode}
          title="Mode vocal"
          style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sm-soft-blue)', border: 'none', flexShrink: 0, cursor: 'pointer' }}
        >
          <Icon name="headphones" size={17} color="var(--sm-blue)" />
        </button>

      </div>

      {voiceMode ? (
        <VoiceModeOverlay
          voiceState={voiceState}
          voiceError={voiceError}
          voiceInterim={voiceInterim}
          voicePaused={voicePaused}
          lastAssistantText={lastAssistantText}
          lang={lang}
          onTogglePause={toggleVoicePause}
          onExit={exitVoiceMode}
        />
      ) : (
        <>
          {/* Zone messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((m, i) =>
              m.role === 'user'
                ? <ChatUserBubble key={i} text={m.text} image={m.image} />
                : <ChatAIBubble key={i} id={i} lang={lang} text={m.text} actions={m.actions} />
            )}
            {loading && <ChatAIBubble loading />}
            <div ref={bottomRef} />
          </div>

          {/* Barre de saisie */}
          <div style={{ padding: '10px 12px 22px', borderTop: '1px solid var(--sm-line)', background: 'white', flexShrink: 0 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />

            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px',
              borderRadius: 24,
              border: '1.5px solid ' + (listening ? 'var(--sm-red)' : 'var(--sm-line)'),
              background: 'var(--sm-paper)',
              transition: 'border-color 0.2s',
            }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Décrivez la situation..."
                disabled={loading || listening}
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 15, fontFamily: 'inherit', padding: '2px 0',
                  color: 'var(--sm-ink)',
                }}
              />

              {/* Bouton image */}
              <button
                onClick={() => fileRef.current?.click()}
                title="Envoyer une image"
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--sm-paper-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
              >
                <Icon name="image" size={16} color="var(--sm-ink-400)" />
              </button>

              {/* Bouton micro — saisie vocale ponctuelle : remplit le champ, n'envoie pas */}
              <button
                onClick={startVoice}
                title={listening ? 'En écoute…' : 'Saisie vocale'}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: listening ? 'var(--sm-red)' : 'var(--sm-soft-red)',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, cursor: 'pointer', transition: 'background 0.2s',
                }}
              >
                <Icon name={listening ? 'mic-off' : 'mic'} size={16} color={listening ? 'white' : 'var(--sm-red)'} />
              </button>

              {/* Bouton envoyer */}
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading || listening}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: input.trim() && !loading && !listening ? 'var(--sm-blue)' : 'var(--sm-line)',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, cursor: input.trim() && !loading ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                }}
              >
                <Icon name="arrow-up" size={16} color="white" />
              </button>
            </div>

            <p style={{ fontSize: 11, color: 'var(--sm-ink-400)', textAlign: 'center', marginTop: 7 }}>
              Urgence vitale → 185 (SAMU) · 180 (pompiers) · 170 (police)
            </p>
          </div>
        </>
      )}
    </div>
  );
}

const ChatResponse = ChatListening;

Object.assign(window, { ChatListening, ChatResponse });
