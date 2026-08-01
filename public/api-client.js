// Client API Sauv'Moi — pont entre le frontend et le backend.
// (Pour pointer ailleurs : window.SAUVMOI_API = 'https://mon-url'; avant le chargement.)

(function () {
  const BASE = window.SAUVMOI_API
    || 'https://sauvmoi.onrender.com';

  // Distingue une vraie panne réseau (fetch() n'aboutit pas — hors-ligne) d'une
  // réponse serveur en erreur (le serveur a répondu, ce n'est pas du "hors-ligne").
  async function req(path, { method = 'GET', body } = {}) {
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

  window.API = {
    base: BASE,

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
    trainingModules: () => req('/api/training/modules'),
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
    medicalQr: () => req('/api/medical-record/qr'),

    // Notifications in-app
    notifications: () => req('/api/notifications'),
    markNotifRead: (id) => req('/api/notifications/' + id + '/read', { method: 'POST' }),

    // Centres de santé
    healthCenters: (lat, lng) => req('/api/health-centers' + (lat != null && lng != null ? `?lat=${lat}&lng=${lng}` : '')),
  };
})();
