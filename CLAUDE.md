# Sauv'Moi — Contexte projet pour Claude Code

Application de premiers secours mobile pour la Côte d'Ivoire.
Projet hackathon "IA et service universel des télécommunications TIC".
Tagline : **"Restez calme, tout ira bien"** (affiché sur splash screen et écran de connexion).

---

## Description

Sauv'Moi guide les utilisateurs dans les premiers secours via une IA vocale,
reconnaît les situations d'urgence (texte, voix, photo), déclenche un SOS géolocalisé,
localise les centres de santé proches, et propose des formations PSC1 gamifiées.
Cible : Abidjan et Afrique de l'Ouest. Les données de démo du module Localisation
couvrent San Pédro (20 centres de santé, liste vérifiée le 31/07/2026).

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Node.js (ES modules) + Express 4 + WebSocket (`ws`) |
| Frontend | React 18 + JSX transpilé par Babel Standalone (pas de build) |
| Icônes | Lucide (UMD, chargé via CDN) |
| Cartes | Leaflet.js (CDN) + tuiles OpenStreetMap — carte SOS et carte Localisation |
| IA | Claude `claude-haiku-4-5-20251001` via Anthropic API — premiers secours **et** santé générale, garde-fous stricts (jamais de diagnostic ni de posologie) — fallback protocoles PSC1 si pas de clé ou appel échoué |
| Auth + BDD | **Supabase** (`@supabase/supabase-js` ^2) — auth JWT (register/login/refresh) + Postgres (`profiles`, `emergency_contacts`, `training_progress`, `notifications`) avec Row Level Security |
| Persistance legacy | Fichier JSON `.data/db.json` via `src/store.js` — plus utilisé pour les comptes/profils (migrés vers Supabase), reste pour les données seed statiques, les alertes SOS actives (en mémoire) et les conversations chat |
| Mobile | Capacitor.js v8 (`@capacitor/android`) — Android uniquement pour l'instant |
| QR Scan | `@capacitor-mlkit/barcode-scanning` (natif Android) + `jsQR` (fallback web via CDN) |
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
| `server.js` | Express + WebSocket. Monte : `authRoutes` → `apiRoutes` → `chatRoutes` → `sosRoutes` → `trainingRoutes` |
| `supabase.js` | Client Supabase principal (`supabase`, clé `service_role` — contourne RLS, jamais de session dessus) + `createAuthClient()` (fabrique de clients jetables clé `anon`, un par appel, pour `signInWithPassword`/`refreshSession`). **Ne jamais appeler une méthode qui gère une session (`signIn*`, `signOut`, `refreshSession`) sur le client `supabase` partagé** — ça fait basculer l'en-tête `Authorization` de toutes les requêtes PostgREST suivantes (y compris pour d'autres requêtes concurrentes) du `service_role` vers le JWT de l'utilisateur connecté → erreurs RLS aléatoires en prod. Toujours passer par `createAuthClient()` pour ça. |
| `store.js` | Store en mémoire + persistance JSON (`.data/db.json`). API : `get()`, `save()`, `uid(prefix)`. Ne gère plus les comptes/profils (→ Supabase) ; reste utilisé pour les alertes SOS actives et les conversations chat |
| `ai.js` | Claude via Anthropic API (premiers secours + santé générale, garde-fous stricts). Fallback déterministe si `ANTHROPIC_API_KEY` absent ou appel échoué — log explicite dans les deux cas (`[ai] Utilisation Claude API` / `[ai] Utilisation fallback PSC1 (raison: ...)`). Réponse normalisée : `{ reply, suggestedActions, protocolRef, source }` |
| `routes/auth.js` | `POST /auth/register` (Supabase `admin.createUser` + upsert `profiles` + insert `emergency_contacts` + connexion immédiate) · `POST /auth/login` (`signInWithPassword`) · `POST /auth/refresh` (`{refreshToken}` → nouveau `{token, refreshToken, expiresAt}`) · `POST /auth/change-password` · `GET /me` · `PUT /me` (profil + carnet médical + remplacement complet des contacts). Exporte le middleware `requireAuth` (vérifie le Bearer token via `supabase.auth.getUser(token)`, attache `req.user`), réutilisé par `api.js`/`training.js`/`sos.js`. |
| `routes/api.js` | Home, urgences, protocoles, vision IA, paiements (legacy, `DEMO_USER`/seed) + `/medical-record/qr` et `/notifications` (Supabase, `requireAuth`). `/auth/request-otp` et `/auth/verify` legacy encore présents mais inutilisés par le frontend. |
| `routes/chat.js` | `POST /chat` (Claude ou fallback) · `GET /conversations` |
| `routes/sos.js` | `POST /sos/trigger` (`requireAuth` — vérifie `hasAccount` via la table `profiles` par téléphone, insère dans `notifications` Supabase) · `GET /sos/:id/status` · `POST /sos/:id/cancel` (en mémoire, non protégés) — pas de WebSocket ni de simulation, la position vient du GPS réel du téléphone |
| `routes/training.js` | `GET /training/modules` (`requireAuth` — lit `training_progress`, statut `locked`/`unlocked`/`completed`, score clampé `[0,100]`) · `POST /training/:moduleId/complete` (`requireAuth` — upsert `training_progress`, déverrouille le module suivant si ≥ 60%) |
| `data/seed.js` | `DEMO_USER`, `EMERGENCY_LIST`, `RESCUERS`, `PAYMENT_METHODS`, `TIPS` — données statiques, plus la source de vérité des comptes (→ Supabase) |
| `data/protocols.js` | Protocoles PSC1 validés (hémorragie, étouffement, RCP, brûlure, AVC…) |
| `data/training-modules.js` | `TRAINING_MODULES` — 10 modules PSC1 ordonnés (`order`), chacun avec un quiz de 5 à 20 questions selon la difficulté |
| `data/health-centers.js` | `HEALTH_CENTERS` — 20 centres de santé de San Pédro (hôpital, clinique, maternité regroupée sous `type: 'clinique'`, dispensaire, public), liste vérifiée le 31/07/2026 via Google Maps. `phone` vaut `null` pour les centres sans numéro confirmé (6 centres) — le frontend (`screen-map.jsx`) affiche alors "Numéro non disponible" au lieu d'un bouton "Appeler" qui aurait planté sur `null.replace(...)`. |

