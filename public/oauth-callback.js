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

// LOT 13c — storageKey dédié du client Supabase natif (PKCE + session
// temporaire issue de l'échange, voir supabase-client.js). Isolé de tout
// autre stockage (sm_token/sm_refresh_token restent gérés séparément par
// api-client.js) pour ne jamais risquer de diverger avec eux.
const NATIVE_OAUTH_STORAGE_KEY = 'sm-native-oauth-pkce';

// Supprime toute entrée de `storage` dont la clé commence par `prefix`.
// Pure (storage injecté, pas de dépendance à `window.localStorage` en dur) —
// testable avec un faux objet storage. Utilisée après CHAQUE tentative
// d'échange PKCE natif, succès ou échec, pour ne jamais laisser le verifier
// (déjà supprimé par auth-js lui-même, voir CLAUDE.md) ni la session
// temporaire que GoTrueClient écrit sous `storageKey` (nécessaire pour que
// le verifier survive à un redémarrage du process, voir CLAUDE.md lot 13c)
// traîner plus longtemps que la durée de l'échange.
function clearNativeOAuthStorage(storage, prefix) {
  const keysToRemove = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && key.indexOf(prefix) === 0) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => storage.removeItem(k));
}

// Pas de `window` en Node (tests) — globalThis fonctionne dans les deux
// environnements, voir oauth-callback.test.js.
const _oauthCallbackGlobal = (typeof window !== 'undefined' ? window : globalThis);
_oauthCallbackGlobal.parseOAuthCallbackUrl = parseOAuthCallbackUrl;
_oauthCallbackGlobal.clearNativeOAuthStorage = clearNativeOAuthStorage;
_oauthCallbackGlobal.NATIVE_OAUTH_STORAGE_KEY = NATIVE_OAUTH_STORAGE_KEY;
