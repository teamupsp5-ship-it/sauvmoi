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

  // Scroll automatique vers le dernier message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text) {
    const msg = (text !== undefined ? text : input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    let result;
    try {
      result = await window.API.chat(msg, lang || 'FR', convId);
      if (result.conversationId) setConvId(result.conversationId);
      setOffline(false);
    } catch {
      result = _localFallback(msg);
      setOffline(true);
    }

    setMessages(prev => [...prev, {
      role: 'assistant',
      text: result.reply,
      actions: result.suggestedActions || [],
    }]);
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      send('Reconnaissance vocale non disponible — tapez votre message.');
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
      send(transcript);
    };
    try { rec.start(); } catch { setListening(false); }
  }

  function handleImage(e) {
    if (e.target.files && e.target.files[0]) {
      send('J\'envoie une photo de la situation.');
      e.target.value = '';
    }
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
          onClick={() => nav.go('emergency')}
          style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--sm-soft-red)', border: 'none', color: 'var(--sm-red)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}
        >
          <Icon name="shield-alert" size={13} color="var(--sm-red)" />
          Urgence
        </button>
      </div>

      {/* Zone messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((m, i) =>
          m.role === 'user'
            ? <ChatUserBubble key={i} text={m.text} />
            : <ChatAIBubble key={i} text={m.text} actions={m.actions} nav={nav} />
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

          {/* Bouton micro */}
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
    </div>
  );
}

const ChatResponse = ChatListening;

Object.assign(window, { ChatListening, ChatResponse });
