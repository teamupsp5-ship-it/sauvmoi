// Screen Chat IA — version canvas (données statiques pour les artboards)
// La version live (live-chat.jsx) surcharge ChatListening et ChatResponse.

// ── Bulle utilisateur ──────────────────────────────────────────────────────
function ChatUserBubble({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{
        maxWidth: '78%',
        padding: '10px 14px',
        borderRadius: '18px 18px 4px 18px',
        background: 'var(--sm-blue)',
        color: 'white',
        fontSize: 15,
        lineHeight: 1.5,
      }}>
        {text}
      </div>
    </div>
  );
}

// ── Bulle IA ────────────────────────────────────────────────────────────────
function ChatAIBubble({ text, actions, loading, nav }) {
  useLucide();
  const lines = loading ? [] : (text || '').split('\n');
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: 'var(--sm-ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
      }}>
        <Icon name="sparkles" size={14} color="white" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          padding: '10px 14px',
          borderRadius: '4px 18px 18px 18px',
          background: 'white',
          border: '1px solid var(--sm-line)',
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--sm-ink)',
        }}>
          {loading
            ? <ChatTypingDots />
            : lines.map((line, i) => <span key={i}>{line}{i < lines.length - 1 ? <br /> : null}</span>)
          }
        </div>

        {!loading && actions && actions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {actions.map((a, i) =>
              a.type === 'call' ? (
                <a key={i} href={'tel:' + a.number} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 14px', borderRadius: 12,
                  background: 'var(--sm-soft-red)',
                  textDecoration: 'none', color: 'var(--sm-red)',
                }}>
                  <Icon name="phone" size={16} color="var(--sm-red)" />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</span>
                  <Icon name="arrow-right" size={13} color="var(--sm-red)" style={{ marginLeft: 'auto' }} />
                </a>
              ) : a.type === 'guide' && nav ? (
                <button key={i} onClick={() => nav.go('emergency_guide')} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 14px', borderRadius: 12,
                  background: 'var(--sm-soft-blue)',
                  border: 'none', color: 'var(--sm-blue)',
                  width: '100%', cursor: 'pointer',
                }}>
                  <Icon name="list-checks" size={16} color="var(--sm-blue)" />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</span>
                </button>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Indicateur de frappe ───────────────────────────────────────────────────
function ChatTypingDots() {
  const [frame, setFrame] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 3), 500);
    return () => clearInterval(id);
  }, []);
  const dots = ['·', '· ·', '· · ·'][frame];
  return (
    <span style={{ color: 'var(--sm-ink-400)', fontStyle: 'italic', letterSpacing: 2 }}>
      En train d'écrire {dots}
    </span>
  );
}

// ── Écran chat unifié (canvas — statique) ──────────────────────────────────
function ChatScreen({ nav, lang }) {
  useLucide();

  const demoMessages = [
    {
      role: 'assistant',
      text: 'Bonjour ! Je suis votre assistant de premiers secours. Décrivez ce qui se passe, je vous guide.',
      actions: [],
    },
    { role: 'user', text: 'Mon père est tombé et ne répond plus' },
    {
      role: 'assistant',
      text: 'Inconscience. Restez calme.\n1. Parlez fort, secouez doucement les épaules.\n2. Vérifiez la respiration : joue près de la bouche, 10 secondes.\n3. S\'il respire → Position Latérale de Sécurité.\n4. S\'il ne respire pas → appelez le 185 et commencez le massage cardiaque.',
      actions: [
        { type: 'call', label: 'Appeler SAMU 185', number: '185' },
      ],
    },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--sm-paper)', display: 'flex', flexDirection: 'column' }}>

      {/* En-tête */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px 10px',
        background: 'white',
        borderBottom: '1px solid var(--sm-line)',
      }}>
        <button
          onClick={() => goBack(nav)}
          style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sm-paper-2)', border: 'none', flexShrink: 0, cursor: 'pointer' }}
        >
          <Icon name="arrow-left" size={18} />
        </button>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: 'var(--sm-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon name="sparkles" size={17} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Assistant Sauv'Moi</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 12, color: 'var(--sm-ink-500)' }}>En ligne</span>
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
        {demoMessages.map((m, i) =>
          m.role === 'user'
            ? <ChatUserBubble key={i} text={m.text} />
            : <ChatAIBubble key={i} text={m.text} actions={m.actions} nav={nav} />
        )}
      </div>

      {/* Barre de saisie */}
      <div style={{ padding: '10px 12px 22px', borderTop: '1px solid var(--sm-line)', background: 'white' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px',
          borderRadius: 24,
          border: '1.5px solid var(--sm-line)',
          background: 'var(--sm-paper)',
        }}>
          <input
            placeholder="Décrivez la situation..."
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, fontFamily: 'inherit', padding: '2px 0' }}
          />
          <button style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--sm-paper-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="image" size={16} color="var(--sm-ink-400)" />
          </button>
          <button style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--sm-soft-red)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="mic" size={16} color="var(--sm-red)" />
          </button>
          <button style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--sm-blue)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

