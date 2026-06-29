// Screen Formation — parcours Duolingo avec déverrouillage progressif
// Desktop : catalogue existant conservé

const DIFF_STYLES_T = {
  'Facile':         { color: '#27AE60', bg: '#EAFAF1' },
  'Moyen':          { color: '#E67E22', bg: '#FEF5EC' },
  'Difficile':      { color: '#C0392B', bg: '#FDEDEC' },
  'Très difficile': { color: '#8E44AD', bg: '#F5EEF8' },
};

function TrainingMobile({ nav }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lockedToast, setLockedToast] = useState(false);
  useLucide();

  useEffect(() => {
    window.API.trainingModules()
      .then(m => { setModules(m); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const completed = modules.filter(m => m.status === 'completed').length;
  const total = modules.length || 10;
  const pct = Math.round((completed / total) * 100);

  const openModule = (mod) => {
    if (mod.status === 'locked') {
      setLockedToast(true);
      setTimeout(() => setLockedToast(false), 2500);
      return;
    }
    window.SM.trainingModule = mod;
    nav.go('training_module');
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#F4F6F9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* En-tête */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--sm-line)', padding: '18px 20px 14px', flexShrink: 0 }}>
        <h1 className="sm-serif" style={{ fontSize: 20, lineHeight: 1.2, marginBottom: 10 }}>
          Formation aux gestes de secours
        </h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--sm-ink-500)', fontFamily: 'var(--font-ui)' }}>
            {completed}/{total} modules complétés
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-ui)', color: pct >= 60 ? '#27AE60' : 'var(--sm-blue)' }}>
            {pct}%
          </span>
        </div>
        <div style={{ height: 7, borderRadius: 999, background: '#F1F2F4', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: pct + '%', borderRadius: 999,
            background: 'linear-gradient(90deg, var(--sm-blue), #0D47A1)',
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Parcours */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
        {loading
          ? [0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ width: 64, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8E8E8' }} />
                  {i < 3 && <div style={{ width: 3, height: 28, background: '#F1F2F4', margin: '6px 0', borderRadius: 999 }} />}
                </div>
                <div style={{ flex: 1, paddingTop: 12, paddingBottom: 16 }}>
                  <div style={{ height: 16, background: '#E8E8E8', borderRadius: 4, marginBottom: 10, width: '62%' }} />
                  <div style={{ height: 12, background: '#F1F2F4', borderRadius: 4, width: '38%' }} />
                </div>
              </div>
            ))
          : modules.map((mod, i) => {
              const isLast = i === modules.length - 1;
              const isLocked = mod.status === 'locked';
              const isDone = mod.status === 'completed';
              const diff = DIFF_STYLES_T[mod.difficulty] || DIFF_STYLES_T['Facile'];

              return (
                <div key={mod.id} style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>

                  {/* Colonne gauche : cercle + trait de connexion */}
                  <div style={{ width: 64, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button
                      onClick={() => openModule(mod)}
                      style={{
                        width: 64, height: 64, borderRadius: '50%', border: 'none', padding: 0,
                        background: isLocked ? '#E8E8E8' : mod.color,
                        boxShadow: isLocked ? 'none' : `0 4px 18px ${mod.color}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: isLocked ? 'default' : 'pointer',
                        position: 'relative', flexShrink: 0,
                        outline: isDone ? '3px solid #27AE60' : 'none',
                        outlineOffset: 2,
                      }}
                    >
                      <Icon
                        name={isLocked ? 'lock' : mod.icon}
                        size={24} color={isLocked ? '#BDBDBD' : 'white'} strokeWidth={1.9}
                      />
                      {isDone && (
                        <div style={{
                          position: 'absolute', top: -3, right: -3,
                          width: 22, height: 22, borderRadius: '50%',
                          background: '#27AE60', border: '2.5px solid white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon name="check" size={11} color="white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                    {!isLast && (
                      <div style={{
                        width: 3, flex: 1, minHeight: 12, borderRadius: 999,
                        background: isDone ? '#27AE60' : '#E0E0E0',
                        margin: '5px 0',
                      }} />
                    )}
                  </div>

                  {/* Colonne droite : carte */}
                  <div style={{ flex: 1, paddingBottom: isLast ? 4 : 14 }}>
                    <button
                      onClick={() => openModule(mod)}
                      style={{
                        width: '100%', textAlign: 'left', background: 'white',
                        border: 'none', borderRadius: 'var(--sm-radius)',
                        boxShadow: 'var(--sm-shadow)', padding: '14px 16px',
                        cursor: isLocked ? 'default' : 'pointer',
                        opacity: isLocked ? 0.5 : 1,
                      }}
                    >
                      <div style={{
                        fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-ui)',
                        color: isLocked ? 'var(--sm-ink-400)' : 'var(--sm-ink)',
                        marginBottom: 7, lineHeight: 1.3,
                      }}>
                        {mod.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: mod.score !== null ? 9 : 0 }}>
                        {!isLocked && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)',
                            color: diff.color, background: diff.bg,
                            borderRadius: 999, padding: '2px 9px',
                          }}>
                            {mod.difficulty}
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: 'var(--sm-ink-500)', fontFamily: 'var(--font-ui)' }}>
                          {isLocked ? '🔒 Verrouillé' : `${mod.quiz.length} questions`}
                        </span>
                      </div>
                      {mod.score !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 999, background: '#F1F2F4', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: mod.score + '%', borderRadius: 999,
                              background: mod.score >= 60 ? '#27AE60' : 'var(--sm-red)',
                            }} />
                          </div>
                          <span style={{
                            fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-ui)', flexShrink: 0,
                            color: mod.score >= 60 ? '#27AE60' : 'var(--sm-red)',
                          }}>
                            {mod.score}%
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
        }
        <div style={{ height: 8 }} />
      </div>

      {/* Toast module verrouillé */}
      {lockedToast && (
        <div style={{
          position: 'absolute', bottom: 88, left: 16, right: 16, zIndex: 100,
          background: 'var(--sm-ink)', color: 'white', borderRadius: 14,
          padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
        }}>
          <Icon name="lock" size={16} color="white" />
          <span style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-ui)', lineHeight: 1.3 }}>
            Terminez le module précédent pour débloquer
          </span>
        </div>
      )}

      <HomeTabBar active="training" nav={nav} />
    </div>
  );
}

// ── DESKTOP ──────────────────────────────────────────────────────────────
const COURSES_LIST = [
  { title: 'PSC1 · Prévention et Secours Civiques',  duration: '6 h · 10 modules', tag: 'free',    icon: 'shield-check' },
  { title: 'Premiers gestes pour bébés et enfants',  duration: '3 h · 6 modules',  tag: 'free',    icon: 'baby' },
  { title: 'AVC : reconnaître en 60 secondes',       duration: '45 min',           tag: 'free',    icon: 'brain' },
  { title: 'Massage cardiaque · maîtrise',           duration: '2 h',              tag: 'premium', icon: 'heart-pulse', price: '4 900 FCFA' },
  { title: 'Sauveteur secouriste du travail (SST)',  duration: '14 h · pro',       tag: 'premium', icon: 'briefcase',   price: '34 000 FCFA' },
  { title: 'Premiers secours en équipe (PSE1)',      duration: '35 h · pro',       tag: 'premium', icon: 'users',       price: '120 000 FCFA' },
  { title: 'Catastrophes naturelles · plan familial',duration: '1 h',              tag: 'free',    icon: 'cloud-rain' },
  { title: 'AED · défibrillateur automatique',       duration: '1 h 30',           tag: 'premium', icon: 'zap',         price: '8 500 FCFA' },
];

function TrainingDesktop({ nav }) {
  useLucide();
  const [filter, setFilter] = useState('all');
  const filtered = COURSES_LIST.filter(c =>
    filter === 'all' ? true : filter === 'free' ? c.tag === 'free' : filter === 'premium' ? c.tag === 'premium' : true
  );

  return (
    <>
      <Sidebar active="training" onNav={(id) => nav.go(id)} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '28px 48px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ maxWidth: 640 }}>
            <div className="sm-eyebrow" style={{ marginBottom: 8 }}>Formations & certifications</div>
            <h1 className="sm-serif" style={{ fontSize: 36, lineHeight: 1.1 }}>
              Apprenez à sauver une vie<br />
              <em style={{ color: 'var(--sm-red)', fontStyle: 'italic', fontWeight: 500 }}>en 5 minutes par jour.</em>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'var(--sm-soft-orange)', color: 'var(--sm-orange)', fontWeight: 600 }}>
              <Icon name="flame" size={16} strokeWidth={2} /> 12 jours · 1 240 XP
            </div>
            <div className="sm-photo-placeholder" style={{ width: 36, height: 36, borderRadius: '50%' }}>
              <span style={{ position: 'relative', zIndex: 1, fontWeight: 600, fontSize: 12 }}>AK</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 className="sm-serif" style={{ fontSize: 22 }}>Catalogue complet</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ id: 'all', label: 'Tous' }, { id: 'free', label: 'Gratuits' }, { id: 'premium', label: 'Premium' }, { id: 'pro', label: 'Pour pros' }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} className={'sm-chip' + (filter === f.id ? ' is-active' : '')}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {filtered.map((c, i) => <CourseCard key={i} c={c} />)}
        </div>

        <div style={{ marginTop: 28, padding: 16, borderRadius: 10, border: '1px solid var(--sm-line)', background: 'var(--sm-paper-2)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Icon name="credit-card" size={20} color="var(--sm-ink-700)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Paiements acceptés sur les cours premium</div>
            <div style={{ fontSize: 12, color: 'var(--sm-ink-500)' }}>Wave · Orange Money · MTN Mobile Money · Moov Money · Visa</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Wave', 'OM', 'MTN', 'Moov', 'Visa'].map(p => (
              <span key={p} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--sm-line)', background: 'white', fontSize: 11, fontWeight: 600, color: 'var(--sm-ink-700)' }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function CourseCard({ c }) {
  const isPremium = c.tag === 'premium';
  return (
    <div className="sm-card" style={{ overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="sm-photo-placeholder" style={{ height: 130 }}>
        <Icon name={c.icon} size={40} />
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6,
            background: isPremium ? 'var(--sm-soft-orange)' : 'var(--sm-soft-green)',
            color: isPremium ? 'var(--sm-orange)' : 'var(--sm-green)',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {isPremium ? 'Premium' : 'Gratuit'}
          </span>
          {isPremium && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sm-ink)' }}>{c.price}</span>}
        </div>
        <h4 className="sm-serif" style={{ fontSize: 17, lineHeight: 1.2 }}>{c.title}</h4>
        <div style={{ fontSize: 12, color: 'var(--sm-ink-500)', marginTop: 'auto' }}>{c.duration}</div>
      </div>
    </div>
  );
}

Object.assign(window, { TrainingMobile, TrainingDesktop });
