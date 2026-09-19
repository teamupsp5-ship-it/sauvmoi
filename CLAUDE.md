# Sauv'Moi — Contexte projet pour Claude Code

Application de premiers secours mobile pour la Côte d'Ivoire.
Projet hackathon "IA et service universel des télécommunications TIC".
Tagline : **"Restez calme, tout ira bien"** (affiché sur splash screen et écran de connexion).

---

## Description

Sauv'Moi guide les utilisateurs dans les premiers secours via une IA vocale,
reconnaît les situations d'urgence (texte, voix, photo), déclenche un SOS géolocalisé,
localise les centres de santé proches, et propose des formations PSC1 gamifiées.
Cible : Abidjan et Afrique de l'Ouest. Le module Localisation vise une couverture
nationale des centres de santé (Côte d'Ivoire), synchronisée depuis l'API
healthsites.io (données OpenStreetMap) — voir section Localisation. En
secours (sync réel pas encore exécuté), 20 centres de San Pédro vérifiés le
31/07/2026 restent disponibles (`source: 'seed-manuel'`).

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Node.js (ES modules) + Express 4 + WebSocket (`ws`) |
| Sécurité backend | `helmet` (headers de sécurité + CSP) + `express-rate-limit` (login/register) — voir `src/server.js` et `src/validate.js`, section Sécurité ci-dessous |
| Frontend | React 18 + JSX transpilé par Babel Standalone (pas de build) |
| Icônes | Lucide (UMD, chargé via CDN) |
| Cartes | Leaflet.js (CDN) + tuiles OpenStreetMap — carte SOS et carte Localisation. Centres de santé : couverture nationale Côte d'Ivoire, synchronisée depuis l'API healthsites.io (données OpenStreetMap, licence ODbL) vers la table Supabase `health_centers` par `scripts/sync-health-centers.js` (tâche cron, jamais appelée en direct par une requête utilisateur) — voir section Localisation ci-dessous. |
| IA | Claude `claude-haiku-4-5-20251001` via Anthropic API — premiers secours **et** santé générale, garde-fous stricts (jamais de diagnostic ni de posologie) — fallback protocoles PSC1 si pas de clé ou appel échoué |
| Auth + BDD | **Supabase** (`@supabase/supabase-js` ^2, npm côté backend) — auth JWT (register/login/refresh) + Postgres (`profiles`, `emergency_contacts`, `training_progress`, `notifications`) avec Row Level Security. Côté navigateur, même SDK chargé en CDN (`supabase-client.js`) — usage limité à l'OAuth Google (`signInWithOAuth`), tout le reste du CRUD passe par le backend. |
| Persistance legacy | Fichier JSON `.data/db.json` via `src/store.js` — plus utilisé pour les comptes/profils (migrés vers Supabase), reste pour les données seed statiques, les alertes SOS actives (en mémoire) et les conversations chat |
| Mobile | Capacitor.js v8 (`@capacitor/android`) — Android uniquement pour l'instant |
| QR Scan | `@capacitor-mlkit/barcode-scanning` (natif Android) + `jsQR` (fallback web via CDN) |
| QR médical | `qrcode` (génération du motif QR) + `sharp` (rasterise le template SVG de la fiche d'urgence en PNG, route publique `/api/public/medical-card/:id.png`) |
| Caméra | `@capacitor/camera` — installé, branché dans `screen-qr-scanner.jsx` |
| Voix | Web Speech API : `SpeechRecognition` (saisie vocale ponctuelle + mode vocal continu) et `SpeechSynthesis` (lecture à voix haute des réponses IA) — coordination partagée via `speakText`/`stopSpeech`/`useSpeechActive` dans `frames.jsx` |
| Polices | Poppins (UI principal, titres en 700/gras vs texte courant en 400) · Spectral (serif titres, via `.sm-serif`) · Public Sans (fallback) · JetBrains Mono (code) — Google Fonts |

**Aucun bundler.** Babel transpile le JSX directement dans le navigateur.
Tous les composants sont exposés sur `window` via `Object.assign(window, {...})`.

---

## Variables d'environnement

Fichier `.env.example` à la racine :

```
ANTHROPIC_API_KEY=sk-ant-...   # Optionnel : active Claude. Sans clé → fallback protocoles.
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
PORT=3000

# Requis — le serveur ne démarre pas correctement sans elles (auth, profils,
# formation, SOS en dépendent). Voir supabase/schema.sql.
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...             # opérations de session (signIn/refresh) — voir createAuthClient()
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # client backend principal, contourne RLS — ne jamais exposer au frontend
```

⚠️ **`supabase/schema.sql` doit être exécuté manuellement** dans l'éditeur SQL du
projet Supabase (Dashboard → SQL Editor) avant tout déploiement sur une base
neuve — il crée les tables, les policies RLS et le trigger de création de profil.

---

## Lancer le projet

```bash
npm start          # production
npm run dev        # développement avec --watch (rechargement auto)
```

App disponible sur `http://localhost:3000`.
Canvas design sur `http://localhost:3000/canvas.html`.

### Scripts Capacitor (Android)

```bash
npm run android:add    # Une seule fois : génère le dossier android/
npm run build:mobile   # Synchronise public/ → android/ (après chaque modif front)
npm run android:open   # Ouvre Android Studio
npm run android:run    # Lance sur émulateur ou device connecté
```

---

## Architecture — deux points d'entrée

| Fichier HTML | Charge | Usage |
|---|---|---|
| `public/index.html` | `app-live.jsx` | **App réelle** — téléphone plein écran, branchée au backend |
| `public/canvas.html` | `app.jsx` | **Canvas design** — plusieurs artboards côte à côte, développement |

**Capacitor** pointe sur `webDir: "public"` → charge `index.html` automatiquement.

---

## État global partagé — `window.SM`

Défini dans `public/sm-state.js`. Toutes les données live passent par là.

```js
window.SM = {
  user: null,        // rempli après login ou bootstrap()
  token: null,       // JWT Supabase (session.access_token) après auth — plus un token "demo.<id>"
  sessionExpired: false, // mis à true par api-client.js si un refresh implicite échoue ; consommé par app-live.jsx (redirige vers 'auth')
  home: null,        // données /api/home
  emergencies: null,
  chat: { conversationId, transcript, reply, suggestedActions, loading },
  sos: { alertId, contacts, lat, lng },  // contacts : { name, phone, relation, hasAccount }
  trainingModule: null, // module sélectionné, passé à TrainingModuleScreen
  offline: false,
  autoVoiceMode: false, // posé par le micro de la carte Chat IA (screen-home.jsx) avant nav.go('chat') ; consommé une seule fois par ChatListening (live-chat.jsx) qui appelle enterVoiceMode()
}

window.SM.emit()       // notifie tous les abonnés
window.useSM()         // hook React : re-render quand SM change (compteur interne — SM lui-même garde la même référence, ne pas mettre `SM` dans un tableau de deps de useEffect)
window.SM.bootstrap()  // si un token existe : charge home + emergencies + user depuis l'API. Ne s'exécute pas sans token (évite un faux 401 avant connexion)
```

**Session persistante (`localStorage`)** — écrite par `screen-auth.jsx` (login/register) et
`api-client.js` (après un refresh) : `sm_token`, `sm_refresh_token`, `sm_expires_at` (ms epoch),
`sm_user`. Restaurée au démarrage par l'IIFE `restoreSession()` dans `app-live.jsx`.

**Client HTTP :** `window.API` défini dans `public/api-client.js` — toutes les routes API y sont
listées. Attache automatiquement `Authorization: Bearer <token>` et rafraîchit le JWT en amont de
chaque appel si l'expiration est proche (voir section Auth ci-dessous).

---

## Registre des écrans — `app-live.jsx`

```js
const PHONE_SCREENS = {
  splash:           window.SplashScreen,      // démarre toujours ici — redirige vers auth ou home
  auth:             window.AuthScreen,
  register:         window.RegisterScreen,
  home:             window.HomeMobile,
  qr_scanner:       window.QrScannerScreen,   // surchargé par screen-qr-scanner.jsx
  emergency:        window.EmergencyMobile,
  emergency_cam:    window.EmergencyCamera,
  emergency_guide:  window.EmergencyGuide,
  chat:             window.ChatListening,      // écran chat unifié
  chat_response:    window.ChatListening,      // même écran
  sos:              window.SOSCountdown,
  sos_confirm:      window.SOSConfirm,
  training:         window.TrainingMobile,
  training_module:  window.TrainingModuleScreen,
  map:              window.MapScreen,
  profile:          window.ProfileScreen,
  profile_personal: window.ProfilePersonal,
  profile_medical:  window.ProfileMedical,
  profile_contacts: window.ProfileContacts,
  qr_code:          window.QrCodeScreen,
  terms:            window.TermsScreen,
  victim_card:      window.VictimCardScreen,
};
```

Pour ajouter un écran : le définir dans un fichier `screen-*.jsx`, l'exporter sur `window`,
charger le fichier dans `index.html`, l'ajouter ici.

---

## Fichiers clés et leur rôle

### Backend (`src/`)

| Fichier | Rôle |
|---|---|
| `server.js` | Express + WebSocket. Monte : `authRoutes` → `apiRoutes` → `chatRoutes` → `sosRoutes` → `trainingRoutes`. `app.set('trust proxy', 1)` (déployé derrière le proxy Render — sans ça `req.ip` renvoie l'IP du proxy pour tout le monde, ce qui casse le rate limiting par IP). `helmet()` avec CSP explicite (voir section Sécurité) appliqué globalement avant les routes ; `express.json({limit:'8mb'})` inchangé. |
| `validate.js` | Validation manuelle légère des entrées utilisateur (pas de zod/joi — dépendances backend minimales par convention, besoin borné à quelques routes) : `isNonEmptyString`/`isOptionalString` (+ longueur max), `isValidEmail`, `isValidPhone`, `isValidIsoDate`, `isNotFutureDate` (comparaison de chaînes `YYYY-MM-DD`, lot 7 — refuse une date de naissance dans le futur, accepte hier/aujourd'hui), `isValidLatLng`, `validateImageDataUrl` (MIME jpeg/png/webp strict + taille max décodée depuis la longueur base64, photo de profil) et `validateProofDataUrl` (lot 8 — même mécanique via une fonction interne partagée `validateDataUrl`, mais MIME jpeg/png/webp**/pdf**, pour le justificatif de groupe sanguin), `rejectUnknownFields` (whitelist explicite). Utilisé par `routes/auth.js`, `routes/chat.js`, `routes/sos.js`. |
| `supabase.js` | Client Supabase principal (`supabase`, clé `service_role` — contourne RLS, jamais de session dessus) + `createAuthClient()` (fabrique de clients jetables clé `anon`, un par appel, pour `signInWithPassword`/`refreshSession`). **Ne jamais appeler une méthode qui gère une session (`signIn*`, `signOut`, `refreshSession`) sur le client `supabase` partagé** — ça fait basculer l'en-tête `Authorization` de toutes les requêtes PostgREST suivantes (y compris pour d'autres requêtes concurrentes) du `service_role` vers le JWT de l'utilisateur connecté → erreurs RLS aléatoires en prod. Toujours passer par `createAuthClient()` pour ça. |
| `store.js` | Store en mémoire + persistance JSON (`.data/db.json`). API : `get()`, `save()`, `uid(prefix)`. Ne gère plus les comptes/profils (→ Supabase) ; reste utilisé pour les alertes SOS actives et les conversations chat |
| `ai.js` | Claude via Anthropic API (premiers secours + santé générale, garde-fous stricts). Fallback déterministe si `ANTHROPIC_API_KEY` absent ou appel échoué — log explicite dans les deux cas (`[ai] Utilisation Claude API` / `[ai] Utilisation fallback PSC1 (raison: ...)`). Réponse normalisée : `{ reply, suggestedActions, protocolRef, source }`. Section système `LANGUE` : consigne stricte et non ambiguë de toujours répondre entièrement en français (aucun mot anglais), quelle que soit la langue du message de l'utilisateur, sauf instruction contraire explicite de sa part — remplace une ancienne ligne "réponds dans la langue de l'utilisateur" qui poussait légitimement Claude à répondre en anglais si l'utilisateur écrivait en anglais. Même section : phrases courtes, vocabulaire courant (pas de jargon médical complexe, terme technique expliqué entre parenthèses si nécessaire), instructions actionables directes plutôt que des explications longues. Aucun paramètre de langue n'est envoyé dans le corps de la requête `/v1/messages` (seulement `model`, `max_tokens`, `system`, `messages`) — la langue de réponse est intégralement pilotée par le texte du system prompt. |
| `routes/auth.js` | `POST /auth/register` (Supabase `admin.createUser` + upsert `profiles` + insert `emergency_contacts` + connexion immédiate — `express-rate-limit` 3/heure/IP, honeypot `website` invisible côté frontend rejeté silencieusement avant tout appel Supabase, validation des champs via `validate.js`, y compris `isNotFutureDate` sur la date de naissance) · `POST /auth/login` (`signInWithPassword` — rate limit 5/15min/IP) · `POST /auth/refresh` (`{refreshToken}` → nouveau `{token, refreshToken, expiresAt}`) · `POST /auth/change-password` · `POST /auth/google-sync` (`requireAuth` — backfille `profiles.name`/`photo` depuis `user_metadata` Google si vides, via `upsert` ; idempotent une fois les champs remplis) · `GET /me` · `PUT /me` (profil + carnet médical + remplacement complet des contacts — whitelist explicite des champs top-level et `medicalRecord.*` via `rejectUnknownFields`, 400 si un champ non prévu est présent (`role`/`id`/`email` notamment) ; `photo` validée via `validateImageDataUrl` (jpeg/png/webp, 5 Mo max)). `extractMedicalFields()` : `normalizeListField()` joint `allergies`/`conditions` en chaîne `", "`-séparée **avant** validation si le payload les envoie en tableau — cause racine du bug lot 5 (voir Conventions de code) : `isOptionalString()` exige `typeof v === 'string'`, un tableau (même vide) échoue toujours ce test, donc `PUT /me` répondait 400 dès que le formulaire profil envoyait ces champs en tableau, avant même d'atteindre Supabase. Règle de cohérence groupe sanguin (lot 8) : si `bloodType` change de valeur dans le patch, le justificatif existant est supprimé du Storage ET `blood_type_status`/`blood_type_proof_path`/`blood_type_verified_at` repassent à `declared`/`null`/`null` — jamais un statut "vérifié"/"en attente" laissé attaché à une valeur qui a changé. Exporte le middleware `requireAuth` (vérifie le Bearer token via `supabase.auth.getUser(token)`, attache `req.user`), réutilisé par `api.js`/`training.js`/`sos.js`. |
| `routes/api.js` | `/home`, `/emergencies`, `/protocols/:id`, `/vision/analyze`, `/payments/*` (**legacy/mort, voir Dette technique connue — à ne pas confondre avec `/emergency-numbers` ci-dessous, actif** — `DEMO_USER`/seed) + `/notifications` (Supabase, `requireAuth`) + `GET /config` (public — expose `SUPABASE_URL`/`SUPABASE_ANON_KEY` au frontend pour l'OAuth Google côté navigateur ; `SUPABASE_SERVICE_ROLE_KEY` n'y transite jamais) + `GET /emergency-numbers` (public, lot 7 — sert `src/data/emergency-numbers.js`, source unique des numéros SAMU/Pompiers/Police, mis en cache côté client). `/auth/request-otp` et `/auth/verify` legacy encore présents mais inutilisés par le frontend (voir Dette technique connue). **Fiche médicale QR (lots 4-5, safety/sécurité)** : `GET /medical-record/qr` (`requireAuth`) est une **lecture pure** — réutilise `qr_generated_at` existant, n'écrit qu'au tout premier accès (aucun `qr_generated_at` encore posé) ; `exp` est toujours dérivé de `gen` (+ 6 mois), jamais recalculé depuis `Date.now()`, pour que l'URL/signature reste identique tant que `gen` ne change pas. `POST /medical-record/qr/regenerate` (`requireAuth`) est la **seule** route qui écrit un nouveau `qr_generated_at` — invalide alors toute URL/QR déjà émise (voir révocation ci-dessous). Cette lecture/écriture séparée corrige un défaut du lot 4 : `GET /medical-record/qr` réécrivait `qr_generated_at` à *chaque* simple consultation de l'écran "Mon QR", ce qui invalidait silencieusement toute carte déjà imprimée. Chaque URL encode `id`, `gen`, `exp` et une **signature HMAC SHA-256** (`sig`, sur `id:gen:exp`, clé `MEDICAL_CARD_SECRET`) ajoutée à la génération ; `GET /public/medical-card/:id.png`/`.json` (public, sans auth) vérifie `sig` en temps constant (`crypto.timingSafeEqual`) **avant** toute autre décision, refuse toute URL dont `gen` est antérieur au `qr_generated_at` courant du profil (révocation réelle — une signature seule n'empêche que la falsification de l'URL, pas la réutilisation d'une ancienne URL toujours valablement signée), et échoue fermé si `MEDICAL_CARD_SECRET` n'est pas configurée (jamais de repli non signé). Les 4 motifs de refus (signature absente/invalide, expirée, révoquée) + profil introuvable renvoient tous la même réponse générique "Fiche indisponible" — le détail exact ne part que dans les logs serveur. `Cache-Control: no-store` + `Pragma: no-cache` sur `GET /medical-record/qr` et sur toutes les réponses de `/public/medical-card/:file` (y compris les refus) — données de santé, jamais en cache. **Justificatif de groupe sanguin (lot 8)** : `POST`/`DELETE`/`GET /medical-record/blood-type-proof` (`requireAuth` — upload passe le statut à `pending`, jamais `verified` ; retrait repasse à `declared` ; lecture relaie les octets depuis Storage via `service_role`, aucune URL publique/signée ne quitte jamais le serveur, chemin toujours dérivé de `req.user.id` — structurellement impossible d'atteindre le justificatif d'un autre compte). |
| `medical-card.js` | Génère la "Fiche d'urgence" visuelle : template SVG (police système `Arial, Helvetica, sans-serif` — le rendu SVG serveur ne charge pas Poppins) rasterisé en PNG par `sharp`, sections à positions Y fixes (pas de cascade dynamique) pour garantir qu'aucun profil ne peut faire déborder une section sur la suivante. `buildMedicalCardSvg()` (carte réelle) et `buildUnavailableCardSvg()` (fiche introuvable/expirée/révoquée/non signée — même rendu générique quel que soit le motif) — utilisées par `/api/public/medical-card/:id.png` dans `routes/api.js`. `formatAgeFr(ageDays)` : formatage de l'âge par paliers, français uniquement (route publique sans paramètre de langue) — voir Décisions techniques pour les 4 paliers exacts, logique dupliquée intentionnellement avec `formatAge()` de `public/frames.jsx` (pas de module partagé backend/frontend sans bundler). `bloodTypeStatusFr(status)` : texte + couleur des 3 états déclaré/en attente/vérifié (lot 8) sur la carte PNG. |
| `routes/chat.js` | `POST /chat` (Claude ou fallback — message limité à 2000 caractères, `lang` normalisée à `FR`/`EN`) · `GET /conversations` |
| `routes/sos.js` | `POST /sos/trigger` (`requireAuth` — vérifie `hasAccount` via la table `profiles` par téléphone, insère dans `notifications` Supabase). **Distinction volontaire, à ne jamais fusionner** : position **ABSENTE** (`lat`/`lng` tous les deux `undefined`/`null`) est **acceptée** — l'alerte part quand même, sans coordonnées, plutôt que de bloquer un utilisateur en détresse ; position **FOURNIE MAIS INVALIDE** (un seul des deux présent, ou hors plage réelle) est **toujours rejetée en 400** — safety-critical, mieux vaut échouer clairement qu'envoyer une position erronée aux secours/contacts. Aucun défaut fabriqué côté serveur (l'ancien repli silencieux sur Abidjan `5.354/-3.987` a été retiré, voir Décisions techniques) : un défaut a exactement la même forme qu'une vraie position GPS, rien ne permettrait de le distinguer une fois parti vers les secours. · `GET /sos/:id/status` · `POST /sos/:id/cancel` (en mémoire, non protégés) — pas de WebSocket ni de simulation, la position vient du GPS réel du téléphone |
| `routes/training.js` | `GET /training/modules` (`requireAuth` — lit `training_progress`, statut `locked`/`unlocked`/`completed`, score clampé `[0,100]`) · `POST /training/:moduleId/complete` (`requireAuth` — upsert `training_progress`, déverrouille le module suivant si ≥ 60%) |
| `data/seed.js` | `DEMO_USER`, `EMERGENCY_LIST`, `RESCUERS`, `PAYMENT_METHODS`, `TIPS` — données statiques, plus la source de vérité des comptes (→ Supabase) |
| `data/protocols.js` | Protocoles PSC1 validés (hémorragie, étouffement, RCP, brûlure, AVC…) |
| `data/training-modules.js` | `TRAINING_MODULES` — 10 modules PSC1 ordonnés (`order`), chacun avec un quiz de 5 à 20 questions selon la difficulté. Structure bilingue : `{ id, order, icon, color, difficulty, image, fr:{title,description,steps,quiz}, en:{...} }` — `id`/`order`/`icon`/`color`/`difficulty`/`image` restent des champs canoniques indépendants de la langue (localisés côté serveur par `localizeModule()` dans `routes/training.js` selon `?lang=`), seuls `fr`/`en` portent le contenu traduit. `image` : URL Unsplash/Pexels réelle associée par thème, affichée via `FallbackImage` (`frames.jsx`) avec `mod.color` en repli — les 10 modules ont chacun une image distincte (Hémorragie/Brûlures/Fractures ont reçu des photos dédiées après un premier passage où elles partageaient une image à 3, les rendant indiscernables dans la liste) ; certaines coïncident avec une image de `DAILY_TIPS` (`screen-home.jsx`, pool de 6 photos séparé) par cohérence thématique, mais ce n'est plus un pool strictement partagé entre les deux fichiers. |
| `data/health-centers.js` | **Superseded, code mort** — `HEALTH_CENTERS`, la liste statique des 20 centres de San Pédro (utile jusque-là comme unique source), n'est plus importée par `routes/api.js` depuis le passage à une couverture nationale via la table Supabase `health_centers` (voir `scripts/sync-health-centers.js` et la section Localisation). Fichier laissé en place (les 20 mêmes entrées ont été copiées en dur dans la migration SQL de `supabase/schema.sql`, source `'seed-manuel'`) plutôt que supprimé — candidat à un nettoyage futur, voir Dette technique connue. |
| `data/emergency-numbers.js` | `EMERGENCY_NUMBERS = { samu: '185', pompiers: '180', police: '110' }` — **source unique** des numéros d'urgence (lot 7). Avant ce fichier, la Police apparaissait en `110` sur les écrans SOS et en `170` dans le prompt système de l'IA/les CGU/le pied de page du chat (`src/data/protocols.js` définissait même déjà `POLICE='170'` sans que les écrans SOS ne l'utilisent) — deux valeurs réelles mais divergentes faute de source commune. `110` a été retenu comme valeur canonique parce que c'est celle déjà utilisée par la surface la plus critique (les écrans SOS), pas parce qu'une autorité externe a été consultée pour trancher entre les deux — si un numéro officiel différent devait un jour être confirmé, ce fichier est le seul endroit à corriger. `data/protocols.js` réexporte désormais SAMU/POMPIERS/POLICE depuis ce fichier plutôt que de les redéfinir. Exposé côté client via `GET /api/emergency-numbers` (`routes/api.js`) + `useEmergencyNumbers()` (`frames.jsx`, avec repli local `EMERGENCY_NUMBERS_FALLBACK` identique — un écran SOS ne doit jamais attendre un aller-retour réseau pour afficher un numéro qui compose très bien hors ligne). Exception documentée : le fallback PSC1 hors-ligne de `live-chat.jsx` garde SAMU/Pompiers codés en dur (jamais la Police, absente de ces protocoles) — ce fallback existe précisément pour fonctionner réseau coupé, un appel à cette route y romprait la garantie ; `screen-sos.jsx`/`screen-chat.jsx` (canvas, données de démo statiques) restent aussi codés en dur, cohérent avec le reste des données de canvas. |

### Scripts (`scripts/`)

| Fichier | Rôle |
|---|---|
| `sync-health-centers.js` | Script **autonome**, jamais importé ni appelé par `src/server.js` — exécution en ligne de commande (`node scripts/sync-health-centers.js`), prévu pour une tâche cron (voir section Localisation ci-dessous pour le détail complet : format API, mapping de type, pagination, upsert par lots). Exporte `resolveType`/`mapFeatureToRow`/`fetchAllFeatures` en plus de son exécution directe, pour rester testable sans réseau (voir `sync-health-centers.test.js`). |
| `sync-health-centers.test.js` | Vérifie la logique de `sync-health-centers.js` (mapping de tags OSM, extraction d'une ligne, pagination) contre des données et un `fetch()` **factices** — aucun appel réseau réel, aucune écriture Supabase. Pas de framework de test (aucun n'est installé dans ce projet, voir Dette technique connue) : assertions `node:assert/strict` pures, exécution directe (`node scripts/sync-health-centers.test.js`). |

### Frontend (`public/`)

| Fichier | Rôle |
|---|---|
| `frames.jsx` | Primitives partagées : `Icon`, `PhoneFrame`, `DesktopFrame`, `TabBar`, `PulseCircle`, `Waveform`, `FloatingChatButton`, `BirthdateField`, `Banner`. `StatusBar()` et `HomeIndicator()` retournent `null`. Définit `goBack(nav)` (helper global) et `nav.canBack()`. `PhoneFrame` accepte un prop optionnel `onNavReady(nav)` (no-op si absent, `canvas.html` inchangé) pour exposer `nav` à un composant parent — utilisé par `app-live.jsx` pour piloter la navigation depuis l'extérieur (déconnexion forcée). `FloatingChatButton` : cercle rouge dégradé 52px, icône `message-circle-heart`, `position: fixed; bottom: calc(92px + env(safe-area-inset-bottom, 0px))` (92px = hauteur mesurée de `HomeTabBar` hors safe-area, +env() pour les appareils à barre d'accueil — sans le calc(), le bouton restait à distance fixe du bord et chevauchait l'onglet Profil sur ces appareils), `nav.go('chat')` — affiché sur `HomeMobile`, `TrainingMobile`, `MapScreen`, `ProfileScreen` (écran principal) et `SOSCountdown` (phase `idle` uniquement). `Icon` a une `key={safeName}` sur son `<span>` racine (pas sur le `<i>` interne) : lucide ne convertit un `<i data-lucide>` en `<svg>` qu'une seule fois, donc sans cette clé changer dynamiquement le prop `name` d'une icône déjà montée (mic/mic-off, pause/play…) restait bloqué sur le premier glyphe — voir la Décision technique dédiée. `Banner({variant, icon, title, text, stacked, children, style})` : bandeau réutilisable 4 variantes pastel (`success`/`warning`/`danger`/`info`, contraste texte/fond vérifié WCAG AA), barre d'accent 5px + icône en cercle 15% opacité ; mode par défaut texte inline (titre gras suivi du texte dans la même phrase, pour les messages courts : erreurs, toasts) ou `stacked` (titre et description sur deux lignes distinctes, pour un contenu plus long comme Conseil du jour). `speakText(id, text, lang, onEnd)` (async — voir ci-dessous) / `stopSpeech()` / `useSpeechActive(id)` / `useSpeechUnavailable(id)` : coordination partagée (`window.SM_SPEECH`) pour qu'une seule lecture Speech Synthesis soit active à la fois, quel que soit l'appelant (bulle de chat, mode vocal). `speakText` attend `waitForVoices()` (timeout 2s) avant `speak()` — `speechSynthesis.getVoices()` renvoie souvent un tableau vide au premier appel sur Android (chargement asynchrone, événement `voiceschanged`) ; un watchdog de 3s après `speak()` détecte l'absence totale d'`onstart`/`onerror` (synthèse probablement indisponible sur l'appareil) et expose ça via `useSpeechUnavailable(id)`, consommé par `ChatAIBubble` et `VoiceModeOverlay` pour afficher "La lecture vocale n'est pas disponible sur cet appareil". `stripMarkdownForSpeech` (nettoyage markdown → texte brut avant lecture) couvre gras/italique (`**`/`__`/`*`/`_`), titres, listes à puces et numérotées, citations, liens (garde le texte, jette l'URL), barré, code inline/bloc, lignes horizontales. `BirthdateField` : bascule calendrier natif / saisie texte JJ/MM/AAAA, valeur toujours exposée en ISO `YYYY-MM-DD` au parent. `formatAge(ageDays, lang)` (lot 7) : formatage de l'âge par paliers — voir Décisions techniques pour le détail exact (≥2 ans, mois+semaines, semaines+jours, jours seuls) ; duplique intentionnellement `formatAgeFr()` de `src/medical-card.js` (pas de module partagé backend/frontend sans bundler), réutilisé par `screen-qr-code.jsx` et `screen-victim-card.jsx`. `formatDate(value, lang)` (lot 7) : date en toutes lettres, réutilisé par `screen-qr-code.jsx`, `screen-victim-card.jsx`, `screen-profile.jsx` (les deux premiers dupliquaient déjà le même calcul avant factorisation). `DeclaredNotVerifiedNote` (lot 3) : mention bilingue "déclaré, non vérifié médicalement" sous allergies/antécédents sur `screen-victim-card.jsx` (jamais sur un état vide). `BloodTypeStatusNote` (lot 8) : même principe mais à 3 états (déclaré/en attente/vérifié) pour le groupe sanguin — réutilisé par `screen-qr-code.jsx` et `screen-victim-card.jsx`, voir Décisions techniques. `useEmergencyNumbers()`/`EMERGENCY_NUMBERS_FALLBACK` (lot 7) : hook partagé par tous les écrans affichant les numéros d'urgence — voir `data/emergency-numbers.js`. `FallbackImage({src, alt, fallbackColor, style, imgStyle})` : image avec fond de secours en couleur unie — le fond reste visible (fondu en opacité) tant que l'image charge, et RESTE affiché si elle échoue (`onError`), jamais d'icône "image cassée" ; utilisé pour toutes les photos réelles ajoutées aux conseils du jour et modules de formation (voir `screen-home.jsx`/`screen-training.jsx`/`screen-training-module.jsx`). |
| `screen-splash.jsx` | Animation "Révélation Vitale" 6.5s : fond rouge → cercle blanc (1.5s) → logo pop-in + pulsation infinie (2.8s) → tracé ECG SVG + titre Poppins (2.8s→4.5s) → sous-titre (4.5s→5.5s) → redirection auth ou home. Si le token restauré expire bientôt, attend un `window.API.refreshSession()` avant de décider (sinon atterrissage sur `home` avec un token déjà mort). |
| `screen-auth.jsx` | `AuthScreen` (logo + tagline, email + mdp, bouton "Continuer avec Google" **fonctionnel** — `handleGoogleLogin()` appelle `getSupabaseClient()` puis `signInWithOAuth({provider:'google'})`, redirige immédiatement vers Google ; état `googleLoading` pendant la redirection, message clair si le SDK Supabase (CDN) est inaccessible plutôt qu'une exception JS. Bouton Apple resté purement visuel, sans `onClick`) · `RegisterScreen` (2 étapes : infos perso + profil médical, date de naissance via `BirthdateField`) — champ honeypot `website` invisible (hors écran, `aria-hidden`, `tabIndex -1`, jamais `display:none` pour ne pas être détecté comme tel par un bot) dans le formulaire de l'étape 1, envoyé tel quel à `POST /auth/register` qui rejette silencieusement si rempli. Messages d'erreur (connexion et les 2 étapes d'inscription) via `<Banner variant="danger" icon="alert-circle">`. `applySession()` sauvegarde `sm_token`/`sm_refresh_token`/`sm_expires_at`/`sm_user` en localStorage. |
| `supabase-client.js` | Client Supabase **côté navigateur** (clé `anon`, publique), créé à la demande via `getSupabaseClient()`/`window.SM_GOOGLE_SYNC` — sert **uniquement** à l'OAuth Google (`signInWithOAuth` pour déclencher la redirection, `detectSessionInUrl`+`getSession()` pour récupérer la session au retour). `persistSession`/`autoRefreshToken` désactivés : ce client ne gère pas de session dans la durée, ce rôle reste à `sm_token`/`sm_refresh_token`/`api-client.js` — deux gestionnaires de session en parallèle risqueraient de diverger. `SM_GOOGLE_SYNC` (IIFE auto-exécutée au chargement de chaque page) : si l'URL contient un callback OAuth fraîchement reçu, synchronise la session vers le modèle applicatif habituel (`POST /api/auth/google-sync`, écrit `sm_token`/`sm_user` en localStorage) puis nettoie le fragment `#access_token=...` de l'URL. Se dégrade proprement (aucune exception) si le SDK CDN est absent. |
| `screen-home.jsx` | `HomeMobile` : logo `logo_80.png` en haut à gauche (cliquable → notifications) + salutation (nom en gras, sous-titre discret `splash.tagline` en dessous) + avatar cliquable → profil. Carte "Que se passe-t-il ?" : photo réelle (Pexels, `background-image`) + voile `var(--sm-navy-deep-soft)` pour la lisibilité du texte blanc dans les deux langues, fond de repli `var(--sm-navy-deep)` (évite un flash blanc au chargement), badge `sm-pill-badge` "Aujourd'hui", trait vert discret en bas à gauche, `sm-card-breathe` recolorée en navy (voir styles.css). Le bouton photo (tap carte → chat texte) et le bouton micro rond rouge sont deux `<button>` FRÈRES superposés en position absolue (jamais un bouton imbriqué dans un bouton) : le micro pose `window.SM.autoVoiceMode = true` avant `nav.go('chat')`, flag consommé une seule fois par un `useEffect` au montage de `ChatListening` (`live-chat.jsx`) qui appelle alors `enterVoiceMode()` — le micro déclenche donc la vraie reconnaissance vocale continue, pas juste un raccourci visuel vers l'écran texte. Carte QR : icône `qr-code` dans `sm-icon-tile` bleu pastel + indicateur `sm-icon-circle` bleu pastel à droite. Section Conseil du jour : en-tête icône ampoule + titre (le lien décoratif "Voir plus" qui s'y trouvait, sans aucune fonctionnalité derrière, a été retiré au lot 9 — un contrôle qui ne fait rien n'a pas sa place dans l'app), `TipOfDayCard` (composant LOCAL à ce fichier, pas le `Banner` partagé — Banner sert aussi de toast profil/bandeau GPS, un style dédié ici évite de dévier ces usages) : dégradé vert doux → blanc (adapté en sombre via `useTheme()`, couleurs de texte calquées sur `BANNER_VARIANTS(_DARK).success` de `frames.jsx`), image spécifique par conseil (`tip.image`, un pool de 6 photos Unsplash/Pexels réparties par thème sur les 7 `DAILY_TIPS` — un seul doublon assumé entre Étouffement et Malaise) via `FallbackImage` (`frames.jsx`) avec fond vert pastel en repli. `HomeTabBar` (aussi utilisée par Formation/Localisation/Profil/SOS) : fond `var(--sm-navy-deep)` uni (remplace l'ancien dégradé bleu), icônes/labels blancs, trait vert `var(--sm-green)` sous l'icône de l'onglet actif (remplace l'ancienne bordure blanche en haut) — la barre garde sa place quand inactive pour ne jamais faire varier la hauteur de la tabbar (mesure dont dépend `FloatingChatButton`, voir `frames.jsx`). Bouton SOS central réduit (54px, était 60px) pour rester proportionné. Racine `<div position:absolute;inset:0>` (pas un Fragment — nécessaire pour que le safe-area CSS centralisé s'applique, voir Décisions techniques). `HomeDesktop` · `Sidebar` (canvas uniquement, inchangés). |
| `screen-emergency.jsx` | `EmergencyMobile` (racine `<div position:absolute;inset:0>`, idem `HomeMobile`) · `EmergencyCamera` · `EmergencyGuide` (version canvas — la version live vient de `live-emergency.jsx`) |
| `screen-chat.jsx` | **`ChatScreen`/`ChatListening`/`ChatResponse` sont du code mort en production** — chargé par `index.html` mais entièrement remplacé par `live-chat.jsx` (voir surcharge ci-dessous), seul `canvas.html` (outil de design) les exécute réellement. `ChatScreen` contient encore le même bug lot 9 (double frontière `border` + `boxShadow`) que celui corrigé sur `live-chat.jsx` — volontairement non corrigé ici, voir Dette technique connue. **En revanche `ChatUserBubble`/`ChatAIBubble`/`ChatTypingDots`, définis dans ce même fichier, restent réellement utilisés en production** : `live-chat.jsx` ne les redéfinit pas et compte sur les versions exposées ici via `Object.assign(window, ...)` — retirer ce fichier casserait l'app réelle, malgré `ChatScreen` mort à côté. `ChatScreen` unifié (canvas statique). `ChatUserBubble` accepte un prop `image` optionnel (aperçu photo dans la bulle). `ChatAIBubble` accepte `id`/`lang` (identifiant + langue pour la lecture voix) : rend le texte via `renderMarkdown`/`parseInlineMarkdown` (parseur ligne par ligne maison — **gras**, titres `#`/`##`/`###`, listes `-`/`*` → `<ul><li>`, pas de lib externe) au lieu de texte brut, et affiche un bouton haut-parleur (`speakText`/`useSpeechActive`) qui lit la réponse à voix haute et s'arrête au second clic, plus un texte discret "La lecture vocale n'est pas disponible sur cet appareil" si `useSpeechUnavailable(id)` (voir frames.jsx). `ChatTypingDots` (indicateur pendant `loading`) : 3 points uniquement, aucun texte d'accompagnement — chacun sur la même animation CSS (`sm-typing-dot`, opacité 0.25→1→0.25) avec un `animation-delay` décalé (0/0.2/0.4s) pour un effet de vague façon "réflexion" plutôt qu'un clignotement synchronisé. Le texte de la bulle IA porte `className="sm-chat-selectable"` (seul endroit où `user-select` reste actif, voir styles.css). Surchargé par `live-chat.jsx` en live. |
| `screen-sos.jsx` / `live-sos.jsx` | **`screen-sos.jsx` est entièrement du code mort en production** (contrairement à `screen-chat.jsx` ci-dessus, qui partage des bulles réellement utilisées) : il n'exporte que `SOSCountdown`/`SOSConfirm`, tous deux réécrits par `live-sos.jsx` (chargé après dans `index.html`) — seul `canvas.html` exécute la version de `screen-sos.jsx`. Contient encore le même bug lot 9 (double frontière) sur son bouton Annuler, jamais corrigé ici (voir Dette technique connue). `SOSCountdown` (idle : grand bouton rouge pulsant + numéros rapides SAMU/Pompiers/Police en `sm-icon-tile`/`sm-icon-circle` bleu/orange/rouge pastel — même structure que la carte QR de l'accueil, pas d'aplat rouge plein réservé au seul bouton SOS ; counting : compte à rebours 5s sur un disque `var(--sm-shadow-md)`, cercle SVG rouge, vibration, GPS réel via `navigator.geolocation`) · `SOSConfirm` (carte Leaflet réelle centrée sur la position déclarée, "Alerte déclenchée" via `<Banner variant="success">` plutôt qu'un bloc vert fait main, liste des contacts avec badge "Notifié dans l'app" si `hasAccount`, sinon bouton "Alerter via WhatsApp" qui ouvre `wa.me` avec message + lien Google Maps géolocalisé — message généré dans la langue active de l'utilisateur, voir `buildWaUrl(..., lang)`). `live-sos.jsx` surcharge entièrement `screen-sos.jsx`. |
| `screen-training.jsx` | `TrainingMobile` — parcours façon Duolingo : liste des 10 modules PSC1 avec barre de progression globale, déverrouillage séquentiel (toast si module verrouillé cliqué), badges de difficulté pastel (`DIFF_STYLES_T`), vignette photo par module (`mod.image` via `FallbackImage`, coins arrondis alignés sur l'échelle `sm-icon-tile`), `FloatingChatButton`. |
| `screen-training-module.jsx` | `TrainingModuleScreen` — détail d'un module + quiz progressif (5 à 20 questions selon le module), soumission du score à `POST /training/:moduleId/complete`, déverrouille le module suivant si réussite ≥ 60%. Illustration d'en-tête (`mod.image` via `FallbackImage`, ~130px, fond de repli `mod.color`) affichée en haut de la phase Étapes, au-dessus du titre et du contenu. Texte des étapes en 16px (relisibilité). `useEffect` sur `mod?.id` qui réinitialise `phase`/`result` à chaque changement de module — sinon `nav.go('training_module')` vers le module suivant réutilisait le composant déjà monté et restait bloqué sur l'écran de résultat de l'ancien module. `QuizPhase` garde en mémoire (`wrongAnswersRef`) chaque question ratée (texte, réponse donnée, bonne réponse), transmis à `ResultPhase` via le résultat. Écran de résultat : bloc titre/message ("Module complété !"/"Essayez encore") via `<Banner variant="success"|"danger">` plutôt qu'un titre centré fait main ; dès que le score n'est pas 100%, section "Questions à revoir" listant chaque erreur (réponse donnée en rouge ✗, bonne réponse en vert ✓, couleurs alignées sur celles du `Banner`). Boutons : échec (< 60%) → "Recommencer le quiz" (`handleRetry`, repasse par les étapes) ; validé mais imparfait (60–99%) → "Module suivant" reste l'action principale (si dispo), + bouton secondaire "Revoir mes erreurs et refaire le quiz" (`handleRetryQuiz`, saute directement au quiz sans repasser par les étapes — la matière est déjà maîtrisée). |
| `screen-map.jsx` | `MapScreen` — module Localisation : carte Leaflet + liste des centres de santé, chargée via `window.API.healthCenters(lat, lng)` (`GET /api/health-centers`, désormais couverture nationale, voir section Localisation), position GPS temps réel via `navigator.geolocation.watchPosition`, distance Haversine (calculée côté client, redondante avec celle déjà renvoyée par le backend — comportement préexistant, inchangé), tri par proximité, filtres (Tous / Hôpitaux / Cliniques / Dispensaires / 24hsur24 — chip actif en `var(--sm-navy-deep)`, cohérent avec la tabbar). **Filtres partiellement obsolètes depuis le passage à healthsites.io** (fichier non modifié par ce changement, voir Décisions techniques) : "Dispensaires" ne matche plus aucun centre (la nouvelle taxonomie `type` n'a pas cette valeur, tout est reclassé en `hopital`/`clinique`/`pharmacie`/`centre_sante`/`autre`), et "24h" ne renvoie plus jamais de résultat (`available24h` n'existe plus dans les données). `TYPE_ICON`/`TYPE_COLOR`/`TYPE_BG` ne couvrent que `hopital`/`clinique`/`maternite`/`dispensaire`/`public` (anciennes valeurs) — un centre `pharmacie`/`centre_sante`/`autre` retombe sur l'icône/couleur générique (`map-pin`/`var(--sm-ink)`/`#F1F2F4`), pas de crash, juste moins distinctif visuellement. Appel direct par centre — bouton "Appeler" remplacé par "Numéro non disponible" (désactivé) si `phone: null`. Mention d'attribution discrète sous la carte (`map.osm_attribution`, licence ODbL — légalement requise, les tuiles ET désormais les centres de santé sont des données OpenStreetMap ; le badge Leaflet natif reste désactivé, `attributionControl: false`, pour rester cohérent avec le style de l'app). Si la géolocalisation échoue en `PERMISSION_DENIED` **et** que `isIOSDevice()` détecte iOS (userAgent, avec le cas iPad qui se présente en `Macintosh` + `maxTouchPoints`), remplace le bouton "Réessayer" (inopérant sur iOS une fois le refus enregistré) par les instructions manuelles Réglages → Safari → Position — "Réessayer" reste actif pour Android et les autres cas. Le bandeau d'erreur GPS utilise `<Banner variant="warning" icon="alert-circle">` avec `children` (titre + instructions/bouton conditionnels selon `denied`/iOS). `FloatingChatButton`. |
| `live-chat.jsx` | Chat live complet : POST `/api/chat` (premiers secours + santé générale, garde-fous, mémoire de conversation complète), fallback PSC1 local (6 protocoles embarqués) — déclenché **uniquement** sur vraie panne réseau (`err.isNetworkError`), jamais sur une réponse serveur en erreur. `send()` retourne le résultat (utilisé par le mode vocal). Saisie vocale ponctuelle (bouton micro) : le transcript remplit le champ texte, **n'envoie jamais automatiquement** — confirmation par le bouton d'envoi comme au clavier. **Mode vocal continu** (bouton casque dans l'en-tête, `VoiceModeOverlay`) : écoute continue (`SpeechRecognition` `continuous`+`interimResults`), détection de fin de phrase par timeout de silence ~1.5s (+ `onspeechend` en complément), envoi auto à `/api/chat`, lecture de la réponse en Speech Synthesis (id partagé `'voice-live'` avec le bouton haut-parleur de la bulle affichée dans l'overlay — cliquer dessus interrompt la lecture), micro coupé pendant que l'app parle puis réécoute automatique à la fin. États visuels écoute/réflexion/réponse/pause/erreur, pause et sortie à tout moment. Watchdog de 3s après `rec.start()` (saisie ponctuelle ET mode continu) : si ni `onstart` ni `onerror` ne s'est déclenché, affiche un message clair au lieu de laisser l'UI bloquée sur "en écoute" — silence typique de Samsung Internet, qui expose souvent `webkitSpeechRecognition` sans que la reconnaissance fonctionne réellement. `isSamsungInternet()` (UA sniffing, même pattern que `isIOSDevice()` dans `screen-map.jsx`) adapte le message ("non supporté" et "watchdog silencieux") pour inviter explicitement à utiliser Chrome. Logs console `[voice]`/`[speech]` à chaque étape clé (démarrage/résultat/erreur reconnaissance, démarrage/onstart/fin synthèse) — rendre les échecs visibles plutôt que silencieux. Envoi image (aperçu dans la bulle, texte envoyé au vrai pipeline Claude — le system prompt lui interdit de prétendre diagnostiquer visuellement), auto-scroll, indicateur En ligne/Hors ligne. Surcharge `ChatListening` et `ChatResponse`. |
| `live-emergency.jsx` | Version branchée backend de l'urgence — surcharge `EmergencyGuide` de `screen-emergency.jsx` (racine `<div position:absolute;inset:0>`, pas un Fragment, même raison que `HomeMobile`) |
| `screen-profile.jsx` | `ProfileScreen` : en-tête dégradé `linear-gradient(180deg, #f8f9fa, white)` (aligné sur SOS/Localisation/`SubHeader`, remplace un fond blanc plat), carte profil avec barre de progression (complétion calculée sur 12 points : infos perso + médicales + contacts), badge "Profil complet" à 100%, badge "À compléter" sur la section médicale si groupe sanguin ou allergies manquants, `FloatingChatButton`. Navigue vers 3 sous-écrans dédiés : `ProfilePersonal` (infos perso, date de naissance via `BirthdateField`), `ProfileMedical` (carnet médical), `ProfileContacts` (contacts d'urgence, max 5, remplacement complet côté backend). Avatar + photo (resize canvas), changement mdp (Bearer token requis), déconnexion (nettoie aussi `sm_refresh_token`/`sm_expires_at`). Mode édition avec champs bleutés, barre sticky Annuler/Sauvegarder, `ProfileToast` (succès uniquement, `<Banner variant="success">`, positionnement absolu `top: 70` par-dessus l'écran — décalage deviné pour la hauteur du `SubHeader`, jamais mesuré, mais sans conséquence pratique pour un toast de succès éphémère). **Les erreurs (lot 8), elles, ne passent plus par ce composant** : `<Banner variant="danger">` est rendu EN LIGNE dans le flux normal du document (juste au-dessus de la barre Annuler/Sauvegarder, ou en tête de corps pour l'écran principal) — jamais un positionnement absolu à coordonnées fixes, qui avait rendu invisible le message d'erreur de `ProfilePersonal` sur certains rendus (le décalage devine ne correspondait à rien de visible à l'écran). Voir Décisions techniques. Corps scrollable (`overflow-y:auto`) — le corps est lui-même `display:flex; flex-direction:column` (pour son `gap` entre cartes), ce qui a longtemps empêché tout défilement même avec le fix `min-height:0` : ses enfants directs (les 3 cartes) héritaient de `flex-shrink:1` et se COMPRESSAIENT pour tenir dans l'espace disponible au lieu de déborder — "Changer le mot de passe"/"Conditions générales" invisibles sans qu'aucun `scrollHeight > clientHeight` ne se déclenche jamais. Voir styles.css pour le fix `flex-shrink:0` correspondant. Vérifié atteignable jusqu'à "Se déconnecter" sur iPhone SE (375×667, safe-area nulle sur un vrai appareil) et standard (390×844 avec safe-area réaliste). |
| `screen-qr-code.jsx` | Affichage du QR PNG médical personnel (depuis `/api/medical-record/qr`, `requireAuth`) — le QR affiché encode désormais une URL image publique (`/api/public/medical-card/:id.png`), pas du JSON brut, mais l'écran lui-même est inchangé (`qrDataUrl` reste une image du motif QR, `payload` reste le récapitulatif affiché sous le code). |
| `screen-terms.jsx` | Conditions générales d'utilisation (8 sections). |
| `screen-victim-card.jsx` | Fiche d'urgence victime après scan QR : groupe sanguin rouge, allergies orange, contacts avec appel direct. Alimentée par `window.SM_VICTIM`, posé par `screen-qr-scanner.jsx` (nouveau format URL image ou ancien format JSON brut). |
| `screen-qr-scanner.jsx` | Scanner QR (surcharge `QrScannerScreen`). Natif : `@capacitor-mlkit/barcode-scanning`. Web : file input + jsQR. `handleRaw()` : si le contenu scanné est une URL `/api/public/medical-card/:id.png` (format courant), en extrait l'id + `gen`/`exp` et recharge les données via la variante `.json` de la même route pour rester **en interne** (pas d'ouverture de l'image dans un navigateur externe) ; l'ancien format JSON brut reste supporté pour ne pas casser un QR déjà généré avant la migration. Navigue vers `victim_card` dans les deux cas. |
| `app-live.jsx` | Point d'entrée app réelle. Registre `PHONE_SCREENS`. Démarre toujours sur `splash` (qui redirige). Récupère `nav` via `onNavReady` et observe `SM.sessionExpired` (sans tableau de deps — `useSM()` renvoie toujours la même référence, `[SM]` ne se redéclencherait jamais) pour rediriger vers `auth` si un refresh implicite échoue en session. Classe CSS `sm-live` pour le plein écran natif. Bandeau "Backend injoignable" (`SM.offline`) via `<Banner variant="danger" icon="wifi-off">`. |
| `app.jsx` | Point d'entrée canvas design. Sections : 0·Auth · 1·Accueil · 2·Urgence · 3·Chat · 4·SOS · 5·Formation |
| `sm-state.js` | Bus d'état global `window.SM`. `bootstrap()` ne s'exécute que si un token existe ; n'affiche pas le bandeau hors-ligne si l'échec vient d'une session invalidée (token déjà effacé par un refresh raté) plutôt que d'une vraie panne réseau. |
| `api-client.js` | Client HTTP `window.API` — toutes les routes disponibles. Attache `Authorization: Bearer` automatiquement. Avant chaque appel (hors `/api/auth/*`), rafraîchit le JWT si l'expiration est à moins de 2 min (`refreshSession()`, dédoublonne les refresh concurrents). Si le refresh échoue : vide le localStorage et met `SM.sessionExpired = true`. |
| `styles.css` | Tokens CSS (`--sm-red`, `--sm-blue`, `--sm-ink`…), Poppins comme `--font-ui` (titres/`.sm-serif` en 700, texte courant en 400), `--sm-paper: #FFFFFF`, `--sm-radius: 16px`, `--sm-shadow`, composants, `.sm-live` pour plein écran natif. `.sm-live .sm-phone` : `height:100vh` en repli avant `height:100dvh` (Safari < 15.4 ne supporte pas `dvh`). `.sm-live .sm-screen > *` : `padding-top/bottom: env(safe-area-inset-*)` appliqué à l'unique enfant racine de chaque écran plutôt que dans chaque fichier — un padding sur un ancêtre positionné n'a aucun effet sur un descendant en `inset:0` (containing block = padding box), d'où le ciblage précis de cet enfant (voir Décisions techniques). `.sm-frame *` porte `-webkit-overflow-scrolling: touch` (inerte hors scroll). `body, #root` en `user-select:none` ; `input`/`textarea`/`.sm-chat-selectable` repassent en `user-select:text`. **Fix scroll, en deux règles ciblées par attribut** (`[style*="overflow-y: auto"]`, fiable quelle que soit la profondeur de nesting car React sérialise toujours cette paire kebab-case à l'identique) : (1) `min-height: 0` sur tout conteneur `overflow-y:auto` — le `min-height:auto` par défaut d'un flex item se cale sur son contenu, pas 0, donc sans ce fix un corps de page refuse de rétrécir à l'espace disponible et l'excédent est silencieusement absorbé par l'`overflow:hidden` de l'écran ; (2) `flex-shrink: 0` sur les enfants directs de tout conteneur `overflow-y:auto` qui est LUI-MÊME `display:flex` — sans ça, ces enfants (flex-shrink:1 par défaut) se compressent pour tenir dans l'espace au lieu de déborder, empêchant tout scroll de se déclencher même avec (1) en place (bug persistant sur `ProfileScreen` malgré (1), voir Décisions techniques). `sm-card-breathe` : respiration douce du box-shadow (jamais l'opacité) sur la carte "Que se passe-t-il ?", cycle 2.6s infini. `sm-typing-dot` : opacité 0.25→1→0.25, utilisé avec un `animation-delay` décalé par point pour l'indicateur de chargement du chat. |
| `tweaks-panel.jsx` | Panneau de configuration design (accent, densité, dark mode) — canvas uniquement |
| `design-canvas.jsx` | Composants `DesignCanvas`, `DCSection`, `DCArtboard`, `TweaksPanel` — canvas uniquement |

### Logos (`public/`)

| Fichier | Usage |
|---|---|
| `logo_80.png` | Header accueil + écran auth (72×72px) |
| `logo_192.png` | Favicon `index.html` |
| `logo_512.png` | Réserve PWA |
| `logo_1024.png` | Splash screen (140×140px dans l'animation) |
| `logo_transparent.png` | Fond transparent — usage futur |
| `apple-touch-icon.png` | Icône iOS "Ajouter à l'écran d'accueil" (`<link rel="apple-touch-icon">` dans `index.html`) — `logo_192.png` composité sur un fond blanc opaque (généré via `pngjs`, script jetable) : `logo_192.png` est réellement transparent (vérifié pixel par pixel), et iOS remplace la transparence par du noir sur les icônes d'écran d'accueil |

### Configuration

| Fichier | Rôle |
|---|---|
| `capacitor.config.json` | `appId: ci.sauvmoi.app` · `appName: Sauv'Moi` · `webDir: public` · `androidScheme: https` |
| `package.json` | Scripts `start`, `dev`, `android:add`, `build:mobile`, `android:open`, `android:run` |
| `.cpanel.yml` | Déploiement semi-automatique via l'outil **Git Version Control** de cPanel (o2switch) — voir section Déploiement & infrastructure. Spécifique à o2switch, n'affecte pas le déploiement Render |
| `index.html` | `viewport-fit=cover` (nécessaire pour `env(safe-area-inset-*)`), `apple-touch-icon`, `apple-mobile-web-app-capable`/`-status-bar-style`/`-title` pour l'expérience iOS "app". Charge `tweak-defaults.js` (externalisé, ex-`<script>` inline) plutôt qu'un bloc inline — permet de ne pas ajouter `'unsafe-inline'` à script-src pour CE fichier (nécessaire quand même globalement à cause de Babel Standalone, voir Sécurité ci-dessous). |

---

## Flux d'authentification — Supabase

Auth réelle (mot de passe vérifié) depuis la migration Supabase. Plus de mode démo
« n'importe quel mot de passe fonctionne » ni de compte auto-créé au premier login.

```
AuthScreen → POST /api/auth/login { email, password }
           ← { token, refreshToken, expiresAt, user }
           → applySession() : sm_token/sm_refresh_token/sm_expires_at/sm_user en localStorage
           → nav.reset('home')

RegisterScreen (étape 1) → infos perso + validation
RegisterScreen (étape 2) → profil médical (facultatif)
           → POST /api/auth/register { name, email, password, birthdate, gender,
                                       bloodType, height, weight, conditions,
                                       allergies, emergencyContact }
             │
             ├─ supabase.auth.admin.createUser(...)  (client service_role)
             ├─ trigger SQL handle_new_user → ligne vide dans profiles (name, phone)
             ├─ upsert profiles (complète tous les champs) — upsert plutôt qu'update :
             │  un update() qui ne matche aucune ligne réussirait SILENCIEUSEMENT
             │  côté PostgREST (error === null, 0 ligne)
             ├─ insert emergency_contacts si fourni
             └─ createAuthClient().auth.signInWithPassword(...) → session
           ← { token, refreshToken, expiresAt, user }
           → nav.reset('home')
```

**Refresh automatique du JWT** (expire ~1h côté Supabase) : avant chaque appel API
(hors `/api/auth/*`), `api-client.js` vérifie `sm_expires_at` et déclenche
`POST /api/auth/refresh { refreshToken }` si l'expiration est à moins de 2 minutes —
transparent pour l'appelant, la requête originale part avec le nouveau token juste après.
Si le refresh échoue (refresh token lui-même expiré/révoqué), déconnexion propre
(localStorage vidé, redirection vers `auth`).

**Client jetable pour les opérations de session** (`createAuthClient()` dans
`src/supabase.js`) : `signInWithPassword`/`refreshSession` ne sont **jamais** appelés
sur le client `service_role` partagé — voir l'avertissement dans le tableau backend
ci-dessus.

Le code OTP (legacy, routes `api.js` uniquement désormais) est toujours `123456` mais
inutilisé par le frontend. Le bouton "Continuer avec Apple" reste uniquement visuel —
aucun `onClick`, aucune intégration.

**Connexion Google (OAuth réel, via Supabase Auth) :**

```
AuthScreen → clic "Continuer avec Google" → handleGoogleLogin()
           → getSupabaseClient() (public/supabase-client.js, clé anon récupérée
             via GET /api/config) → signInWithOAuth({ provider: 'google' })
           → redirection immédiate vers Google (hors app)
           ← retour sur l'app avec #access_token=... dans l'URL
           → SM_GOOGLE_SYNC (IIFE auto-exécutée à CHAQUE chargement de page,
             avant que le splash décide de la redirection auth/home) :
             detectSessionInUrl + getSession() → POST /api/auth/google-sync
             (requireAuth, backfille name/photo depuis user_metadata si vides)
           ← { user } → sm_token/sm_refresh_token/sm_expires_at/sm_user en
             localStorage (même modèle de session que email/mot de passe)
           → nettoie le fragment #access_token=... de l'URL
```

Le token Supabase issu de l'OAuth est du même format que pour email/mot de passe
(vérifié par `requireAuth` côté backend) — pas besoin d'un token applicatif séparé.
Se dégrade proprement (message clair, pas d'exception JS) si le SDK Supabase (CDN)
est inaccessible.

---

## Base de données Supabase — `supabase/schema.sql`

⚠️ À exécuter manuellement dans l'éditeur SQL Supabase avant tout déploiement sur une
base neuve (voir aussi la section Variables d'environnement).

| Table | Colonnes clés | Rôle |
|---|---|---|
| `profiles` | `id` (= `auth.users.id`), `name`, `phone`, `birthdate`, `gender`, `photo`, `city`, `role`, `lang`, `blood_type`, `height`, `weight`, `allergies` (text), `conditions` (text), `qr_generated_at` (lot 4-5), `blood_type_status`/`blood_type_proof_path`/`blood_type_verified_at`/`blood_type_verified_by` (lot 8) | Profil + carnet médical. `allergies`/`conditions` stockés en texte simple, transformés en tableaux à la lecture pour le frontend (`medicalRecord.allergies`) — même convention que l'ancien `store.js`. `height`/`weight` ajoutés par rapport à la demande initiale de schéma : le frontend (calcul de complétion du profil sur 12 points) les lit/écrit déjà, sans eux la complétion plafonnait à 10/12. `qr_generated_at` : horodatage de la dernière génération de QR médical, sert à la révocation (voir `routes/api.js` et Décisions techniques). **Groupe sanguin à 3 états** (`blood_type_status`, défaut `'declared'`, contrainte CHECK `in ('declared','pending','verified')`) : `declared` (aucun justificatif) → `pending` (justificatif téléversé, `blood_type_proof_path` pointe vers le bucket Storage privé `blood-type-proofs`, jamais une URL) → `verified` (`blood_type_verified_at`/`blood_type_verified_by` renseignés). **`verified` n'est atteignable par AUCUNE route existante à ce jour** — colonnes et logique de lecture prêtes, mais faire passer un statut à `verified` nécessite une future interface de validation médicale (un professionnel de santé authentifié qui examine le justificatif et tranche) qui n'est pas construite ; un document téléversé par l'utilisateur n'est pas un document valide en soi. |
| `emergency_contacts` | `id`, `user_id`, `name`, `phone`, `relation` | Contacts d'urgence, max 5 côté backend (400 si dépassé). `PUT /me` fait un remplacement complet (delete puis insert) quelle que soit la forme du payload (`emergencyContacts` tableau ou `emergencyContact` singulier, à plat ou nichés sous `medicalRecord`). |
| `training_progress` | `user_id` (PK), `completed_modules` (`text[]`), `scores` (`jsonb`) | Progression formation, upsert à chaque `POST /training/:id/complete`. Score toujours clampé `[0,100]` en écriture et en lecture. |
| `notifications` | `id`, `user_id`, `type`, `from_user`, `message`, `lat`, `lng`, `is_read` | Alertes in-app, alimentées par `routes/sos.js` quand un contact d'urgence a lui-même un compte. |
| `health_centers` | `id` (text, `"<osm_type>/<osm_id>"`, ex. `node/2828406228`), `name`, `type` (`hopital`/`clinique`/`pharmacie`/`centre_sante`/`autre`, CHECK), `lat`, `lng`, `phone`, `address` (nullable), `source` (`'healthsites.io'` ou `'seed-manuel'`), `synced_at` | Couverture nationale des centres de santé, table de référence publique (pas de `user_id`) écrite uniquement par `scripts/sync-health-centers.js` (upsert sur `id`), lue par `GET /api/health-centers`. RLS activée SANS AUCUNE policy — même principe que le bucket `blood-type-proofs` (voir Sécurité) : seul le backend `service_role` y accède, l'absence de policy empêche tout accès direct anon/authenticated. Voir section Localisation ci-dessous pour l'architecture complète. |

**Row Level Security** activée sur les 4 tables (`auth.uid() = id` / `= user_id`) —
mais le backend passe toujours par le client `service_role` (`src/supabase.js`), qui
contourne RLS. Les policies sont un filet de sécurité pour un futur accès direct
depuis le client, pas le mécanisme d'autorisation actuel (c'est `requireAuth` +
`req.user.id` qui filtrent les requêtes aujourd'hui).

**Trigger `handle_new_user`** (`security definer`, `after insert on auth.users`) :
crée automatiquement une ligne `profiles` (name, phone) à l'inscription. `POST
/auth/register` complète ensuite cette ligne par un `upsert` (pas un simple
`update`, voir Flux d'authentification ci-dessus).

---

## Localisation — centres de santé

**Architecture délibérée : aucun appel direct à healthsites.io au moment où
un utilisateur consulte la carte.** Sauv'Moi est une app de premiers
secours — une fonctionnalité potentiellement critique (trouver le centre de
santé le plus proche) ne doit jamais dépendre en temps réel de la
disponibilité d'un service tiers. À la place :

```
scripts/sync-health-centers.js (tâche cron, indépendant du serveur Express)
  → API healthsites.io v3 (données OpenStreetMap, licence ODbL)
  → upsert dans la table Supabase health_centers (par lots de 500)

GET /api/health-centers (routes/api.js, appelé par screen-map.jsx à chaque
  consultation de l'écran Localisation)
  → lit UNIQUEMENT la table Supabase health_centers (service_role)
  → calcule la distance (haversineKm, inchangé) si lat/lng fournis
  → jamais d'appel réseau vers healthsites.io à ce moment
```

**Table `health_centers`** : voir Base de données Supabase ci-dessus pour
le schéma complet. RLS activée sans policy (accès direct impossible depuis
un client anon/authenticated, seul le backend `service_role` la lit/écrit).

**Seed initial** : la migration SQL insère les 20 centres de San Pédro
auparavant codés en dur dans `src/data/health-centers.js` (`source:
'seed-manuel'`, id préfixés `seed/...`) — garantit qu'il n'y a jamais de
régression (carte vide) si le tout premier sync réel échoue ou tarde à
être programmé. Ces lignes coexistent sans conflit avec celles qu'un sync
réel écrira plus tard pour les mêmes établissements (id différents,
`seed/...` vs `node/...`/`way/...`) — un nettoyage manuel des lignes
`source = 'seed-manuel'` peut être fait après le premier sync réussi, si
souhaité, mais n'est pas automatique.

**Taxonomie `type`** : `hopital` / `clinique` / `pharmacie` / `centre_sante`
/ `autre`, déduite des tags OpenStreetMap `healthcare`/`amenity` par
`resolveType()` dans `scripts/sync-health-centers.js` (`healthcare`
consulté en priorité, plus spécifique que `amenity` quand les deux tags
coexistent sur un même établissement). Différente de l'ancienne taxonomie
(`hopital`/`clinique`/`dispensaire`/`public`/`maternite`) — voir la
Décision technique dédiée pour les conséquences côté `screen-map.jsx`
(fichier volontairement non modifié par ce changement).

**`scripts/sync-health-centers.js`** — script autonome (`node
scripts/sync-health-centers.js`), jamais importé par `src/server.js` :
- Lit `HEALTHSITES_API_KEY` (voir `.env.example`) — abandonne immédiatement
  si absente.
- Interroge `GET https://healthsites.io/api/v3/facilities/` avec
  `api-key`, `page` (pagination incrémentée jusqu'à une page vide — la
  documentation officielle ne précise pas de total explicite),
  `country=Côte d'Ivoire`, `output=geojson`, `flat-properties=true`.
  Garde-fou `MAX_PAGES` (500) pour ne jamais boucler indéfiniment en tâche
  cron non surveillée.
- Récupère **tous les types d'établissements**, sans filtrer (conforme à
  la demande) — le filtrage se fait uniquement au niveau du `type` déduit,
  pas au niveau de la requête HTTP.
- `mapFeatureToRow()` convertit chaque feature GeoJSON en ligne
  `health_centers` — défensif par construction (plusieurs noms de champs
  plausibles essayés dans l'ordre pour `phone`/`address`, une ligne
  inexploitable — coordonnées ou id OSM manquants — est ignorée plutôt que
  de faire échouer tout le sync).
- Upsert Supabase par lots de 500 lignes (`onConflict: 'id'`) — une table
  nationale peut compter plusieurs milliers d'établissements, un seul
  appel risquerait timeout/limite de charge.
- Log clair à la fin : nombre d'établissements récupérés depuis
  healthsites.io et nombre réellement synchronisé (inséré ou mis à jour)
  dans Supabase, plus un avertissement si des lignes ont été ignorées.
- N'écrit jamais une table vide par erreur : si la réponse API ne produit
  aucune ligne exploitable, le script échoue explicitement (`process.exit(1)`)
  **sans toucher à Supabase**, plutôt que de purger silencieusement les
  données existantes.

⚠️ **Format de réponse healthsites.io non vérifié contre un appel réel** au
moment où ce script a été écrit — la clé `HEALTHSITES_API_KEY` n'était pas
encore approuvée. Les PARAMÈTRES de requête viennent de la documentation
officielle (`https://healthsites.io/api/docs/`), consultée directement.
Les noms de CHAMPS dans chaque `properties` GeoJSON (`amenity`,
`healthcare`, `name`, `phone`, `contact:phone`, `addr:*`) sont déduits des
conventions de tags OpenStreetMap standard et d'exemples communautaires,
pas d'une réponse authentifiée observée. **`mapFeatureToRow()` est la
fonction à ajuster en priorité si le tout premier sync réel échoue ou
produit des lignes inattendues.**

**Tests** (`scripts/sync-health-centers.test.js`, `node
scripts/sync-health-centers.test.js`) : logique de mapping de type,
extraction d'une ligne à partir d'un feature GeoJSON, et pagination
(`fetch()` global stubbé) — 18 cas, aucun appel réseau réel, aucune
écriture Supabase. Ne couvre pas `upsertInBatches()` elle-même (chaînage
Supabase non trivialement simulable sans framework de mock dans ce
projet) — relu manuellement, chunking simple, risque jugé faible.

**Relancer le sync manuellement** :
```bash
# Variables requises dans l'environnement (ce projet n'utilise pas dotenv,
# voir .env.example) :
#   HEALTHSITES_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
node scripts/sync-health-centers.js
```

**Programmer en cron sur o2switch** (à faire manuellement via cPanel, pas
automatisé par ce dépôt) : cPanel → Cron Jobs → nouvelle tâche exécutant
`node /chemin/vers/sauvmoi/scripts/sync-health-centers.js` avec les trois
variables d'environnement ci-dessus disponibles dans l'environnement
d'exécution du cron (cPanel permet généralement de les préfixer directement
dans la commande, ex. `HEALTHSITES_API_KEY=... SUPABASE_URL=... node
scripts/sync-health-centers.js`, ou via un fichier chargé par
`--env-file`). Fréquence suggérée : hebdomadaire ou mensuelle — les
données OpenStreetMap de centres de santé ne changent pas au jour le jour.

**Route `GET /api/health-centers`** (`routes/api.js`) : lit désormais
`health_centers` (Supabase) au lieu du tableau statique `HEALTH_CENTERS`
— même calcul de distance (`haversineKm`, inchangé) et même forme de
réponse JSON qu'avant, à une exception assumée : `available24h`
n'existe pas dans la table (aucune donnée fiable côté OSM pour ce champ) et
n'apparaît donc plus dans la réponse — voir la Décision technique dédiée
pour les conséquences côté `screen-map.jsx` (fichier non modifié).

**Attribution ODbL** : mention `map.osm_attribution` ("Données ©
contributeurs OpenStreetMap") affichée sous la carte dans
`screen-map.jsx` — légalement requise par la licence ODbL des données
OpenStreetMap (tuiles ET, désormais, centres de santé).

---

## Sécurité

Renforcement effectué avant le lancement pilote (checklist priorisée par
criticité réelle plutôt qu'exhaustive).

**En place :**
- **Rate limiting** (`express-rate-limit`, `src/routes/auth.js`) : 5/15min/IP
  sur `/auth/login`, 3/heure/IP sur `/auth/register`, réponse 429 avec message
  bilingue FR/EN (seul message de cette route à l'être — voir plus bas).
  `app.set('trust proxy', 1)` dans `server.js` est **nécessaire** pour que
  `req.ip` reflète le vrai client derrière le proxy Render, sans quoi tout le
  monde partage la même IP apparente et le rate limit devient inopérant.
- **Headers de sécurité** (`helmet`, `src/server.js`) : CSP explicite (voir
  encadré ci-dessous), HSTS, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`. Vérifié en conditions réelles (Playwright) :
  l'app se rend sans erreur CSP, carte Leaflet + tuiles OpenStreetMap +
  images Unsplash/Pexels chargent normalement.
- **`npm audit`** : 7 vulnérabilités (dont 1 critique, `node-tar`) corrigées
  via `npm audit fix` — uniquement des montées de version mineures/patch
  (`sharp` 0.35.3→0.35.4, `express` 4.22.2→4.22.3, etc.), aucune majeure,
  `0 vulnerabilities` après coup. Revalidé (`sharp` re-testé manuellement,
  génération de fiche médicale toujours fonctionnelle).
- **Whitelist des champs modifiables** (`PUT /me`, `routes/auth.js`) :
  `rejectUnknownFields()` rejette (400) tout champ de premier niveau — ou
  nichés sous `medicalRecord`/`medical` — absent d'une liste explicite,
  avant même de lire les valeurs. `role`/`id`/`email` ne peuvent donc plus
  transiter par cette route, whitelist auditable plutôt que dépendre du fait
  qu'une route ne LIT jamais un champ non prévu (fragile si un futur
  `...body` était ajouté par erreur).
- **Validation des entrées** (`src/validate.js`, manuelle — pas de zod/joi,
  cohérent avec les dépendances backend minimales du projet) : types,
  longueurs (nom < 100, message chat < 2000, etc.), formats (email,
  téléphone, date ISO, coordonnées GPS) sur `/auth/register`, `PUT /me`,
  `/chat`, `/sos/trigger`.
- **Parseur markdown du chat** (`screen-chat.jsx`) : audité — aucun
  `dangerouslySetInnerHTML` dans tout le frontend (`grep` sur `public/`),
  `parseInlineMarkdown`/`renderMarkdown` ne produisent que des éléments React
  (texte + `<strong>`), jamais du HTML brut injecté. Testé en conditions
  réelles avec un message contenant `<script>alert(1)</script><img src=x
  onerror=alert(2)>` : rendu en texte échappé (`&lt;script&gt;...`), zéro
  `<script>`/`<img>` dans le DOM final, aucune exécution.
- **Upload photo de profil** (`PUT /me`) : `validateImageDataUrl()` limite
  strictement le type MIME à `image/jpeg`/`image/png`/`image/webp` (rejette
  explicitement `image/svg+xml`, qui peut embarquer du script) et la taille
  décodée à 5 Mo, avant tout `update` Supabase.
- **Honeypot anti-bot** (`POST /auth/register`) : champ `website` invisible
  (hors écran, pas `display:none`) ajouté au formulaire d'inscription
  (`screen-auth.jsx`) — rejeté silencieusement (400 générique, aucun détail
  sur la détection) avant tout appel Supabase si rempli. Protection simple
  contre les bots qui scrapent/remplissent le formulaire à l'aveugle ; n'a
  pas d'effet contre un bot qui appelle l'API JSON directement sans jamais
  charger la page — le rate limiting reste la défense principale contre ce
  cas-là.
- **Policies RLS Supabase (`supabase/schema.sql`) : accordent, ne refusent
  jamais.** Une policy RLS accorde toujours des droits, elle n'en retire
  jamais ; plusieurs policies permissives sur une même table se combinent
  par OU (la moins restrictive l'emporte, il n'existe pas de policy
  "restrictive" par défaut) ; sans clause `to`, une policy s'applique à
  PUBLIC (rôle anonyme compris) ; l'ABSENCE de policy est le refus par
  défaut — RLS actif sur une table = personne n'a accès tant qu'aucune
  policy ne l'accorde explicitement. Trouvé en pratique (lot 8) : une
  version antérieure de `supabase/schema.sql` créait sur `storage.objects`
  une policy `using (bucket_id != 'blood-type-proofs')` en pensant
  interdire l'accès direct au bucket des justificatifs de groupe sanguin —
  elle faisait l'inverse, accordant un accès PUBLIC (anonyme compris) en
  lecture/écriture à TOUS LES AUTRES buckets Storage du projet. Jamais
  exécutée en production ; corrigée en retirant purement et simplement la
  policy — l'absence de policy sur ce bucket est déjà la protection voulue
  (le backend y accède via `service_role`, qui contourne RLS, comme pour
  les 4 tables ci-dessus). Avant d'écrire une policy dont la condition
  "ressemble" à une interdiction (`!=`, `not`, `<>`...), vérifier ce
  qu'elle ACCORDE réellement plutôt que ce qu'elle semble refuser.

**Content-Security-Policy — compromis assumé et documenté :** l'app n'a pas
de bundler (voir Stack technique) : tout le JSX est transpilé et exécuté EN
DIRECT dans le navigateur par Babel Standalone. Vérifié empiriquement
(testé, cassait tout l'écran) : Babel Standalone n'utilise pas
eval()/Function() pour exécuter le code transpilé, il l'injecte comme un
nouvel élément `<script>` avec le code en texte — traité par le navigateur
comme du script inline, quel que soit le `<script src="...">` d'origine.
`script-src` a donc besoin à la fois de `'unsafe-inline'` ET `'unsafe-eval'`
(regenerator-runtime utilise aussi `Function()`), ce qui limite fortement ce
que la CSP protège réellement contre une injection de script. C'est un
compromis inhérent à l'architecture "sans bundler" de ce projet, pas un
oubli — voir le point suivant pour la mitigation qui en tient compte.
Les autres directives restent une vraie protection indépendante de cette
limite : `connect-src` (uniquement `'self'`, l'API Sauv'Moi et
`*.supabase.co`) empêche qu'un script injecté exfiltre des données vers un
domaine arbitraire, `object-src 'none'` bloque les plugins, `frame-ancestors`
+ `X-Frame-Options: DENY` bloquent le clickjacking. `canvas.html` (outil de
design, données synthétiques uniquement) partage la même CSP — son
`<script>` inline (bloc EDITMODE réécrit par l'éditeur visuel, voir
`tweaks-panel.jsx`) fonctionne déjà avec `'unsafe-inline'` puisqu'il est
nécessaire de toute façon pour l'app réelle.

**Stockage des tokens (localStorage) — risque connu, mitigation sans
refonte :** `sm_token`/`sm_refresh_token` restent en `localStorage`
(`api-client.js`), un vecteur classique de vol de session en cas de faille
XSS — une migration vers des cookies `httpOnly` supprimerait ce risque mais
représente une refonte du flux d'auth (cookies cross-origin entre le
frontend statique et l'API, gestion CSRF, `sameSite`) trop risquée juste
avant un lancement pilote. Décision : ne pas migrer maintenant, réduire le
risque autrement, et **reconsidérer après le pilote** avec plus de temps
pour une migration testée correctement :
- La CSP ci-dessus (`connect-src` restreint) limite déjà où un script
  injecté pourrait exfiltrer un token volé, même si elle ne peut pas
  empêcher l'injection elle-même (voir compromis ci-dessus).
- Durée de vie du token d'accès : contrôlée par la configuration du projet
  Supabase (Dashboard → Authentication → Settings → JWT expiry), pas par ce
  code — actuellement ~1h (voir `sessionExpiresAtMs()` dans
  `routes/auth.js`), déjà raisonnablement courte plutôt que "longue". Le
  refresh automatique et transparent (`api-client.js`, avant chaque appel si
  expiration < 2 min) rend déjà une durée courte invisible pour
  l'utilisateur — aucune régression UX à réduire encore ce paramètre côté
  Supabase si souhaité, mais ce n'est pas un changement que ce code peut
  faire lui-même.
- **À faire après le pilote** : migration complète vers des cookies
  `httpOnly`/`secure`/`sameSite` pour `sm_token`/`sm_refresh_token`, avec le
  temps nécessaire pour traiter CSRF et le flux cross-origin proprement.

---

## Décisions techniques prises

| Sujet | Décision | Raison |
|---|---|---|
| Build | Pas de bundler | Démo hackathon — zéro config, démarrage immédiat |
| Auth | Email + password (pas OTP en principal), migré vers Supabase (JWT réel) | Plus universel sur mobile ; vraie auth pour un vrai produit plutôt que des tokens `demo.<id>` |
| Auth : clients Supabase | `service_role` partagé pour tout le CRUD backend, `createAuthClient()` (clé `anon`, instance jetable) pour `signInWithPassword`/`refreshSession` uniquement | Appeler une méthode de session sur le client `service_role` fait basculer l'`Authorization` de toutes les requêtes PostgREST suivantes (y compris pour d'autres requêtes concurrentes) vers le JWT de l'utilisateur — a causé une vraie panne RLS en prod avant correction |
| Auth Google : client Supabase séparé côté navigateur | `supabase-client.js` (clé `anon`, `persistSession`/`autoRefreshToken` désactivés) plutôt que de router l'OAuth par le backend | `signInWithOAuth` doit s'exécuter côté navigateur (redirection du user-agent) ; désactiver la gestion de session sur ce client évite un second gestionnaire en parallèle de `sm_token`/`api-client.js`, qui risquerait de diverger |
| `GET /api/config` | Route publique exposant `SUPABASE_URL`/`SUPABASE_ANON_KEY` (clé anon, publique par conception) au frontend | Sans templating côté serveur (fichiers statiques purs), seul moyen de transmettre ces valeurs au client sans les coder en dur ; `SUPABASE_SERVICE_ROLE_KEY` n'y transite jamais |
| Profil : upsert plutôt qu'update | `POST /auth/register` complète le profil via `upsert` (clé `id`), pas `update().eq('id', ...)` | Un `update()` qui ne matche aucune ligne (trigger pas encore visible, etc.) réussit silencieusement côté PostgREST — a causé un vrai bug (champs médicaux jamais enregistrés) avant correction |
| Refresh JWT | Automatique côté client, transparent, avant chaque appel API si expiration < 2 min | Le JWT Supabase expire après ~1h ; sans refresh l'utilisateur était déconnecté toutes les heures |
| Écran initial | `splash` (toujours) | Le splash gère lui-même la redirection auth/home selon session |
| `StatusBar` / `HomeIndicator` | `return null` dans `frames.jsx` | Le vrai OS Android gère sa propre barre |
| Plein écran natif | Classe `.sm-live` + `position: fixed; inset: 0` | Permet de garder `canvas.html` intact |
| Canvas design | `canvas.html` séparé | Préserve les artboards de maquette sans impacter l'app |
| `HomeTabBar` | Fond `var(--sm-navy-deep)` uni + trait vert sous l'icône active (refonte UI/UX Phase 1, remplace l'ancien dégradé bleu + bordure blanche) | Look app de santé pro plutôt que "template startup" ; le bleu marine profond est un chrome intentionnellement sombre dans les deux thèmes (même traitement que le splash/scanner QR), jamais réécrit sous `.sm-dark` |
| Conseil du jour | `DAILY_TIPS[getDay()]` | Simple, sans backend, 7 conseils PSC1 valides |
| Refonte UI/UX Phase 1 : `--sm-navy-deep` | Nouveau token racine (`#0D1428`), jamais redéfini sous `.sm-dark` | Bleu marine profond utilisé pour du chrome délibérément sombre dans les deux thèmes (voile de la carte Chat IA, fond de la tabbar) — même exemption de théming que `screen-splash.jsx`/`screen-qr-scanner.jsx` ; tout le TEXTE reste sur `var(--sm-ink)` (qui, lui, s'éclaircit en sombre) pour ne jamais casser le mode sombre |
| Refonte UI/UX Phase 1 : micro carte Chat IA fonctionnel | `window.SM.autoVoiceMode = true` posé par le bouton micro avant `nav.go('chat')`, consommé une seule fois par un `useEffect` au montage de `ChatListening` qui appelle `enterVoiceMode()` | `PhoneFrame.nav.go()` ne transmet pas de paramètres aux écrans ; ce flag ad hoc sur `window.SM` (même convention que `SM.trainingModule`) permet au micro d'ouvrir le chat DIRECTEMENT en mode vocal continu plutôt qu'un simple raccourci visuel vers l'écran texte |
| Refonte UI/UX Phase 2 : SOS/Formation/Localisation/Profil | Réutilisation stricte des primitives Phase 1 plutôt que de nouveaux styles par écran : `Banner` (succès pour "Alerte déclenchée" dans `live-sos.jsx` et le bloc de résultat de quiz dans `screen-training-module.jsx`, danger pour l'échec), `.sm-icon-tile`/`.sm-icon-circle` (numéros rapides SOS, même structure que la carte QR de l'accueil), `var(--sm-navy-deep)` (chip de filtre actif dans `screen-map.jsx`, cohérent avec la tabbar) | Objectif explicite : un seul design system centralisé plutôt que des variantes locales par écran — toute nouvelle carte/bandeau doit d'abord chercher si `Banner`/un token/une classe existants couvrent déjà le besoin avant d'en écrire un nouveau |
| Chat unifié | `ChatListening = ChatResponse` dans `live-chat.jsx` | Un seul écran gère tout le fil de conversation |
| Fallback chat hors-ligne | 6 protocoles PSC1 embarqués dans `live-chat.jsx` (`_PSC1`), déclenché uniquement sur vraie panne réseau (`isNetworkError`) | Indépendant du backend — fonctionne même si le serveur est coupé, mais ne doit pas masquer une vraie erreur serveur en la faisant passer pour du hors-ligne |
| Sécurité pilote : CSP avec `'unsafe-inline'`+`'unsafe-eval'` en script-src | Gardés tous les deux malgré l'affaiblissement de la CSP contre l'injection de script | Sans bundler, Babel Standalone exécute le JSX en injectant le code transpilé comme un nouvel élément `<script>` (pas via eval/Function) — retirer `'unsafe-inline'` casse le rendu de toute l'app, vérifié empiriquement. Voir section Sécurité pour la mitigation (connect-src restreint) |
| Sécurité pilote : validation manuelle plutôt que zod/joi | `src/validate.js`, fonctions pures simples | Cohérent avec les dépendances backend minimales du projet ; le besoin (types/longueurs/formats sur un nombre borné de routes) ne justifie pas une librairie de schémas complète |
| Sécurité pilote : tokens localStorage non migrés vers httpOnly | Risque documenté et mitigé (CSP connect-src, JWT ~1h + refresh) plutôt que refonte immédiate | Migration cookies httpOnly = refonte du flux d'auth (CSRF, cross-origin, sameSite) trop risquée juste avant un lancement pilote — à reconsidérer après, voir section Sécurité |
| Chat IA : périmètre élargi | System prompt couvre premiers secours **et** santé générale, avec garde-fous stricts (jamais de diagnostic affirmatif, jamais de posologie, toujours renvoyer vers un pro en cas de doute) | L'app doit rester utile au-delà de la seule urgence vitale, sans jamais se substituer à un avis médical |
| Chat IA : images | Pas d'analyse visuelle prétendue — le system prompt demande une description écrite | Aucun modèle de vision fiable branché ; mieux vaut le dire clairement que de bluffer une analyse |
| Bouton flottant Chat IA | `FloatingChatButton` dans `frames.jsx`, affiché sur les écrans principaux (pas pendant un quiz/étape de formation, pas sur les sous-écrans profil) | Accès rapide au chat depuis n'importe où sans surcharger les écrans à fort enjeu (formation en cours, etc.) |
| SOS : simulation retirée | WebSocket + simulation SAMU/secouristes supprimés, remplacés par carte Leaflet + position GPS réelle + WhatsApp + notifications in-app | La simulation temps fictif n'apportait rien face à une vraie position + de vrais canaux d'alerte (WhatsApp, notif in-app) |
| Notifications SOS | Vérification `hasAccount` par téléphone dans la table Supabase `profiles` côté `routes/sos.js` | Distingue contact avec compte (notifié in-app) vs sans compte (relayé par WhatsApp) |
| Formation | Déverrouillage séquentiel par `order` — un module ne s'ouvre que si le précédent a un score ≥ 60% | Reproduit la mécanique "parcours" façon Duolingo, incite à progresser dans l'ordre |
| Localisation | Leaflet.js + tuiles OpenStreetMap (pas de clé API pour l'affichage de la carte) | Gratuit, aucune dépendance à Google Maps, adapté à un hackathon |
| Centres de santé : sync différé plutôt qu'appel direct | `scripts/sync-health-centers.js` (tâche cron, autonome) écrit dans la table Supabase `health_centers` ; `GET /api/health-centers` ne lit QUE cette table, jamais l'API healthsites.io en direct — voir section Localisation pour l'architecture complète | App de premiers secours : une fonctionnalité potentiellement critique (trouver le centre de santé le plus proche) ne doit jamais dépendre en temps réel de la disponibilité d'un service tiers externe |
| Centres de santé : nouvelle taxonomie `type`, `screen-map.jsx` non modifié | 5 catégories (`hopital`/`clinique`/`pharmacie`/`centre_sante`/`autre`) déduites des tags OSM, remplacent l'ancienne taxonomie (`hopital`/`clinique`/`dispensaire`/`public`/`maternite`) — `screen-map.jsx` reste inchangé comme demandé | Conséquences assumées, non corrigées ici (hors périmètre du changement demandé) : le filtre "Dispensaires" ne matche plus rien (valeur absente de la nouvelle taxonomie), le filtre "24h" ne renvoie plus jamais de résultat (`available24h` n'existe pas dans `health_centers`, aucune donnée fiable côté OSM pour ce champ), et `pharmacie`/`centre_sante`/`autre` n'ont pas d'icône/couleur dédiée dans `TYPE_ICON`/`TYPE_COLOR`/`TYPE_BG` (retombent sur le style générique `map-pin`, pas de crash) |
| Centres de santé | Données statiques `HEALTH_CENTERS` (20 centres San Pédro, vérifiés 31/07/2026) codées en dur | Pas de temps pour une vraie API annuaire santé ivoirienne |
| Profil : complétion | Calcul sur 12 points (infos perso + médicales + contacts) dans `screen-profile.jsx` | Donne un objectif concret à l'utilisateur, incite à remplir le carnet médical |
| Profil : sous-écrans | `ProfilePersonal` / `ProfileMedical` / `ProfileContacts` séparés avec navigation dédiée | Remplace l'ancien formulaire unique — édition plus lisible sur mobile |
| Onglet Localisation | Actif dans `HomeTabBar` | L'écran `MapScreen` existe désormais — plus besoin de le désactiver |
| URL API | `https://sauvmoi.onrender.com` en dur dans `api-client.js` | Backend Render en prod |
| QR Scanner web | `jsQR` (CDN) + `<input type="file" capture="environment">` | Sans bundler : plugin natif accessible via `window.Capacitor.Plugins.BarcodeScanner` |
| QR médical : image PNG plutôt que JSON brut | Le QR encode une URL `/api/public/medical-card/:id.png?gen=…&exp=…` (route publique, sans auth, SVG→PNG via `sharp`) plutôt que le JSON brut encodé auparavant | Chargement instantané et compatible avec n'importe quel appareil photo/scanner (pas seulement l'app), même sur téléphone ancien ou connexion faible — un JSON brut scanné hors de l'app n'affiche rien de lisible |
| QR médical : expiration en query string | `exp`/`gen` (timestamps ms) portés par l'URL elle-même (et couverts par la signature HMAC, voir plus bas) plutôt que d'être la seule source de vérité côté serveur | La route publique n'a pas de session pour retrouver la date de génération d'un QR donné à partir du seul `id` — porter `gen`/`exp` dans l'URL évite d'avoir à les chercher ailleurs pour vérifier l'expiration. **Note (lots 4-5) : cette décision n'évite plus toute colonne serveur** — `profiles.qr_generated_at` a bien été ajoutée par la suite, mais pour un rôle différent (révocation d'anciennes URL, pas pour stocker `gen`/`exp` eux-mêmes) ; voir l'entrée "Fiche médicale QR : signature HMAC + révocation réelle" plus bas dans ce tableau |
| QR médical : layout SVG à positions Y fixes | Chaque section (allergies, antécédents, contacts) a un nombre de lignes plafonné (`wrapText`) et un slot de hauteur fixe dans `medical-card.js`, plutôt qu'un empilement dynamique | Garantit qu'aucun profil, même très rempli, ne peut faire déborder une section sur la suivante sur une image générée une fois et jamais réajustée interactivement |
| Données victime QR | `window.SM_VICTIM` (variable globale temporaire) | Passage de données entre QrScannerScreen → VictimCardScreen sans router — alimenté soit par le JSON de `/api/public/medical-card/:id.json` (nouveau format), soit directement par le JSON brut décodé (ancien format, rétrocompatibilité) |
| Boutons retour | `goBack(nav)` partout | `nav.back()` seul plante si la pile est vide — `goBack` bascule sur `nav.reset('home')` |
| Avatar accueil | Bouton cliquable → `nav.go('profile')` | Re-render immédiat via `window.useSM()` déjà présent dans `HomeMobile` |
| Police principale | Poppins (400/500/600/700) remplace Public Sans | Meilleure lisibilité mobile, look médical/app moderne |
| Fond général | `--sm-paper: #FFFFFF` (blanc pur) | Contraste maximal sur mobile, cartes qui se détachent via shadow |
| Icônes accueil | Fond `#F1F2F4` gris neutre, icônes `#1a1a1a` | Suppression des fonds colorés (vert/rose) qui nuisaient à la lisibilité |
| Splash ECG | Tracé SVG `stroke-dashoffset` → 0 | Animation native CSS, aucun JS de rendu |
| Logo splash | Pulsation `scale(1)→scale(1.08)` infinite dès phase 2 | Animation continue jusqu'à redirection — effet battement de cœur |
| Typographie | Titres (`h1-h4`, `.sm-serif`) en `font-weight: 700`, texte courant en `400` | Contraste de hiérarchie plus net sur mobile ; `.sm-serif` est utilisé sur quasiment tous les titres d'écran, donc un seul changement dans `styles.css` couvre toute l'app |
| Date de naissance | `BirthdateField` (calendrier natif ↔ texte JJ/MM/AAAA), valeur toujours exposée en ISO au parent | Certains utilisateurs préfèrent taper une date plutôt que défiler un sélecteur natif ; le format envoyé au backend doit rester stable quel que soit le mode |
| Chat IA : saisie vocale ponctuelle | Le transcript remplit le champ texte, n'envoie jamais automatiquement | Cohérence avec la saisie clavier — laisse l'utilisateur relire/corriger avant envoi, surtout critique en contexte d'urgence où une mauvaise transcription pourrait envoyer un message erroné |
| Chat IA : rendu markdown | Parseur maison ligne par ligne (`renderMarkdown`/`parseInlineMarkdown` dans `screen-chat.jsx`), pas de lib externe | Claude répond avec du markdown (`**gras**`, titres, listes) ; besoin borné à quelques patterns, une lib ajouterait une dépendance CDN de plus sans bénéfice proportionné |
| Chat IA : mode vocal continu | Un seul overlay (`VoiceModeOverlay`) réutilisant `ChatAIBubble` pour la dernière réponse (id partagé `'voice-live'`) plutôt qu'un écran séparé dupliquant la logique de conversation | Reste dans le même composant `ChatListening`, partage `messages`/`convId`/`send()` avec le mode texte ; le bouton "lire à voix haute" de la bulle affichée dans l'overlay contrôle directement la lecture auto en cours (même id de coordination) |
| Lecture à voix haute | Bus partagé `window.SM_SPEECH` (`speakText`/`stopSpeech`/`useSpeechActive` dans `frames.jsx`) | Une seule ressource audio possible côté navigateur ; sans coordination, démarrer une lecture (bouton bulle ou mode vocal) n'aurait pas coupé une lecture déjà en cours |
| `Icon` : `key={safeName}` sur le span racine | Force un remount ciblé quand le prop `name` change sur une icône déjà montée | `lucide.createIcons()` ne convertit un `<i data-lucide>` en `<svg>` qu'une seule fois — sans cette clé, changer `name` dynamiquement (mic/mic-off, pause/play, volume-1/2) restait silencieusement bloqué sur le premier glyphe. Cible le `<span>` stable (jamais touché par lucide) et non le `<i>`, pour ne pas réintroduire le crash `removeChild` que ce wrapper évitait déjà (voir commentaire dans `frames.jsx`) |
| Safe-area iOS : ciblage centralisé | `padding: env(safe-area-inset-*)` sur `.sm-live .sm-screen > *` (l'enfant racine unique de l'écran actif) plutôt que dans chaque fichier `screen-*.jsx` | Le padding d'un ancêtre positionné n'affecte pas un descendant absolument positionné en `inset:0` (containing block = padding box, qui inclut déjà le padding) — a nécessité de convertir 3 écrans qui rendaient un Fragment (`<>`) au lieu d'un unique `<div>` racine (`HomeMobile`, `EmergencyMobile`, `EmergencyGuide` live), sans quoi la règle CSS retombait sur le premier enfant du Fragment au lieu de la vraie racine |
| Sélection de texte | `user-select: none` sur `body`/`#root`, réactivé sur `input`/`textarea` et `.sm-chat-selectable` (bulles IA du chat) | Comportement "app native" (pas de sélection accidentelle au appui long) tout en gardant la copie possible pour un protocole de premiers secours affiché dans le chat |
| GPS refusé sur iOS | Détection iOS (`userAgent`, avec le cas iPad qui se présente en `Macintosh` + tactile) → instructions manuelles Réglages → Safari → Position au lieu du bouton "Réessayer" | iOS ne permet pas de rouvrir une demande de permission refusée depuis le JS — un bouton "Réessayer" y est trompeur ; reste inchangé pour Android où un nouvel essai peut légitimement redéclencher la demande |
| Icône iOS "à l'écran d'accueil" | `apple-touch-icon.png` généré (fond blanc opaque composité) plutôt que de réutiliser `logo_192.png` tel quel | `logo_192.png` est transparent — iOS remplace la transparence par du noir sur les icônes d'écran d'accueil, jamais testé/visible avant ce fix |
| Scroll cassé partout : fix en deux temps | `min-height: 0` sur tout conteneur `overflow-y:auto` (règle 1), PUIS `flex-shrink: 0` sur les enfants directs des conteneurs qui sont eux-mêmes `display:flex` (règle 2) — deux règles CSS ciblées par attribut dans `styles.css`, aucune modification par écran | La règle 1 seule a corrigé Formation/Localisation (conteneurs `overflow-y:auto` en simple `<div>`) mais pas Profil, dont le corps scrollable est LUI-MÊME une colonne flex (pour son `gap`) — ses enfants (les cartes) se compressaient silencieusement pour tenir dans l'espace au lieu de déborder, donc `scrollHeight` restait égal à `clientHeight` et rien n'était jamais détecté comme scrollable. Mesuré directement : la carte des sections tombait de 389px à 264.83px une fois l'espace contraint |
| FloatingChatButton : position bottom en `calc()` | `bottom: calc(92px + env(safe-area-inset-bottom, 0px))` plutôt qu'un `90px` fixe | 90px ne correspondait pas à la vraie hauteur mesurée de `HomeTabBar` (91.2px) et ignorait la safe-area des appareils à barre d'accueil — le bouton finissait par chevaucher l'onglet Profil sur ces appareils |
| Bandeau/bannière réutilisable | Composant `Banner` unique dans `frames.jsx` (4 variantes pastel, mode inline ou `stacked`) plutôt que des styles ad hoc dupliqués par écran | Cohérence visuelle (accueil, carte, auth, profil, bandeau hors-ligne) et un seul endroit à faire évoluer plutôt que 5 implémentations divergentes |
| Voix : attente du chargement des voix | `speakText` (async) attend `waitForVoices()` (timeout 2s) avant `speak()` plutôt que d'appeler `speak()` immédiatement | `speechSynthesis.getVoices()` renvoie souvent un tableau vide au premier appel sur Android (chargement asynchrone, événement `voiceschanged`) — sans l'attendre, la lecture pouvait échouer silencieusement |
| Voix : échecs visibles | Watchdogs 3s après `speak()`/`rec.start()` (synthèse ET reconnaissance) exposant un état "indisponible" (`useSpeechUnavailable`, messages d'input) + logs `[voice]`/`[speech]` à chaque étape | Un appareil/navigateur qui expose l'API sans qu'elle fonctionne réellement (ex. Samsung Internet) laissait l'UI bloquée en silence, sans indice pour l'utilisateur ni pour le débogage |
| Voix : détection Samsung Internet | `isSamsungInternet()` (UA sniffing, même pattern que `isIOSDevice()`) adapte les messages d'erreur pour inviter explicitement à utiliser Chrome | Samsung Internet expose souvent `webkitSpeechRecognition` (la détection par simple feature-test passe) mais son support réel du Web Speech API est historiquement incohérent |
| Chat IA : nettoyage markdown renforcé | `stripMarkdownForSpeech` étendu au-delà de `**gras**`/titres/listes à puces : italique simple, listes numérotées, citations, liens (garde le texte, jette l'URL), barré, code, lignes horizontales | La version précédente laissait passer des symboles markdown lus tels quels à voix haute (astérisques, etc.) dès que Claude utilisait une construction non couverte |
| Chat IA : français forcé | System prompt : consigne stricte "toujours répondre entièrement en français, sans aucun mot anglais" remplace l'ancienne "réponds dans la langue de l'utilisateur" | Un message en anglais poussait légitimement Claude à répondre en anglais avec l'ancienne consigne — bug confirmé par l'utilisateur |
| Carte accueil : respiration douce | `sm-card-breathe` (box-shadow uniquement, jamais l'opacité) sur la carte "Que se passe-t-il ?", 2.6s en boucle | Attire l'attention sans agressivité ni gêner la lisibilité du texte pendant l'animation |
| Indicateur de chargement chat | `ChatTypingDots` : 3 points animés en vague (delays décalés), aucun texte d'accompagnement | Alignement sur le style "réflexion" minimaliste plutôt qu'un texte "En train d'écrire…" jugé trop verbeux |
| Quiz : révision des erreurs | `QuizPhase` mémorise les questions ratées, `ResultPhase` affiche "Questions à revoir" dès que le score n'est pas 100% ; bouton secondaire "Revoir mes erreurs et refaire le quiz" (saute direct au quiz) pour un module déjà validé mais imparfait | Permet de s'améliorer même après validation (≥60%), sans forcer un repassage complet des étapes qui n'apporterait rien à quelqu'un maîtrisant déjà la matière |
| SOS : position absente vs invalide, jamais de défaut fabriqué | `POST /sos/trigger` (`src/routes/sos.js`, lot 1) accepte une position **absente** (l'alerte part sans coordonnées) mais rejette en 400 une position **fournie mais invalide** (un seul de `lat`/`lng` présent, ou hors plage réelle) — l'ancien comportement (défaut `lat=5.354, lng=-3.987, label='Abidjan'`) a été retiré. **Ne pas réintroduire un défaut silencieux dans un futur lot** : un défaut a exactement la même forme qu'une vraie position GPS, rien ne permet de le distinguer une fois parti vers les secours/contacts — c'est le module le plus safety-critical de l'app | Un utilisateur en détresse sans GPS disponible (refus, timeout, indoor) doit pouvoir déclencher une alerte quand même ; mais une coordonnée fournie et corrompue doit échouer bruyamment plutôt que d'envoyer une position erronée aux secours sans que personne ne le remarque |
| Groupe sanguin : justificatif à 3 états, jamais auto-validable | `declared` (défaut, aucun justificatif) → `pending` (justificatif téléversé, jamais auto-promu) → `verified` (colonnes `blood_type_verified_at`/`_by` prêtes, mais **aucune route actuelle n'écrit ce statut** — nécessite une future interface de validation médicale, non construite) | Un document téléversé par l'utilisateur n'est PAS un document valide ; un secouriste qui lirait "vérifié" sur la seule foi d'un upload agirait sur une confiance non méritée. Changer `bloodType` réinitialise le justificatif à `declared` (voir `routes/auth.js`) pour ne jamais laisser un statut attaché à une valeur qui a changé |
| Format d'âge par paliers | `formatAge(ageDays, lang)` (`public/frames.jsx`) et `formatAgeFr(ageDays)` (`src/medical-card.js`, même logique dupliquée côté serveur — pas de module partagé backend/frontend sans bundler) : **≥ 2 ans** → années seules ("34 ans") ; **2 semaines à < 2 ans** → mois + semaines ("2 mois et 3 semaines") ; **1 à < 2 semaines** → semaines + jours ("1 semaine et 4 jours") ; **< 1 semaine** → jours seuls ("3 jours"). Une unité à zéro n'est jamais affichée à côté d'une autre (filtrée) | Un âge en années arrondi à 0 pour un nourrisson de quelques jours est arithmétiquement juste mais trompeur pour un secouriste ; `ageDays` (jours entiers) est calculé une seule fois côté serveur et laissé à chaque surface pour choisir l'unité adaptée plutôt que de figer un format qui ne convient qu'à un cas |
| Numéros d'urgence : source unique | `src/data/emergency-numbers.js` (`{samu:'185', pompiers:'180', police:'110'}`) remplace toute occurrence codée en dur, exposé via `GET /api/emergency-numbers` + `useEmergencyNumbers()` (repli local identique, pas d'attente réseau) | La Police apparaissait en `110` (écrans SOS) et en `170` (prompt IA/CGU/pied de page chat) sans source commune ; `110` retenu parce que déjà utilisé par la surface la plus critique (SOS), pas par vérification d'une autorité externe — voir le fichier lui-même si un numéro officiel différent devait être confirmé un jour |
| Fiche médicale QR : signature HMAC + révocation réelle | URL signée `id:gen:exp` (HMAC SHA-256, `MEDICAL_CARD_SECRET`, vérifiée en temps constant) + `exp` toujours dérivé de `gen` (jamais recalculé) + révocation par comparaison à `profiles.qr_generated_at`, mise à jour **uniquement** par la route dédiée `POST /medical-record/qr/regenerate` (jamais par la simple lecture `GET /medical-record/qr`) | Sans signature, une URL sans `exp` affichait la fiche indéfiniment (les données Supabase sont relues à chaque appel) — une carte imprimée perdue/volée restait exploitable pour toujours. Séparer lecture (GET, ne doit jamais rien invalider) de régénération (POST explicite, seule à invalider) corrige un défaut du lot 4 où consulter simplement l'écran "Mon QR" invalidait silencieusement toute carte déjà imprimée |
| Erreurs de profil : jamais un positionnement absolu à coordonnées fixes (lot 8) | Les erreurs de `ProfilePersonal`/`ProfileMedical`/`ProfileContacts` (`screen-profile.jsx`) sont rendues en `<Banner variant="danger">` **dans le flux normal du document**, jamais dans un overlay `position: absolute` à un décalage deviné | Le message d'erreur ÉTAIT bien généré et injecté dans le DOM (position/z-index/opacity tous corrects), mais `ProfileToast` (`top: 70`, une valeur devinée pour correspondre à la hauteur du `SubHeader`, jamais mesurée) pouvait diverger de la hauteur RÉELLE du header selon l'appareil/le rendu — le bandeau se retrouvait alors à un endroit qui ne correspondait à rien de visible à l'écran. Un bloc en flux normal repousse le contenu autour de lui, il ne peut par construction pas finir hors du champ visible — `ProfileToast` reste utilisé pour le toast de SUCCÈS uniquement (éphémère, conséquence bien moindre s'il est mal placé) |
| Lot 9 : une seule frontière par élément | Une carte se définit par son fond ET son ombre, jamais un contour en plus (`border` retiré partout où `boxShadow` était déjà présent — `.sm-card`, cartes Accueil/QR/fiche victime/profil, boutons choix de langue, bouton pause vocal, bouton Scanner un QR). Entre deux rubriques, l'espacement sépare — les traits `borderBottom`/`borderTop` génériques entre sections ont été retirés au profit du rythme vertical, sauf chrome fixe (en-tête/pied collés sans espace au contenu scrollable, ex. `SubHeader`/`SaveBar`). Pour une longue liste où un séparateur reste utile (infos perso/médicales, contacts, champs du QR), un token unique par thème `--sm-divider` (light `#EFE9DC`, dark `#3A3A3A` — plus clair que les surfaces de carte qu'il borde, jamais l'inverse) porté par une seule classe centralisée `.sm-row-divider` dans `styles.css`, plutôt que des `border-bottom` hardcodés par écran | Un objet borduré ET ombré a deux frontières pour une seule limite, perçu comme "sale" ; un séparateur foncé sur un fond sombre se lit comme une fissure, pas un trait fin |
| `.sm-row-divider` : trait inset en `background-image`, pas `border-bottom` | `background-image: linear-gradient(var(--sm-divider), var(--sm-divider))` avec `background-size: calc(100% - 32px) 1px; background-position: center bottom`, `:last-child { background-image: none }` pour masquer automatiquement le dernier élément — les 4 déclarations `background-*` portent `!important` | Un `border-bottom` classique ne peut pas être inset (retrait des bords de la carte) sans un `margin`/`padding` supplémentaire qui casserait l'alignement des lignes ; `:last-child` évite de recalculer un index sur des listes dont certaines lignes sont conditionnelles (ex. tableau de champs du QR). `!important` nécessaire : un style inline `background: '#F4F8FF'` (raccourci) réinitialise silencieusement `background-image` à `none` en cascade CSS normale, et un style inline à priorité normale bat toujours une règle de classe à priorité normale — même logique déjà en place pour les surcharges de thème sombre dans ce fichier |

---

## Ce qui est fait ✅

- **Migration backend vers Supabase** : auth réelle (JWT, mot de passe vérifié) + Postgres (`profiles`, `emergency_contacts`, `training_progress`, `notifications`) avec RLS, en remplacement de `db.json` pour tout ce qui est compte utilisateur. Voir `supabase/schema.sql`.
- **Refresh JWT automatique** : plus de déconnexion après 1h — `api-client.js` rafraîchit le token de façon transparente avant expiration, avec déconnexion propre si le refresh échoue
- Authentification complète (connexion email/mdp réelle + inscription 2 étapes avec profil médical, contacts d'urgence sauvegardés) + session persistante (localStorage, token + refresh token)
- **Connexion Google (OAuth réel)** : `signInWithOAuth` via un client Supabase dédié côté navigateur (`supabase-client.js`), backfill automatique du nom/photo depuis `user_metadata` (`POST /api/auth/google-sync`), session synchronisée avec le même modèle que email/mot de passe — voir Flux d'authentification. Non testé en conditions réelles (pas de projet Supabase déployé disponible pendant le dev), à valider avec de vraies clés.
- Splash screen "Révélation Vitale" 6.5s : fond rouge → cercle blanc → logo pop-in → pulsation → tracé ECG → titre + sous-titre → redirection (avec refresh silencieux si le token restauré expire bientôt)
- Logo intégré partout : `logo_80.png` (auth + header accueil), `logo_1024.png` (splash), `logo_192.png` (favicon)
- Écran d'accueil redesigné : dégradé header, carte IA bleue agrandie avec respiration douce du box-shadow, QR + conseil du jour (via `Banner`), tabbar bleu dégradé avec blur + indicateur actif, onglet Localisation actif
- Avatar accueil cliquable → profil, photo si disponible, réactif via `useSM()`
- Design global Poppins : police principale, `--sm-paper` blanc, `--sm-radius 16px`, `--sm-shadow`, boutons scale(0.97)
- Écran urgence (voix + caméra IA + guidage pas-à-pas)
- **Chat IA repensé** : périmètre élargi premiers secours + santé générale, garde-fous stricts (jamais de diagnostic ni de posologie, toujours renvoyer vers un pro en cas de doute), mémoire de conversation complète transmise à Claude, log serveur explicite (Claude vs fallback), fallback PSC1 local déclenché uniquement sur vraie panne réseau, images : aperçu dans la bulle + demande de description écrite plutôt qu'analyse visuelle prétendue, indicateur En ligne/Hors ligne, auto-scroll
- **Chat IA v2** : saisie vocale ponctuelle confirmée par le bouton d'envoi (jamais auto-envoyée) · rendu markdown des réponses (**gras**, titres, listes) · mode vocal continu (`VoiceModeOverlay`) avec détection de fin de phrase par silence, lecture auto de la réponse, micro coupé pendant que l'app parle, états visuels écoute/réflexion/réponse/pause/erreur · bouton "lire à voix haute" sur chaque bulle IA (texte et mode vocal), lecture unique coordonnée (`window.SM_SPEECH`)
- **Chat IA v3 — fiabilité vocale + français strict** : `speakText` attend le chargement asynchrone des voix (`waitForVoices`) avant de lire ; watchdogs 3s (synthèse ET reconnaissance) affichant un message clair si le navigateur expose l'API sans qu'elle fonctionne réellement, détection Samsung Internet avec message dédié ; nettoyage markdown avant lecture étendu (italique, listes numérotées, citations, liens, barré, code, lignes horizontales) ; system prompt : consigne stricte "toujours en français, jamais un mot anglais" ; indicateur de chargement épuré (3 points animés en vague, sans texte)
- **Bouton flottant Chat IA** (`FloatingChatButton`) : accès rapide depuis Accueil, Formation, Localisation, Profil et SOS (idle)
- **Module SOS réel** : compte à rebours 5s + position GPS réelle (`navigator.geolocation`) + carte Leaflet de confirmation + boutons WhatsApp réels (`wa.me` avec position géolocalisée) pour les contacts sans compte + notifications in-app réelles pour les contacts avec compte (vérification `hasAccount` via Supabase côté backend)
- **Module Formation complet** : 10 modules PSC1, parcours façon Duolingo, quiz progressifs de 5 à 20 questions selon le module, déverrouillage séquentiel (un module ouvre le suivant à partir de 60% de réussite), progression persistée dans Supabase, écrans `screen-training.jsx` (liste + progression globale) et `screen-training-module.jsx` (détail + quiz, transition propre entre modules). Résultat de quiz : section "Questions à revoir" (réponse donnée vs bonne réponse) dès que le score n'est pas parfait, bouton "Revoir mes erreurs et refaire le quiz" pour un module déjà validé mais imparfait.
- **Module Localisation complet** : carte Leaflet.js + OpenStreetMap, centres de santé à **couverture nationale** (table Supabase `health_centers`, synchronisée depuis l'API healthsites.io par la tâche cron `scripts/sync-health-centers.js` — jamais d'appel direct à ce service tiers au moment où un utilisateur consulte la carte, voir section Localisation), 20 centres de San Pédro conservés en secours (`source: 'seed-manuel'`, tant qu'aucun sync réel n'a encore tourné), suivi GPS temps réel (`watchPosition`), tri par distance (Haversine), filtres (Tous / Hôpitaux / Cliniques / Dispensaires / 24h sur 24 — les deux derniers partiellement obsolètes depuis la nouvelle taxonomie de types, voir Décisions techniques), appel direct (ou "Numéro non disponible" si absent), mention d'attribution ODbL, message d'instructions manuelles si GPS refusé sur iOS, écran `screen-map.jsx`. **Sync réel pas encore exécuté** : clé `HEALTHSITES_API_KEY` pas encore approuvée par healthsites.io au moment de l'écriture, voir Feuille de route.
- Profil utilisateur redesigné : carte profil avec barre de progression (complétion sur 12 points), badge "Profil complet" à 100%, sous-écrans dédiés `profile_personal` / `profile_medical` / `profile_contacts` avec navigation propre, données persistées dans Supabase. Avatar + photo (resize canvas), changement mdp, déconnexion. Mode édition champs bleutés, barre sticky, toast vert. Date de naissance via `BirthdateField` (calendrier ou texte).
- **Typographie renforcée** : titres en gras (700) vs texte courant régulier (400) sur tout l'app, texte des étapes de formation agrandi (16px)
- **Expérience iOS Safari** : hauteur d'écran fiable (repli `100vh`/`100dvh`), zones de sécurité (`env(safe-area-inset-*)`), scroll tactile fluide, sélection de texte désactivée sauf champs de saisie et réponses IA, message clair si GPS refusé (au lieu d'un "Réessayer" inopérant), icône d'écran d'accueil dédiée (`apple-touch-icon.png`)
- **Scroll fiable sur tout l'app** : fix CSS en deux règles (`min-height:0` + `flex-shrink:0`, voir Décisions techniques) garantissant qu'un corps de page trop long devient réellement scrollable au lieu d'être coupé ou compressé silencieusement — vérifié concrètement sur Profil/Formation/Localisation/Chat/résultat de quiz
- **Composant `Banner` réutilisable** (`frames.jsx`) : 4 variantes pastel (succès/avertissement/erreur/info), appliqué à Conseil du jour, bandeau GPS, erreurs de connexion/inscription, toast profil, bandeau hors-ligne
- QR Code médical généré côté serveur (données Supabase) — fiche lisible par les secours. Le QR encode une URL image PNG publique (`/api/public/medical-card/:id.png`, sans authentification, template SVG → `sharp`) plutôt que du JSON brut : chargement instantané par n'importe quel appareil photo, y compris hors de l'app. Scanné **depuis** l'app, `screen-qr-scanner.jsx` détecte cette URL et recharge les données en JSON pour rester en interne (affichage riche `VictimCardScreen` inchangé, pas d'ouverture de l'image dans un navigateur externe)
- Scanner QR : natif Android (MLKit) + fallback web (jsQR + file input caméra)
- Fiche victime après scan QR : groupe sanguin rouge, allergies orange, contacts avec appel direct
- Conditions générales d'utilisation
- Navigation cohérente : `goBack(nav)` sur tous les boutons retour
- Backend complet (auth Supabase, home, urgences, protocoles, chat IA, SOS réel, formations, paiements, carnet médical, QR médical)
- Backend déployé sur Render : `https://sauvmoi.onrender.com`
- Dépôt GitHub : `https://github.com/teamupsp5-ship-it/sauvmoi` (branche `main`)
- Capacitor configuré pour Android (`ci.sauvmoi.app`) + permission CAMERA dans AndroidManifest
- Mode plein écran natif (`.sm-live`, `viewport-fit=cover`)
- **Renforcement sécurité pilote** : rate limiting login/register (`express-rate-limit`), headers de sécurité + CSP (`helmet`), `npm audit fix` (0 vulnérabilité restante), whitelist explicite des champs modifiables sur `PUT /me`, validation des entrées (`src/validate.js`) sur register/`PUT /me`/chat/SOS, audit anti-XSS du parseur markdown du chat (testé en conditions réelles), restriction MIME/taille de l'upload photo de profil, honeypot anti-bot sur l'inscription. Voir section Sécurité pour le détail et les compromis documentés (CSP limitée par l'absence de bundler, tokens localStorage non migrés vers httpOnly).

---

## Feuille de route restante 🔲

### Priorité haute (avant démo)
- [ ] **Confirmer que `supabase/schema.sql` a bien été exécuté** sur le projet Supabase de prod, et que `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` sont bien renseignées sur Render
- [ ] Vérifier de bout en bout en conditions réelles (aucun projet Supabase réel disponible pendant le dev pour tester au-delà de mocks locaux) : inscription complète → `GET /me` reflète bien tous les champs (medical + contacts) → refresh JWT après ~1h → SOS `hasAccount`
- [ ] Brancher `@capacitor/camera` sur les uploads photo du profil (natif Android)
- [ ] `npm run build:mobile` + rebuild APK pour activer le scanner MLKit
- [ ] Configurer `ANTHROPIC_API_KEY` sur Render (à vérifier — absente en prod lors des derniers tests → le chat tournait en fallback PSC1 même en production)
- [ ] **Centres de santé** : exécuter `supabase/schema.sql` (bloc migration `health_centers` + seed) sur le projet Supabase de prod. Une fois `HEALTHSITES_API_KEY` approuvée par healthsites.io : lancer manuellement `node scripts/sync-health-centers.js` une première fois (observer attentivement les logs — voir l'avertissement dans le script sur le format de réponse non vérifié, ajuster `mapFeatureToRow()` si les données produites semblent incorrectes), puis programmer la tâche en cron sur o2switch (cPanel → Cron Jobs, voir section Localisation pour la commande exacte)

### Priorité moyenne
- [ ] Tester le flux Google OAuth bout-en-bout avec de vraies clés Supabase déployées (non vérifiable en local sans projet Supabase réel — voir Flux d'authentification)
- [ ] Vraie authentification Apple Sign-In — le bouton "Continuer avec Apple" est actuellement décoratif, sans `onClick`
- [ ] Notifications push (`@capacitor/push-notifications`) — distinct des notifications in-app SOS déjà en place
- [ ] Mode hors-ligne partiel (`@capacitor/preferences` ou cache local)
- [ ] **Après le pilote** : migration `sm_token`/`sm_refresh_token` de `localStorage` vers des cookies `httpOnly`/`secure`/`sameSite` (reportée volontairement avant le lancement pilote, voir section Sécurité — nécessite de traiter CSRF et le flux cross-origin proprement, pas un correctif rapide)

### Priorité basse
- [ ] Paiement Mobile Money réel (CinetPay, PayDunya, Wave Business)
- [ ] i18n complet FR/EN (structure `T(key, lang)` déjà en place)
- [ ] Écran desktop pour Localisation et Profil
- [ ] Tests automatisés
- [ ] Écran Formations desktop complet
- [ ] **Bug connu : `canvas.html` casse au chargement** (`AuthScreen is not defined`, écran blanc) — `screen-auth.jsx` a été ajouté à `index.html` mais jamais reporté dans la liste de scripts de `canvas.html`, qui n'a pas suivi les écrans ajoutés depuis. Repéré en testant que le renforcement sécurité (CSP) ne cassait rien ; confirmé sans rapport avec la CSP (`git diff` : `canvas.html` non modifié), pré-existant. Fix : ajouter `<script type="text/babel" src="screen-auth.jsx"></script>` à `canvas.html` (et vérifier qu'aucun autre écran récent manque de la même façon)

---

## Dette technique connue

Constats vérifiés (grep/lecture du code réel, pas une supposition) plutôt qu'une liste de vœux.

- **Aucun test automatisé dans tout le projet.** Toute la vérification décrite dans l'historique des lots (voir commits) a été faite à la main, lot par lot, via des harnais Playwright/Express jetables (créés puis supprimés avant chaque commit) — rien ne persiste pour empêcher une régression future. **Prioritaires si des tests sont introduits** : `PUT /me` (`routes/auth.js`) et la chaîne fiche médicale (`GET /medical-record/qr`, `POST .../regenerate`, `GET /public/medical-card/:file`, `src/medical-card.js`) — le bug bloquant du lot 5 (carnet médical qui ne s'enregistrait jamais dès que `allergies`/`conditions` était renseigné) est exactement le genre d'erreur qu'un test d'intégration basique (`PUT /me` avec un tableau non vide → 200, valeurs relues identiques) aurait attrapé immédiatement au lieu d'attendre un rapport utilisateur.
- **Code mort à supprimer** (vérifié par recherche exhaustive des appelants, pas juste par lecture d'une route isolée) :
  - `POST /auth/request-otp` et `POST /auth/verify` (`src/routes/api.js`) — legacy, code OTP toujours `123456` en dur, aucun appel depuis le frontend.
  - Tout ce qui dépend de `DEMO_USER`/`RESCUERS`/`PAYMENT_METHODS`/`EMERGENCY_LIST` (`src/data/seed.js`) : `GET /api/home` (le résultat, `window.SM.home`, est bien rempli par `bootstrap()` mais **n'est lu par aucun écran** — vérifié par recherche de `SM.home` dans tout `public/`, seule occurrence restante hors `sm-state.js` est un `= null` à la déconnexion), `GET /api/emergencies` (même constat : `API.emergencies()`/`SM.emergencies` ne sont référencés nulle part dans `public/`, malgré `emergencies: null` toujours déclaré dans la forme de `window.SM`, voir État global partagé), `GET/POST /api/training/me`, `GET/PUT /api/medical-record` (legacy, remplacé par les routes Supabase de `routes/auth.js`/`routes/api.js`), `GET /api/payments/methods` + `POST /api/payments/initiate` + `POST/GET /api/payments/:id` (aucun des trois n'a de caller côté client — `API.paymentMethods()`/`payInitiate()`/`payConfirm()` dans `api-client.js` ne sont appelés par aucun écran). **Contredit la note "DEMO_USER sert encore de données statiques pour accueil/urgences/paiements" plus bas dans ce document (section Notes démo) : c'est vrai que ces routes existent et renvoient du `DEMO_USER`, mais aucune n'est plus consommée par un écran réel — corrigé dans cette même mise à jour.**
  - `API.rescuers()` (`public/api-client.js`) appelle `GET /api/rescuers/nearby`, une route qui **n'existe même plus côté serveur** (404 garanti si jamais invoquée) — mort des deux côtés.
  - `src/data/health-centers.js` (`HEALTH_CENTERS`, 20 centres de San Pédro) — plus importé par `routes/api.js` depuis le passage de `GET /api/health-centers` à la table Supabase `health_centers` (couverture nationale, voir section Localisation). Les mêmes 20 entrées ont été copiées en dur dans la migration SQL (`source: 'seed-manuel'`), ce fichier JS n'a donc plus aucun rôle fonctionnel.
- **`.sm-tabbar`/`TabBar` (`frames.jsx`, `styles.css`) : pas littéralement mort, mais un piège de maintenance.** Utilisé uniquement par `app.jsx` (canvas.html) ; l'app réelle utilise partout `HomeTabBar` (`screen-home.jsx`, styles inline, tout autre composant). Deux implémentations de tabbar parallèles qui peuvent diverger sans qu'aucune erreur ne le signale — un futur changement visuel de la tabbar appliqué à un seul des deux risque de rendre le canvas visuellement incohérent avec l'app réelle sans que personne ne s'en aperçoive avant de l'ouvrir.
- **`screen-sos.jsx` et `screen-chat.jsx` (chargés par `canvas.html` via `app.jsx`, jamais par l'app réelle sauf pour les bulles de chat partagées de `screen-chat.jsx`, voir Fichiers clés) contiennent encore le bug "double frontière" corrigé au lot 9 sur leurs équivalents live (`live-sos.jsx`, `live-chat.jsx`)** — non corrigé intentionnellement lors du lot 9, la vérification par capture d'écran demandée portait sur les tailles de téléphone réel, hors du périmètre de `canvas.html`.

---

## Conventions de code

- **Composants JSX** : PascalCase, exposés sur `window` à la fin du fichier via `Object.assign(window, {...})`
- **Styles** : inline JSX uniquement, jamais de classes inventées — utiliser les tokens `--sm-*` et les classes utilitaires de `styles.css`
- **Navigation** : `nav.go('id')` empile · `nav.reset('id')` remplace tout · `nav.back()` dépile · `nav.canBack()` teste si la pile a > 1 écran
- **Retour** : toujours utiliser `goBack(nav)` (défini dans `frames.jsx`) — dépile si possible, sinon `nav.reset('home')`. Ne jamais appeler `nav.back()` directement dans les boutons retour.
- **State** : données live via `window.SM` + `window.useSM()` dans les composants live
- **API calls** : `window.API.*` pour les appels standards (attache le Bearer token et rafraîchit le JWT automatiquement) · `fetch` direct pour login/register/change-password — si un appel direct nécessite une session, attacher `authorization: 'Bearer ' + window.SM.token` manuellement (voir `changePassword()` dans `screen-profile.jsx`)
- **Pas de commentaires** sauf WHY non-évident
- **ES modules** côté backend (`"type": "module"` dans package.json)
- **Ne jamais mettre à jour l'état local (`window.SM.*`/`localStorage`) avant confirmation serveur, et jamais avec une valeur calculée en local ("optimiste")** — toujours attendre la réponse HTTP réussie, puis écrire l'état local avec **la réponse serveur elle-même**, jamais une valeur reconstruite côté client qui pourrait diverger de ce qui a réellement été écrit en base. Règle née du bug bloquant du lot 5 : `ProfilePersonal`/`ProfileMedical`/`ProfileContacts` (`screen-profile.jsx`) faisaient `try { await window.API.updateMe(...) } catch {}` puis mutaient `window.SM.user`/`localStorage` de façon **inconditionnelle** avec un objet optimiste — `PUT /me` échouait systématiquement en 400 dès que `allergies`/`conditions` était renseigné (tableau envoyé à une validation qui exige une chaîne, voir `routes/auth.js`), mais l'app affichait quand même la nouvelle valeur localement pendant que la base gardait l'ancienne, sans jamais signaler l'échec à l'utilisateur ni aux logs. En cas d'échec, ne rien muter localement et afficher `<Banner variant="danger">` avec le formulaire qui reste ouvert pour réessayer (voir `screen-profile.jsx` pour le patron exact)

---

## Flux Git

Deux branches, un seul sens de circulation :

- **`dev`** : branche de travail. Tout correctif ("LOT") est commité et poussé ici.
- **`main`** : branche de production. Render déploie automatiquement à chaque push sur `main` (voir Déploiement & infrastructure ci-dessous).
- **La fusion `dev` → `main` est un acte manuel, décidé et exécuté uniquement par l'utilisateur** (`git checkout main && git merge dev && git push`, ou équivalent) — jamais par Claude Code de sa propre initiative, même après un lot terminé et poussé sur `dev` avec succès. Un push direct sur `main`, ou une fusion lancée sans que l'utilisateur ait tapé la commande lui-même, n'est jamais acceptable : c'est le déclencheur du déploiement en production, cette décision appartient entièrement à l'utilisateur.
- Après un lot : commiter sur `dev` avec un message clair (quoi + pourquoi), pousser `dev`, rapporter le hash de commit et la liste des fichiers modifiés — jamais toucher `main` dans la même action.

---

## Déploiement & infrastructure

| Élément | Valeur |
|---|---|
| Backend prod | `https://sauvmoi.onrender.com` |
| Dépôt GitHub | `https://github.com/teamupsp5-ship-it/sauvmoi` |
| Branche principale | `main` |
| Déploiement | Automatique sur push Render ← GitHub |
| Base de données / Auth | Projet Supabase — schéma dans `supabase/schema.sql` (**à exécuter manuellement** via l'éditeur SQL Supabase avant tout déploiement sur une base neuve) |
| Variables Render | `ANTHROPIC_API_KEY` (optionnelle, **non configurée lors des derniers tests** → fallback PSC1 en prod) · `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (requises — le serveur ne fonctionne pas sans elles) |

### Déploiement o2switch (cPanel) — secondaire, n'affecte pas Render

`.cpanel.yml` à la racine du projet : permet un déploiement semi-automatique
via l'outil **Git Version Control** de cPanel (o2switch) — cPanel détecte ce
fichier et exécute ses `tasks` à chaque déploiement déclenché depuis son
interface. Ce fichier est **spécifique à o2switch** ; il n'est lu par
personne d'autre (Render ignore tout fichier qu'il ne connaît pas) et
n'affecte donc en rien le déploiement automatique Render ← GitHub décrit
ci-dessus. Les deux déploiements sont indépendants et peuvent coexister à
partir du même dépôt.

```yaml
deployment:
  tasks:
    - export DEPLOYPATH=/home3/sc3jdmi5414/sauvmoi
    - /usr/bin/rsync -av --exclude='.git' --exclude='node_modules' ./ $DEPLOYPATH
    - /bin/mkdir -p $DEPLOYPATH/tmp
    - /bin/touch $DEPLOYPATH/tmp/restart.txt
```

- `rsync` copie le dépôt vers `$DEPLOYPATH`, en excluant `.git` et
  `node_modules`.
- `touch tmp/restart.txt` est le mécanisme standard **Passenger** (utilisé
  par cPanel pour les apps Node.js) pour déclencher un redémarrage propre de
  l'application après déploiement.
- **`npm install` n'est volontairement pas exécuté** dans ce script — rien
  ne garantit que `npm` soit dans le `PATH` du contexte d'exécution cPanel
  qui lance `.cpanel.yml`. À faire manuellement (SSH ou terminal cPanel) si
  de nouvelles dépendances sont ajoutées, ou à automatiser dans une
  itération future une fois le PATH vérifié.

---

## Notes pour la démo hackathon

- Sans `ANTHROPIC_API_KEY`, le chat utilise les protocoles PSC1 en dur (ça marche hors-ligne) — vérifier si la clé est configurée sur Render avant la démo
- L'authentification est réelle (Supabase) : plus de mode "n'importe quel mot de passe fonctionne" — préparer un compte de démo à l'avance plutôt que de compter sur l'auto-création au premier login
- La connexion Google (OAuth) n'a jamais été testée bout-en-bout avec un vrai projet Supabase déployé — vérifier qu'elle fonctionne avant de s'appuyer dessus en démo, sinon privilégier email/mot de passe
- `DEMO_USER` dans `seed.js` simule encore Aïcha Kouassi, Abidjan, groupe O+, mais **plus aucun écran réel n'affiche ces données** (`GET /api/home`, `/api/emergencies`, `/api/payments/*`, `/api/training/me` existent toujours côté serveur mais n'ont plus de caller côté client — voir Dette technique connue) ; les 20 centres de santé du module Localisation, eux, sont basés à San Pédro et bien réellement affichés (`HEALTH_CENTERS`)
- Le SOS déclenche une alerte réelle : géolocalisation du téléphone, carte Leaflet, WhatsApp pour les proches sans compte, notification in-app pour ceux qui en ont un (vérification via la table Supabase `profiles`)
- Les paiements Mobile Money sont simulés (pas de vrai appel agrégateur)
- Le numéro SAMU d'urgence en Côte d'Ivoire est le **185**
