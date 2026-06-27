# Sauv'Moi — Contexte projet pour Claude Code

Application de premiers secours mobile pour la Côte d'Ivoire.
Projet hackathon "IA et service universel des télécommunications TIC".
Tagline : **"Restez calme, tout ira bien"** (affiché sur splash screen et écran de connexion).

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
| QR Scan | `@capacitor-mlkit/barcode-scanning` (natif Android) + `jsQR` (fallback web via CDN) |
| Caméra | `@capacitor/camera` — installé, branché dans `screen-qr-scanner.jsx` |
| Polices | Poppins (UI principal) · Spectral (serif titres) · Public Sans (fallback) · JetBrains Mono (code) — Google Fonts |

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
  profile:          window.ProfileScreen,
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
| `server.js` | Express + WebSocket. Monte : `authRoutes` → `apiRoutes` → `chatRoutes` → `sosRoutes` |
| `store.js` | Store en mémoire + persistance JSON. API : `get()`, `save()`, `uid(prefix)` |
| `ai.js` | Claude via Anthropic API. Fallback déterministe si `ANTHROPIC_API_KEY` absent. Réponse normalisée : `{ reply, suggestedActions, protocolRef, source }` |
| `routes/auth.js` | `POST /auth/login` · `POST /auth/register` · `POST /auth/request-otp` · `POST /auth/verify` · `POST /auth/change-password` |
| `routes/api.js` | Home, urgences, protocoles, vision IA, formations, paiements, carnet médical |
| `routes/chat.js` | `POST /chat` (Claude ou fallback) · `GET /conversations` |
| `routes/sos.js` | `POST /sos/trigger` · `GET /sos/:id/status` · `POST /sos/:id/cancel` · WebSocket `/ws/sos/:id` · simulation temps réel |
| `data/seed.js` | `DEMO_USER`, `EMERGENCY_LIST`, `COURSES`, `RESCUERS`, `PAYMENT_METHODS`, `TIPS` |
| `data/protocols.js` | Protocoles PSC1 validés (hémorragie, étouffement, RCP, brûlure, AVC…) |

### Frontend (`public/`)

