# Sauv'Moi — Contexte projet pour Claude Code

Application de premiers secours mobile pour la Côte d'Ivoire.
Projet hackathon "IA et service universel des télécommunications TIC".

---

## Description

Sauv'Moi guide les utilisateurs dans les premiers secours via une IA vocale,
reconnaît les situations d'urgence (texte, voix, photo), déclenche un SOS géolocalisé,
et propose des formations PSC1 gamifiées. Cible : Abidjan et Afrique de l'Ouest.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Node.js (ES modules) + Express 4 + WebSocket (`ws`) |
| Frontend | React 18 + JSX transpilé par Babel Standalone (pas de build) |
| Icônes | Lucide (UMD, chargé via CDN) |
| IA | Claude `claude-haiku-4-5-20251001` via Anthropic API — fallback protocoles PSC1 si pas de clé |
| Persistance | Fichier JSON `.data/db.json` via `src/store.js` (démo — pas de vraie BDD) |
| Mobile | Capacitor.js v8 (`@capacitor/android`) — Android uniquement pour l'instant |
| Polices | Spectral (serif) · Public Sans (UI) · JetBrains Mono (code) — Google Fonts |

**Aucun bundler.** Babel transpile le JSX directement dans le navigateur.
Tous les composants sont exposés sur `window` via `Object.assign(window, {...})`.

---

## Variables d'environnement

Fichier `.env.example` à la racine :

```
ANTHROPIC_API_KEY=sk-ant-...   # Optionnel : active Claude. Sans clé → fallback protocoles.
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
PORT=3000
```

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
  token: null,       // "demo.<id>" après auth
  home: null,        // données /api/home
  emergencies: null,
  chat: { conversationId, transcript, reply, suggestedActions, loading },
  sos: { alertId, samu, rescuers, eta, status, ws },
  offline: false,
}