### Frontend (`public/`)

| Fichier | Rôle |
|---|---|
| `frames.jsx` | Primitives partagées : `Icon`, `PhoneFrame`, `DesktopFrame`, `TabBar`, `PulseCircle`, `Waveform`, `FloatingChatButton`, `BirthdateField`. `StatusBar()` et `HomeIndicator()` retournent `null`. Définit `goBack(nav)` (helper global) et `nav.canBack()`. `PhoneFrame` accepte un prop optionnel `onNavReady(nav)` (no-op si absent, `canvas.html` inchangé) pour exposer `nav` à un composant parent — utilisé par `app-live.jsx` pour piloter la navigation depuis l'extérieur (déconnexion forcée). `FloatingChatButton` : cercle bleu dégradé 52px, icône `briefcase-medical`, `position: fixed` au-dessus de la tabbar, `nav.go('chat')` — affiché sur `HomeMobile`, `TrainingMobile`, `MapScreen`, `ProfileScreen` (écran principal) et `SOSCountdown` (phase `idle` uniquement). `Icon` a une `key={safeName}` sur son `<span>` racine (pas sur le `<i>` interne) : lucide ne convertit un `<i data-lucide>` en `<svg>` qu'une seule fois, donc sans cette clé changer dynamiquement le prop `name` d'une icône déjà montée (mic/mic-off, pause/play…) restait bloqué sur le premier glyphe — voir la Décision technique dédiée. `speakText(id, text, lang, onEnd)` / `stopSpeech()` / `useSpeechActive(id)` : coordination partagée (`window.SM_SPEECH`) pour qu'une seule lecture Speech Synthesis soit active à la fois, quel que soit l'appelant (bulle de chat, mode vocal). `BirthdateField` : bascule calendrier natif / saisie texte JJ/MM/AAAA, valeur toujours exposée en ISO `YYYY-MM-DD` au parent. |
| `screen-splash.jsx` | Animation "Révélation Vitale" 6.5s : fond rouge → cercle blanc (1.5s) → logo pop-in + pulsation infinie (2.8s) → tracé ECG SVG + titre Poppins (2.8s→4.5s) → sous-titre (4.5s→5.5s) → redirection auth ou home. Si le token restauré expire bientôt, attend un `window.API.refreshSession()` avant de décider (sinon atterrissage sur `home` avec un token déjà mort). |
| `screen-auth.jsx` | `AuthScreen` (logo + tagline, email + mdp, boutons Google/Apple purement visuels — sans `onClick`) · `RegisterScreen` (2 étapes : infos perso + profil médical, date de naissance via `BirthdateField`). `applySession()` sauvegarde `sm_token`/`sm_refresh_token`/`sm_expires_at`/`sm_user` en localStorage. |
| `screen-home.jsx` | `HomeMobile` : logo `logo_80.png` en haut à gauche, carte IA bleue (min-height 120px), QR + conseil (icônes noires sur fond #F1F2F4), `HomeTabBar` dégradé bleu #1565C0→#0D47A1 avec backdrop-blur + indicateur blanc sur onglet actif, onglet Localisation actif. Avatar cliquable → profil. Racine `<div position:absolute;inset:0>` (pas un Fragment — nécessaire pour que le safe-area CSS centralisé s'applique, voir Décisions techniques). `HomeDesktop` · `Sidebar`. |
| `screen-emergency.jsx` | `EmergencyMobile` (racine `<div position:absolute;inset:0>`, idem `HomeMobile`) · `EmergencyCamera` · `EmergencyGuide` (version canvas — la version live vient de `live-emergency.jsx`) |
| `screen-chat.jsx` | `ChatScreen` unifié (canvas statique). `ChatUserBubble` accepte un prop `image` optionnel (aperçu photo dans la bulle). `ChatAIBubble` accepte `id`/`lang` (identifiant + langue pour la lecture voix) : rend le texte via `renderMarkdown`/`parseInlineMarkdown` (parseur ligne par ligne maison — **gras**, titres `#`/`##`/`###`, listes `-`/`*` → `<ul><li>`, pas de lib externe) au lieu de texte brut, et affiche un bouton haut-parleur (`speakText`/`useSpeechActive`) qui lit la réponse à voix haute et s'arrête au second clic. Le texte de la bulle IA porte `className="sm-chat-selectable"` (seul endroit où `user-select` reste actif, voir styles.css). Surchargé par `live-chat.jsx` en live. |
| `screen-sos.jsx` / `live-sos.jsx` | `SOSCountdown` (idle : grand bouton rouge pulsant + numéros rapides SAMU/Pompiers/Police + `FloatingChatButton` ; counting : compte à rebours 5s, cercle SVG rouge, vibration, GPS réel via `navigator.geolocation`) · `SOSConfirm` (carte Leaflet réelle centrée sur la position déclarée, liste des contacts avec badge "Notifié dans l'app" si `hasAccount`, sinon bouton "Alerter via WhatsApp" qui ouvre `wa.me` avec message + lien Google Maps géolocalisé). `live-sos.jsx` surcharge entièrement `screen-sos.jsx`. |
| `screen-training.jsx` | `TrainingMobile` — parcours façon Duolingo : liste des 10 modules PSC1 avec barre de progression globale, déverrouillage séquentiel (toast si module verrouillé cliqué), `FloatingChatButton`. |
| `screen-training-module.jsx` | `TrainingModuleScreen` — détail d'un module + quiz progressif (5 à 20 questions selon le module), soumission du score à `POST /training/:moduleId/complete`, déverrouille le module suivant si réussite ≥ 60%. Texte des étapes en 16px (relisibilité). `useEffect` sur `mod?.id` qui réinitialise `phase`/`result` à chaque changement de module — sinon `nav.go('training_module')` vers le module suivant réutilisait le composant déjà monté et restait bloqué sur l'écran de résultat de l'ancien module. |
| `screen-map.jsx` | `MapScreen` — module Localisation : carte Leaflet + liste des centres de santé de San Pédro (`HEALTH_CENTERS`, 20 centres), position GPS temps réel via `navigator.geolocation.watchPosition`, distance Haversine, tri par proximité, filtres (Tous / Hôpitaux / Cliniques / Dispensaires / 24hsur24), appel direct par centre — bouton "Appeler" remplacé par "Numéro non disponible" (désactivé) si `phone: null`. Si la géolocalisation échoue en `PERMISSION_DENIED` **et** que `isIOSDevice()` détecte iOS (userAgent, avec le cas iPad qui se présente en `Macintosh` + `maxTouchPoints`), remplace le bouton "Réessayer" (inopérant sur iOS une fois le refus enregistré) par les instructions manuelles Réglages → Safari → Position — "Réessayer" reste actif pour Android et les autres cas. `FloatingChatButton`. |
| `live-chat.jsx` | Chat live complet : POST `/api/chat` (premiers secours + santé générale, garde-fous, mémoire de conversation complète), fallback PSC1 local (6 protocoles embarqués) — déclenché **uniquement** sur vraie panne réseau (`err.isNetworkError`), jamais sur une réponse serveur en erreur. `send()` retourne le résultat (utilisé par le mode vocal). Saisie vocale ponctuelle (bouton micro) : le transcript remplit le champ texte, **n'envoie jamais automatiquement** — confirmation par le bouton d'envoi comme au clavier. **Mode vocal continu** (bouton casque dans l'en-tête, `VoiceModeOverlay`) : écoute continue (`SpeechRecognition` `continuous`+`interimResults`), détection de fin de phrase par timeout de silence ~1.5s (+ `onspeechend` en complément), envoi auto à `/api/chat`, lecture de la réponse en Speech Synthesis (id partagé `'voice-live'` avec le bouton haut-parleur de la bulle affichée dans l'overlay — cliquer dessus interrompt la lecture), micro coupé pendant que l'app parle puis réécoute automatique à la fin. États visuels écoute/réflexion/réponse/pause/erreur, pause et sortie à tout moment, message clair si micro refusé ou navigateur non supporté. Envoi image (aperçu dans la bulle, texte envoyé au vrai pipeline Claude — le system prompt lui interdit de prétendre diagnostiquer visuellement), auto-scroll, indicateur En ligne/Hors ligne. Surcharge `ChatListening` et `ChatResponse`. |
| `live-emergency.jsx` | Version branchée backend de l'urgence — surcharge `EmergencyGuide` de `screen-emergency.jsx` (racine `<div position:absolute;inset:0>`, pas un Fragment, même raison que `HomeMobile`) |
| `screen-profile.jsx` | `ProfileScreen` : carte profil avec barre de progression (complétion calculée sur 12 points : infos perso + médicales + contacts), badge "Profil complet" à 100%, badge "À compléter" sur la section médicale si groupe sanguin ou allergies manquants, `FloatingChatButton`. Navigue vers 3 sous-écrans dédiés : `ProfilePersonal` (infos perso, date de naissance via `BirthdateField`), `ProfileMedical` (carnet médical), `ProfileContacts` (contacts d'urgence, max 5, remplacement complet côté backend). Avatar + photo (resize canvas), changement mdp (Bearer token requis), déconnexion (nettoie aussi `sm_refresh_token`/`sm_expires_at`). Mode édition avec champs bleutés, barre sticky Annuler/Sauvegarder, toast vert. Corps scrollable (`overflow-y:auto`) — vérifié atteignable jusqu'à "Se déconnecter" sur iPhone SE (375×667) et standard (390×844), voir styles.css pour le fix `-webkit-overflow-scrolling`. |
| `screen-qr-code.jsx` | Affichage du QR PNG médical personnel (depuis `/api/medical-record/qr`, `requireAuth`). |
| `screen-terms.jsx` | Conditions générales d'utilisation (8 sections). |
| `screen-victim-card.jsx` | Fiche d'urgence victime après scan QR : groupe sanguin rouge, allergies orange, contacts avec appel direct. |
| `screen-qr-scanner.jsx` | Scanner QR (surcharge `QrScannerScreen`). Natif : `@capacitor-mlkit/barcode-scanning`. Web : file input + jsQR. Navigue vers `victim_card`. |
| `app-live.jsx` | Point d'entrée app réelle. Registre `PHONE_SCREENS`. Démarre toujours sur `splash` (qui redirige). Récupère `nav` via `onNavReady` et observe `SM.sessionExpired` (sans tableau de deps — `useSM()` renvoie toujours la même référence, `[SM]` ne se redéclencherait jamais) pour rediriger vers `auth` si un refresh implicite échoue en session. Classe CSS `sm-live` pour le plein écran natif. |
| `app.jsx` | Point d'entrée canvas design. Sections : 0·Auth · 1·Accueil · 2·Urgence · 3·Chat · 4·SOS · 5·Formation |
| `sm-state.js` | Bus d'état global `window.SM`. `bootstrap()` ne s'exécute que si un token existe ; n'affiche pas le bandeau hors-ligne si l'échec vient d'une session invalidée (token déjà effacé par un refresh raté) plutôt que d'une vraie panne réseau. |
| `api-client.js` | Client HTTP `window.API` — toutes les routes disponibles. Attache `Authorization: Bearer` automatiquement. Avant chaque appel (hors `/api/auth/*`), rafraîchit le JWT si l'expiration est à moins de 2 min (`refreshSession()`, dédoublonne les refresh concurrents). Si le refresh échoue : vide le localStorage et met `SM.sessionExpired = true`. |
| `styles.css` | Tokens CSS (`--sm-red`, `--sm-blue`, `--sm-ink`…), Poppins comme `--font-ui` (titres/`.sm-serif` en 700, texte courant en 400), `--sm-paper: #FFFFFF`, `--sm-radius: 16px`, `--sm-shadow`, composants, `.sm-live` pour plein écran natif. `.sm-live .sm-phone` : `height:100vh` en repli avant `height:100dvh` (Safari < 15.4 ne supporte pas `dvh`). `.sm-live .sm-screen > *` : `padding-top/bottom: env(safe-area-inset-*)` appliqué à l'unique enfant racine de chaque écran plutôt que dans chaque fichier — un padding sur un ancêtre positionné n'a aucun effet sur un descendant en `inset:0` (containing block = padding box), d'où le ciblage précis de cet enfant (voir Décisions techniques). `.sm-frame *` porte `-webkit-overflow-scrolling: touch` (inerte hors scroll). `body, #root` en `user-select:none` ; `input`/`textarea`/`.sm-chat-selectable` repassent en `user-select:text`. |
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
| `index.html` | `viewport-fit=cover` (nécessaire pour `env(safe-area-inset-*)`), `apple-touch-icon`, `apple-mobile-web-app-capable`/`-status-bar-style`/`-title` pour l'expérience iOS "app" |

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
inutilisé par le frontend. Les boutons "Continuer avec Google" / "Continuer avec Apple"
sont uniquement visuels — aucun `onClick`, aucune intégration OAuth.

---

## Base de données Supabase — `supabase/schema.sql`

⚠️ À exécuter manuellement dans l'éditeur SQL Supabase avant tout déploiement sur une
base neuve (voir aussi la section Variables d'environnement).

| Table | Colonnes clés | Rôle |
|---|---|---|
| `profiles` | `id` (= `auth.users.id`), `name`, `phone`, `birthdate`, `gender`, `photo`, `city`, `role`, `lang`, `blood_type`, `height`, `weight`, `allergies` (text), `conditions` (text) | Profil + carnet médical. `allergies`/`conditions` stockés en texte simple, transformés en tableaux à la lecture pour le frontend (`medicalRecord.allergies`) — même convention que l'ancien `store.js`. `height`/`weight` ajoutés par rapport à la demande initiale de schéma : le frontend (calcul de complétion du profil sur 12 points) les lit/écrit déjà, sans eux la complétion plafonnait à 10/12. |
| `emergency_contacts` | `id`, `user_id`, `name`, `phone`, `relation` | Contacts d'urgence, max 5 côté backend (400 si dépassé). `PUT /me` fait un remplacement complet (delete puis insert) quelle que soit la forme du payload (`emergencyContacts` tableau ou `emergencyContact` singulier, à plat ou nichés sous `medicalRecord`). |
| `training_progress` | `user_id` (PK), `completed_modules` (`text[]`), `scores` (`jsonb`) | Progression formation, upsert à chaque `POST /training/:id/complete`. Score toujours clampé `[0,100]` en écriture et en lecture. |
| `notifications` | `id`, `user_id`, `type`, `from_user`, `message`, `lat`, `lng`, `is_read` | Alertes in-app, alimentées par `routes/sos.js` quand un contact d'urgence a lui-même un compte. |

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

## Décisions techniques prises

| Sujet | Décision | Raison |
|---|---|---|
| Build | Pas de bundler | Démo hackathon — zéro config, démarrage immédiat |
| Auth | Email + password (pas OTP en principal), migré vers Supabase (JWT réel) | Plus universel sur mobile ; vraie auth pour un vrai produit plutôt que des tokens `demo.<id>` |
| Auth : clients Supabase | `service_role` partagé pour tout le CRUD backend, `createAuthClient()` (clé `anon`, instance jetable) pour `signInWithPassword`/`refreshSession` uniquement | Appeler une méthode de session sur le client `service_role` fait basculer l'`Authorization` de toutes les requêtes PostgREST suivantes (y compris pour d'autres requêtes concurrentes) vers le JWT de l'utilisateur — a causé une vraie panne RLS en prod avant correction |
| Profil : upsert plutôt qu'update | `POST /auth/register` complète le profil via `upsert` (clé `id`), pas `update().eq('id', ...)` | Un `update()` qui ne matche aucune ligne (trigger pas encore visible, etc.) réussit silencieusement côté PostgREST — a causé un vrai bug (champs médicaux jamais enregistrés) avant correction |
| Refresh JWT | Automatique côté client, transparent, avant chaque appel API si expiration < 2 min | Le JWT Supabase expire après ~1h ; sans refresh l'utilisateur était déconnecté toutes les heures |
| Écran initial | `splash` (toujours) | Le splash gère lui-même la redirection auth/home selon session |
| `StatusBar` / `HomeIndicator` | `return null` dans `frames.jsx` | Le vrai OS Android gère sa propre barre |
| Plein écran natif | Classe `.sm-live` + `position: fixed; inset: 0` | Permet de garder `canvas.html` intact |
| Canvas design | `canvas.html` séparé | Préserve les artboards de maquette sans impacter l'app |
| `HomeTabBar` | Dégradé bleu #1565C0→#0D47A1 + backdrop-blur | Distincts visuellement, effet verre moderne |
| Conseil du jour | `DAILY_TIPS[getDay()]` | Simple, sans backend, 7 conseils PSC1 valides |
| Chat unifié | `ChatListening = ChatResponse` dans `live-chat.jsx` | Un seul écran gère tout le fil de conversation |
| Fallback chat hors-ligne | 6 protocoles PSC1 embarqués dans `live-chat.jsx` (`_PSC1`), déclenché uniquement sur vraie panne réseau (`isNetworkError`) | Indépendant du backend — fonctionne même si le serveur est coupé, mais ne doit pas masquer une vraie erreur serveur en la faisant passer pour du hors-ligne |
| Chat IA : périmètre élargi | System prompt couvre premiers secours **et** santé générale, avec garde-fous stricts (jamais de diagnostic affirmatif, jamais de posologie, toujours renvoyer vers un pro en cas de doute) | L'app doit rester utile au-delà de la seule urgence vitale, sans jamais se substituer à un avis médical |
| Chat IA : images | Pas d'analyse visuelle prétendue — le system prompt demande une description écrite | Aucun modèle de vision fiable branché ; mieux vaut le dire clairement que de bluffer une analyse |
| Bouton flottant Chat IA | `FloatingChatButton` dans `frames.jsx`, affiché sur les écrans principaux (pas pendant un quiz/étape de formation, pas sur les sous-écrans profil) | Accès rapide au chat depuis n'importe où sans surcharger les écrans à fort enjeu (formation en cours, etc.) |
| SOS : simulation retirée | WebSocket + simulation SAMU/secouristes supprimés, remplacés par carte Leaflet + position GPS réelle + WhatsApp + notifications in-app | La simulation temps fictif n'apportait rien face à une vraie position + de vrais canaux d'alerte (WhatsApp, notif in-app) |
| Notifications SOS | Vérification `hasAccount` par téléphone dans la table Supabase `profiles` côté `routes/sos.js` | Distingue contact avec compte (notifié in-app) vs sans compte (relayé par WhatsApp) |
| Formation | Déverrouillage séquentiel par `order` — un module ne s'ouvre que si le précédent a un score ≥ 60% | Reproduit la mécanique "parcours" façon Duolingo, incite à progresser dans l'ordre |
| Localisation | Leaflet.js + OpenStreetMap (pas de clé API) | Gratuit, aucune dépendance à Google Maps, adapté à un hackathon |
| Centres de santé | Données statiques `HEALTH_CENTERS` (20 centres San Pédro, vérifiés 31/07/2026) codées en dur | Pas de temps pour une vraie API annuaire santé ivoirienne |
| Profil : complétion | Calcul sur 12 points (infos perso + médicales + contacts) dans `screen-profile.jsx` | Donne un objectif concret à l'utilisateur, incite à remplir le carnet médical |
| Profil : sous-écrans | `ProfilePersonal` / `ProfileMedical` / `ProfileContacts` séparés avec navigation dédiée | Remplace l'ancien formulaire unique — édition plus lisible sur mobile |
| Onglet Localisation | Actif dans `HomeTabBar` | L'écran `MapScreen` existe désormais — plus besoin de le désactiver |
| URL API | `https://sauvmoi.onrender.com` en dur dans `api-client.js` | Backend Render en prod |
| QR Scanner web | `jsQR` (CDN) + `<input type="file" capture="environment">` | Sans bundler : plugin natif accessible via `window.Capacitor.Plugins.BarcodeScanner` |
| Données victime QR | `window.SM_VICTIM` (variable globale temporaire) | Passage de données entre QrScannerScreen → VictimCardScreen sans router |
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

---

## Ce qui est fait ✅

- **Migration backend vers Supabase** : auth réelle (JWT, mot de passe vérifié) + Postgres (`profiles`, `emergency_contacts`, `training_progress`, `notifications`) avec RLS, en remplacement de `db.json` pour tout ce qui est compte utilisateur. Voir `supabase/schema.sql`.
- **Refresh JWT automatique** : plus de déconnexion après 1h — `api-client.js` rafraîchit le token de façon transparente avant expiration, avec déconnexion propre si le refresh échoue
- Authentification complète (connexion email/mdp réelle + inscription 2 étapes avec profil médical, contacts d'urgence sauvegardés) + session persistante (localStorage, token + refresh token)
- Splash screen "Révélation Vitale" 6.5s : fond rouge → cercle blanc → logo pop-in → pulsation → tracé ECG → titre + sous-titre → redirection (avec refresh silencieux si le token restauré expire bientôt)
- Logo intégré partout : `logo_80.png` (auth + header accueil), `logo_1024.png` (splash), `logo_192.png` (favicon)
- Écran d'accueil redesigné : dégradé header, carte IA bleue agrandie, QR + conseil (icônes noires sur fond gris), tabbar bleu dégradé avec blur + indicateur actif, onglet Localisation actif
- Avatar accueil cliquable → profil, photo si disponible, réactif via `useSM()`
- Design global Poppins : police principale, `--sm-paper` blanc, `--sm-radius 16px`, `--sm-shadow`, boutons scale(0.97)
- Écran urgence (voix + caméra IA + guidage pas-à-pas)
- **Chat IA repensé** : périmètre élargi premiers secours + santé générale, garde-fous stricts (jamais de diagnostic ni de posologie, toujours renvoyer vers un pro en cas de doute), mémoire de conversation complète transmise à Claude, log serveur explicite (Claude vs fallback), fallback PSC1 local déclenché uniquement sur vraie panne réseau, images : aperçu dans la bulle + demande de description écrite plutôt qu'analyse visuelle prétendue, indicateur En ligne/Hors ligne, auto-scroll
- **Chat IA v2** : saisie vocale ponctuelle confirmée par le bouton d'envoi (jamais auto-envoyée) · rendu markdown des réponses (**gras**, titres, listes) · mode vocal continu (`VoiceModeOverlay`) avec détection de fin de phrase par silence, lecture auto de la réponse, micro coupé pendant que l'app parle, états visuels écoute/réflexion/réponse/pause/erreur · bouton "lire à voix haute" sur chaque bulle IA (texte et mode vocal), lecture unique coordonnée (`window.SM_SPEECH`)
- **Bouton flottant Chat IA** (`FloatingChatButton`) : accès rapide depuis Accueil, Formation, Localisation, Profil et SOS (idle)
- **Module SOS réel** : compte à rebours 5s + position GPS réelle (`navigator.geolocation`) + carte Leaflet de confirmation + boutons WhatsApp réels (`wa.me` avec position géolocalisée) pour les contacts sans compte + notifications in-app réelles pour les contacts avec compte (vérification `hasAccount` via Supabase côté backend)
- **Module Formation complet** : 10 modules PSC1, parcours façon Duolingo, quiz progressifs de 5 à 20 questions selon le module, déverrouillage séquentiel (un module ouvre le suivant à partir de 60% de réussite), progression persistée dans Supabase, écrans `screen-training.jsx` (liste + progression globale) et `screen-training-module.jsx` (détail + quiz, transition propre entre modules)
- **Module Localisation complet** : carte Leaflet.js + OpenStreetMap, 20 centres de santé de San Pédro vérifiés (`health-centers.js`), suivi GPS temps réel (`watchPosition`), tri par distance (Haversine), filtres (Tous / Hôpitaux / Cliniques / Dispensaires / 24h sur 24), appel direct (ou "Numéro non disponible" si absent), message d'instructions manuelles si GPS refusé sur iOS, écran `screen-map.jsx`
- Profil utilisateur redesigné : carte profil avec barre de progression (complétion sur 12 points), badge "Profil complet" à 100%, sous-écrans dédiés `profile_personal` / `profile_medical` / `profile_contacts` avec navigation propre, données persistées dans Supabase. Avatar + photo (resize canvas), changement mdp, déconnexion. Mode édition champs bleutés, barre sticky, toast vert. Date de naissance via `BirthdateField` (calendrier ou texte).
- **Typographie renforcée** : titres en gras (700) vs texte courant régulier (400) sur tout l'app, texte des étapes de formation agrandi (16px)
- **Expérience iOS Safari** : hauteur d'écran fiable (repli `100vh`/`100dvh`), zones de sécurité (`env(safe-area-inset-*)`), scroll tactile fluide, sélection de texte désactivée sauf champs de saisie et réponses IA, message clair si GPS refusé (au lieu d'un "Réessayer" inopérant), icône d'écran d'accueil dédiée (`apple-touch-icon.png`)
- QR Code médical généré côté serveur (données Supabase) — fiche lisible par les secours
- Scanner QR : natif Android (MLKit) + fallback web (jsQR + file input caméra)
- Fiche victime après scan QR : groupe sanguin rouge, allergies orange, contacts avec appel direct
- Conditions générales d'utilisation
- Navigation cohérente : `goBack(nav)` sur tous les boutons retour
- Backend complet (auth Supabase, home, urgences, protocoles, chat IA, SOS réel, formations, paiements, carnet médical, QR médical)
- Backend déployé sur Render : `https://sauvmoi.onrender.com`
- Dépôt GitHub : `https://github.com/teamupsp5-ship-it/sauvmoi` (branche `main`)
- Capacitor configuré pour Android (`ci.sauvmoi.app`) + permission CAMERA dans AndroidManifest
- Mode plein écran natif (`.sm-live`, `viewport-fit=cover`)

---

## Feuille de route restante 🔲

### Priorité haute (avant démo)
- [ ] **Confirmer que `supabase/schema.sql` a bien été exécuté** sur le projet Supabase de prod, et que `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` sont bien renseignées sur Render
- [ ] Vérifier de bout en bout en conditions réelles (aucun projet Supabase réel disponible pendant le dev pour tester au-delà de mocks locaux) : inscription complète → `GET /me` reflète bien tous les champs (medical + contacts) → refresh JWT après ~1h → SOS `hasAccount`
- [ ] Brancher `@capacitor/camera` sur les uploads photo du profil (natif Android)
- [ ] `npm run build:mobile` + rebuild APK pour activer le scanner MLKit
- [ ] Configurer `ANTHROPIC_API_KEY` sur Render (à vérifier — absente en prod lors des derniers tests → le chat tournait en fallback PSC1 même en production)

### Priorité moyenne
- [ ] Vrai Google OAuth (Firebase Auth ou OAuth2) — le bouton "Continuer avec Google" est actuellement décoratif, sans `onClick`
- [ ] Vraie authentification Apple Sign-In — le bouton "Continuer avec Apple" est actuellement décoratif, sans `onClick`
- [ ] Notifications push (`@capacitor/push-notifications`) — distinct des notifications in-app SOS déjà en place
- [ ] Mode hors-ligne partiel (`@capacitor/preferences` ou cache local)

### Priorité basse
- [ ] Paiement Mobile Money réel (CinetPay, PayDunya, Wave Business)
- [ ] i18n complet FR/EN (structure `T(key, lang)` déjà en place)
- [ ] Écran desktop pour Localisation et Profil
- [ ] Tests automatisés
- [ ] Écran Formations desktop complet

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

---

## Notes pour la démo hackathon

- Sans `ANTHROPIC_API_KEY`, le chat utilise les protocoles PSC1 en dur (ça marche hors-ligne) — vérifier si la clé est configurée sur Render avant la démo
- L'authentification est réelle (Supabase) : plus de mode "n'importe quel mot de passe fonctionne" — préparer un compte de démo à l'avance plutôt que de compter sur l'auto-création au premier login
- `DEMO_USER` dans `seed.js` sert encore de données statiques pour les écrans non migrés (accueil, urgences, paiements) — simule Aïcha Kouassi, Abidjan, groupe O+ (les 20 centres de santé du module Localisation sont eux basés à San Pédro)
- Le SOS déclenche une alerte réelle : géolocalisation du téléphone, carte Leaflet, WhatsApp pour les proches sans compte, notification in-app pour ceux qui en ont un (vérification via la table Supabase `profiles`)
- Les paiements Mobile Money sont simulés (pas de vrai appel agrégateur)
- Le numéro SAMU d'urgence en Côte d'Ivoire est le **185**
