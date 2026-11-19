import { load } from './store.js';
import { createApp } from './app.js';

load();

process.on('uncaughtException', (e) => console.error('[uncaught]', e));
process.on('unhandledRejection', (e) => console.error('[unhandled]', e));

// Construction de l'app Express extraite dans app.js (LOT 14a) — réutilisée
// telle quelle par les tests d'intégration HTTP (src/routes/*.test.js), qui
// ont besoin d'un app importable sans socket déjà ouvert. Comportement de
// production strictement inchangé : app.listen() reste ici, seul point qui
// démarre réellement le serveur.
const app = createApp();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚑  Sauv'Moi → http://localhost:${PORT}`);
  console.log(`    App          : http://localhost:${PORT}/`);
  console.log(`    Design canvas: http://localhost:${PORT}/canvas.html`);
  console.log(`    IA           : ${process.env.ANTHROPIC_API_KEY ? 'Claude (clé détectée)' : 'fallback protocoles'}`);
  console.log(`    Santé API    : http://localhost:${PORT}/api/health\n`);
});