window.SM.emit()       // notifie tous les abonnés
window.useSM()         // hook React : re-render quand SM change
window.SM.bootstrap()  // charge home + emergencies + user depuis l'API
```

**Client HTTP :** `window.API` défini dans `public/api-client.js` — toutes les routes API y sont listées.

---

## Registre des écrans — `app-live.jsx`

```js
const PHONE_SCREENS = {
  auth:             window.AuthScreen,        // écran initial
  register:         window.RegisterScreen,
  home:             window.HomeMobile,
  qr_scanner:       window.QrScannerScreen,
  emergency:        window.EmergencyMobile,
  emergency_cam:    window.EmergencyCamera,
  emergency_guide:  window.EmergencyGuide,
  chat:             window.ChatListening,   // écran chat unifié
  chat_response:    window.ChatListening,   // même écran — plus de navigation inter-écrans
  sos:              window.SOSCountdown,
  sos_confirm:      window.SOSConfirm,
  training:         window.TrainingMobile,
  profile:          ProfileMobileLive,       // défini inline dans app-live.jsx
};
```

Pour ajouter un écran : le définir dans un fichier `screen-*.jsx`, l'exporter sur `window`,
charger le fichier dans `index.html`, l'ajouter ici.

---

## Fichiers clés et leur rôle

### Backend (`src/`)

| Fichier | Rôle |
|---|---|
| `server.js` | Express + WebSocket. Monte : `authRoutes` → `apiRoutes` → `chatRoutes` → `sosRoutes` |
| `store.js` | Store en mémoire + persistance JSON. API : `get()`, `save()`, `uid(prefix)` |
| `ai.js` | Claude via Anthropic API. Fallback déterministe si `ANTHROPIC_API_KEY` absent. Réponse normalisée : `{ reply, suggestedActions, protocolRef, source }` |
| `routes/auth.js` | `POST /auth/login` · `POST /auth/register` · `POST /auth/request-otp` · `POST /auth/verify` |
| `routes/api.js` | Home, urgences, protocoles, vision IA, formations, paiements, carnet médical |
| `routes/chat.js` | `POST /chat` (Claude ou fallback) · `GET /conversations` |
| `routes/sos.js` | `POST /sos/trigger` · WebSocket `/ws/sos/:id` · simulation temps réel |
| `data/seed.js` | `DEMO_USER`, `EMERGENCY_LIST`, `COURSES`, `RESCUERS`, `PAYMENT_METHODS`, `TIPS` |
| `data/protocols.js` | Protocoles PSC1 validés (hémorragie, étouffement, RCP, brûlure, AVC…) |

### Frontend (`public/`)

| Fichier | Rôle |
|---|---|
| `frames.jsx` | Primitives partagées : `Icon`, `PhoneFrame`, `DesktopFrame`, `TabBar`, `PulseCircle`, `Waveform`. `StatusBar()` et `HomeIndicator()` retournent `null` (le vrai OS gère ça). |
| `screen-auth.jsx` | `AuthScreen` (email + mdp, boutons Google/Apple) · `RegisterScreen` (2 étapes : infos perso + profil médical) |
| `screen-home.jsx` | `HomeMobile` (en-tête blanc, carte IA bleue, QR, conseil du jour, `HomeTabBar` bleu nuit) · `QrScannerScreen` · `HomeDesktop` · `Sidebar` |
| `screen-emergency.jsx` | `EmergencyMobile` · `EmergencyCamera` · `EmergencyGuide` |
| `screen-chat.jsx` | `ChatScreen` unifié (canvas statique) · `ChatUserBubble` · `ChatAIBubble` · `ChatTypingDots` · `ChatDesktop`. `ChatListening = ChatResponse = ChatScreen`. Surcharge par `live-chat.jsx` en live. |
| `screen-sos.jsx` | `SOSCountdown` · `SOSConfirm` — remplacés par `live-sos.jsx` en live |
| `screen-training.jsx` | `TrainingMobile` |
| `live-chat.jsx` | Chat live complet : POST `/api/chat`, fallback PSC1 local (6 protocoles embarqués), Web Speech API (FR/EN), envoi image, auto-scroll, indicateur En ligne/Hors ligne. Surcharge `ChatListening` et `ChatResponse`. |
| `live-sos.jsx` | Version branchée backend du SOS (WebSocket) — surcharge `screen-sos.jsx` |
| `live-emergency.jsx` | Version branchée backend de l'urgence — surcharge `screen-emergency.jsx` |
| `app-live.jsx` | Point d'entrée app réelle. Registre `PHONE_SCREENS`. Démarre sur `initial="auth"`. Classe CSS `sm-live` pour le plein écran natif. |
| `app.jsx` | Point d'entrée canvas design. Sections : 0·Auth · 1·Accueil · 2·Urgence · 3·Chat · 4·SOS · 5·Formation |
| `sm-state.js` | Bus d'état global `window.SM` |
| `api-client.js` | Client HTTP `window.API` — toutes les routes disponibles |
| `styles.css` | Tokens CSS (`--sm-red`, `--sm-blue`, `--sm-ink`…), composants, `.sm-live` pour plein écran natif |
| `tweaks-panel.jsx` | Panneau de configuration design (accent, densité, dark mode) — canvas uniquement |
| `design-canvas.jsx` | Composants `DesignCanvas`, `DCSection`, `DCArtboard`, `TweaksPanel` — canvas uniquement |

### Configuration

| Fichier | Rôle |
|---|---|
| `capacitor.config.json` | `appId: ci.sauvmoi.app` · `appName: Sauv'Moi` · `webDir: public` · `androidScheme: https` |
| `package.json` | Scripts `start`, `dev`, `android:add`, `build:mobile`, `android:open`, `android:run` |

---

## Flux d'authentification

```
AuthScreen → POST /api/auth/login { email, password }
           ← { token: "demo.<id>", user: {...} }
           → window.SM.token = token
           → window.SM.user = user
           → nav.reset('home')

RegisterScreen (étape 1) → infos perso + validation
RegisterScreen (étape 2) → profil médical (facultatif)
           → POST /api/auth/register { name, email, password, birthdate, gender,
                                       bloodType, height, weight, conditions,
                                       allergies, emergencyContact }
           ← { token, user }
           → nav.reset('home')
```

**Démo :** n'importe quel mot de passe fonctionne pour un compte existant.
Le code OTP (legacy) est toujours `123456`.

---

## Décisions techniques prises

