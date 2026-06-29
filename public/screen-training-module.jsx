// Écran module de formation : étapes → quiz → résultat

const DIFF_MODULE = {
  'Facile':         { color: '#27AE60', bg: '#EAFAF1' },
  'Moyen':          { color: '#E67E22', bg: '#FEF5EC' },
  'Difficile':      { color: '#C0392B', bg: '#FDEDEC' },
  'Très difficile': { color: '#8E44AD', bg: '#F5EEF8' },
};

// ── Phase 1 : Étapes ──────────────────────────────────────────────────────

function StepsPhase({ mod, onStartQuiz }) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = mod.steps[stepIdx];
  const isLast = stepIdx === mod.steps.length - 1;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Barre de progression */}
      <div style={{ padding: '12px 20px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontFamily: 'var(--font-ui)', color: 'var(--sm-ink-500)' }}>
            Étape {stepIdx + 1} / {mod.steps.length}
          </span>
          <span style={{ fontSize: 13, fontFamily: 'var(--font-ui)', color: mod.color, fontWeight: 600 }}>
            {Math.round(((stepIdx + 1) / mod.steps.length) * 100)}%
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 999, background: '#F1F2F4', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999, background: mod.color,
            width: (((stepIdx + 1) / mod.steps.length) * 100) + '%',
            transition: 'width 0.35s ease',
          }} />
        </div>
      </div>

      {/* Contenu étape */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: mod.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'white', fontFamily: 'var(--font-ui)' }}>
              {stepIdx + 1}
            </span>
          </div>
          <h2 className="sm-serif" style={{ fontSize: 20, lineHeight: 1.25, flex: 1, margin: 0 }}>
            {step.title}
          </h2>
        </div>

        <div style={{
          background: 'white', borderRadius: 'var(--sm-radius)', boxShadow: 'var(--sm-shadow)',
          padding: '20px 18px',
        }}>
          <p style={{ fontSize: 15, color: 'var(--sm-ink)', lineHeight: 1.75, fontFamily: 'var(--font-ui)', margin: 0 }}>
            {step.content}
          </p>
        </div>

        {stepIdx > 0 && (
          <button
            onClick={() => setStepIdx(i => i - 1)}
            style={{
              marginTop: 14, background: 'none', border: 'none', padding: 0,
              fontSize: 13, color: 'var(--sm-ink-500)', fontFamily: 'var(--font-ui)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <Icon name="arrow-left" size={14} color="var(--sm-ink-500)" />
            Étape précédente
          </button>
        )}
        <div style={{ height: 20 }} />
      </div>

      {/* Bouton navigation */}
      <div style={{ padding: '12px 20px 32px', borderTop: '1px solid var(--sm-line)', flexShrink: 0 }}>
        <button
          onClick={() => isLast ? onStartQuiz() : setStepIdx(i => i + 1)}
          style={{
            width: '100%', padding: '15px 20px', borderRadius: 'var(--sm-radius)',
            background: mod.color, color: 'white', border: 'none',
            fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-ui)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          {isLast
            ? <><Icon name="circle-play" size={20} color="white" strokeWidth={1.9} />Commencer le quiz</>
            : <>Étape suivante<Icon name="arrow-right" size={20} color="white" /></>
          }
        </button>
      </div>
    </div>
  );
}

// ── Phase 2 : Quiz ────────────────────────────────────────────────────────

function QuizPhase({ mod, onFinish }) {
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [saving, setSaving] = useState(false);
  const correctRef = useRef(0);

  const q = mod.quiz[qIdx];
  const isLastQ = qIdx === mod.quiz.length - 1;
  const isCorrect = picked !== null && picked === q.correct;
  const progress = ((qIdx + 1) / mod.quiz.length) * 100;

  const handlePick = (optIdx) => {
    if (picked !== null) return;
    setPicked(optIdx);
    if (optIdx === q.correct) correctRef.current++;
  };

  const handleNext = async () => {
    if (!isLastQ) {
      setPicked(null);
      setQIdx(i => i + 1);
      return;
    }
    const score = correctRef.current;
    const total = mod.quiz.length;
    setSaving(true);
    try {
      const res = await window.API.trainingComplete(mod.id, score, total);
      onFinish({ score, total, ...res });
    } catch {
      const pct = Math.round((score / total) * 100);
      onFinish({ score, total, passed: pct >= 60, percentage: pct, nextModuleId: null });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* En-tête quiz */}
      <div style={{ padding: '10px 20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: mod.color, fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quiz
          </span>
          <span style={{ fontSize: 13, color: 'var(--sm-ink-500)', fontFamily: 'var(--font-ui)' }}>
            {qIdx + 1} / {mod.quiz.length}
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: '#F1F2F4', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: progress + '%', background: mod.color, borderRadius: 999, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Zone scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Question */}
        <div style={{ background: 'white', borderRadius: 'var(--sm-radius)', boxShadow: 'var(--sm-shadow)', padding: '18px 16px' }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--sm-ink)', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-ui)' }}>
            {q.question}
          </p>
        </div>

        {/* Options */}
        {q.options.map((opt, i) => {
          let bg = 'white', textColor = 'var(--sm-ink)', borderColor = 'var(--sm-line)';
          if (picked !== null) {
            if (i === q.correct)                   { bg = '#EAFAF1'; textColor = '#1E8449'; borderColor = '#27AE60'; }
            else if (i === picked && i !== q.correct) { bg = '#FDEDEC'; textColor = '#C0392B'; borderColor = '#C0392B'; }
          }
          const showCheck = picked !== null && i === q.correct;
          const showX     = picked !== null && i === picked && i !== q.correct;
          return (
            <button
              key={i}
              onClick={() => handlePick(i)}
              style={{
                width: '100%', textAlign: 'left', padding: '14px 16px',
                borderRadius: 14, border: `2px solid ${borderColor}`,
                background: bg, color: textColor,
                cursor: picked !== null ? 'default' : 'pointer',
                fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-ui)', lineHeight: 1.4,
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              {showCheck && <Icon name="check-circle" size={18} color="#27AE60" strokeWidth={2} />}
              {showX     && <Icon name="x-circle"     size={18} color="#C0392B" strokeWidth={2} />}
              {!showCheck && !showX && (
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--sm-line)', flexShrink: 0 }} />
              )}
              <span style={{ flex: 1 }}>{opt}</span>
            </button>
          );
        })}

        {/* Feedback */}
        {picked !== null && (
          <div style={{
            padding: '12px 16px', borderRadius: 12,
            background: isCorrect ? '#EAFAF1' : '#FDEDEC',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <Icon
              name={isCorrect ? 'check-circle-2' : 'info'}
              size={19} color={isCorrect ? '#27AE60' : '#C0392B'} strokeWidth={2}
            />
            <span style={{ fontSize: 14, lineHeight: 1.5, color: isCorrect ? '#1E8449' : '#922B21', fontFamily: 'var(--font-ui)' }}>
              {isCorrect
                ? 'Bonne réponse !'
                : `Pas tout à fait — la bonne réponse est : « ${q.options[q.correct]} »`}
            </span>
          </div>
        )}
        <div style={{ height: 4 }} />
      </div>

      {/* Bouton suivant */}
      {picked !== null && (
        <div style={{ padding: '10px 20px 32px', borderTop: '1px solid var(--sm-line)', flexShrink: 0 }}>
          <button
            onClick={handleNext}
            disabled={saving}
            style={{
              width: '100%', padding: '15px 20px', borderRadius: 'var(--sm-radius)',
              background: isCorrect ? '#27AE60' : mod.color,
              color: 'white', border: 'none',
              fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-ui)',
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Calcul du score…' : isLastQ ? 'Voir les résultats' : 'Question suivante →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Phase 3 : Résultat ───────────────────────────────────────────────────

function ResultPhase({ mod, result, nav, onRetry }) {
  const { score, total, passed, percentage, nextModuleId } = result;
  const [nextMod, setNextMod] = useState(null);

  useEffect(() => {
    if (!nextModuleId) return;
    window.API.trainingModules()
      .then(mods => {
        const n = mods.find(m => m.id === nextModuleId && m.status !== 'locked');
        setNextMod(n || null);
      })
      .catch(() => {});
  }, [nextModuleId]);

  const openNext = () => {
    window.SM.trainingModule = nextMod;
    nav.go('training_module');
  };

  const scoreColor = passed ? '#27AE60' : '#C0392B';
  const scoreBg    = passed ? '#EAFAF1' : '#FDEDEC';

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 24px 44px' }}>

      {/* Cercle score */}
      <div style={{
        width: 148, height: 148, borderRadius: '50%',
        background: scoreBg,
        border: `5px solid ${scoreColor}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        marginBottom: 26,
      }}>
        <span style={{ fontSize: 46, fontWeight: 900, fontFamily: 'var(--font-ui)', color: scoreColor, lineHeight: 1 }}>
          {percentage}%
        </span>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-ui)', marginTop: 4, color: scoreColor }}>
          {score} / {total}
        </span>
      </div>

      <h2 className="sm-serif" style={{ fontSize: 24, textAlign: 'center', marginBottom: 10, lineHeight: 1.2 }}>
        {passed ? 'Module complété !' : 'Essayez encore'}
      </h2>
      <p style={{
        fontSize: 14, color: 'var(--sm-ink-500)', textAlign: 'center', lineHeight: 1.65,
        fontFamily: 'var(--font-ui)', marginBottom: 34, maxWidth: 290,
      }}>
        {passed
          ? nextMod
            ? `Félicitations ! ${score}/${total} bonnes réponses. Le module suivant est débloqué !`
            : `Félicitations ! ${score}/${total} bonnes réponses. Vous maîtrisez ce module.`
          : `Il faut au moins 60% pour valider. Vous avez eu ${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''} sur ${total}.`
        }
      </p>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {passed && nextMod && (
          <button onClick={openNext} style={{
            padding: '15px 20px', borderRadius: 'var(--sm-radius)',
            background: mod.color, color: 'white', border: 'none',
            fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-ui)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <Icon name="arrow-right" size={20} color="white" />
            Module suivant : {nextMod.title}
          </button>
        )}
        {!passed && (
          <button onClick={onRetry} style={{
            padding: '15px 20px', borderRadius: 'var(--sm-radius)',
            background: mod.color, color: 'white', border: 'none',
            fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-ui)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <Icon name="rotate-ccw" size={18} color="white" />
            Recommencer
          </button>
        )}
        <button onClick={() => nav.reset('training')} style={{
          padding: '14px 20px', borderRadius: 'var(--sm-radius)',
          background: '#F1F2F4', color: 'var(--sm-ink)', border: 'none',
          fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-ui)',
          cursor: 'pointer',
        }}>
          Retour à la formation
        </button>
      </div>
    </div>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────

function TrainingModuleScreen({ nav }) {
  useLucide();
  const mod = window.SM?.trainingModule;
  const [phase, setPhase] = useState('steps');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!mod) nav.reset('training');
  }, []);

  if (!mod) return null;

  const diff = DIFF_MODULE[mod.difficulty] || DIFF_MODULE['Facile'];

  const handleRetry = () => {
    setResult(null);
    setPhase('steps');
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#F4F6F9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* En-tête */}
      <div style={{
        background: 'white', borderBottom: '1px solid var(--sm-line)',
        padding: '14px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        {phase !== 'result' && (
          <button
            onClick={() => goBack(nav)}
            style={{ background: 'none', border: 'none', padding: '4px', margin: '-4px', cursor: 'pointer', flexShrink: 0 }}
          >
            <Icon name="arrow-left" size={22} color="var(--sm-ink)" />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-ui)', color: 'var(--sm-ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {mod.title}
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-ui)',
          color: diff.color, background: diff.bg,
          borderRadius: 999, padding: '3px 10px', flexShrink: 0,
        }}>
          {mod.difficulty}
        </span>
      </div>

      {phase === 'steps' && (
        <StepsPhase mod={mod} onStartQuiz={() => setPhase('quiz')} />
      )}
      {phase === 'quiz' && (
        <QuizPhase
          mod={mod}
          onFinish={(r) => { setResult(r); setPhase('result'); }}
        />
      )}
      {phase === 'result' && result && (
        <ResultPhase mod={mod} result={result} nav={nav} onRetry={handleRetry} />
      )}
    </div>
  );
}

Object.assign(window, { TrainingModuleScreen });
