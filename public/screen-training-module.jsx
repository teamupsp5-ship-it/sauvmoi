// Écran module de formation : étapes → quiz → résultat

const DIFF_MODULE = {
  'Facile':         { color: '#27AE60', bg: '#EAFAF1' },
  'Moyen':          { color: '#E67E22', bg: '#FEF5EC' },
  'Difficile':      { color: '#C0392B', bg: '#FDEDEC' },
  'Très difficile': { color: '#8E44AD', bg: '#F5EEF8' },
};

// Couleurs de texte des blocs correct/incorrect (quiz + révision des
// erreurs) — les valeurs light sont inchangées (accent vert/rouge déjà
// lisible sur leurs fonds pastel clairs) ; les valeurs dark sont les mêmes
// que celles déjà validées (contraste ≥6.4:1) pour le Banner et les
// overrides CSS de mode sombre — reprises ici en JS plutôt qu'en CSS pour
// ce composant réécrit, plus direct que de dépendre du hack d'attribut
// [style*="color: rgb(...)"].
// wrongText garde #C0392B (pas la valeur texte du Banner danger, #641E16) :
// il joue aussi le rôle d'accent (anneau + score du ResultPhase en cas
// d'échec), où une teinte vive reste nécessaire — voir le commentaire sur
// scoreColor plus bas.
const FEEDBACK_LIGHT = { correctBg: '#EAF3DE', correctText: '#145A32', wrongBg: '#FDEDEC', wrongText: '#C0392B' };
const FEEDBACK_DARK  = { correctBg: '#16281E', correctText: '#8FDB7A', wrongBg: '#3B211F', wrongText: '#FF8A7A' };

// ── Phase 1 : Étapes ──────────────────────────────────────────────────────

function StepsPhase({ mod, onStartQuiz }) {
  const t = useTranslation();
  const [stepIdx, setStepIdx] = useState(0);
  const step = mod.steps[stepIdx];
  const isLast = stepIdx === mod.steps.length - 1;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Barre de progression */}
      <div style={{ padding: '12px 20px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontFamily: 'var(--font-ui)', color: 'var(--sm-ink-500)' }}>
            {t('training_module.step_of').replace('{n}', stepIdx + 1).replace('{total}', mod.steps.length)}
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

      {/* Illustration d'en-tête — fond de secours = couleur du module tant
          que l'image charge ou si elle échoue. */}
      <div style={{ padding: '0 20px 14px', flexShrink: 0 }}>
        <FallbackImage
          src={mod.image}
          fallbackColor={mod.color}
          style={{ width: '100%', height: 130, borderRadius: 'var(--sm-radius)' }}
        />
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
          padding: '18px 18px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {step.substeps.map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                background: mod.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'white', fontFamily: 'var(--font-ui)' }}>
                  {i + 1}
                </span>
              </div>
              <p style={{ fontSize: 16, color: 'var(--sm-ink)', lineHeight: 1.5, fontFamily: 'var(--font-ui)', margin: 0 }}>
                {line}
              </p>
            </div>
          ))}
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
            {t('training_module.previous_step')}
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
            ? <><Icon name="circle-play" size={20} color="white" strokeWidth={1.9} />{t('training_module.start_quiz')}</>
            : <>{t('training_module.next_step')}<Icon name="arrow-right" size={20} color="white" /></>
          }
        </button>
      </div>
    </div>
  );
}

// ── Phase 2 : Quiz ────────────────────────────────────────────────────────

