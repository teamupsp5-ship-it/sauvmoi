// Screen 5 — Formations & certifications
// Mobile: gamified zigzag path (Duolingo-style)
// Desktop: catalogue with sidebar

const PATH_STEPS = [
  { id: 1, label: 'PLS',              icon: 'user-round',     state: 'done' },
  { id: 2, label: 'Étouffement',      icon: 'wind',           state: 'done' },
  { id: 3, label: 'Massage cardiaque',icon: 'heart-pulse',    state: 'current' },
  { id: 4, label: 'Brûlures',         icon: 'flame',          state: 'locked' },
  { id: 5, label: 'Hémorragies',      icon: 'droplets',       state: 'locked' },
  { id: 6, label: 'AVC',              icon: 'brain',          state: 'locked' },
  { id: 7, label: 'Examen PSC1',      icon: 'award',          state: 'locked', special: true },
];

function TrainingMobile({ nav, lang }) {
  useLucide();
  return (
    <>
      <StatusBar />
      {/* Header with back + streak */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 16px 12px' }}>
        <button onClick={() => goBack(nav)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sm-paper-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginRight: 4 }}>
          <Icon name="arrow-left" size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: 'var(--sm-soft-orange)', color: 'var(--sm-orange)',
            fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600,
          }}>
            <Icon name="flame" size={16} strokeWidth={2} />
            12 jours
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 999,
            background: 'var(--sm-soft-green)', color: 'var(--sm-green)',
            fontSize: 12, fontWeight: 700,
          }}>
            <Icon name="zap" size={12} strokeWidth={2.4} />
            +25 XP
          </div>
        </div>
        <div className="sm-photo-placeholder" style={{ width: 34, height: 34, borderRadius: '50%' }}>
          <span style={{ position: 'relative', zIndex: 1, fontSize: 12, fontWeight: 600 }}>AK</span>
        </div>
      </div>

      {/* Sub-header */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <h2 className="sm-serif" style={{ fontSize: 20 }}>Parcours · Premiers secours</h2>
          <span style={{ fontSize: 13, color: 'var(--sm-ink-500)', fontVariantNumeric: 'tabular-nums' }}>8 / 20</span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: 'var(--sm-line)' }}>
          <div style={{ width: '40%', height: '100%', borderRadius: 999, background: 'var(--sm-green)' }} />
        </div>
      </div>

      {/* Zigzag path */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', padding: '8px 0 24px' }}>
        <div style={{ position: 'relative', width: 350, margin: '0 auto', minHeight: 600 }}>
          {/* SVG dashed connector */}
          <svg viewBox="0 0 350 700" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, top: 30, width: '100%', height: 700, pointerEvents: 'none' }}>
            <path
              d="M 100 0 Q 60 60, 250 100 Q 320 130, 100 200 Q 30 240, 250 300 Q 320 330, 100 400 Q 30 440, 250 500 Q 320 530, 175 600"
              stroke="var(--sm-ink-400)"
              strokeWidth="2.5"
              strokeDasharray="4 7"
              fill="none"
              opacity="0.5"
            />
          </svg>

          {PATH_STEPS.map((s, i) => {
            const left = i % 2 === 0 ? 70 : 220;
            const top = 10 + i * 95;
            return <PathNode key={s.id} step={s} left={left} top={top} onClick={() => null} />;
          })}
        </div>

        {/* Encouragement card */}
        <div className="sm-card" style={{ margin: '20px 20px 4px', padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--sm-soft-green)', color: 'var(--sm-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="award" size={22} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, lineHeight: 1.3 }}>
            <div className="sm-serif" style={{ fontSize: 15 }}>Plus que 12 modules</div>
            <div style={{ fontSize: 12, color: 'var(--sm-ink-500)' }}>pour obtenir votre certificat PSC1.</div>
          </div>
          <button className="sm-btn sm-btn-primary" style={{ padding: '8px 12px', minHeight: 36, fontSize: 13 }}>
            Reprendre
          </button>
        </div>
      </div>

      <TabBar active="training" onNav={(id) => nav.reset(id === 'training' ? 'home' : id)} onSOS={() => nav.go('sos')} />
      <HomeIndicator />
    </>
  );
}

