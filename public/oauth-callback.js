// oauth-callback.js — extraction pure code/erreur depuis une URL de callback
// OAuth PKCE (lien profond natif, ci.sauvmoi.app://auth-callback?code=...).
// Fichier séparé de supabase-client.js, sans dépendance au DOM/window au-delà
// de `URL` (disponible nativement en Node ET navigateur) : reste testable
// directement avec `node oauth-callback.test.js`, sans WebView ni Capacitor.
function parseOAuthCallbackUrl(rawUrl) {
  let params;
  try {
    params = new URL(rawUrl).searchParams;
  } catch {
    // URL malformée (ne devrait pas arriver — appUrlOpen fournit toujours une
    // URL syntaxiquement valide — mais ne jamais lever d'exception ici :
    // le pire résultat acceptable est "aucun code, aucune erreur reconnue",
    // jamais un crash du handler appUrlOpen).
    return { code: null, error: null, errorDescription: null };
  }
  return {
    code: params.get('code'),
    error: params.get('error'),
    errorDescription: params.get('error_description'),
  };
}

// Pas de `window` en Node (tests) — globalThis fonctionne dans les deux
// environnements, voir oauth-callback.test.js.
(typeof window !== 'undefined' ? window : globalThis).parseOAuthCallbackUrl = parseOAuthCallbackUrl;
