// Source unique des numéros d'urgence (Côte d'Ivoire). Toute autre valeur
// codée en dur ailleurs dans le projet (system prompt IA, écrans SOS, fiche
// victime, CGU, i18n...) doit venir d'ici — soit par import direct côté
// backend, soit via GET /api/emergency-numbers côté navigateur (voir
// routes/api.js et public/api-client.js). Trouvé lors du LOT 7 : le SOS et
// le prompt IA affichaient deux numéros de police différents (110 vs 170),
// tous deux réels mais divergents faute d'une source commune.
export const EMERGENCY_NUMBERS = {
  samu: '185',
  pompiers: '180',
  police: '110',
};
