// État vivant partagé de l'application (rempli depuis le backend).
// Les écrans "patchés" lisent ici au lieu d'utiliser des données en dur.

window.SM = {
  lang: (window.TWEAK_DEFAULTS && window.TWEAK_DEFAULTS.lang) || 'FR',

  // rempli au démarrage par bootstrap()
  home: null,
  emergencies: null,
  user: null,

  // conversation en cours (chat vocal)
  chat: {
    conversationId: null,
    transcript: '',        // ce que "dit" l'utilisateur
    reply: '',             // réponse de l'IA
    suggestedActions: [],
    protocolRef: null,
    loading: false,
  },

  // alerte SOS en cours
  sos: {
    alertId: null,
    samu: null,
    relatives: [],
    rescuers: [],
    rescuersAccepted: 0,
    eta: null,
    status: null,
    ws: null,
  },
};

// Petit bus d'abonnement pour forcer le re-render des écrans live
window.SM._subs = new Set();
window.SM.subscribe = (fn) => { window.SM._subs.add(fn); return () => window.SM._subs.delete(fn); };
window.SM.emit = () => { window.SM._subs.forEach((fn) => { try { fn(); } catch {} }); };

// Hook React : renvoie un compteur qui change à chaque emit() → re-render
window.useSM = function useSM() {
  const [, force] = React.useState(0);
  React.useEffect(() => window.SM.subscribe(() => force((n) => n + 1)), []);
  return window.SM;
};

// Phrases d'exemple "entendues" par le micro selon la langue (démo vocale)
window.SM.demoUtterances = {
  FR: ['Mon père est tombé et ne répond plus', "Quelqu'un saigne beaucoup", "Un bébé s'est brûlé avec de l'eau chaude"],
  EN: ['My father fell and is not responding', 'Someone is bleeding a lot', 'A baby got burned with hot water'],
};

// Charge les données initiales depuis l'API
window.SM.bootstrap = async function bootstrap() {
  try {
    const [home, emergencies, user] = await Promise.all([
      window.API.home(), window.API.emergencies(), window.API.me(),
    ]);
    window.SM.home = home;
    window.SM.emergencies = emergencies;
    window.SM.user = user;
    window.SM.emit();
  } catch (e) {
    console.warn('[SM] bootstrap échoué (backend lancé ?):', e.message);
    window.SM.offline = true;
    window.SM.emit();
  }
};
