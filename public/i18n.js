// i18n.js — bus de langue FR/EN, même pattern que window.SM_THEME (bus dédié
// + hook) : la langue est une préoccupation transverse à toute l'app, pas
// une donnée "métier" au même titre que user/token/home dans window.SM.
//
// Contrairement au thème (qui se détecte automatiquement via
// prefers-color-scheme si rien n'est sauvegardé), l'absence de choix ici
// signifie explicitement "pas encore choisi" — `lang` reste `null` tant que
// rien n'est en localStorage, ce que app-live.jsx utilise pour décider
// d'afficher l'écran de choix de langue avant même le splash.
(function () {
  const STORAGE_KEY = 'sm_lang';

  function resolveInitialLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'fr' || saved === 'en') return saved;
    } catch {}
    return null;
  }

  // <html lang> pilote le rendu NATIF du navigateur (placeholder de
  // <input type="date"> en "jj/mm/aaaa" vs "mm/dd/yyyy", correcteur
  // orthographique, lecteurs d'écran...) — indépendant de notre t(), donc à
  // synchroniser explicitement à chaque changement de langue.
  function applyHtmlLang(lang) {
    document.documentElement.lang = lang;
  }

  const subs = new Set();
  const initialLang = resolveInitialLang();
  if (initialLang) applyHtmlLang(initialLang);

  window.SM_I18N = {
    lang: initialLang,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    emit() { subs.forEach((fn) => { try { fn(); } catch {} }); },
    set(lang) {
      if (lang !== 'fr' && lang !== 'en') return;
      window.SM_I18N.lang = lang;
      try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
      applyHtmlLang(lang);
      window.SM_I18N.emit();
    },
    toggle() {
      window.SM_I18N.set(window.SM_I18N.lang === 'en' ? 'fr' : 'en');
    },
  };
})();

// Traduction directe, hors composant (event handlers, code non-React) — lit
// toujours l'état courant, jamais mémoïsé, donc reste correcte même appelée
// juste après un SM_I18N.set() sans passer par un re-render.
function t(key) {
  const lang = window.SM_I18N.lang || 'fr';
  const dict = (lang === 'en' ? window.I18N_EN : window.I18N_FR) || {};
  return dict[key] != null ? dict[key] : key;
}

// Hook React : force un re-render quand la langue change, renvoie `t`
// elle-même (référence stable, pas besoin de la recréer — elle relit déjà
// SM_I18N.lang à chaque appel).
function useTranslation() {
  const [, force] = React.useState(0);
  React.useEffect(() => window.SM_I18N.subscribe(() => force((n) => n + 1)), []);
  return t;
}

// Pour les écrans qui ont besoin du code langue lui-même (ex: passer 'FR'/'EN'
// à l'API chat) plutôt que d'une fonction de traduction.
function useLang() {
  const [, force] = React.useState(0);
  React.useEffect(() => window.SM_I18N.subscribe(() => force((n) => n + 1)), []);
  return window.SM_I18N.lang || 'fr';
}

Object.assign(window, { t, useTranslation, useLang });
