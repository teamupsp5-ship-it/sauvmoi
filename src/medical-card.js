// src/medical-card.js — Génère la "Fiche d'urgence" visuelle (SVG rasterisé
// en PNG par sharp, voir routes/api.js). Police système en fallback
// (Arial/Helvetica/sans-serif) : le rendu SVG côté serveur (librsvg, via
// sharp) ne peut pas charger Poppins facilement, contrairement au frontend.
//
// Layout à positions Y FIXES plutôt que cascadées dynamiquement : chaque
// section (allergies, antécédents, contacts) a un nombre de lignes plafonné
// (wrapText) et un slot de hauteur fixe. Un profil avec peu de contenu laisse
// un peu de blanc inutilisé, mais ça garantit qu'aucun profil, même très
// rempli, ne peut faire déborder une section sur la suivante — plus simple
// et plus robuste qu'un calcul de hauteur cumulée pour une carte générée une
// fois et jamais réajustée interactivement.

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;
const FONT = 'Arial, Helvetica, sans-serif';
const RED = '#E53935';
const GREEN = '#2E6B4F';
const BLUE = '#4A90C2';
const INK = '#0A1628';
const ORANGE = '#E65100';
const GRAY = '#9AA3AD';

function escapeXml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  }[c]));
}

// Découpe un texte en lignes de au plus maxChars caractères, plafonné à
// maxLines lignes (ellipse sur la dernière si le contenu déborde) — un
// <text> SVG ne fait pas de retour à la ligne automatique.
function wrapText(text, maxChars, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  const usedWordCount = lines.join(' ').split(/\s+/).filter(Boolean).length;
  if (usedWordCount < words.length) {
    const last = lines[lines.length - 1] || '';
    lines[lines.length - 1] = last.replace(/[.,;:]+$/, '') + '…';
  }
  return lines;
}

function headerSvg() {
  return `
    <rect x="0" y="0" width="${CARD_WIDTH}" height="190" fill="${RED}"/>
    <circle cx="100" cy="95" r="46" fill="#FFFFFF"/>
    <rect x="88" y="70" width="24" height="50" rx="6" fill="${RED}"/>
    <rect x="75" y="83" width="50" height="24" rx="6" fill="${RED}"/>
    <text x="168" y="88" font-family="${FONT}" font-size="42" font-weight="700" fill="#FFFFFF">Sauv'Moi</text>
    <text x="168" y="130" font-family="${FONT}" font-size="26" fill="#FFFFFF" fill-opacity="0.9">Fiche d'urgence médicale</text>
  `;
}

function footerNumbersSvg() {
  const y = 1170, h = 100;
  return `
    <rect x="60" y="${y}" width="${CARD_WIDTH - 120}" height="${h}" rx="16" fill="${RED}"/>
    <line x1="${CARD_WIDTH / 2}" y1="${y + 16}" x2="${CARD_WIDTH / 2}" y2="${y + h - 16}" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2"/>
    <text x="${CARD_WIDTH / 4 + 20}" y="${y + 44}" font-family="${FONT}" font-size="24" fill="#FFFFFF" fill-opacity="0.9" text-anchor="middle">SAMU</text>
    <text x="${CARD_WIDTH / 4 + 20}" y="${y + 82}" font-family="${FONT}" font-size="44" font-weight="800" fill="#FFFFFF" text-anchor="middle">185</text>
    <text x="${(CARD_WIDTH * 3) / 4 - 20}" y="${y + 44}" font-family="${FONT}" font-size="24" fill="#FFFFFF" fill-opacity="0.9" text-anchor="middle">Pompiers</text>
    <text x="${(CARD_WIDTH * 3) / 4 - 20}" y="${y + 82}" font-family="${FONT}" font-size="44" font-weight="800" fill="#FFFFFF" text-anchor="middle">180</text>
  `;
}

