export const HEALTH_CENTERS = [
  // Hôpitaux publics
  { id: 'hg-san-pedro', name: 'Hôpital Général (HG) de San Pedro', type: 'hopital', phone: null, lat: 4.747568, lng: -6.635152, available24h: true },
  { id: 'chr-san-pedro', name: 'Centre Hospitalier Régional (CHR) de San Pedro', type: 'hopital', phone: null, lat: 4.784555, lng: -6.699763, available24h: true },

  // Cliniques privées
  { id: 'clinic-notre-dame', name: 'Medical Clinic Notre Dame', type: 'clinique', phone: '+225 27 34 71 35 35', lat: 4.744491, lng: -6.635397, available24h: false },
  { id: 'espace-pasteur', name: 'Espace Médical Pasteur', type: 'clinique', phone: '+225 27 34 71 86 06', lat: 4.747617, lng: -6.631029, available24h: false },
  { id: 'clinical-power-plant', name: 'Clinical Power Plant San Pedro', type: 'clinique', phone: '+225 07 47 81 81 21', lat: 4.747772, lng: -6.629602, available24h: false },
  { id: 'clinic-begnanko', name: 'Medical Clinic Begnanko', type: 'clinique', phone: '+225 07 48 57 96 45', lat: 4.737333, lng: -6.646455, available24h: false },
  { id: 'clinique-emmanuel', name: 'Clinique Médico-Chirurgicale L\'Emmanuel', type: 'clinique', phone: '+225 07 09 22 30 68', lat: 4.778827, lng: -6.652021, available24h: false },
  { id: 'centre-achifa', name: 'Centre Médical Achifa', type: 'clinique', phone: null, lat: 4.750114, lng: -6.634968, available24h: false },
  { id: 'centre-la-grace', name: 'Centre Médical La Grâce', type: 'clinique', phone: null, lat: 4.745371, lng: -6.653120, available24h: false },
  { id: 'centre-maman-louise', name: 'Centre Médical Maman Louise', type: 'clinique', phone: '+225 07 89 49 08 15', lat: 4.769273, lng: -6.667515, available24h: false },
  { id: 'clinique-rochers', name: 'Clinique des Rochers', type: 'clinique', phone: '+225 27 34 71 48 52', lat: 4.739267, lng: -6.631905, available24h: false },
  { id: 'clinique-renaissance', name: 'Clinique La Renaissance San Pedro', type: 'clinique', phone: '+225 07 10 24 67 33', lat: 4.747013, lng: -6.633425, available24h: false },

  // Maternité (regroupée dans le type "clinique")
  { id: 'maternite-zara', name: 'Maternité Zara de Digboué', type: 'clinique', phone: '+225 05 95 12 15 25', lat: 4.748684, lng: -6.693746, available24h: false },

  // Centres communautaires, associatifs et spécialisés
  { id: 'csu-dafci', name: 'CSU DAFCI San-Pedro', type: 'public', phone: '+225 05 66 66 08 66', lat: 4.777289, lng: -6.686609, available24h: false },
  { id: 'el-rapha-social', name: 'Espace de Santé et Promotion Sociale El Rapha', type: 'public', phone: '+225 07 07 38 62 72', lat: 4.765230, lng: -6.676083, available24h: false },
  { id: 'health-center-rapha', name: 'Health Center Le Rapha', type: 'public', phone: '+225 07 07 32 15 55', lat: 4.766676, lng: -6.678662, available24h: false },
  { id: 'ong-cerbas', name: 'ONG CERBAS (centre de santé)', type: 'public', phone: null, lat: 4.761192, lng: -6.667324, available24h: false },
  { id: 'dispensaire-urbain', name: 'Dispensaire Urbain de San Pedro', type: 'dispensaire', phone: null, lat: 4.771773, lng: -6.654238, available24h: false },
  { id: 'pmi-bardot', name: 'PMI Bardot San Pedro', type: 'public', phone: null, lat: 4.771569, lng: -6.654413, available24h: false },
  { id: 'centre-antituberculeux', name: 'Centre Antituberculeux de San-Pédro', type: 'public', phone: '+225 27 34 71 69 28', lat: 4.757890, lng: -6.642369, available24h: false }
];

// NOTE : liste vérifiée le 31/07/2026 via données
// géographiques Google Maps. Numéros de téléphone
// confirmés quand disponibles, phone: null sinon
// (l'interface affiche "Numéro non disponible" dans
// ce cas, comportement déjà en place).
