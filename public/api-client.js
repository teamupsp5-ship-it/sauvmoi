// Client API Sauv'Moi — pont entre le frontend et le backend.
// Sur mobile Capacitor, le WebView ne peut pas atteindre localhost : on cible l'IP LAN.
// (Pour pointer ailleurs : window.SAUVMOI_API = 'https://mon-url'; avant le chargement.)

(function () {
  const BASE = window.SAUVMOI_API
    || (window.Capacitor ? 'http://192.168.1.8:3000' : '');

  async function req(path, { method = 'GET', body } = {}) {
    const res = await fetch(BASE + path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
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

    // Paiements
    paymentMethods: () => req('/api/payments/methods'),
    payInitiate: (courseId, method, phone) =>
      req('/api/payments/initiate', { method: 'POST', body: { courseId, method, phone } }),
    payConfirm: (id) => req('/api/payments/' + id + '/confirm', { method: 'POST' }),

    // Carnet médical
    medicalRecord: () => req('/api/medical-record'),
    medicalQr: () => req('/api/medical-record/qr'),

    // WebSocket SOS temps réel → renvoie le socket
    sosSocket: (alertId, onEvent) => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const host = BASE ? BASE.replace(/^https?:\/\//, '') : location.host;
      const ws = new WebSocket(`${proto}://${host}/ws/sos/${alertId}`);
      ws.onmessage = (e) => { try { onEvent(JSON.parse(e.data)); } catch {} };
      return ws;
    },
  };
})();
