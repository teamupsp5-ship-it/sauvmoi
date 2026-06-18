// Données de démonstration (alignées sur le front Sauv'Moi)

export const EMERGENCY_LIST = [
  { id: 'hemo', name: 'Hémorragie', en: 'Bleeding', icon: 'droplets', tint: 'red' },
  { id: 'chok', name: 'Étouffement', en: 'Choking', icon: 'wind', tint: 'red' },
  { id: 'unc', name: 'Inconscience', en: 'Unconscious', icon: 'user-x', tint: 'red' },
  { id: 'burn', name: 'Brûlure', en: 'Burn', icon: 'flame', tint: 'orange' },
  { id: 'avc', name: 'AVC', en: 'Stroke', icon: 'brain', tint: 'violet' },
  { id: 'heart', name: 'Crise cardiaque', en: 'Heart attack', icon: 'heart-pulse', tint: 'red' },
  { id: 'acc', name: 'Accident', en: 'Accident', icon: 'car-front', tint: 'orange' },
  { id: 'mal', name: 'Malaise', en: 'Faintness', icon: 'thermometer', tint: 'blue' },
  { id: 'conv', name: 'Convulsion', en: 'Seizure', icon: 'zap', tint: 'violet' },
];

export const COURSES = [
  { id: 'psc1', title: 'PSC1 · Prévention et Secours Civiques', duration: '6 h · 10 modules', tag: 'free', icon: 'shield-check', priceFcfa: 0 },
  { id: 'baby', title: 'Premiers gestes pour bébés et enfants', duration: '3 h · 6 modules', tag: 'free', icon: 'baby', priceFcfa: 0 },
  { id: 'avc60', title: 'AVC : reconnaître en 60 secondes', duration: '45 min', tag: 'free', icon: 'brain', priceFcfa: 0 },
  { id: 'rcp', title: 'Massage cardiaque · maîtrise', duration: '2 h', tag: 'premium', icon: 'heart-pulse', priceFcfa: 4900 },
  { id: 'sst', title: 'Sauveteur secouriste du travail (SST)', duration: '14 h · pro', tag: 'premium', icon: 'briefcase', priceFcfa: 34000 },
  { id: 'pse1', title: 'Premiers secours en équipe (PSE1)', duration: '35 h · pro', tag: 'premium', icon: 'users', priceFcfa: 120000 },
  { id: 'cata', title: 'Catastrophes naturelles · plan familial', duration: '1 h', tag: 'free', icon: 'cloud-rain', priceFcfa: 0 },
  { id: 'aed', title: 'AED · défibrillateur automatique', duration: '1 h 30', tag: 'premium', icon: 'zap', priceFcfa: 8500 },
];

export const TRAINING_PATH = [
  { id: 1, label: 'PLS', icon: 'user-round', state: 'done' },
  { id: 2, label: 'Étouffement', icon: 'wind', state: 'done' },
  { id: 3, label: 'Massage cardiaque', icon: 'heart-pulse', state: 'current' },
  { id: 4, label: 'Brûlures', icon: 'flame', state: 'locked' },
  { id: 5, label: 'Hémorragies', icon: 'droplets', state: 'locked' },
  { id: 6, label: 'AVC', icon: 'brain', state: 'locked' },
  { id: 7, label: 'Examen PSC1', icon: 'award', state: 'locked', special: true },
];

// Secouristes fictifs autour de Cocody / Riviera 2, Abidjan
export const RESCUERS = [
  { id: 'r1', name: 'Kofi A.', skill: 'PSC1', lat: 5.3540, lng: -3.9870, distanceM: 200 },
  { id: 'r2', name: 'Mariam D.', skill: 'Infirmière', lat: 5.3552, lng: -3.9881, distanceM: 350 },
  { id: 'r3', name: 'Yao K.', skill: 'PSE1', lat: 5.3531, lng: -3.9858, distanceM: 480 },
  { id: 'r4', name: 'Awa T.', skill: 'PSC1', lat: 5.3568, lng: -3.9899, distanceM: 620 },
  { id: 'r5', name: 'Ibrahim S.', skill: 'Pompier vol.', lat: 5.3519, lng: -3.9845, distanceM: 740 },
];

export const PAYMENT_METHODS = [
  { id: 'wave', label: 'Wave' },
  { id: 'om', label: 'Orange Money' },
  { id: 'mtn', label: 'MTN Mobile Money' },
  { id: 'moov', label: 'Moov Money' },
  { id: 'visa', label: 'Visa' },
];

export const TIPS = [
  { id: 'pls', title: 'Position Latérale de Sécurité', minutes: 2, desc: 'Pour une personne inconsciente qui respire.', icon: 'heart-pulse' },
  { id: 'heimlich', title: 'Manœuvre de Heimlich', minutes: 3, desc: 'Désobstruer les voies aériennes.', icon: 'wind' },
  { id: 'rcp', title: 'Rythme du massage cardiaque', minutes: 2, desc: '100 à 120 compressions par minute.', icon: 'activity' },
  { id: 'burn', title: 'Réflexe brûlure', minutes: 1, desc: "15 minutes d'eau, jamais de glace.", icon: 'flame' },
];

export const DEMO_USER = {
  id: 'u_demo',
  name: 'Aïcha Kouassi',
  initials: 'AK',
  role: 'Citoyenne',
  city: 'Abidjan',
  phone: '+22507000000',
  lang: 'FR',
  medicalRecord: {
    bloodType: 'O+',
    allergies: ['Pénicilline', 'Arachides'],
    conditions: [],
    emergencyContacts: [
      { name: 'Mamadou Kouassi', relation: 'Époux', phone: '+22507111111' },
      { name: 'Awa Koné', relation: 'Sœur', phone: '+22507222222' },
    ],
  },
  training: { streakDays: 12, xp: 1240, certificateProgress: 0.4, modulesDone: 8, modulesTotal: 20 },
};
