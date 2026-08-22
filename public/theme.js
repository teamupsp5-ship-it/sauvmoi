// theme.js — bus de thème clair/sombre, même pattern que window.SM_SPEECH
// (bus dédié + hook useTheme()) : le thème est une préoccupation transverse
// à toute l'app, pas une donnée "métier" au même titre que user/token/home
// dans window.SM.
//
// Résolution au premier chargement : si sm_theme est déjà en localStorage
// (choix précédent, manuel ou auto-détecté), on le réutilise tel quel — y
// compris une valeur auto-détectée lors d'un lancement précédent, qui se
// comporte alors comme un choix permanent au même titre qu'un choix manuel.
// Seule l'ABSENCE de valeur sauvegardée déclenche une détection via
// prefers-color-scheme, immédiatement persistée. Un changement manuel
// (toggle() / set()) écrase toujours ce qui précède.
(function () {
  const STORAGE_KEY = 'sm_theme';

  function resolveInitialTheme() {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch {}
    if (saved === 'light' || saved === 'dark') return saved;

    const prefersDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const detected = prefersDark ? 'dark' : 'light';
    try { localStorage.setItem(STORAGE_KEY, detected); } catch {}
    return detected;
  }

  function applyThemeClass(theme) {
    // Sur <html> plutôt que sur .sm-frame/.sm-phone : portée universelle,
    // et les sélecteurs CSS `.sm-dark [style*="..."]` fonctionnent de la
    // même façon quel que soit l'ancêtre qui porte la classe.
    document.documentElement.classList.toggle('sm-dark', theme === 'dark');
  }

  const subs = new Set();
  const initial = resolveInitialTheme();

  window.SM_THEME = {
    theme: initial,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    emit() { subs.forEach((fn) => { try { fn(); } catch {} }); },
    set(theme) {
      if (theme !== 'light' && theme !== 'dark') return;
      window.SM_THEME.theme = theme;
      try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
      applyThemeClass(theme);
      window.SM_THEME.emit();
    },
    toggle() {
      window.SM_THEME.set(window.SM_THEME.theme === 'dark' ? 'light' : 'dark');
    },
  };

  // Appliquée tout de suite, avant le premier rendu React — évite un flash
  // du mauvais thème au chargement.
  applyThemeClass(initial);
})();

function useTheme() {
  const [, force] = React.useState(0);
  React.useEffect(() => window.SM_THEME.subscribe(() => force((n) => n + 1)), []);
  return window.SM_THEME.theme;
}

Object.assign(window, { useTheme });