export function buildMedicalCardSvg({ nom, age, bloodType, allergies, conditions, contacts, generatedAt, expiresAt }) {
  const genDate = generatedAt ? new Date(generatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const expDate = expiresAt ? new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  const nameLine = wrapText(nom || "Fiche d'urgence", 24, 1)[0] || "Fiche d'urgence";
  const allergyLines = allergies && allergies.length ? wrapText(allergies.join(', '), 46, 2) : [];
  const conditionLines = conditions && conditions.length ? wrapText(conditions.join(', '), 46, 2) : [];
  const shownContacts = (contacts || []).slice(0, 2);
  const extraContacts = (contacts || []).length - shownContacts.length;

  const parts = [`<rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="#FFFFFF"/>`, headerSvg()];

  // Nom + âge
  parts.push(`<text x="60" y="270" font-family="${FONT}" font-size="56" font-weight="700" fill="${INK}">${escapeXml(nameLine)}</text>`);
  if (age != null) {
    parts.push(`<text x="60" y="312" font-family="${FONT}" font-size="30" fill="#5A6472">${age} ans</text>`);
  }
  parts.push(`<line x1="60" y1="345" x2="${CARD_WIDTH - 60}" y2="345" stroke="#E7E9EC" stroke-width="2"/>`);

  // Groupe sanguin — section critique, très grand et rouge
  parts.push(`<text x="60" y="398" font-family="${FONT}" font-size="24" font-weight="700" fill="${RED}" letter-spacing="1.5">GROUPE SANGUIN</text>`);
  if (bloodType) {
    parts.push(`<text x="60" y="580" font-family="${FONT}" font-size="150" font-weight="800" fill="${RED}">${escapeXml(bloodType)}</text>`);
  } else {
    parts.push(`<text x="60" y="450" font-family="${FONT}" font-size="30" fill="${GRAY}">Non renseigné</text>`);
  }
  parts.push(`<line x1="60" y1="650" x2="${CARD_WIDTH - 60}" y2="650" stroke="#E7E9EC" stroke-width="2"/>`);

  // Allergies
  parts.push(`<text x="60" y="695" font-family="${FONT}" font-size="24" font-weight="700" fill="${ORANGE}" letter-spacing="1.5">ALLERGIES</text>`);
  if (allergyLines.length) {
    allergyLines.forEach((line, i) => {
      parts.push(`<text x="60" y="${740 + i * 40}" font-family="${FONT}" font-size="30" font-weight="700" fill="#BF360C">${escapeXml(line)}</text>`);
    });
  } else {
    parts.push(`<text x="60" y="740" font-family="${FONT}" font-size="30" font-weight="700" fill="${GREEN}">✓ Aucune allergie connue</text>`);
  }

  // Antécédents médicaux
  parts.push(`<text x="60" y="850" font-family="${FONT}" font-size="24" font-weight="700" fill="${BLUE}" letter-spacing="1.5">ANTÉCÉDENTS MÉDICAUX</text>`);
  if (conditionLines.length) {
    conditionLines.forEach((line, i) => {
      parts.push(`<text x="60" y="${892 + i * 38}" font-family="${FONT}" font-size="28" fill="${INK}">${escapeXml(line)}</text>`);
    });
  } else {
    parts.push(`<text x="60" y="892" font-family="${FONT}" font-size="28" fill="${GRAY}">Aucun antécédent connu</text>`);
  }

  // Contacts d'urgence
  parts.push(`<text x="60" y="998" font-family="${FONT}" font-size="24" font-weight="700" fill="${INK}" letter-spacing="1.5">CONTACTS D'URGENCE — APPELER POUR URGENCE</text>`);
  if (shownContacts.length) {
    shownContacts.forEach((c, i) => {
      const line = `${c.name || ''}${c.relation ? ' (' + c.relation + ')' : ''} · ${c.phone || ''}`;
      parts.push(`<text x="60" y="${1042 + i * 46}" font-family="${FONT}" font-size="30" fill="${INK}">${escapeXml(line)}</text>`);
    });
    if (extraContacts > 0) {
      parts.push(`<text x="60" y="${1042 + shownContacts.length * 46}" font-family="${FONT}" font-size="24" fill="${GRAY}">+${extraContacts} autre(s) contact(s)</text>`);
    }
  } else {
    parts.push(`<text x="60" y="1042" font-family="${FONT}" font-size="28" fill="${GRAY}">Aucun contact renseigné</text>`);
  }

  // Numéros d'urgence
  parts.push(footerNumbersSvg());

  // Dates génération / expiration
  const dateLine = [genDate ? `Généré le ${genDate}` : null, expDate ? `Valable jusqu'au ${expDate}` : null].filter(Boolean).join('   ·   ');
  if (dateLine) {
    parts.push(`<text x="${CARD_WIDTH / 2}" y="1320" font-family="${FONT}" font-size="20" fill="${GRAY}" text-anchor="middle">${escapeXml(dateLine)}</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}">${parts.join('\n')}</svg>`;
}

export function buildUnavailableCardSvg(message) {
  const cx = CARD_WIDTH / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}">
    <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="#F5F6F8"/>
    ${headerSvg()}
    <circle cx="${cx}" cy="560" r="90" fill="#FDEDEC"/>
    <text x="${cx}" y="600" font-family="${FONT}" font-size="90" font-weight="700" fill="${RED}" text-anchor="middle">!</text>
    <text x="${cx}" y="740" font-family="${FONT}" font-size="38" font-weight="700" fill="${INK}" text-anchor="middle">${escapeXml(message)}</text>
    <text x="${cx}" y="786" font-family="${FONT}" font-size="24" fill="#5A6472" text-anchor="middle">Ce lien n'est plus valide.</text>
  </svg>`;
}

export const MEDICAL_CARD_WIDTH = CARD_WIDTH;
export const MEDICAL_CARD_HEIGHT = CARD_HEIGHT;
