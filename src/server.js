import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { load } from './store.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import chatRoutes from './routes/chat.js';
import sosRoutes, { subscribe } from './routes/sos.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

load();

// Filet de sécurité : en démo, on ne veut jamais que le serveur meure en silence.
process.on('uncaughtException', (e) => console.error('[uncaught]', e));
process.on('unhandledRejection', (e) => console.error('[unhandled]', e));


const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

// petit log
app.use((req, _res, next) => { console.log(`${req.method} ${req.url}`); next(); });

// ── Frontend (servi par le backend : une seule origine, pas de CORS) ────────
app.use(express.static(PUBLIC_DIR));

app.get('/api', (_req, res) => res.json({
  app: "Sauv'Moi API", status: 'ok', version: '1.0.0',
  ai: process.env.ANTHROPIC_API_KEY ? 'claude' : 'fallback-protocoles',
  docs: '/api/health',
}));

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  ai: process.env.ANTHROPIC_API_KEY ? 'claude' : 'fallback',
  endpoints: [
    'POST /api/auth/request-otp', 'POST /api/auth/verify', 'GET /api/me',
    'GET /api/home', 'GET /api/emergencies', 'GET /api/protocols/:id',
    'POST /api/vision/analyze', 'POST /api/chat', 'GET /api/conversations',
    'POST /api/sos/trigger', 'GET /api/sos/:id/status', 'WS /ws/sos/:id',
    'GET /api/training/path', 'GET /api/training/courses',
    'POST /api/payments/initiate', 'POST /api/payments/:id/confirm',
    'GET /api/medical-record', 'GET /api/medical-record/qr',
  ],
}));

app.use('/api', authRoutes);
app.use('/api', apiRoutes);
app.use('/api', chatRoutes);
app.use('/api', sosRoutes);

// ── WebSocket : suivi SOS en direct ───────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
wss.on('connection', (ws, req) => {
  const m = (req.url || '').match(/\/ws\/sos\/([^/?]+)/);
  if (!m) { ws.send(JSON.stringify({ type: 'error', error: 'route ws invalide' })); return ws.close(); }
  const alertId = m[1];
  subscribe(alertId, ws);
  ws.send(JSON.stringify({ type: 'connected', alertId }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚑  Sauv'Moi → http://localhost:${PORT}`);
  console.log(`    App         : http://localhost:${PORT}/`);
  console.log(`    Design canvas: http://localhost:${PORT}/canvas.html`);
  console.log(`    IA          : ${process.env.ANTHROPIC_API_KEY ? 'Claude (clé détectée)' : 'fallback protocoles (pas de clé)'}`);
  console.log(`    Santé API   : http://localhost:${PORT}/api/health\n`);
});
