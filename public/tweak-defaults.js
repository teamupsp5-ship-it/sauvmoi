// tweak-defaults.js — anciennement un <script> inline dans index.html,
// extrait dans son propre fichier pour permettre une Content-Security-Policy
// script-src sans 'unsafe-inline' (voir helmet dans src/server.js). Aucun
// changement de comportement : mêmes valeurs, lues au même moment (avant les
// écrans app-live.jsx).
window.TWEAK_DEFAULTS = {
  "accent": "#E53935",
  "density": "standard",
  "animations": "standard",
  "lang": "FR",
  "dark": false
};
