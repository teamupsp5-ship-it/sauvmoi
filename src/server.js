import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

// Déployé derrière le proxy de Render — sans ça, req.ip renvoie l'IP interne
// du proxy pour toutes les requêtes (au lieu du vrai client), ce qui rend
// tout rate limiting par IP inopérant (une seule IP apparente pour tout le
// monde) en plus de faire lever un avertissement à express-rate-limit.
app.set('trust proxy', 1);

app.use(cors());

// ─── Content-Security-Policy ────────────────────────────────────────────────
// L'app n'a pas de bundler : tout le JSX est transpilé EN DIRECT dans le
// navigateur par Babel Standalone (<script type="text/babel" src="...">).
// Vérifié empiriquement (testé avec 'unsafe-eval' seul → tout l'écran reste
// blanc, erreurs CSP en console) : Babel Standalone n'exécute PAS le code
// transpilé via eval()/Function(), il l'injecte comme un NOUVEL élément
// <script> avec le code en texte — ce que le navigateur traite comme du
// "script inline", peu importe que le <script> d'origine ait un `src=`.
// script-src a donc besoin à la fois de 'unsafe-inline' (exécuter ce script
// injecté) ET 'unsafe-eval' (Babel/regenerator-runtime utilisent aussi
// Function() en interne pour async/await) — sans bundler, une CSP stricte
// sur script-src n'est tout simplement pas atteignable ici ; c'est le
// compromis assumé de cette architecture (voir aussi le point sur les
// tokens localStorage dans CLAUDE.md, qui documente cette même limite).
// Les autres directives (surtout connect-src) restent une vraie protection
// même dans ce contexte : si une injection HTML/script arrivait malgré tout
// à s'exécuter, connect-src empêche encore l'exfiltration du token vers un
// domaine autre que notre propre API/Supabase.
const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://images.pexels.com', 'https://*.tile.openstreetmap.org', 'https://unpkg.com'],
  // API Sauv'Moi (prod + dev local) + Supabase (OAuth Google et lecture de
  // session côté navigateur, voir supabase-client.js) — l'API Anthropic
  // n'a PAS besoin d'être ici : elle n'est jamais appelée depuis le
  // navigateur, uniquement depuis le backend (src/ai.js), donc hors CSP.
  connectSrc: ["'self'", 'https://sauvmoi.onrender.com', 'https://*.supabase.co'],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  // frame-ancestors prend le pas sur X-Frame-Options quand les deux sont
  // présents — explicite à 'none' pour ne pas laisser le défaut Helmet
  // ('self') contredire silencieusement le frameguard 'deny' ci-dessous.
  frameAncestors: ["'none'"],
};

app.use(helmet({
  contentSecurityPolicy: { directives: CSP_DIRECTIVES },
  frameguard: { action: 'deny' }, // X-Frame-Options — l'app n'est jamais destinée à être embarquée dans un iframe
  // HSTS reste sans effet en HTTP local (ignoré par les navigateurs hors
  // HTTPS) et s'applique correctement une fois servi en HTTPS sur Render.
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
    'GET /api/home', 'GET /api/emergencies', 'GET /api/protocols/:id',
    'POST /api/vision/analyze', 'POST /api/chat', 'GET /api/conversations',
    'POST /api/sos/trigger', 'GET /api/sos/:id/status', 'POST /api/sos/:id/cancel',
    'GET /api/notifications', 'POST /api/notifications/:id/read',
    'GET /api/training/path', 'GET /api/training/courses',
    'POST /api/payments/initiate', 'POST /api/payments/:id/confirm',
    'GET /api/medical-record', 'GET /api/medical-record/qr',
    'GET /api/public/medical-card/:id.png', 'GET /api/public/medical-card/:id.json',
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
