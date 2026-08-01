import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from './auth.js';
import { TRAINING_MODULES } from '../data/training-modules.js';

const router = Router();

async function getProgress(userId) {
  const { data, error } = await supabase
    .from('training_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data || { completed_modules: [], scores: {} };
}

router.get('/training/modules', requireAuth, async (req, res) => {
  try {
    const progress = await getProgress(req.user.id);
    const completed = new Set(progress.completed_modules || []);

    const modules = TRAINING_MODULES.map(m => {
      const isDone = completed.has(m.id);
      const prev = TRAINING_MODULES.find(x => x.order === m.order - 1);
      const isUnlocked = m.order === 1 || (prev && completed.has(prev.id));
      const rawScore = progress.scores?.[m.id];
      // Clamp défensif également en lecture : auto-corrige l'affichage pour
      // tout score déjà stocké hors [0, 100] par un test antérieur au fix
      // ci-dessus, sans attendre que l'utilisateur repasse le module.
      const score = rawScore == null ? null : Math.min(100, Math.max(0, rawScore));
      return {
        ...m,
        status: isDone ? 'completed' : (isUnlocked ? 'unlocked' : 'locked'),
        score,
      };
    });

    res.json(modules);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/training/:moduleId/complete', requireAuth, async (req, res) => {
  const { moduleId } = req.params;
  const { score: rawScore = 0, total: rawTotal = 1 } = req.body || {};
  // Coercition + clamp défensifs : quels que soient les types/valeurs reçus
  // (chaînes, score déjà exprimé en pourcentage avec total absent, etc.), le
  // pourcentage stocké/retourné reste toujours dans [0, 100].
  const score = Number(rawScore) || 0;
  const total = Number(rawTotal) || 0;

  const mod = TRAINING_MODULES.find(m => m.id === moduleId);
  if (!mod) return res.status(404).json({ error: 'module inconnu' });

  try {
    const progress = await getProgress(req.user.id);
    const percentage = total > 0 ? Math.min(100, Math.max(0, Math.round((score / total) * 100))) : 0;
    const scores = { ...(progress.scores || {}), [moduleId]: percentage };

    const passed = percentage >= 60;
    const completedModules = progress.completed_modules || [];
    const nextCompletedModules = passed && !completedModules.includes(moduleId)
      ? [...completedModules, moduleId]
      : completedModules;

    const { error: upsertErr } = await supabase.from('training_progress').upsert({
      user_id: req.user.id,
      completed_modules: nextCompletedModules,
      scores,
      updated_at: new Date().toISOString(),
    });
    if (upsertErr) throw upsertErr;

    const nextMod = TRAINING_MODULES.find(m => m.order === mod.order + 1);
    res.json({ passed, percentage, nextModuleId: nextMod?.id ?? null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
