import { Router } from 'express';
import { get, save } from '../store.js';
import { TRAINING_MODULES } from '../data/training-modules.js';

const router = Router();
const USER_ID = 'u_demo';

function getProgress() {
  const db = get();
  if (!db.users[USER_ID]) db.users[USER_ID] = { id: USER_ID };
  if (!db.users[USER_ID].trainingProgress) {
    db.users[USER_ID].trainingProgress = { completedModules: [], scores: {} };
  }
  return db.users[USER_ID].trainingProgress;
}

router.get('/training/modules', (_req, res) => {
  const progress = getProgress();
  const completed = new Set(progress.completedModules || []);

  const modules = TRAINING_MODULES.map(m => {
    const isDone = completed.has(m.id);
    const prev = TRAINING_MODULES.find(x => x.order === m.order - 1);
    const isUnlocked = m.order === 1 || (prev && completed.has(prev.id));
    return {
      ...m,
      status: isDone ? 'completed' : (isUnlocked ? 'unlocked' : 'locked'),
      score: progress.scores?.[m.id] ?? null,
    };
  });

  res.json(modules);
});

router.post('/training/:moduleId/complete', (req, res) => {
  const { moduleId } = req.params;
  const { score = 0, total = 1 } = req.body || {};

  const mod = TRAINING_MODULES.find(m => m.id === moduleId);
  if (!mod) return res.status(404).json({ error: 'module inconnu' });

  const progress = getProgress();
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  progress.scores[moduleId] = percentage;

  const passed = percentage >= 60;
  if (passed && !progress.completedModules.includes(moduleId)) {
    progress.completedModules.push(moduleId);
  }

  save();

  const nextMod = TRAINING_MODULES.find(m => m.order === mod.order + 1);
  res.json({ passed, percentage, nextModuleId: nextMod?.id ?? null });
});

export default router;
