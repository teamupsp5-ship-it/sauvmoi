// screen-home.jsx — Accueil Sauv'Moi · mobile + desktop

// ── Conseils PSC1 — rotation sur les 7 jours de la semaine ───────────────
const DAILY_TIPS = [
  { icon: 'user-round',  title: 'Position Latérale de Sécurité', text: 'Pour une personne inconsciente qui respire, placez-la en PLS pour dégager les voies aériennes et éviter l\'étouffement.' },
  { icon: 'wind',        title: 'Étouffement — Manœuvre de Heimlich', text: '5 tapes dans le dos puis 5 compressions abdominales. Répétez jusqu\'à dégagement complet de l\'obstruction.' },
  { icon: 'heart-pulse', title: 'Massage cardiaque', text: '30 compressions (5–6 cm, 100–120/min) alternées avec 2 insufflations. Continuez jusqu\'à l\'arrivée des secours.' },
  { icon: 'flame',       title: 'Brûlure — réflexe immédiat', text: '15 minutes sous eau tempérée courante. Jamais de glace, de beurre ou de dentifrice sur la brûlure.' },
  { icon: 'droplets',    title: 'Hémorragie — compression directe', text: 'Appuyez fermement avec un linge propre sur la plaie sans relâcher. Appelez le 185 immédiatement.' },
  { icon: 'brain',       title: 'Reconnaître un AVC (FAST)', text: 'Visage asymétrique · Bras tombant · Parole difficile → Temps = urgence absolue. Appelez le 185.' },
  { icon: 'thermometer', title: 'Malaise — premiers gestes', text: 'Allongez la victime, surélevez les jambes, desserrez les vêtements. Si inconsciente → mettez en PLS.' },
];

