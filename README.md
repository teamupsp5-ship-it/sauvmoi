# Sauv'Moi

Application mobile de premiers secours pour la Côte d'Ivoire (projet hackathon
"IA et service universel des télécommunications TIC"). IA vocale de premiers
secours, SOS géolocalisé, localisation des centres de santé, formations PSC1
gamifiées, fiche médicale d'urgence par QR code.

**Node.js + Express (backend) + React/JSX transpilé par Babel Standalone côté
navigateur (aucun bundler) + Supabase (authentification + base de données) +
Capacitor (app Android).**

---

## ⚠️ Prérequis : un projet Supabase configuré

Depuis la migration vers Supabase, **le serveur ne démarre pas sans une base
Supabase valide** — contrairement à une version antérieure du projet qui
tournait entièrement en mémoire. Sans ça, `npm start` échoue immédiatement
avec `supabaseUrl is required.`

1. Créer un projet sur [supabase.com](https://supabase.com) (gratuit).
2. Dans l'éditeur SQL du projet (Dashboard → SQL Editor), exécuter
   l'intégralité de `supabase/schema.sql` — crée les tables (`profiles`,
   `emergency_contacts`, `training_progress`, `notifications`,
   `health_centers`), les policies RLS et le trigger de création de profil.
3. Copier `.env.example` vers `.env` et renseigner au minimum :
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
     (Dashboard Supabase → Project Settings → API)
   - `MEDICAL_CARD_SECRET` — une chaîne aléatoire (ex. `openssl rand -hex 32`),
     nécessaire pour signer la fiche médicale QR ; sans elle, tout ce qui
     touche au QR médical échoue volontairement (échec fermé)
   - `PUBLIC_BASE_URL` — en local, `http://localhost:3000` suffit (voir
     `.env.example` pour le détail et les implications en production)

`ANTHROPIC_API_KEY` et `HEALTHSITES_API_KEY` restent optionnelles (voir plus
bas).

## Lancer l'application

```bash
npm install
npm start          # production
npm run dev        # développement, rechargement auto (node --watch)
```

Ouvrir **http://localhost:3000**.

### En un clic (Windows/macOS/Linux)
- **Windows** : double-cliquer sur `Lancer-Sauvmoi.bat`
- **macOS/Linux** : `Lancer-Sauvmoi.command` (macOS, 1ʳᵉ fois : clic-droit →
  Ouvrir) ou `./Lancer-Sauvmoi.command`

Ces lanceurs installent les dépendances au premier lancement et ouvrent le
navigateur automatiquement, mais **ne configurent pas `.env` à votre place**
— à faire une fois manuellement (voir Prérequis ci-dessus) avant de les
utiliser.

