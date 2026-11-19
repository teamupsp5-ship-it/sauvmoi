import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import chatRoutes from './routes/chat.js';
import sosRoutes from './routes/sos.js';
import trainingRoutes from './routes/training.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// Extrait de server.js (LOT 14a) — seule différence : pas de app.listen() ici.
// server.js reste le seul point d'entrée qui démarre réellement le process
// (load() du store, process.on(uncaughtException/unhandledRejection),
// app.listen()) ; createApp() construit l'app Express identique à avant,
// réutilisable par les tests d'intégration HTTP (src/routes/*.test.js) sans
// ouvrir de socket ni dépendre d'un port libre.
export function createApp() {
  const app = express();

  // Déployé derrière le proxy inverse d'o2switch (Apache/Passenger) — sans ça,
  // req.ip renvoie l'IP interne du proxy pour toutes les requêtes (au lieu du
  // vrai client), ce qui rend tout rate limiting par IP inopérant (une seule
  // IP apparente pour tout le monde) en plus de faire lever un avertissement à
  // express-rate-limit.
  app.set('trust proxy', 1);

  // ─── CORS — liste blanche explicite ─────────────────────────────────────────
  const DEFAULT_CORS_ORIGINS = [
    'https://sauvmoi.com',
    'https://www.sauvmoi.com',
    'https://localhost',
    'http://localhost:3000',
  ];
  const ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : DEFAULT_CORS_ORIGINS;

  app.use(cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(null, false);
    },
  }));

  // ─── Content-Security-Policy ────────────────────────────────────────────────
  const CSP_DIRECTIVES = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://images.pexels.com', 'https://*.tile.openstreetmap.org', 'https://unpkg.com'],
    connectSrc: ["'self'", 'https://sauvmoi.com', 'https://*.supabase.co'],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    frameAncestors: ["'none'"],
  };

  app.use(helmet({
    contentSecurityPolicy: { directives: CSP_DIRECTIVES },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

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
      'GET /api/config',
      'POST /api/auth/login', 'POST /api/auth/register', 'POST /api/auth/google-sync', 'GET /api/me', 'PUT /api/me',
      'GET /api/home (compatibilité anciennes APK uniquement)', 'GET /api/protocols/:id',
      'POST /api/vision/analyze', 'POST /api/chat', 'GET /api/conversations',
      'POST /api/sos/trigger', 'GET /api/sos/:id/status', 'POST /api/sos/:id/cancel',
      'GET /api/notifications', 'POST /api/notifications/:id/read',
      'GET /api/training/modules', 'POST /api/training/:moduleId/complete',
      'GET /api/medical-record/qr', 'POST /api/medical-record/qr/regenerate',
      'GET /api/public/medical-card/:id.png', 'GET /api/public/medical-card/:id.json',
    ],
  }));

  app.use('/api', authRoutes);
  app.use('/api', apiRoutes);
  app.use('/api', chatRoutes);
  app.use('/api', sosRoutes);
  app.use('/api', trainingRoutes);

  return app;
}