// ── Desktop artboard ────────────────────────────────────────────────────────
function ChatDesktop({ nav, lang }) {
  useLucide();

  return (
    <>
      {/* Sidebar conversations */}
      <aside style={{
        width: 280, background: 'var(--sm-paper-2)',
        borderRight: '1px solid var(--sm-line)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '20px 18px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--sm-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="life-buoy" size={18} color="var(--sm-paper)" />
          </div>
          <span className="sm-serif" style={{ fontSize: 19 }}>Sauv'Moi</span>
          <button onClick={() => nav.go('home')} style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--sm-line)' }}>
            <Icon name="arrow-left" size={14} />
          </button>
        </div>
        <div style={{ padding: '4px 14px 14px' }}>
          <button className="sm-btn sm-btn-ink" style={{ width: '100%', borderRadius: 8, padding: '10px 14px', fontSize: 14 }}>
            <Icon name="plus" size={16} /> Nouvelle conversation
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 14px' }}>
          {[
            { title: 'Inconscience · père', sub: 'il y a 2 min', active: true },
            { title: 'Brûlure légère · main', sub: 'il y a 1 h' },
            { title: 'Massage cardiaque · rythme', sub: 'hier 19:04' },
            { title: "Crise d'asthme — enfant", sub: 'lun. 16:48' },
          ].map((c, i) => (
            <button key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              width: '100%', padding: '8px 10px', borderRadius: 8,
              background: c.active ? 'white' : 'transparent',
              boxShadow: c.active ? 'var(--shadow-1)' : 'none',
              border: c.active ? '1px solid var(--sm-line)' : '1px solid transparent',
              textAlign: 'left', gap: 2, marginTop: i === 0 ? 10 : 2,
            }}>
              <span style={{ fontSize: 13, fontWeight: c.active ? 600 : 500 }}>{c.title}</span>
              <span style={{ fontSize: 11, color: 'var(--sm-ink-500)' }}>{c.sub}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: 14, borderTop: '1px solid var(--sm-line)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="sm-photo-placeholder" style={{ width: 32, height: 32, borderRadius: '50%' }}>
            <span style={{ position: 'relative', zIndex: 1, fontSize: 12, fontWeight: 600 }}>AK</span>
          </div>
          <div style={{ flex: 1, lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Aïcha Kouassi</div>
            <div style={{ fontSize: 11, color: 'var(--sm-ink-500)' }}>Citoyenne · Abidjan</div>
          </div>
          <Icon name="settings" size={16} color="var(--sm-ink-500)" />
        </div>
      </aside>

      {/* Zone principale */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--sm-paper)' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', borderBottom: '1px solid var(--sm-line)', background: 'white' }}>
          <div>
            <h2 className="sm-serif" style={{ fontSize: 22 }}>Inconscience · père</h2>
            <div style={{ fontSize: 12, color: 'var(--sm-ink-500)', marginTop: 4 }}>
              <span>FR</span> · 4 messages · <span style={{ fontFamily: 'var(--font-mono)' }}>protocoles PSC1</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="tel:185" className="sm-btn sm-btn-primary" style={{ padding: '8px 14px', minHeight: 36, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="phone" size={16} /> Appeler le 185
            </a>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ChatAIBubble text="Bonjour ! Je suis votre assistant de premiers secours. Décrivez ce qui se passe, je vous guide." actions={[]} />
            <ChatUserBubble text="Mon père est tombé et ne répond plus" />
            <ChatAIBubble
              text={'Inconscience. Restez calme.\n1. Parlez fort, secouez doucement les épaules.\n2. Vérifiez la respiration : joue près de la bouche, 10 secondes.\n3. S\'il respire → Position Latérale de Sécurité.\n4. S\'il ne respire pas → appelez le 185 et commencez le massage cardiaque.'}
              actions={[{ type: 'call', label: 'Appeler SAMU 185', number: '185' }]}
            />
          </div>
        </div>

        <div style={{ padding: '14px 32px 20px', borderTop: '1px solid var(--sm-line)', background: 'white' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, border: '1px solid var(--sm-line)', background: 'var(--sm-paper)', boxShadow: 'var(--shadow-1)' }}>
              <input placeholder="Décrivez la situation… ou parlez (FR · EN)" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, fontFamily: 'inherit', padding: '6px 4px' }} />
              <button style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--sm-paper-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="image" size={17} color="var(--sm-ink-400)" />
              </button>
              <button style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--sm-soft-red)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="mic" size={17} color="var(--sm-red)" />
              </button>
              <button style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--sm-ink)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="arrow-up" size={18} color="var(--sm-paper)" />
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--sm-ink-400)', textAlign: 'center', marginTop: 10 }}>
              L'IA peut se tromper. Pour une urgence vitale, appelez le 185 (SAMU) ou le 180 (pompiers).
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const ChatListening = ChatScreen;
const ChatResponse = ChatScreen;

Object.assign(window, {
  ChatListening, ChatResponse, ChatDesktop, ChatScreen,
  ChatUserBubble, ChatAIBubble, ChatTypingDots,
});
