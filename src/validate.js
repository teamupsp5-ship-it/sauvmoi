// src/validate.js — validation manuelle légère des entrées utilisateur.
// Pas de zod/joi : projet sans bundler, dépendances backend minimales par
// convention (voir CLAUDE.md) ; le besoin ici (quelques types/longueurs/
// formats sur un nombre borné de routes) ne justifie pas une librairie de
// schémas complète.

export function isNonEmptyString(v, maxLen = Infinity) {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= maxLen;
}

// Un champ optionnel : absent/null accepté, sinon doit être une string dans
// la longueur autorisée (chaîne vide acceptée — "efface le champ").
export function isOptionalString(v, maxLen = Infinity) {
  return v === undefined || v === null || (typeof v === 'string' && v.length <= maxLen);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(v) {
  return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);
}

// Volontairement permissif sur le format (indicatifs internationaux,
// espaces, tirets, parenthèses) — le but est de rejeter du texte
// arbitraire, pas d'imposer un format E.164 strict que la démo terrain
// (numéros ivoiriens saisis à la main) ne respecte pas forcément.
const PHONE_RE = /^[+0-9\s().-]{6,20}$/;
export function isValidPhone(v) {
  return typeof v === 'string' && PHONE_RE.test(v);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function isValidIsoDate(v) {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return false;
  const d = new Date(v);
  return !isNaN(d.getTime());
}

// Une date de naissance dans le FUTUR est toujours une erreur de saisie —
// contrairement à une date très récente (un nourrisson est un profil
// légitime pour cette application, jamais à rejeter). Comparaison de
// chaînes YYYY-MM-DD (ordre lexicographique = ordre chronologique pour ce
// format, zéro-paddé) plutôt que d'objets Date, pour éviter tout écart
// d'horodatage exact entre la date envoyée (minuit local) et `now` côté
// serveur. Suppose `v` déjà validé par isValidIsoDate() par l'appelant.
export function isNotFutureDate(v) {
  if (!isValidIsoDate(v)) return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  return v <= todayStr;
}

export function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

export function isValidLatLng(lat, lng) {
  return isFiniteNumber(lat) && isFiniteNumber(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// data:<mime>;base64,<...> — taille approximée depuis la longueur base64
// (4 caractères encodent 3 octets) sans jamais décoder la chaîne entière en
// mémoire pour mesurer. Générique : partagée par validateImageDataUrl
// (photo de profil, jpeg/png/webp uniquement) et validateProofDataUrl
// (justificatif de groupe sanguin, qui autorise aussi le PDF) — même
// validation, whitelist MIME différente selon l'usage.
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_PROOF_MIME = [...ALLOWED_IMAGE_MIME, 'application/pdf'];

function validateDataUrl(dataUrl, allowedMimes, maxBytes, label) {
  if (typeof dataUrl !== 'string') return { ok: false, error: `Format de ${label} invalide` };
  const m = /^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return { ok: false, error: `Format de ${label} invalide (data URL attendue)` };
  const [, mime, b64] = m;
  if (!allowedMimes.includes(mime.toLowerCase())) {
    return { ok: false, error: `Type de ${label} non autorisé (${mime}) — ${allowedMimes.join(', ')} uniquement` };
  }
  const approxBytes = Math.floor((b64.length * 3) / 4);
  if (approxBytes > maxBytes) {
    return { ok: false, error: `Fichier trop volumineux (max ${Math.round(maxBytes / (1024 * 1024))} Mo)` };
  }
  return { ok: true, mime: mime.toLowerCase(), bytes: approxBytes };
}

export function validateImageDataUrl(dataUrl, maxBytes) {
  return validateDataUrl(dataUrl, ALLOWED_IMAGE_MIME, maxBytes, 'image');
}

// Justificatif de groupe sanguin (lot 8) : jpeg/png/webp (scan photo) ou PDF
// (export d'une carte de groupe sanguin numérisée) — jamais svg (script
// embarqué possible, même réserve que validateImageDataUrl) ni autre type.
export function validateProofDataUrl(dataUrl, maxBytes) {
  return validateDataUrl(dataUrl, ALLOWED_PROOF_MIME, maxBytes, 'justificatif');
}

// Rejette tout champ de premier niveau absent de `allowed` — whitelist
// explicite plutôt que de compter sur le fait qu'une route ne LIT jamais un
// champ non prévu (fragile si un futur `...body` est ajouté par erreur).
export function rejectUnknownFields(body, allowed) {
  const unknown = Object.keys(body || {}).filter((k) => !allowed.includes(k));
  return unknown.length ? unknown : null;
}
