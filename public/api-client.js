// Client API Sauv'Moi — pont entre le frontend et le backend.
// (Pour pointer ailleurs : window.SAUVMOI_API = 'https://mon-url'; avant le chargement.)

(function () {
  // Le backend est servi par le MÊME serveur Express que le frontend statique
  // (Render, o2switch/cPanel, ou npm run dev en local) — sauf dans l'app
  // Android (Capacitor), où la WebView charge les fichiers locaux sous
  // `https://localhost` (androidScheme: "https", voir capacitor.config.json)
  // et où window.location.origin ne pointe donc vers AUCUN backend réel.
  // Un repli codé en dur sur https://sauvmoi.onrender.com faisait dépendre
  // silencieusement TOUT appel API du backend Render, même quand le frontend
  // était servi depuis une autre adresse (ex. o2switch) — fonctionnait grâce
  // à CORS (voir CORS_ALLOWED_ORIGINS, server.js) mais reléguait le backend
  // réellement co-hébergé sur cette autre adresse au silence, jamais
  // sollicité. Même détection `Capacitor.isNativePlatform()` que
  // screen-qr-scanner.jsx pour ne garder le repli fixe que là où il est
  // réellement nécessaire (app Android).
  const isNativeApp = !!(window.Capacitor?.isNativePlatform?.());
  const BASE = window.SAUVMOI_API
    || (isNativeApp ? 'https://sauvmoi.onrender.com' : window.location.origin);

  // Le JWT Supabase (window.SM.token) expire après ~1h. sm_refresh_token et
  // sm_expires_at (ms epoch) sont écrits ici et dans screen-auth.jsx
  // (connexion/inscription) — toujours les trois ensemble.
  const EXPIRY_MARGIN_MS = 2 * 60 * 1000; // rafraîchit si < 2 min restantes

  function getExpiresAt() {
    const v = localStorage.getItem('sm_expires_at');
    return v ? Number(v) : null;
  }

  function isExpiringSoon() {
    const expiresAt = getExpiresAt();
    if (!expiresAt) return false; // pas de session active à rafraîchir
    return Date.now() >= expiresAt - EXPIRY_MARGIN_MS;
  }

  function persistSession(session) {
    if (session.token) {
      window.SM.token = session.token;
      localStorage.setItem('sm_token', session.token);
    }
    if (session.refreshToken) localStorage.setItem('sm_refresh_token', session.refreshToken);
    if (session.expiresAt) localStorage.setItem('sm_expires_at', String(session.expiresAt));
  }

  // Efface la session côté client. Ne navigue pas elle-même (ce module n'a
  // pas accès à `nav`) — signale via SM.sessionExpired, que app-live.jsx
  // observe pour rediriger vers l'écran de connexion.
  function clearSession() {
    window.SM.token = null;
    window.SM.user = null;
    localStorage.removeItem('sm_token');
    localStorage.removeItem('sm_refresh_token');
    localStorage.removeItem('sm_expires_at');
    localStorage.removeItem('sm_user');
    window.SM.sessionExpired = true;
    window.SM.emit();
  }

  // Dédoublonne les refresh concurrents : si plusieurs appels API partent en
  // même temps avec un token expirant, un seul appel réseau de refresh part.
  let refreshPromise = null;

  async function refreshSession() {
    if (refreshPromise) return refreshPromise;
    const refreshToken = localStorage.getItem('sm_refresh_token');
    if (!refreshToken) return false;

    refreshPromise = (async () => {
      try {
        const res = await fetch(BASE + '/api/auth/refresh', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) throw new Error('refresh → ' + res.status);
        const data = await res.json();
        persistSession(data);
        return true;
      } catch (e) {
        console.warn('[API] refresh de session échoué, déconnexion:', e.message);
        clearSession();
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }

  // Distingue une vraie panne réseau (fetch() n'aboutit pas — hors-ligne) d'une
  // réponse serveur en erreur (le serveur a répondu, ce n'est pas du "hors-ligne").
  async function req(path, { method = 'GET', body } = {}) {
    // Rafraîchit la session avant l'appel si le token est expiré ou proche
    // de l'être — jamais pour les routes d'auth elles-mêmes (login/register/
    // refresh n'ont pas de session à rafraîchir, et ça éviterait une boucle).
    if (!path.startsWith('/api/auth/') && isExpiringSoon()) {
      await refreshSession();
    }

    let res;
    const headers = {};
    if (body) headers['content-type'] = 'application/json';
    const token = window.SM && window.SM.token;
    if (token) headers['authorization'] = 'Bearer ' + token;
    try {
      res = await fetch(BASE + path, {
        method,
        headers: Object.keys(headers).length ? headers : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr) {
      const err = new Error(`Réseau injoignable : ${method} ${path}`);
      err.isNetworkError = true;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`${method} ${path} → ${res.status}`);
      err.isNetworkError = false;
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  let emergencyNumbersCache = null;

  window.API = {
    base: BASE,
    refreshSession,
    isExpiringSoon,
    clearSession,

    // Accueil / contenu
    home: () => req('/api/home'),
    me: () => req('/api/me'),
    emergencies: () => req('/api/emergencies'),
    protocol: (id) => req('/api/protocols/' + id),
    analyzeImage: () => req('/api/vision/analyze', { method: 'POST' }),

    // Chat IA
    chat: (message, lang, conversationId) =>
      req('/api/chat', { method: 'POST', body: { message, lang, conversationId } }),
    conversations: () => req('/api/conversations'),

    // SOS
    sosTrigger: (loc = {}) => req('/api/sos/trigger', { method: 'POST', body: loc }),
    sosStatus: (id) => req('/api/sos/' + id + '/status'),
    sosCancel: (id) => req('/api/sos/' + id + '/cancel', { method: 'POST' }),
    rescuers: () => req('/api/rescuers/nearby'),

    // Formations
    trainingPath: () => req('/api/training/path'),
    courses: (filter) => req('/api/training/courses' + (filter ? '?filter=' + filter : '')),
    trainingMe: () => req('/api/training/me'),
    trainingModules: (lang) => req('/api/training/modules' + (lang ? '?lang=' + lang.toLowerCase() : '')),
    trainingComplete: (moduleId, score, total) =>
      req('/api/training/' + moduleId + '/complete', { method: 'POST', body: { score, total } }),

    // Paiements
    paymentMethods: () => req('/api/payments/methods'),
    payInitiate: (courseId, method, phone) =>
      req('/api/payments/initiate', { method: 'POST', body: { courseId, method, phone } }),
    payConfirm: (id) => req('/api/payments/' + id + '/confirm', { method: 'POST' }),

    // Profil utilisateur
    updateMe: (data) => req('/api/me', { method: 'PUT', body: data }),

    // Carnet médical
    medicalRecord: () => req('/api/medical-record'),
    // Lecture pure : réutilise le QR déjà généré (gen/exp/sig stables), n'en
    // recrée un que s'il n'en existe encore aucun — voir routes/api.js.
    medicalQr: () => req('/api/medical-record/qr'),
    // Régénération EXPLICITE uniquement : invalide toute carte imprimée ou
    // partagée existante (nouveau qr_generated_at, voir routes/api.js).
    regenerateQr: () => req('/api/medical-record/qr/regenerate', { method: 'POST' }),

    // Notifications in-app
    notifications: () => req('/api/notifications'),
    markNotifRead: (id) => req('/api/notifications/' + id + '/read', { method: 'POST' }),

    // Centres de santé
    healthCenters: (lat, lng) => req('/api/health-centers' + (lat != null && lng != null ? `?lat=${lat}&lng=${lng}` : '')),

    // Numéros d'urgence — source unique (src/data/emergency-numbers.js),
    // mis en cache après le premier appel : ces valeurs ne changent jamais
    // en cours de session, inutile de les redemander à chaque écran qui en
    // a besoin (SOS, fiche victime, CGU, accueil).
    emergencyNumbers: () => emergencyNumbersCache
      ? Promise.resolve(emergencyNumbersCache)
      : req('/api/emergency-numbers').then((n) => { emergencyNumbersCache = n; return n; }),
  };
})();
