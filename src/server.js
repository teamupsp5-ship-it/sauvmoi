import express from 'express';
import cors from 'cors';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { load } from './store.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import chatRoutes from './routes/chat.js';
import sosRoutes from './routes/sos.js';
import trainingRoutes from './routes/training.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

load();

process.on('uncaughtException', (e) => console.error('[uncaught]', e));
process.on('unhandledRejection', (e) => console.error('[unhandled]', e));

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use((req, _res, next) => { console.log(`${req.method} ${req.url}`); next(); });

app.use(express.static(PUBLIC_DIR));

app.get('/api', (_req, res) => res.json({
  app: "Sauv'Moi API", status: 'ok', version: '1.0.0',
  ai: process.env.ANTHROPIC_API_KEY ? 'claude' : 'fallback-protocoles',
}));

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  ai: process.env.ANTHROPIC_API_KEY ? 'claude' : 'fallback',
  endpoints: [
    'POST /api/auth/login', 'POST /api/auth/register', 'GET /api/me', 'PUT /api/me',
    'GET /api/home', 'GET /api/emergencies', 'GET /api/protocols/:id',
    'POST /api/vision/analyze', 'POST /api/chat', 'GET /api/conversations',
    'POST /api/sos/trigger', 'GET /api/sos/:id/status', 'POST /api/sos/:id/cancel',
    'GET /api/notifications', 'POST /api/notifications/:id/read',
    'GET /api/training/path', 'GET /api/training/courses',
    'POST /api/payments/initiate', 'POST /api/payments/:id/confirm',
    'GET /api/medical-record', 'GET /api/medical-record/qr',
  ],
}));

app.use('/api', authRoutes);
app.use('/api', apiRoutes);
app.use('/api', chatRoutes);
app.use('/api', sosRoutes);
app.use('/api', trainingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚑  Sauv'Moi → http://localhost:${PORT}`);
  console.log(`    App          : http://localhost:${PORT}/`);
  console.log(`    Design canvas: http://localhost:${PORT}/canvas.html`);
  console.log(`    IA           : ${process.env.ANTHROPIC_API_KEY ? 'Claude (clé détectée)' : 'fallback protocoles'}`);
  console.log(`    Santé API    : http://localhost:${PORT}/api/health\n`);
});
