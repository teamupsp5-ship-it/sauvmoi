// Protocoles de premiers secours validés (inspirés PSC1 / Croix-Rouge).
// SOURCE DE VÉRITÉ de l'IA : en démo sans clé API, et garde-fou anti-hallucination
// quand la clé est présente. Chaque protocole se termine TOUJOURS par l'appel aux secours.
// ⚠️ À faire relire par un formateur PSC1 / professionnel de santé avant tout usage réel.

export const SAMU = '185';
export const POMPIERS = '180';
export const POLICE = '170';

export const PROTOCOLS = {
  hemo: {
    id: 'hemo',
    name: 'Hémorragie',
    en: 'Bleeding',
    icon: 'droplets',
    tint: 'red',
    severity: 'critique',
    summary: 'Compression directe et continue de la plaie.',
    keywords: ['saigne', 'sang', 'hémorragie', 'plaie', 'coupure', 'blood', 'bleeding', 'cut'],
    steps: [
      { title: 'Appliquez une pression ferme', icon: 'hand', desc: "Avec un linge propre, appuyez fortement sur la plaie. Ne retirez pas le linge même s'il s'imbibe — ajoutez-en par-dessus." },
      { title: 'Maintenez la pression 10 min', icon: 'timer', desc: 'Ne soulevez pas pour vérifier. Comptez avec le chronomètre. Parlez à la personne pour la rassurer.' },
      { title: 'Surélevez le membre', icon: 'move-up', desc: 'Si possible et sans douleur, levez le membre blessé au-dessus du niveau du cœur pour ralentir le saignement.' },
      { title: 'Appelez le SAMU 185', icon: 'phone', desc: "L'aide est en chemin. Restez calme, continuez la pression jusqu'à leur arrivée." },
    ],
  },
  chok: {
    id: 'chok',
    name: 'Étouffement',
    en: 'Choking',
    icon: 'wind',
    tint: 'red',
    severity: 'critique',
    summary: '5 claques dans le dos, puis 5 compressions abdominales (Heimlich).',
    keywords: ['étouffe', 'etouffe', 'avale', 'gorge', 'choking', 'choke', 'étranglé'],
    steps: [
      { title: 'Encouragez à tousser', icon: 'wind', desc: 'Si la personne tousse ou parle, laissez-la tousser : ne tapez pas dans le dos.' },
      { title: '5 claques dans le dos', icon: 'hand', desc: 'Si elle ne peut plus respirer : penchez-la en avant, donnez 5 claques fermes entre les omoplates avec le plat de la main.' },
      { title: '5 compressions abdominales', icon: 'move-up', desc: 'Si ça ne marche pas : placez-vous derrière, poing au-dessus du nombril, tirez vers vous et vers le haut, 5 fois (manœuvre de Heimlich).' },
      { title: 'Alternez et appelez le 185', icon: 'phone', desc: 'Alternez 5 claques / 5 compressions. Appelez le SAMU 185 immédiatement.' },
    ],
  },
  unc: {
    id: 'unc',
    name: 'Inconscience',
    en: 'Unconscious',
    icon: 'user-x',
    tint: 'red',
    severity: 'critique',
    summary: 'Vérifier la respiration, mettre en Position Latérale de Sécurité.',
    keywords: ['inconscient', 'évanoui', 'tombé', 'répond plus', 'ne répond', 'unconscious', 'passed out', 'fainted'],
    steps: [
      { title: 'Vérifiez la conscience', icon: 'hand', desc: 'Parlez fort, secouez doucement les épaules. Pas de réaction = inconscient.' },
      { title: 'Vérifiez la respiration', icon: 'wind', desc: 'Joue près de la bouche, regardez le thorax. Comptez 10 secondes. Respire ?' },
      { title: 'Position Latérale de Sécurité', icon: 'move-up', desc: "Si elle respire : tournez-la sur le côté pour libérer les voies aériennes." },
      { title: 'Appelez le SAMU 185', icon: 'phone', desc: "Si elle NE respire PAS : appelez le 185 et commencez le massage cardiaque." },
    ],
  },
  burn: {
    id: 'burn',
    name: 'Brûlure',
    en: 'Burn',
    icon: 'flame',
    tint: 'orange',
    severity: 'modérée',
    summary: "Refroidir à l'eau 15 min. Ni glace, ni beurre, ni dentifrice.",
    keywords: ['brûlé', 'brule', 'brûlure', 'feu', 'eau chaude', 'huile', 'burn', 'burned', 'scald'],
    steps: [
      { title: "Refroidissez à l'eau", icon: 'droplets', desc: "Eau du robinet tiède (15–25 °C) pendant 15 minutes minimum. Pas de glace." },
      { title: 'Retirez bijoux et vêtements', icon: 'hand', desc: 'Avant que la zone ne gonfle — sauf ce qui colle à la peau.' },
      { title: 'Couvrez sans serrer', icon: 'move-up', desc: 'Linge propre humide. Pas de beurre, pas de dentifrice, ne percez pas les cloques.' },
      { title: 'Consultez si grave', icon: 'phone', desc: 'Brûlure étendue, profonde, visage/mains/parties intimes, ou enfant : appelez le 185.' },
    ],
  },
  avc: {
    id: 'avc',
    name: 'AVC',
    en: 'Stroke',
    icon: 'brain',
    tint: 'violet',
    severity: 'critique',
    summary: "Test V.I.T.E. (Visage, Inertie, Trouble parole). Chaque minute compte.",
    keywords: ['avc', 'attaque', 'visage', 'paralysé', 'parle mal', 'stroke', 'face droop'],
    steps: [
      { title: 'V — Visage', icon: 'brain', desc: 'Demandez de sourire. La bouche est-elle tordue d\'un côté ?' },
      { title: 'I — Inertie du bras', icon: 'move-up', desc: 'Demandez de lever les deux bras. Un bras retombe-t-il ?' },
      { title: 'T — Trouble de la parole', icon: 'wind', desc: 'Demandez de répéter une phrase. Les mots sont-ils déformés ?' },
      { title: 'E — En urgence : 185', icon: 'phone', desc: 'Un seul signe positif = appelez le SAMU 185 IMMÉDIATEMENT. Notez l\'heure du début.' },
    ],
  },
  heart: {
    id: 'heart',
    name: 'Crise cardiaque',
    en: 'Heart attack',
    icon: 'heart-pulse',
    tint: 'red',
    severity: 'critique',
    summary: 'Mettre au repos, appeler le 185, préparer au massage cardiaque.',
    keywords: ['cardiaque', 'cœur', 'coeur', 'poitrine', 'thorax', 'heart', 'chest pain'],
    steps: [
      { title: 'Mettez au repos', icon: 'hand', desc: 'Asseyez la personne, demi-assise, jambes pliées. Desserrez les vêtements.' },
      { title: 'Appelez le 185 tout de suite', icon: 'phone', desc: 'Décrivez : douleur dans la poitrine, sueurs, essoufflement. Ne raccrochez pas.' },
      { title: 'Surveillez la conscience', icon: 'timer', desc: 'Restez près. Si elle perd connaissance et ne respire plus → massage cardiaque.' },
      { title: 'Massage cardiaque si besoin', icon: 'heart-pulse', desc: 'Compressions au centre du thorax, 100–120/min, sans s\'arrêter jusqu\'aux secours.' },
    ],
  },
};

// Routage simple par mots-clés → protocole (utilisé par l'IA en fallback)
export function matchProtocol(text = '') {
  const t = text.toLowerCase();
  for (const p of Object.values(PROTOCOLS)) {
    if (p.keywords.some((k) => t.includes(k))) return p;
  }
  return null;
}
