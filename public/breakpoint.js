// breakpoint.js — bus de rupture responsive (mobile/tablet/desktop), même
// pattern que window.SM_THEME/window.SM_I18N (bus dédié + hook) : une
// préoccupation transverse à toute l'app, pas une donnée "métier" dans
// window.SM.
//
// LOT 11, étape 1 — infrastructure seule : ce fichier pose le signal et
// l'attribut DOM, mais aucun écran ni aucune règle CSS ne s'en sert encore
// pour changer quoi que ce soit visuellement (voir styles.css et CLAUDE.md).
(function () {
  // Seuils dupliqués À LA MAIN depuis --sm-bp-tablet/--sm-bp-desktop
  // (styles.css) — une media query CSS ne peut pas lire une custom property
  // pour son propre seuil, donc JS et CSS ne peuvent pas partager
  // littéralement la même source ; les deux doivent être changés ensemble
  // si ces valeurs bougent un jour.
  const TABLET_MIN = 640;
  const DESKTOP_MIN = 1024;

  function resolveBp() {
    const w = window.innerWidth;
    if (w >= DESKTOP_MIN) return 'desktop';
    if (w >= TABLET_MIN) return 'tablet';
    return 'mobile';
  }

  // Posé sur .sm-live (jamais <html>/<body>) : seule l'app réelle
  // (app-live.jsx) a besoin de ce signal pour l'instant — canvas.html garde
  // son comportement multi-artboards indépendant des breakpoints, et ne
  // porte pas cette classe. Peut être appelé avant que .sm-live existe dans
  // le DOM (ce script s'exécute avant le premier rendu React) :
  // querySelector renvoie alors null sans erreur ; useBreakpoint() (plus
  // bas) rattrape l'attribut dès son propre montage, forcément postérieur.
  function applyBpAttribute(bp) {
    const el = document.querySelector('.sm-live');
    if (el) el.setAttribute('data-bp', bp);
  }

  const subs = new Set();

  window.SM_BREAKPOINT = {
    bp: resolveBp(),
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    emit() { subs.forEach((fn) => { try { fn(); } catch {} }); },
  };

  function recompute() {
    const next = resolveBp();
    // Idempotent même si next === bp courant : couvre le cas où .sm-live
    // n'existait pas encore lors du tout premier appel plus bas.
    applyBpAttribute(next);
    if (next === window.SM_BREAKPOINT.bp) return;
    window.SM_BREAKPOINT.bp = next;
    window.SM_BREAKPOINT.emit();
  }

  // matchMedia plutôt qu'un listener resize générique : deux MediaQueryList
  // ciblés sur les seuils exacts, qui ne se déclenchent que lorsqu'une
  // rupture est réellement franchie (pas à chaque pixel de redimensionnement)
  // — même idiome que prefers-color-scheme dans theme.js.
  const mqTablet = window.matchMedia(`(min-width: ${TABLET_MIN}px)`);
  const mqDesktop = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
  mqTablet.addEventListener('change', recompute);
  mqDesktop.addEventListener('change', recompute);

  applyBpAttribute(window.SM_BREAKPOINT.bp);
})();

function useBreakpoint() {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    // Rattrape l'attribut au montage : au tout premier chargement, le script
    // ci-dessus s'exécute avant que .sm-live existe dans le DOM. Ce composant,
    // lui, est forcément monté APRÈS .sm-live (il en est un descendant), donc
    // ce point de montage est le bon moment pour le poser si ça n'a pas pu
    // être fait plus tôt.
    const el = document.querySelector('.sm-live');
    if (el) el.setAttribute('data-bp', window.SM_BREAKPOINT.bp);
    return window.SM_BREAKPOINT.subscribe(() => force((n) => n + 1));
  }, []);
  return window.SM_BREAKPOINT.bp;
}

Object.assign(window, { useBreakpoint });