// ── Barre de navigation fond bleu foncé avec SOS pulsé ────────────────────
function HomeTabBar({ active, nav }) {
  const TABS = [
    { id: 'home',     icon: 'home',      label: 'Accueil' },
    { id: 'training', icon: 'book-open', label: 'Formation' },
    { id: 'sos',      icon: 'siren',     label: 'SOS', special: true },
    { id: 'map',      icon: 'map-pin',   label: 'Localisation', disabled: true },
    { id: 'profile',  icon: 'user',      label: 'Profil' },
  ];

  return (
    <div style={{
      background: 'linear-gradient(180deg, #1565C0, #0D47A1)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'flex-start',
      padding: '10px 0 28px',
      flexShrink: 0,
      overflow: 'visible',
      position: 'relative',
    }}>
      {TABS.map(tab => {

        // ── Bouton SOS central surélevé ──
        if (tab.special) return (
          <div key="sos" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, marginTop: -28 }}>
            <button
              onClick={() => nav.go('sos')}
              style={{ position: 'relative', width: 60, height: 60, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              aria-label="Déclencher SOS"
            >
              <div className="sm-halo" style={{ borderColor: 'rgba(229,57,53,0.55)' }} />
              <div className="sm-halo delay1" style={{ borderColor: 'rgba(229,57,53,0.35)' }} />
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'var(--sm-red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 24px rgba(229,57,53,0.55)',
              }}>
                <Icon name="siren" size={25} color="white" strokeWidth={2} />
              </div>
            </button>
            <span style={{ fontSize: 10.5, color: 'white', fontWeight: 700, fontFamily: 'var(--font-ui)' }}>SOS</span>
          </div>
        );

        // ── Onglets normaux ──
        const isActive = active === tab.id;
        const iconColor = tab.disabled
          ? 'rgba(255,255,255,0.25)'
          : isActive ? 'white' : 'rgba(255,255,255,0.5)';

        const GO = { home: () => nav.reset('home'), training: () => nav.go('training'), map: () => nav.go('map'), profile: () => nav.go('profile') };
        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && GO[tab.id]?.()}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              paddingTop: isActive && !tab.disabled ? '6px' : '8px',
              paddingBottom: 0, paddingLeft: '4px', paddingRight: '4px',
              background: 'none',
              borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
              borderTop: isActive && !tab.disabled ? '2px solid white' : '2px solid transparent',
              cursor: tab.disabled ? 'default' : 'pointer',
              fontFamily: 'var(--font-ui)',
            }}
          >
            <Icon name={tab.icon} size={22} color={iconColor} />
            <span style={{ fontSize: 10.5, color: iconColor, fontWeight: isActive ? 600 : 400 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ACCUEIL MOBILE
// ════════════════════════════════════════════════════════════════════════════
function HomeMobile({ nav, lang }) {
  useLucide();
  window.useSM(); // re-render quand SM.user change (après connexion)

  // Salutation dynamique
  const hour     = new Date().getHours();
  const user     = window.SM?.user;
  const prenom   = (user?.prenom || user?.name?.split(' ')[0] || '').trim() || 'vous';
  const initials = user?.initials || prenom.slice(0, 2).toUpperCase();
  const _AV_COLORS = ['#E53935', '#4A90C2', '#2E6B4F', '#C77A2B', '#6B4F8C'];
  const avatarBg = _AV_COLORS[(initials.charCodeAt(0) || 0) % _AV_COLORS.length];

  // Conseil du jour (indexé sur le jour de la semaine)
  const tip = DAILY_TIPS[new Date().getDay()];

  return (
    <>
      {/* ── En-tête dégradé ─────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, #f8f9fa, white)',
        padding: '16px 20px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--sm-line)',
        flexShrink: 0,
      }}>
        {/* Logo Sauv'Moi */}
        <img
          src="logo_80.png"
          alt="Sauv'Moi"
          style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 10, flexShrink: 0 }}
        />

        {/* Salutation */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="sm-serif" style={{ fontSize: 22, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {hour < 13 ? 'Bonjour' : 'Bonsoir'} {prenom}
          </h1>
        </div>

        {/* Avatar cliquable → profil */}
        <button
          onClick={() => nav.go('profile')}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
        >
          {user?.photo ? (
            <img
              src={user.photo}
              alt="avatar"
              style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 0 0 1.5px var(--sm-line)' }}
            />
          ) : (
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: avatarBg, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
            }}>
              {initials}
            </div>
          )}
        </button>
      </div>

      {/* ── Corps scrollable ────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 12px', background: 'var(--sm-paper)' }}>

        {/* Grande carte Chat IA — fond bleu */}
        <button
          onClick={() => nav.go('chat')}
          style={{
            display: 'flex', width: '100%', alignItems: 'center', gap: 14,
            padding: '24px 20px', borderRadius: 20, marginBottom: 14,
            minHeight: 120,
            background: '#1565c0', border: 'none', cursor: 'pointer', textAlign: 'left',
            boxShadow: '0 8px 28px rgba(21,101,192,0.35)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="sm-serif" style={{ fontSize: 22, color: 'white', marginBottom: 10, lineHeight: 1.15 }}>
              Que se passe-t-il ?
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>
              Écrivez, parlez ou envoyez une photo
            </p>
          </div>
          {/* Micro rouge */}
          <div style={{
            width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
            background: 'var(--sm-red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(229,57,53,0.5)',
          }}>
            <Icon name="mic" size={26} color="white" strokeWidth={2} />
          </div>
        </button>

        {/* Carte Scanner QR — fond blanc */}
        <button
          onClick={() => nav.go('qr_scanner')}
          style={{
            display: 'flex', width: '100%', alignItems: 'center', gap: 14,
            padding: '15px 16px', borderRadius: 16, marginBottom: 22,
            background: 'white', border: '1.5px solid var(--sm-line)',
            cursor: 'pointer', textAlign: 'left',
            boxShadow: '0 2px 8px rgba(10,22,40,0.06)',
          }}
        >
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: '#F1F2F4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="camera" size={22} color="#1a1a1a" strokeWidth={1.9} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sm-serif" style={{ fontSize: 16, color: 'var(--sm-ink)', marginBottom: 3 }}>
              Scanner un QR Sauv'Moi
            </div>
            <div style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>
              Voir la fiche d'urgence d'une victime
            </div>
          </div>
          <Icon name="chevron-right" size={18} color="var(--sm-ink-400)" style={{ flexShrink: 0 }} />
        </button>

        {/* Conseil du jour */}
        <h3 className="sm-serif" style={{ fontSize: 18, marginBottom: 12 }}>Conseil du jour</h3>
        <div className="sm-card" style={{ padding: '18px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: '#F1F2F4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={tip.icon} size={22} color="#1a1a1a" strokeWidth={1.9} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 className="sm-serif" style={{ fontSize: 16, marginBottom: 6 }}>{tip.title}</h4>
            <p style={{ fontSize: 13, color: 'var(--sm-ink-500)', lineHeight: 1.55 }}>{tip.text}</p>
          </div>
        </div>
      </div>

      {/* ── Barre de navigation bleue foncée ───────────────────────────── */}
      <HomeTabBar active="home" nav={nav} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ÉCRAN QR SCANNER (caméra branchée via Capacitor Camera plugin)
// ════════════════════════════════════════════════════════════════════════════
function QrScannerScreen({ nav }) {
  useLucide();
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a1628' }}>

      {/* Header */}
      <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => nav.back()}
          style={{ padding: 8, margin: -8, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Icon name="arrow-left" size={22} color="white" />
        </button>
        <h2 className="sm-serif" style={{ fontSize: 20, color: 'white' }}>
          Scanner un QR Sauv'Moi
        </h2>
      </div>

      {/* Zone de visée */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 40px' }}>
        <div style={{
          width: 220, height: 220, borderRadius: 24, marginBottom: 32,
          border: '1.5px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Coins du viseur */}
          <div style={{ position: 'absolute', top: 14, left: 14, width: 26, height: 26, borderTop: '3px solid white', borderLeft: '3px solid white', borderRadius: '8px 0 0 0' }} />
          <div style={{ position: 'absolute', top: 14, right: 14, width: 26, height: 26, borderTop: '3px solid white', borderRight: '3px solid white', borderRadius: '0 8px 0 0' }} />
          <div style={{ position: 'absolute', bottom: 14, left: 14, width: 26, height: 26, borderBottom: '3px solid white', borderLeft: '3px solid white', borderRadius: '0 0 0 8px' }} />
          <div style={{ position: 'absolute', bottom: 14, right: 14, width: 26, height: 26, borderBottom: '3px solid white', borderRight: '3px solid white', borderRadius: '0 0 8px 0' }} />
          <Icon name="camera-off" size={52} color="rgba(255,255,255,0.2)" />
        </div>

        <h3 className="sm-serif" style={{ fontSize: 22, color: 'white', marginBottom: 12, textAlign: 'center' }}>
          Caméra non activée
        </h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.6, marginBottom: 8 }}>
          Fonctionnalité caméra à activer via le plugin Capacitor Camera
        </p>
        <code style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'rgba(255,255,255,0.75)',
          background: 'rgba(255,255,255,0.08)',
          padding: '6px 12px', borderRadius: 8,
        }}>
          @capacitor/camera
        </code>
      </div>

      <div style={{ padding: '0 24px 48px' }}>
        <button onClick={() => nav.back()} className="sm-btn sm-btn-outline-white" style={{ width: '100%' }}>
          Retour
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DESKTOP (inchangé — canvas design uniquement)
// ════════════════════════════════════════════════════════════════════════════
function QuickTile({ color, tint, icon, title, sub, onClick }) {
  return (
    <button onClick={onClick} className="sm-card" style={{
      padding: 16, textAlign: 'left',
      display: 'flex', flexDirection: 'column', gap: 10,
      cursor: 'pointer', background: 'white',
      transition: 'transform 50ms var(--ease), filter 150ms var(--ease)',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} strokeWidth={2} />
      </div>
      <div>
        <div className="sm-serif" style={{ fontSize: 16, color: 'var(--sm-ink)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--sm-ink-500)', marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
}

function BigQuick({ color, icon, title, sub, extra, onClick }) {
  return (
    <button onClick={onClick} className="sm-card" style={{ padding: 22, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={22} strokeWidth={2} />
        </div>
        {extra && <span className="sm-serif" style={{ fontSize: 26, color: color, lineHeight: 1 }}>{extra}</span>}
      </div>
      <div>
        <div className="sm-serif" style={{ fontSize: 19, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>{sub}</div>
      </div>
    </button>
  );
}

function Sidebar({ active, onNav }) {
  const items = [
    { id: 'home',      label: 'Accueil',        icon: 'home' },
    { id: 'emergency', label: 'Mode urgence',   icon: 'shield-alert' },
    { id: 'chat',      label: 'Chat IA',        icon: 'sparkles' },
    { id: 'training',  label: 'Formations',     icon: 'graduation-cap' },
    { id: 'records',   label: 'Carnet médical', icon: 'notebook-pen' },
    { id: 'rescuers',  label: 'Secouristes',    icon: 'map-pin' },
    { id: 'profile',   label: 'Profil',         icon: 'user' },
  ];
  return (
    <aside className="sm-sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 14px' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--sm-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="life-buoy" size={20} color="var(--sm-paper)" />
        </div>
        <span className="sm-serif" style={{ fontSize: 21, letterSpacing: '-0.02em' }}>Sauv'Moi</span>
      </div>
      {items.map(it => (
        <button key={it.id} className={'sm-sidebar-item' + (it.id === active ? ' is-active' : '')} onClick={() => onNav(it.id)}>
          <Icon name={it.icon} size={18} />
          <span>{it.label}</span>
        </button>
      ))}
      <div style={{ marginTop: 'auto' }}>
        <button
          onClick={() => onNav('sos')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderRadius: 10, background: 'var(--sm-red)', color: 'white', border: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="siren" size={20} strokeWidth={2} />
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Déclencher SOS</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>3 sec d'appui long</div>
          </div>
        </button>
        <div style={{ padding: '12px 12px 0', fontSize: 11, color: 'var(--sm-ink-500)', lineHeight: 1.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--sm-green)' }} /> En ligne · Abidjan
          </div>
          <div style={{ marginTop: 4 }}>v1.0 · démo hackathon</div>
        </div>
      </div>
    </aside>
  );
}

function HomeDesktop({ nav, lang }) {
  useLucide();
  return (
    <>
      <Sidebar active="home" onNav={(id) => nav.go(id)} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '28px 48px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>Abidjan · Sauv'Moi</div>
            <h1 className="sm-serif" style={{ fontSize: 34, marginTop: 4 }}>{T('hello', lang)}</h1>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 999, border: '1px solid var(--sm-line)', background: 'white', minWidth: 320 }}>
              <Icon name="search" size={18} color="var(--sm-ink-500)" />
              <span style={{ color: 'var(--sm-ink-500)', fontSize: 14 }}>Rechercher un geste, une fiche…</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--sm-ink-400)' }}>⌘K</span>
            </div>
            <LangPill lang={lang} />
            <button style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--sm-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', cursor: 'pointer' }}>
              <Icon name="bell" size={18} />
            </button>
            <div className="sm-photo-placeholder" style={{ width: 40, height: 40, borderRadius: '50%' }}>
              <span style={{ position: 'relative', zIndex: 1, fontWeight: 600 }}>AK</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '6fr 4fr', gap: 20, marginBottom: 20 }}>
          <div className="sm-card" style={{ padding: 36, display: 'flex', gap: 24, alignItems: 'center', minHeight: 240 }}>
            <div style={{ flex: 1 }}>
              <div className="sm-eyebrow" style={{ marginBottom: 10, color: 'var(--sm-blue)' }}><Icon name="sparkles" size={12} /> Sauv'Moi écoute</div>
              <h2 className="sm-serif" style={{ fontSize: 38, marginBottom: 10, letterSpacing: '-0.02em' }}>{T('whats_happening', lang)}</h2>
              <p style={{ color: 'var(--sm-ink-500)', fontSize: 15, marginBottom: 18, fontStyle: 'italic' }}>{T('whats_examples', lang)}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Quelqu\'un saigne', 'Il s\'étouffe', 'Brûlure'].map(s => (
                  <button key={s} onClick={() => nav.go('chat')} className="sm-chip"><Icon name="quote" size={12} /> {s}</button>
                ))}
              </div>
            </div>
            <button onClick={() => nav.go('chat')} style={{ position: 'relative', width: 132, height: 132, flexShrink: 0 }}>
              <PulseCircle size={132}><Icon name="mic" size={48} strokeWidth={2} /></PulseCircle>
            </button>
          </div>
          <div className="sm-card" style={{ overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="sm-photo-placeholder" style={{ height: 140 }}><Icon name="heart-pulse" size={48} /></div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <div className="sm-eyebrow" style={{ color: 'var(--sm-green)' }}>{T('tip_of_day', lang)}</div>
              <h3 className="sm-serif" style={{ fontSize: 22 }}>{T('pls', lang)}</h3>
              <p style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>Pour une personne inconsciente qui respire.</p>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--sm-ink-500)' }}>{T('read_by', lang)}</span>
                <button className="sm-btn sm-btn-ghost" style={{ padding: '6px 10px', minHeight: 32, fontSize: 13 }}>Lire <Icon name="arrow-right" size={14} /></button>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          <BigQuick color="var(--sm-red)"   icon="shield-alert"    title={T('emergency_mode', lang)} sub="parler ou filmer · IA classe"  onClick={() => nav.go('emergency')} />
          <BigQuick color="var(--sm-green)" icon="graduation-cap"  title="Formation en cours"        sub="PSC1 · module 6 / 10" extra="58 %" onClick={() => nav.go('training')} />
          <BigQuick color="var(--sm-ink)"   icon="notebook-pen"    title="Carnet médical"            sub="groupe O+ · allergies 2"         onClick={() => null} />
          <BigQuick color="var(--sm-blue)"  icon="map-pin"         title="Secouristes près"          sub="12 actifs · 200 m"               onClick={() => null} />
        </div>
      </div>
    </>
  );
}

Object.assign(window, { HomeMobile, HomeDesktop, Sidebar, QrScannerScreen });
