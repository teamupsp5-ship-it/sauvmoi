# Sauv'Moi — Application complète

App IA de premiers secours (Côte d'Ivoire). **Frontend + backend réunis** : un seul serveur, une seule commande.
Node.js + Express + WebSocket. **Aucune base de données à installer.**

## Lancer l'application

### En un clic (recommandé pour la démo)
- **Windows** : double-cliquez sur `Lancer-Sauvmoi.bat`
- **macOS** : double-cliquez sur `Lancer-Sauvmoi.command` (1re fois : clic-droit → Ouvrir)
- **Linux** : `./Lancer-Sauvmoi.command`

Le lanceur vérifie Node.js, installe les dépendances la première fois, démarre le serveur **et** ouvre le navigateur sur l'app. Voir `COMMENT-LANCER.txt` pour le détail.

### En ligne de commande (1 commande)

```bash
npm install
npm start
```

Puis ouvre **http://localhost:3000** dans ton navigateur. C'est l'application réelle, branchée au backend.

> 💡 Pour la démo : si le wifi du hackathon est mauvais, ça n'a aucune importance — tout tourne en local sur ta machine.

### Autres URL
- `http://localhost:3000/` → **l'application** (1 téléphone live)
- `http://localhost:3000/canvas.html` → le **design canvas** d'origine (vue d'ensemble des 5 écrans, pour présenter la maquette)
- `http://localhost:3000/api/health` → santé de l'API

## IA : deux modes automatiques
- **Sans clé** (par défaut) → le chat répond via des **protocoles PSC1 validés en dur**. Idéal démo : zéro hallucination, marche hors-ligne.
- **Avec Claude** → `cp .env.example .env`, renseigne `ANTHROPIC_API_KEY`, relance. Le chat passe sur Claude, **bridé par les mêmes protocoles**.

## Le parcours de démo (ce qui est vraiment branché)

1. **Accueil** — données chargées depuis l'API (`/api/home`).
2. **Chat IA** ⭐ — touche le micro de l'accueil → l'app « entend » une phrase, l'envoie au backend, et **affiche la vraie réponse de l'IA** mot à mot, avec le bon protocole détecté.
3. **Urgence → Guidage** — le guidage pas-à-pas charge le **protocole réel** correspondant au contexte (`/api/protocols/:id`).
4. **SOS temps réel** ⭐⭐ — depuis l'onglet SOS, le compte à rebours déclenche une **vraie alerte** ; l'écran de suivi s'abonne au **WebSocket** : le SAMU passe à « reçu », les secouristes acceptent **un par un en direct**, l'ETA défile. C'est le moment fort.
5. **Formations** — catalogue gamifié (les paiements Mobile Money sont simulés côté API).

## Comment c'est assemblé

Le frontend d'origine était un *design canvas* (maquette statique). Pour en faire une app utilisable, sans toucher au design :

```
public/
  index.html          ← APP réelle (charge les écrans + surcharges live)
  canvas.html         ← design canvas d'origine (préservé)
  api-client.js       ← window.API : pont REST + WebSocket vers le backend
  sm-state.js         ← window.SM : état partagé rempli par l'API
  frames.jsx, screen-*.jsx   ← écrans d'origine (design intact)
  live-chat.jsx       ← surcharge ChatListening/ChatResponse (vraie IA)
  live-sos.jsx        ← surcharge SOSCountdown/SOSConfirm (WebSocket live)
  live-emergency.jsx  ← surcharge EmergencyGuide (protocole réel)
  app-live.jsx        ← point d'entrée : 1 téléphone plein écran
src/                  ← backend (Express + WebSocket + IA + données)
```

Les fichiers `live-*.jsx` sont chargés **après** les originaux : ils remplacent les écrans dynamiques par des versions branchées au backend, en gardant exactement le même rendu visuel.

## Déploiement (au-delà du PC local)
Le serveur lit `process.env.PORT`, donc il marche tel quel sur Render, Railway, etc. Pour une URL publique rapide depuis ton PC :
```bash
npm start                 # terminal 1
npx ngrok http 3000       # terminal 2 → URL publique (WebSocket inclus)
```

## ⚠️ Important (au-delà de la démo)
- Les protocoles de secours doivent être **relus par un formateur PSC1 / professionnel de santé** avant tout usage réel.
- SAMU 185, secouristes, paiements et analyse caméra sont **simulés**. En production : partenariat services d'urgence, agrégateur Mobile Money (CinetPay / PayDunya / Hub2), modèle de vision, conformité **ARTCI** pour les données de santé.