function PathNode({ step, left, top, onClick }) {
  const isDone = step.state === 'done';
  const isCurrent = step.state === 'current';
  const isLocked = step.state === 'locked';

  let bg = 'transparent', color = 'var(--sm-ink-400)', border = '2px solid var(--sm-line)', shadow = 'none';
  let icon = step.icon;
  if (isDone) { bg = 'var(--sm-green)'; color = 'white'; border = 'none'; icon = 'check'; }
  if (isCurrent) { bg = 'var(--sm-red)'; color = 'white'; border = 'none'; shadow = '0 8px 22px rgba(229,57,53,0.4)'; }
  if (isLocked) { icon = 'lock'; }
  if (step.special) {
    bg = isLocked ? 'transparent' : 'var(--sm-orange)';
    border = isLocked ? '2px dashed var(--sm-ochre-500, var(--sm-orange))' : 'none';
  }

  return (
    <div onClick={onClick} style={{
      position: 'absolute', left, top,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      width: 80, transform: 'translateX(-50%)',
    }}>
      <div style={{
        position: 'relative',
        width: 64, height: 64, borderRadius: '50%',
        background: bg,
        border,
        boxShadow: shadow,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        {isCurrent && <span className="sm-halo" style={{ width: 64, height: 64, inset: 'auto' }} />}
        <Icon name={icon} size={26} strokeWidth={2} color={color} />
      </div>
      <div style={{
        fontSize: 11, fontWeight: 600,
        color: isLocked ? 'var(--sm-ink-400)' : 'var(--sm-ink)',
        textAlign: 'center',
        lineHeight: 1.2,
      }}>{step.label}</div>
      {isCurrent && (
        <div style={{
          fontSize: 10, fontWeight: 700,
          color: 'var(--sm-red)', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>À jouer</div>
      )}
    </div>
  );
}

// ── DESKTOP ──────────────────────────────────────────────────────────────
const COURSES = [
  { title: 'PSC1 · Prévention et Secours Civiques',  duration: '6 h · 10 modules', tag: 'free',     icon: 'shield-check' },
  { title: 'Premiers gestes pour bébés et enfants',  duration: '3 h · 6 modules',  tag: 'free',     icon: 'baby' },
  { title: 'AVC : reconnaître en 60 secondes',       duration: '45 min',           tag: 'free',     icon: 'brain' },
  { title: 'Massage cardiaque · maîtrise',           duration: '2 h',              tag: 'premium',  icon: 'heart-pulse', price: '4 900 FCFA' },
  { title: 'Sauveteur secouriste du travail (SST)',  duration: '14 h · pro',       tag: 'premium',  icon: 'briefcase', price: '34 000 FCFA' },
  { title: 'Premiers secours en équipe (PSE1)',      duration: '35 h · pro',       tag: 'premium',  icon: 'users', price: '120 000 FCFA' },
  { title: 'Catastrophes naturelles · plan familial',duration: '1 h',              tag: 'free',     icon: 'cloud-rain' },
  { title: 'AED · défibrillateur automatique',       duration: '1 h 30',           tag: 'premium',  icon: 'zap', price: '8 500 FCFA' },
];

function TrainingDesktop({ nav, lang }) {
  useLucide();
  const [filter, setFilter] = useState('all');
  const filtered = COURSES.filter(c => filter === 'all' ? true : filter === 'free' ? c.tag === 'free' : filter === 'premium' ? c.tag === 'premium' : true);

  return (
    <>
      <Sidebar active="training" onNav={(id) => nav.go(id)} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '28px 48px 48px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ maxWidth: 640 }}>
            <div className="sm-eyebrow" style={{ marginBottom: 8 }}>Formations & certifications</div>
            <h1 className="sm-serif" style={{ fontSize: 36, lineHeight: 1.1 }}>
              Apprenez à sauver une vie<br />
              <em style={{ color: 'var(--sm-red)', fontStyle: 'italic', fontWeight: 500 }}>en 5 minutes par jour.</em>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 999,
              background: 'var(--sm-soft-orange)', color: 'var(--sm-orange)',
              fontWeight: 600,
            }}>
              <Icon name="flame" size={16} strokeWidth={2} /> 12 jours · 1 240 XP
            </div>
            <div className="sm-photo-placeholder" style={{ width: 36, height: 36, borderRadius: '50%' }}>
              <span style={{ position: 'relative', zIndex: 1, fontWeight: 600, fontSize: 12 }}>AK</span>
            </div>
          </div>
        </div>

        {/* Reprendre big banner */}
        <div className="sm-card" style={{ marginBottom: 32, display: 'flex', gap: 0, overflow: 'hidden', borderColor: 'var(--sm-ink)', borderWidth: '1.5px' }}>
          <div className="sm-photo-placeholder" style={{ width: 320, height: 200, borderRadius: 0 }}>
            <Icon name="play" size={56} />
          </div>
          <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="sm-eyebrow" style={{ marginBottom: 8 }}>Reprendre</div>
            <h2 className="sm-serif" style={{ fontSize: 28, marginBottom: 6 }}>PSC1 · Massage cardiaque</h2>
            <div style={{ fontSize: 14, color: 'var(--sm-ink-500)', marginBottom: 18 }}>
              Module 6 sur 10 · 58 % complété · prochain : compressions à 100 / min
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--sm-line)', maxWidth: 460, marginBottom: 20 }}>
              <div style={{ width: '58%', height: '100%', borderRadius: 999, background: 'var(--sm-red)' }} />
            </div>
            <div>
              <button className="sm-btn sm-btn-primary" style={{ padding: '14px 26px', fontSize: 15 }}>
                <Icon name="play" size={18} /> Reprendre
              </button>
            </div>
          </div>
        </div>

        {/* Catalogue */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 className="sm-serif" style={{ fontSize: 22 }}>Catalogue complet</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'all', label: 'Tous' },
              { id: 'free', label: 'Gratuits' },
              { id: 'premium', label: 'Premium' },
              { id: 'pro', label: 'Pour pros' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} className={'sm-chip' + (filter === f.id ? ' is-active' : '')}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {filtered.map((c, i) => <CourseCard key={i} c={c} />)}
        </div>

        {/* Payment methods footer */}
        <div style={{
          marginTop: 28, padding: 16, borderRadius: 10,
          border: '1px solid var(--sm-line)', background: 'var(--sm-paper-2)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <Icon name="credit-card" size={20} color="var(--sm-ink-700)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Paiements acceptés sur les cours premium</div>
            <div style={{ fontSize: 12, color: 'var(--sm-ink-500)' }}>Wave · Orange Money · MTN Mobile Money · Moov Money · Visa</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Wave','OM','MTN','Moov','Visa'].map(p => (
              <span key={p} style={{
                padding: '4px 10px', borderRadius: 6,
                border: '1px solid var(--sm-line)', background: 'white',
                fontSize: 11, fontWeight: 600, color: 'var(--sm-ink-700)',
              }}>{p}</span>
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
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 6,
            background: isPremium ? 'var(--sm-soft-orange)' : 'var(--sm-soft-green)',
            color: isPremium ? 'var(--sm-orange)' : 'var(--sm-green)',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {isPremium ? 'Premium' : 'Gratuit'}
          </span>
          {isPremium && (
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sm-ink)' }}>{c.price}</span>
          )}
        </div>
        <h4 className="sm-serif" style={{ fontSize: 17, lineHeight: 1.2 }}>{c.title}</h4>
        <div style={{ fontSize: 12, color: 'var(--sm-ink-500)', marginTop: 'auto' }}>{c.duration}</div>
      </div>
    </div>
  );
}

Object.assign(window, { TrainingMobile, TrainingDesktop });