### Autres URL
- `http://localhost:3000/` → l'application réelle (téléphone plein écran)
- `http://localhost:3000/canvas.html` → le design canvas (plusieurs écrans
  côte à côte, outil de développement/maquette — pas l'app réelle)
- `http://localhost:3000/api/health` → santé de l'API

## IA : deux modes automatiques
- **Sans `ANTHROPIC_API_KEY`** (par défaut) → le chat utilise des protocoles
  PSC1 validés, codés en dur. Fonctionne hors-ligne, zéro hallucination.
- **Avec `ANTHROPIC_API_KEY`** → le chat passe sur Claude
  (`claude-haiku-4-5-20251001`), guidé par les mêmes protocoles comme
  garde-fou, jamais de diagnostic ni de posologie.

## Ce qui est réellement branché

- **Authentification réelle** (Supabase) : inscription en 2 étapes (infos
  perso + profil médical), connexion email/mot de passe, connexion Google
  (OAuth), session persistante avec rafraîchissement automatique du JWT.
- **Chat IA** : premiers secours et santé générale, mémoire de conversation,
  saisie vocale et mode vocal continu (Web Speech API), lecture des réponses
  à voix haute.
- **SOS réel** : géolocalisation du téléphone (`navigator.geolocation`),
  carte Leaflet/OpenStreetMap centrée sur la position déclarée, alerte
  WhatsApp pré-remplie pour les contacts sans compte, notification in-app
  réelle pour les contacts qui ont un compte Sauv'Moi.
- **Formations PSC1** : 10 modules, quiz progressifs, déverrouillage
  séquentiel, progression persistée dans Supabase.
- **Localisation** : centres de santé à couverture nationale (Côte d'Ivoire),
  synchronisés depuis l'API healthsites.io (OpenStreetMap) par une tâche
  cron indépendante (`scripts/sync-health-centers.js`) — jamais d'appel
  direct à ce service tiers pendant la consultation de la carte.
- **Fiche médicale QR** : génération d'un QR signé (HMAC) encodant une image
  publique de la fiche d'urgence, scannable par n'importe quel appareil
  photo, avec révocation réelle à la régénération.

## Comment c'est assemblé

```
public/
  index.html          ← point d'entrée de l'app réelle (charge app-live.jsx)
  canvas.html          ← design canvas (maquette, plusieurs écrans côte à côte)
  api-client.js        ← window.API : client HTTP vers le backend
  sm-state.js          ← window.SM : état partagé (session, données live)
  frames.jsx, screen-*.jsx   ← primitives et écrans (design + logique)
  live-chat.jsx, live-sos.jsx, screen-qr-scanner.jsx
                        ← surcharges "vivantes" (branchées au vrai backend),
                          chargées après les écrans d'origine pour les remplacer
  app-live.jsx          ← point d'entrée réel : registre des écrans, navigation
src/
  server.js             ← Express : monte routes/auth, api, chat, sos, training
  routes/                ← auth (Supabase), chat (Claude/fallback), sos, training, api
  supabase.js            ← client Supabase (service_role, backend uniquement)
  medical-card.js        ← génération SVG→PNG de la fiche d'urgence
  data/                  ← protocoles PSC1, modules de formation, numéros d'urgence
scripts/
  sync-health-centers.js ← tâche cron autonome (healthsites.io → Supabase)
supabase/schema.sql      ← schéma complet (tables, RLS, trigger) à exécuter manuellement
```

Aucun bundler : Babel Standalone transpile le JSX directement dans le
navigateur. Voir `CLAUDE.md` à la racine du dépôt pour la documentation
technique complète (architecture détaillée, décisions, dette technique
connue, procédure de déploiement).

## Tests

Pas de framework de test — fichiers `*.test.js` exécutés directement avec
`node`, assertions `node:assert/strict`, aucun appel réseau réel :

```bash
node scripts/sync-health-centers.test.js
node src/routes/api.public-base-url.test.js
node src/routes/api.medical-card-availability.test.js
```

## Mobile (Android, Capacitor)

```bash
npm run android:add    # une seule fois : génère le dossier android/
npm run build:mobile   # synchronise public/ → android/ après chaque modif front
npm run android:open   # ouvre Android Studio
npm run android:run    # lance sur émulateur ou appareil connecté
```

## Déploiement

Hébergement de production : **o2switch** (`https://sauvmoi.com`), déploiement
manuel via cPanel Git Version Control — voir `CLAUDE.md`, section
"Déploiement & infrastructure", pour la procédure complète et les variables
d'environnement requises côté serveur.

## ⚠️ Important (au-delà de la démo)

- Les protocoles de premiers secours doivent être **relus par un formateur
  PSC1 / professionnel de santé** avant tout usage réel.
- Les paiements Mobile Money sont **simulés** (pas d'appel agrégateur réel).
- La connexion Google (OAuth) et le flux d'inscription complet n'ont pas été
  vérifiés de bout en bout avec un vrai projet Supabase de production au
  moment de la rédaction — préparer un compte de démo à l'avance plutôt que
  de compter dessus en conditions réelles.
- Les tokens de session restent en `localStorage` (pas de cookies
  `httpOnly`) — compromis documenté dans `CLAUDE.md`, section Sécurité.
