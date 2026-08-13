// État vivant partagé de l'application (rempli depuis le backend).
// Les écrans "patchés" lisent ici au lieu d'utiliser des données en dur.

window.SM = {
  lang: (window.TWEAK_DEFAULTS && window.TWEAK_DEFAULTS.lang) || 'FR',

  // rempli au démarrage par bootstrap()
  home: null,
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

// Charge les données initiales depuis l'API.
// /api/me exige désormais une authentification (Supabase) : appeler
// bootstrap() sans session (avant connexion) ne doit pas déclencher le
// bandeau "hors-ligne" à cause d'un 401 attendu — on saute simplement /me.
window.SM.bootstrap = async function bootstrap() {
  if (!window.SM.token) return;
  try {
    const [home, user] = await Promise.all([
      window.API.home(), window.API.me(),
    ]);
    window.SM.home = home;
    window.SM.user = user;
    window.SM.offline = false;
    window.SM.emit();
  } catch (e) {
    console.warn('[SM] bootstrap échoué (backend lancé ?):', e.message);
    // Si le token a été effacé entre-temps, c'est qu'un refresh automatique
    // a échoué (voir api-client.js clearSession()) — une session invalide,
    // pas une panne réseau. Ne pas afficher le bandeau hors-ligne dans ce
    // cas, l'utilisateur est de toute façon redirigé vers la connexion.
    if (window.SM.token) {
      window.SM.offline = true;
    }
    window.SM.emit();
  }
};