function QuizPhase({ mod, onFinish }) {
  const theme = useTheme();
  const t = useTranslation();
  const FB = theme === 'dark' ? FEEDBACK_DARK : FEEDBACK_LIGHT;
  const [qIdx, setQIdx] = useState(0);
  // `checked` : tableau des index cochés pour la question courante — un QCM
  // peut avoir plusieurs bonnes réponses (q.correctAnswers), donc on ne
  // valide plus au premier clic (`validated` sépare "sélection en cours" de
  // "réponse validée", avec un bouton "Valider" explicite entre les deux).
  const [checked, setChecked] = useState([]);
  const [validated, setValidated] = useState(false);
  const [saving, setSaving] = useState(false);
  const correctRef = useRef(0);
  const wrongAnswersRef = useRef([]);

  const q = mod.quiz[qIdx];
  const isLastQ = qIdx === mod.quiz.length - 1;
  const progress = ((qIdx + 1) / mod.quiz.length) * 100;
  const correctSet = q.correctAnswers;
  // Exact match uniquement : toutes les bonnes réponses cochées, aucune
  // mauvaise — un QCM à moitié coché ne compte pas comme correct.
  const isFullyCorrect = checked.length === correctSet.length && checked.every(i => correctSet.includes(i));

  const toggleOption = (i) => {
    if (validated) return;
    setChecked(cs => cs.includes(i) ? cs.filter(x => x !== i) : [...cs, i]);
  };

  const handleValidate = () => {
    if (checked.length === 0 || validated) return;
    setValidated(true);
    if (isFullyCorrect) {
      correctRef.current++;
    } else {
      wrongAnswersRef.current.push({
        question: q.question,
        givenAnswer: checked.length ? checked.map(i => q.options[i]).join(', ') : t('training_module.no_answer_checked'),
        correctAnswer: correctSet.map(i => q.options[i]).join(', '),
      });
    }
  };

  const handleNext = async () => {
    if (!isLastQ) {
      setChecked([]);
      setValidated(false);
      setQIdx(i => i + 1);
      return;
    }
    const score = correctRef.current;
    const total = mod.quiz.length;
    const wrongAnswers = wrongAnswersRef.current;
    setSaving(true);
    try {
      const res = await window.API.trainingComplete(mod.id, score, total);
      onFinish({ score, total, wrongAnswers, ...res });
    } catch {
      const pct = Math.round((score / total) * 100);
      onFinish({ score, total, wrongAnswers, passed: pct >= 60, percentage: pct, nextModuleId: null });
    } finally {
      setSaving(false);
    }
  };

  // Style d'une option selon son état — regroupé en une fonction pour éviter
  // de dupliquer la logique avant/après validation dans le JSX.
  function optionVisual(i) {
    const isChecked = checked.includes(i);
    const isCorrectOpt = correctSet.includes(i);
    if (validated) {
      if (isCorrectOpt && isChecked) {
        return { bg: FB.correctBg, text: FB.correctText, border: '#27AE60', boxBg: '#27AE60', boxBorder: '#27AE60', icon: <Icon name="check" size={13} color="white" strokeWidth={3} /> };
      }
      if (!isCorrectOpt && isChecked) {
        return { bg: FB.wrongBg, text: FB.wrongText, border: '#C0392B', boxBg: '#C0392B', boxBorder: '#C0392B', icon: <Icon name="x" size={13} color="white" strokeWidth={3} /> };
      }
      if (isCorrectOpt && !isChecked) {
        // Bonne réponse non cochée : neutre/gris plutôt que rouge — ce
        // n'est pas une erreur cochée, juste une réponse manquée à signaler.
        return { bg: 'var(--sm-paper-2)', text: 'var(--sm-ink-500)', border: 'var(--sm-line)', boxBg: 'transparent', boxBorder: 'var(--sm-ink-400)', icon: <Icon name="check" size={13} color="var(--sm-ink-400)" strokeWidth={3} /> };
      }
      return { bg: 'white', text: 'var(--sm-ink)', border: 'var(--sm-line)', boxBg: 'transparent', boxBorder: 'var(--sm-line)', icon: null };
    }
    if (isChecked) {
      return { bg: 'white', text: 'var(--sm-ink)', border: mod.color, boxBg: mod.color, boxBorder: mod.color, icon: <Icon name="check" size={13} color="white" strokeWidth={3} /> };
    }
    return { bg: 'white', text: 'var(--sm-ink)', border: 'var(--sm-line)', boxBg: 'transparent', boxBorder: 'var(--sm-line)', icon: null };
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* En-tête quiz */}
      <div style={{ padding: '10px 20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: mod.color, fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('training_module.quiz_label')}
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
          {correctSet.length > 1 && (
            <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--sm-ink-500)', margin: '6px 0 0', fontFamily: 'var(--font-ui)' }}>
              {t('training_module.multiple_answers_possible')}
            </p>
          )}
        </div>

        {/* Options — cases à cocher (QCM à choix multiple) */}
        {q.options.map((opt, i) => {
          const v = optionVisual(i);
          return (
            <button
              key={i}
              onClick={() => toggleOption(i)}
              disabled={validated}
              style={{
                width: '100%', textAlign: 'left', padding: '14px 16px',
                borderRadius: 14, border: `2px solid ${v.border}`,
                background: v.bg, color: v.text,
                cursor: validated ? 'default' : 'pointer',
                fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-ui)', lineHeight: 1.4,
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: `2px solid ${v.boxBorder}`, background: v.boxBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {v.icon}
              </div>
              <span style={{ flex: 1 }}>{opt}</span>
            </button>
          );
        })}

        {/* Bouton Valider — étape explicite avant tout feedback */}
        {!validated && (
          <button
            onClick={handleValidate}
            disabled={checked.length === 0}
            style={{
              marginTop: 4, width: '100%', padding: '14px 20px', borderRadius: 'var(--sm-radius)',
              background: checked.length === 0 ? 'var(--sm-line)' : mod.color,
              color: 'white', border: 'none',
              fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-ui)',
              cursor: checked.length === 0 ? 'default' : 'pointer',
            }}
          >
            {t('training_module.validate')}
          </button>
        )}

        {/* Feedback + justification */}
        {validated && (
          <>
            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: isFullyCorrect ? FB.correctBg : FB.wrongBg,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <Icon
                name={isFullyCorrect ? 'check-circle-2' : 'info'}
                size={19} color={isFullyCorrect ? '#27AE60' : '#C0392B'} strokeWidth={2}
              />
              <span style={{ fontSize: 14, lineHeight: 1.5, color: isFullyCorrect ? FB.correctText : FB.wrongText, fontFamily: 'var(--font-ui)' }}>
                {isFullyCorrect
                  ? t('training_module.correct_answer')
                  : t('training_module.incorrect_answer_prefix').replace('{answer}', correctSet.map(i => q.options[i]).join(', '))}
              </span>
            </div>
            {q.explanation && (
              <div style={{
                padding: '12px 16px', borderRadius: 12, background: 'var(--sm-paper-2)',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <Icon name="lightbulb" size={18} color="var(--sm-blue)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--sm-ink-700)', fontFamily: 'var(--font-ui)' }}>
                  {q.explanation}
                </span>
              </div>
            )}
          </>
        )}
        <div style={{ height: 4 }} />
      </div>

      {/* Bouton suivant */}
      {validated && (
        <div style={{ padding: '10px 20px 32px', borderTop: '1px solid var(--sm-line)', flexShrink: 0 }}>
          <button
            onClick={handleNext}
            disabled={saving}
            style={{
              width: '100%', padding: '15px 20px', borderRadius: 'var(--sm-radius)',
              background: isFullyCorrect ? '#27AE60' : mod.color,
              color: 'white', border: 'none',
              fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-ui)',
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? t('training_module.calculating_score') : isLastQ ? t('training_module.see_results') : t('training_module.next_question')}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Phase 3 : Résultat ───────────────────────────────────────────────────

function ResultPhase({ mod, result, nav, onRetry, onRetryQuiz }) {
  const theme = useTheme();
  const t = useTranslation();
  const lang = useLang();
  const FB = theme === 'dark' ? FEEDBACK_DARK : FEEDBACK_LIGHT;
  const { score, total, passed, percentage, nextModuleId, wrongAnswers } = result;
  const [nextMod, setNextMod] = useState(null);

  useEffect(() => {
    if (!nextModuleId) return;
    window.API.trainingModules(lang)
      .then(mods => {
        const n = mods.find(m => m.id === nextModuleId && m.status !== 'locked');
        setNextMod(n || null);
      })
      .catch(() => {});
  }, [nextModuleId, lang]);

  const openNext = () => {
    window.SM.trainingModule = nextMod;
    nav.go('training_module');
  };

  // #27AE60 (réussite) garde un contraste correct sur son fond assombri en
  // mode sombre (accent vert assez lumineux) ; #C0392B (échec) non — bascule
  // sur FB.wrongText, déjà validé à ≥6.4:1 sur ce même type de fond.
  const scoreColor = passed ? '#27AE60' : FB.wrongText;
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
        <span style={{ fontSize: 'clamp(36px, 11vw, 46px)', fontWeight: 900, fontFamily: 'var(--font-ui)', color: scoreColor, lineHeight: 1 }}>
          {percentage}%
        </span>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-ui)', marginTop: 4, color: scoreColor }}>
          {score} / {total}
        </span>
      </div>

      {/* Bloc titre + message — composant Banner partagé (frames.jsx),
          success/danger selon la réussite, plutôt qu'un titre/paragraphe
          centrés refaits à la main. */}
      <Banner
        variant={passed ? 'success' : 'danger'}
        icon={passed ? 'party-popper' : 'rotate-ccw'}
        title={passed ? t('training_module.module_completed') : t('training_module.try_again')}
        text={(passed
          ? (nextMod ? t('training_module.congrats_next_unlocked') : t('training_module.congrats_mastered'))
          : t('training_module.need_60_percent')
        ).replace('{score}', score).replace('{total}', total)}
        stacked
        style={{ width: '100%', marginBottom: 28 }}
      />

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {passed && nextMod && (
          <button onClick={openNext} style={{
            padding: '15px 20px', borderRadius: 'var(--sm-radius)',
            background: mod.color, color: 'white', border: 'none',
            fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-ui)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <Icon name="arrow-right" size={20} color="white" />
            {t('training_module.next_module_prefix')}{nextMod.title}
          </button>
        )}
        {/* Validé mais pas parfait : "Module suivant" reste l'action principale
            (ci-dessus si dispo), ce bouton secondaire permet de progresser
            quand même sans attendre un futur module. */}
        {passed && percentage < 100 && (
          <button onClick={onRetryQuiz} style={{
            padding: '14px 20px', borderRadius: 'var(--sm-radius)',
            background: 'white', color: mod.color, border: `1.5px solid ${mod.color}`,
            fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-ui)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <Icon name="rotate-ccw" size={18} color={mod.color} />
            {t('training_module.review_mistakes_retry')}
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
            {t('training_module.retry_quiz')}
          </button>
        )}
        <button onClick={() => nav.reset('training')} style={{
          padding: '14px 20px', borderRadius: 'var(--sm-radius)',
          background: '#F1F2F4', color: 'var(--sm-ink)', border: 'none',
          fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-ui)',
          cursor: 'pointer',
        }}>
          {t('training_module.back_to_training')}
        </button>
      </div>

      {/* Questions à revoir — dès que le score n'est pas parfait, qu'on ait
          validé ou non le module (60% suffit pour valider, mais laisse
          souvent des erreurs à corriger). */}
      {percentage < 100 && wrongAnswers && wrongAnswers.length > 0 && (
        <div style={{ width: '100%', marginTop: 28 }}>
          <h3 className="sm-serif" style={{ fontSize: 16, marginBottom: 12, textAlign: 'left' }}>
            {t('training_module.questions_to_review')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {wrongAnswers.map((w, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 'var(--sm-radius)', boxShadow: 'var(--sm-shadow)',
                padding: '14px 16px', textAlign: 'left',
              }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--sm-ink)', margin: '0 0 10px', lineHeight: 1.4, fontFamily: 'var(--font-ui)' }}>
                  {w.question}
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <Icon name="x-circle" size={16} color="#C0392B" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: FB.wrongText, lineHeight: 1.4, fontFamily: 'var(--font-ui)' }}>{w.givenAnswer}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Icon name="check-circle" size={16} color="#27AE60" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: FB.correctText, lineHeight: 1.4, fontFamily: 'var(--font-ui)' }}>{w.correctAnswer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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

  // "Module suivant" appelle nav.go('training_module') alors qu'on est déjà sur
  // cet écran — même screenId, donc React ne démonte/remonte pas le composant
  // et phase/result restent bloqués sur l'ancien module. On les réinitialise
  // explicitement dès que le module affiché change.
  useEffect(() => {
    setPhase('steps');
    setResult(null);
  }, [mod?.id]);

  if (!mod) return null;

  const diff = DIFF_MODULE[mod.difficulty] || DIFF_MODULE['Facile'];

  const handleRetry = () => {
    setResult(null);
    setPhase('steps');
  };

  // Module déjà validé (≥ 60%) mais pas parfait : repartir directement sur
  // le quiz plutôt que de repasser par les étapes — contrairement à
  // handleRetry (échec), la personne maîtrise déjà la matière, seul le quiz
  // l'intéresse pour corriger ses erreurs.
  const handleRetryQuiz = () => {
    setResult(null);
    setPhase('quiz');
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--sm-paper)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

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
          {difficultyLabel(mod.difficulty)}
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
        <ResultPhase mod={mod} result={result} nav={nav} onRetry={handleRetry} onRetryQuiz={handleRetryQuiz} />
      )}
    </div>
  );
}

Object.assign(window, { TrainingModuleScreen });