| Sujet | Décision | Raison |
|---|---|---|
| Build | Pas de bundler | Démo hackathon — zéro config, démarrage immédiat |
| Auth | Email + password (pas OTP en principal) | Plus universel sur mobile |
| Écran initial | `auth` | L'utilisateur doit se connecter avant d'accéder à l'app |
| `StatusBar` / `HomeIndicator` | `return null` dans `frames.jsx` | Le vrai OS Android gère sa propre barre |
| Plein écran natif | Classe `.sm-live` + `position: fixed; inset: 0` | Permet de garder `canvas.html` intact |
| Canvas design | `canvas.html` séparé | Préserve les artboards de maquette sans impacter l'app |
| `HomeTabBar` | Composant dédié dans `screen-home.jsx` | Fond bleu nuit différent de l'ancien `TabBar` beige |
| Conseil du jour | `DAILY_TIPS[getDay()]` | Simple, sans backend, 7 conseils PSC1 valides |
| Chat unifié | `ChatListening = ChatResponse` dans `live-chat.jsx` | Un seul écran gère tout le fil de conversation — `nav.replace('chat_response')` supprimé |
| Fallback chat hors-ligne | 6 protocoles PSC1 embarqués dans `live-chat.jsx` (`_PSC1`) | Indépendant du backend — fonctionne même si le serveur est coupé |
| Onglet Localisation | Désactivé (opacity 0.25) | Écran carte non encore créé |

---

## Ce qui est fait ✅

- Authentification complète (connexion email/mdp + inscription 2 étapes avec profil médical)
- Écran d'accueil redesigné (en-tête dynamique, carte IA bleue, QR scanner, conseil du jour, tabbar bleu nuit avec SOS pulsé)
- Écran QR Scanner (placeholder — attend plugin `@capacitor/camera`)
- Écran urgence (voix + caméra IA + guidage pas-à-pas)
- Chat IA unifié : interface bulle complète (texte, voix Web Speech API, image), POST `/api/chat` (Claude ou fallback PSC1 backend), fallback PSC1 local si backend injoignable, indicateur En ligne/Hors ligne, auto-scroll, actions suggérées `tel:185`/`tel:180`
- SOS géolocalisé (compte à rebours + WebSocket temps réel)
- Formations (parcours gamifié)
- Backend complet (auth, home, urgences, protocoles, chat IA, SOS, formations, paiements, carnet médical)
- Capacitor configuré pour Android (`ci.sauvmoi.app`)
- Mode plein écran natif (`.sm-live`, `viewport-fit=cover`, sans cadre téléphone fictif)
- `StatusBar` et `HomeIndicator` neutralisés (le vrai OS gère)

---

## Feuille de route restante 🔲

### Priorité haute (avant démo)
- [ ] Écran Profil utilisateur (affichage + édition carnet médical)
- [ ] Brancher `@capacitor/camera` sur `QrScannerScreen`
- [ ] Écran Localisation / carte des secouristes proches
- [ ] Déployer le backend (Render, Railway ou VPS) pour que l'APK puisse appeler l'API

### Priorité moyenne
- [ ] Vrai Google OAuth (Firebase Auth ou OAuth2)
- [ ] Vraie authentification Apple Sign-In
- [ ] Notifications push (`@capacitor/push-notifications`)
- [ ] Génération QR code du carnet médical (endpoint `/api/medical-record/qr` déjà prêt)
- [ ] Mode hors-ligne partiel (`@capacitor/preferences` ou cache local)

### Priorité basse
- [ ] Paiement Mobile Money réel (CinetPay, PayDunya, Wave Business)
- [ ] i18n complet FR/EN (structure `T(key, lang)` déjà en place)
- [ ] Écran desktop pour Localisation et Profil
- [ ] Tests automatisés

---

## Conventions de code

- **Composants JSX** : PascalCase, exposés sur `window` à la fin du fichier via `Object.assign(window, {...})`
- **Styles** : inline JSX uniquement, jamais de classes inventées — utiliser les tokens `--sm-*` et les classes utilitaires de `styles.css`
- **Navigation** : `nav.go('id')` empile · `nav.reset('id')` remplace tout · `nav.back()` dépile
- **State** : données live via `window.SM` + `window.useSM()` dans les composants live
- **API calls** : `window.API.*` pour les appels standards, `fetch` direct pour les routes auth
- **Pas de commentaires** sauf WHY non-évident
- **ES modules** côté backend (`"type": "module"` dans package.json)

---

## Notes pour la démo hackathon

- Sans `ANTHROPIC_API_KEY`, le chat utilise les protocoles PSC1 en dur (ça marche hors-ligne)
- `DEMO_USER` dans `seed.js` simule Aïcha Kouassi, Abidjan, groupe O+
- Le SOS déclenche une simulation : SAMU reçoit en 2s, secouristes acceptent, ETA défile
- Les paiements Mobile Money sont simulés (pas de vrai appel agrégateur)
- Le numéro SAMU d'urgence en Côte d'Ivoire est le **185**