| Fichier | Rôle |
|---|---|
| `frames.jsx` | Primitives partagées : `Icon`, `PhoneFrame`, `DesktopFrame`, `TabBar`, `PulseCircle`, `Waveform`. `StatusBar()` et `HomeIndicator()` retournent `null`. Définit `goBack(nav)` (helper global) et `nav.canBack()`. |
| `screen-splash.jsx` | Animation "Révélation Vitale" 6.5s : fond rouge → cercle blanc (1.5s) → logo pop-in + pulsation infinie (2.8s) → tracé ECG SVG + titre Poppins (2.8s→4.5s) → sous-titre (4.5s→5.5s) → redirection auth ou home. |
| `screen-auth.jsx` | `AuthScreen` (logo + tagline, email + mdp, boutons Google/Apple) · `RegisterScreen` (2 étapes : infos perso + profil médical) |
| `screen-home.jsx` | `HomeMobile` : logo `logo_80.png` en haut à gauche, carte IA bleue (min-height 120px), QR + conseil (icônes noires sur fond #F1F2F4), `HomeTabBar` dégradé bleu #1565C0→#0D47A1 avec backdrop-blur + indicateur blanc sur onglet actif. Avatar cliquable → profil. `HomeDesktop` · `Sidebar`. |
| `screen-emergency.jsx` | `EmergencyMobile` · `EmergencyCamera` · `EmergencyGuide` |
| `screen-chat.jsx` | `ChatScreen` unifié (canvas statique). Surcharge par `live-chat.jsx` en live. |
| `screen-sos.jsx` | `SOSCountdown` (idle : grand bouton rouge pulsant + numéros rapides ; counting : compte à rebours 5s, cercle SVG rouge, vibration) · `SOSConfirm` — remplacés par `live-sos.jsx` en live |
| `screen-training.jsx` | `TrainingMobile` — bouton retour en haut à gauche du header. |
| `live-chat.jsx` | Chat live complet : POST `/api/chat`, fallback PSC1 local (6 protocoles embarqués), Web Speech API (FR/EN), envoi image, auto-scroll, indicateur En ligne/Hors ligne. Surcharge `ChatListening` et `ChatResponse`. |
| `live-sos.jsx` | Version branchée backend du SOS (WebSocket) — surcharge `screen-sos.jsx` |
| `live-emergency.jsx` | Version branchée backend de l'urgence — surcharge `screen-emergency.jsx` |
| `screen-profile.jsx` | Profil complet : avatar + photo (resize canvas), infos perso, carnet médical, contacts d'urgence (max 5), changement mdp, déconnexion. Mode édition avec champs bleutés, barre sticky Annuler/Sauvegarder, toast vert. |
| `screen-qr-code.jsx` | Affichage du QR PNG médical personnel (depuis `/api/medical-record/qr`). |
| `screen-terms.jsx` | Conditions générales d'utilisation (8 sections). |
| `screen-victim-card.jsx` | Fiche d'urgence victime après scan QR : groupe sanguin rouge, allergies orange, contacts avec appel direct. |
| `screen-qr-scanner.jsx` | Scanner QR (surcharge `QrScannerScreen`). Natif : `@capacitor-mlkit/barcode-scanning`. Web : file input + jsQR. Navigue vers `victim_card`. |
| `app-live.jsx` | Point d'entrée app réelle. Registre `PHONE_SCREENS`. Démarre toujours sur `splash` (qui redirige). Classe CSS `sm-live` pour le plein écran natif. |
| `app.jsx` | Point d'entrée canvas design. Sections : 0·Auth · 1·Accueil · 2·Urgence · 3·Chat · 4·SOS · 5·Formation |
| `sm-state.js` | Bus d'état global `window.SM` |
| `api-client.js` | Client HTTP `window.API` — toutes les routes disponibles |
| `styles.css` | Tokens CSS (`--sm-red`, `--sm-blue`, `--sm-ink`…), Poppins comme `--font-ui`, `--sm-paper: #FFFFFF`, `--sm-radius: 16px`, `--sm-shadow`, composants, `.sm-live` pour plein écran natif |
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
| Écran initial | `splash` (toujours) | Le splash gère lui-même la redirection auth/home selon session |
| `StatusBar` / `HomeIndicator` | `return null` dans `frames.jsx` | Le vrai OS Android gère sa propre barre |
| Plein écran natif | Classe `.sm-live` + `position: fixed; inset: 0` | Permet de garder `canvas.html` intact |
| Canvas design | `canvas.html` séparé | Préserve les artboards de maquette sans impacter l'app |
| `HomeTabBar` | Dégradé bleu #1565C0→#0D47A1 + backdrop-blur | Distincts visuellement, effet verre moderne |
| Conseil du jour | `DAILY_TIPS[getDay()]` | Simple, sans backend, 7 conseils PSC1 valides |
| Chat unifié | `ChatListening = ChatResponse` dans `live-chat.jsx` | Un seul écran gère tout le fil de conversation |
| Fallback chat hors-ligne | 6 protocoles PSC1 embarqués dans `live-chat.jsx` (`_PSC1`) | Indépendant du backend — fonctionne même si le serveur est coupé |
| Onglet Localisation | Désactivé (opacity 0.25) | Écran carte non encore créé |
| URL API | `https://sauvmoi-production.up.railway.app` en dur dans `api-client.js` | Backend Railway en prod |
| QR Scanner web | `jsQR` (CDN) + `<input type="file" capture="environment">` | Sans bundler : plugin natif accessible via `window.Capacitor.Plugins.BarcodeScanner` |
| Données victime QR | `window.SM_VICTIM` (variable globale temporaire) | Passage de données entre QrScannerScreen → VictimCardScreen sans router |
| Boutons retour | `goBack(nav)` partout | `nav.back()` seul plante si la pile est vide — `goBack` bascule sur `nav.reset('home')` |
| Avatar accueil | Bouton cliquable → `nav.go('profile')` | Re-render immédiat via `window.useSM()` déjà présent dans `HomeMobile` |
| Police principale | Poppins (400/500/600/700) remplace Public Sans | Meilleure lisibilité mobile, look médical/app moderne |
| Fond général | `--sm-paper: #FFFFFF` (blanc pur) | Contraste maximal sur mobile, cartes qui se détachent via shadow |
| Icônes accueil | Fond `#F1F2F4` gris neutre, icônes `#1a1a1a` | Suppression des fonds colorés (vert/rose) qui nuisaient à la lisibilité |
| Splash ECG | Tracé SVG `stroke-dashoffset` → 0 | Animation native CSS, aucun JS de rendu |
| Logo splash | Pulsation `scale(1)→scale(1.08)` infinite dès phase 2 | Animation continue jusqu'à redirection — effet battement de cœur |

---

## Ce qui est fait ✅

- Authentification complète (connexion email/mdp + inscription 2 étapes avec profil médical) + session persistante (localStorage)
- Splash screen "Révélation Vitale" 6.5s : fond rouge → cercle blanc → logo pop-in → pulsation → tracé ECG → titre + sous-titre → redirection
- Logo intégré partout : `logo_80.png` (auth + header accueil), `logo_1024.png` (splash), `logo_192.png` (favicon)
- Écran d'accueil redesigné : dégradé header, carte IA bleue agrandie, QR + conseil (icônes noires sur fond gris), tabbar bleu dégradé avec blur + indicateur actif
- Avatar accueil cliquable → profil, photo si disponible, réactif via `useSM()`
- Design global Poppins : police principale, `--sm-paper` blanc, `--sm-radius 16px`, `--sm-shadow`, boutons scale(0.97)
- Écran urgence (voix + caméra IA + guidage pas-à-pas)
- Chat IA unifié : interface bulle complète (texte, voix Web Speech API, image), POST `/api/chat`, fallback PSC1 local, indicateur En ligne/Hors ligne, auto-scroll
- SOS géolocalisé (compte à rebours + WebSocket temps réel)
- Formations (parcours gamifié + bouton retour)
- Profil utilisateur complet : avatar + photo (resize canvas), infos perso, carnet médical, contacts d'urgence (max 5), changement mdp, déconnexion. Mode édition champs bleutés, barre sticky, toast vert.
- QR Code médical généré côté serveur — fiche lisible par les secours
- Scanner QR : natif Android (MLKit) + fallback web (jsQR + file input caméra)
- Fiche victime après scan QR : groupe sanguin rouge, allergies orange, contacts avec appel direct
- Conditions générales d'utilisation
- Navigation cohérente : `goBack(nav)` sur tous les boutons retour
- Backend complet (auth, home, urgences, protocoles, chat IA, SOS, formations, paiements, carnet médical, PUT /me, QR médical)
- Backend déployé sur Railway : `https://sauvmoi-production.up.railway.app`
- Dépôt GitHub : `https://github.com/teamupsp5-ship-it/sauvmoi` (branche `main`)
- Capacitor configuré pour Android (`ci.sauvmoi.app`) + permission CAMERA dans AndroidManifest
- Mode plein écran natif (`.sm-live`, `viewport-fit=cover`)

---

## Feuille de route restante 🔲

### Priorité haute (avant démo)
- [ ] Module SOS complet : redesign écran idle + countdown 5s + confirm avec WhatsApp + contacts hasAccount
- [ ] Écran Localisation / carte des secouristes proches
- [ ] Brancher `@capacitor/camera` sur les uploads photo du profil (natif Android)
- [ ] `npm run build:mobile` + rebuild APK pour activer le scanner MLKit

### Priorité moyenne
- [ ] Notifications in-app (badge logo + liste alertes reçues)
- [ ] Vrai Google OAuth (Firebase Auth ou OAuth2)
- [ ] Vraie authentification Apple Sign-In
- [ ] Notifications push (`@capacitor/push-notifications`)
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
- **API calls** : `window.API.*` pour les appels standards, `fetch` direct pour les routes auth
- **Pas de commentaires** sauf WHY non-évident
- **ES modules** côté backend (`"type": "module"` dans package.json)

---

## Déploiement & infrastructure

| Élément | Valeur |
|---|---|
| Backend prod | `https://sauvmoi-production.up.railway.app` |
| Dépôt GitHub | `https://github.com/teamupsp5-ship-it/sauvmoi` |
| Branche principale | `main` |
| Déploiement | Automatique sur push Railway ← GitHub |
| Variable Railway | `ANTHROPIC_API_KEY` (optionnel) |

---

## Notes pour la démo hackathon

- Sans `ANTHROPIC_API_KEY`, le chat utilise les protocoles PSC1 en dur (ça marche hors-ligne)
- `DEMO_USER` dans `seed.js` simule Aïcha Kouassi, Abidjan, groupe O+
- Le SOS déclenche une simulation : SAMU reçoit en 2s, secouristes acceptent, ETA défile
- Les paiements Mobile Money sont simulés (pas de vrai appel agrégateur)
- Le numéro SAMU d'urgence en Côte d'Ivoire est le **185**
