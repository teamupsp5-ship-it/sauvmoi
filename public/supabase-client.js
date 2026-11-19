// supabase-client.js — client Supabase CÔTÉ NAVIGATEUR (clé anon, publique).
// Sert uniquement à l'OAuth Google : déclencher la redirection
// (signInWithOAuth) et récupérer la session que Supabase dépose dans l'URL
// au retour (web) ou via un lien profond (natif, lot 13b). Tout le reste
// (CRUD profils, etc.) continue de passer par le backend (client
// service_role) comme avant — ce client n'est jamais utilisé pour ça.
//
// Le SDK est chargé en CDN (voir index.html) ; s'il est absent (CDN
// injoignable), tout ici se dégrade proprement sans jamais lancer d'erreur —
// le bouton "Continuer avec Google" affiche juste un message clair.
//
// LOT 13b — deux flux OAuth distincts selon la plateforme, jamais mélangés :
//   - web : flux IMPLICITE inchangé depuis toujours (fragment d'URL
//     #access_token=..., detectSessionInUrl:true, détecté au chargement de
//     page par SM_GOOGLE_SYNC ci-dessous).
//   - natif (Capacitor) : flux PKCE (flowType:'pkce', detectSessionInUrl:
//     false — il n'y a jamais de fragment à lire sur un cold start natif),
//     ouvert dans le navigateur système via @capacitor/browser
//     (screen-auth.jsx) et retourné par lien profond
//     (ci.sauvmoi.app://auth-callback?code=...) capté ici par
//     App.addListener('appUrlOpen', ...), puis échangé via
//     exchangeCodeForSession(code). Confirmé AVANT d'implémenter que la
//     version de supabase-js installée supporte PKCE (flowType/
//     exchangeCodeForSession présents dans
//     node_modules/@supabase/auth-js/src/GoTrueClient.ts).
// Les deux chemins partagent syncGoogleSession() (ci-dessous) pour ne
// JAMAIS dupliquer la traduction session Supabase → session applicative —
// le chemin web est un pur refactor de l'ancien code, comportement
// strictement inchangé.
//
// LOT 13c — fiabilité du retour natif : le client natif utilise
// persistSession:true + un storageKey dédié (voir NATIVE_OAUTH_STORAGE_KEY
// dans oauth-callback.js) pour que le verifier PKCE survive à un
// redémarrage du process pendant Custom Tabs ; et App.getLaunchUrl() est
// consulté en plus de appUrlOpen pour couvrir le démarrage à froid via lien
// profond. Voir CLAUDE.md pour le détail complet.
(function () {
  // Même repli que api-client.js (voir son commentaire pour le détail) : le
  // backend tourne à la même origine que le frontend statique (o2switch,
  // hébergement unique, dev local), sauf dans l'app Android (Capacitor) où
  // window.location.origin ne pointe vers aucun backend réel.
  const isNativeApp = !!(window.Capacitor?.isNativePlatform?.());
  const API_BASE = window.SAUVMOI_API
    || (isNativeApp ? 'https://sauvmoi.com' : window.location.origin);

  // Un seul client par onglet/instance WebView, créé au premier besoin
  // (auto-sync au chargement si un callback OAuth est présent dans l'URL sur
  // web, ou clic sur le bouton Google). En PKCE, le code verifier est
  // stocké par supabase-js dans le `storage` configuré sur le client —
  // localStorage par défaut, ici non surchargé — ce qui survit à
  // l'aller-retour par Custom Tabs tant que cette même instance WebView
  // reste en vie (le cas normal : la WebView est seulement mise en arrière-
  // plan pendant l'authentification, jamais détruite).
  async function ensureClient() {
    if (window.SM_SUPABASE) return window.SM_SUPABASE;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    try {
      const cfgRes = await fetch(API_BASE + '/api/config');
      if (!cfgRes.ok) return null;
      const cfg = await cfgRes.json();
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
      // autoRefreshToken désactivé dans les deux cas : ce client ne sert
      // qu'à obtenir la session issue du callback OAuth, pas à gérer une
      // session dans la durée — c'est déjà le rôle de sm_token/
      // sm_refresh_token et du refresh automatique dans api-client.js.
      //
      // LOT 13c — persistSession DOIT être true côté natif, pas false comme
      // sur le web. Vérifié dans node_modules/@supabase/auth-js (GoTrueClient,
      // constructeur) : quel que soit le `storage` passé en option, il est
      // IGNORÉ et remplacé par un stockage EN MÉMOIRE dès que
      // persistSession:false — y compris pour le verifier PKCE lui-même (il
      // passe par ce même `this.storage`). Avec persistSession:false (config
      // d'origine de ce lot), tuer le process pendant que l'utilisateur est
      // dans Chrome Custom Tabs (fréquent sous pression mémoire Android)
      // perdait le verifier, faisant échouer exchangeCodeForSession au
      // retour. storageKey dédié (NATIVE_OAUTH_STORAGE_KEY, oauth-callback.js)
      // + nettoyage explicite après chaque tentative (clearNativeOAuthStorage,
      // appelé dans tous les chemins de sortie ci-dessous) pour ne jamais
      // laisser la session temporaire que GoTrueClient écrit aussi sous ce
      // storageKey traîner en parallèle de sm_token/sm_refresh_token — seul
      // le verifier a besoin de survivre, pas une seconde copie de session.
      const authOptions = isNativeApp
        ? {
            flowType: 'pkce',
            detectSessionInUrl: false,
            persistSession: true,
            storageKey: window.NATIVE_OAUTH_STORAGE_KEY,
            storage: window.localStorage,
            autoRefreshToken: false,
          }
        : { detectSessionInUrl: true, persistSession: false, autoRefreshToken: false };
      window.SM_SUPABASE = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: authOptions,
      });
      return window.SM_SUPABASE;
    } catch (e) {
      console.warn('[supabase-client] initialisation échouée:', e.message);
      return null;
    }
  }
  window.getSupabaseClient = ensureClient;

  // Partagée par les deux chemins — traduit une session Supabase (obtenue
  // par detectSessionInUrl sur web, ou exchangeCodeForSession sur natif) en
  // session applicative (sm_token/sm_user). Le token Supabase est déjà
  // valide en soi (même format que pour email/mot de passe, vérifié par
  // requireAuth côté backend), donc pas besoin d'en obtenir un nouveau :
  // /auth/google-sync ne fait que compléter le profil (nom/photo Google) et
  // renvoyer l'utilisateur.
  async function syncGoogleSession(session) {
    const syncRes = await fetch(API_BASE + '/api/auth/google-sync', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + session.access_token },
    });
    if (!syncRes.ok) return false;
    const { user } = await syncRes.json();

    window.SM.token = session.access_token;
    localStorage.setItem('sm_token', session.access_token);
    if (session.refresh_token) localStorage.setItem('sm_refresh_token', session.refresh_token);
    const expiresAtMs = session.expires_at ? session.expires_at * 1000 : Date.now() + 3600 * 1000;
    localStorage.setItem('sm_expires_at', String(expiresAtMs));
    if (user) {
      window.SM.user = user;
      localStorage.setItem('sm_user', JSON.stringify(user));
    }
    window.SM.emit();
    return true;
  }

  // Message d'échec générique affiché à l'utilisateur (natif uniquement),
  // jamais un texte brut de Google/Supabase (souvent un message technique en
  // anglais) — toujours traduit par défaut ; le détail réel part uniquement
  // dans la console pour le diagnostic, jamais dans window.SM.oauthError.
  function failNativeOAuth(message, logDetail) {
    if (logDetail) console.warn('[supabase-client]', logDetail);
    window.SM.oauthError = message || (window.t ? window.t('auth.google_failed') : 'Google sign-in failed');
    window.SM.emit();
  }

  if (!isNativeApp) {
    // Web, strictement inchangé par rapport à avant le lot 13b (refactor
    // pur : appelle désormais syncGoogleSession() au lieu de dupliquer sa
    // logique). Tenté automatiquement à chaque chargement de page : si
    // l'URL contient un callback OAuth fraîchement reçu (#access_token=...),
    // detectSessionInUrl le fait apparaître ici via getSession() juste après
    // la création du client. Ne fait rien s'il n'y a pas de session (cas
    // normal, immense majorité des chargements).
    window.SM_GOOGLE_SYNC = (async function attemptGoogleSync() {
      try {
        const client = await ensureClient();
        if (!client) return;

        const { data, error: sessionErr } = await client.auth.getSession();
        if (sessionErr || !data || !data.session) return;

        await syncGoogleSession(data.session);

        // Nettoie le fragment #access_token=... de l'URL — évite de le
        // laisser visible/réutilisable si l'URL est copiée ou dans
        // l'historique.
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } catch (e) {
        console.warn('[supabase-client] synchronisation Google échouée:', e.message);
      }
    })();
  } else {
    // Natif (lot 13b/13c) : le retour OAuth arrive par lien profond
    // (ci.sauvmoi.app://auth-callback?code=...), jamais par une navigation
    // de page. DEUX points d'entrée possibles, pas un seul :
    //   - App.addListener('appUrlOpen', ...) : app encore en vie (mise en
    //     arrière-plan pendant Custom Tabs, cas normal) -> onNewIntent().
    //   - App.getLaunchUrl() : app TUÉE par l'OS pendant que l'utilisateur
    //     était dans Custom Tabs (fréquent sous pression mémoire Android) et
    //     relancée directement par le lien profond -> c'est l'intent de
    //     démarrage lui-même (bridge.getIntentUri() côté natif), jamais vu
    //     par appUrlOpen. Vérifié dans
    //     node_modules/@capacitor/app/android/.../AppPlugin.java : les deux
    //     mécanismes sont bien distincts, ni l'un ni l'autre ne couvre le
    //     cas de l'autre. Sans ce second chemin, un redémarrage à froid
    //     perdait silencieusement le retour OAuth.
    // lastHandledUrl déduplique : sur certains redémarrages à froid,
    // getLaunchUrl() ET un appUrlOpen tardif peuvent tous les deux livrer la
    // même URL — un code d'autorisation est à usage unique de toute façon,
    // mais éviter un double échange évite aussi un message d'erreur parasite.
    let lastHandledUrl = null;

    async function handleOAuthDeepLink(url) {
      if (!url || url === lastHandledUrl) return;
      lastHandledUrl = url;
      try {
        if (!window.parseOAuthCallbackUrl) return;
        const { code, error, errorDescription } = window.parseOAuthCallbackUrl(url);
        if (!code && !error) return; // lien profond pour une tout autre raison — ne pas toucher aux Custom Tabs pour rien

        // Fermeture des Custom Tabs dès réception du lien profond, succès
        // ou échec confondus — l'utilisateur est de toute façon revenu
        // dans l'app à cet instant, l'onglet navigateur n'a plus d'utilité.
        // .catch(() => {}) : jamais bloquant si déjà fermé par le système
        // (notamment sur un démarrage à froid via getLaunchUrl, où aucun
        // Custom Tabs n'est peut-être même encore ouvert).
        window.Capacitor?.Plugins?.Browser?.close?.().catch(() => {});

        if (error) {
          // Refus explicite côté Google (l'utilisateur annule sur l'écran
          // de consentement — fermer simplement l'onglet Custom Tabs sans
          // jamais atteindre cet écran ne déclenche PAS de lien profond du
          // tout, voir CLAUDE.md pour la distinction) — jamais un échec
          // silencieux. Le détail anglais de Google part en log, jamais
          // affiché tel quel.
          console.warn('[supabase-client] OAuth refusé côté Google:', error, errorDescription || '');
          window.SM.oauthError = window.t ? window.t('auth.google_cancelled') : 'Google sign-in was cancelled.';
          window.SM.emit();
          return;
        }
        // code est forcément non-null ici : le garde-fou plus haut
        // (!code && !error) a déjà éliminé le seul autre cas possible.

        const client = await ensureClient();
        if (!client) {
          failNativeOAuth(window.t ? window.t('auth.google_unavailable_retry') : null, 'client Supabase indisponible pour l\'échange PKCE');
          return;
        }
        try {
          const { data, error: exchangeErr } = await client.auth.exchangeCodeForSession(code);
          if (exchangeErr || !data || !data.session) {
            failNativeOAuth(null, 'exchangeCodeForSession échoué: ' + (exchangeErr?.message || 'session absente'));
            return;
          }

          const ok = await syncGoogleSession(data.session);
          if (!ok) {
            failNativeOAuth(null, 'syncGoogleSession (google-sync) échoué après échange PKCE réussi');
            return;
          }

          // app-live.jsx observe ce flag pour naviguer vers 'home' — ce
          // script n'a pas accès à `nav` (hors React), même mécanisme que
          // SM.sessionExpired déjà en place pour une redirection forcée
          // depuis l'extérieur de l'arbre de composants.
          window.SM.oauthNativeSynced = true;
          window.SM.emit();
        } finally {
          // LOT 13c — dans TOUS les cas (succès ou échec) : le verifier PKCE
          // est déjà supprimé par auth-js lui-même dans exchangeCodeForSession
          // (vérifié dans son code source, try ET catch), mais la session
          // temporaire que GoTrueClient écrit sous ce même storageKey (voir
          // persistSession:true ci-dessus) ne doit jamais traîner plus
          // longtemps que l'échange — sm_token/sm_refresh_token (déjà écrits
          // par syncGoogleSession en cas de succès) restent la seule copie
          // durable de la session.
          window.clearNativeOAuthStorage?.(window.localStorage, window.NATIVE_OAUTH_STORAGE_KEY);
        }
      } catch (e) {
        failNativeOAuth(null, 'callback OAuth natif en exception: ' + e.message);
      }
    }

    const App = window.Capacitor?.Plugins?.App;
    if (App && typeof App.addListener === 'function') {
      App.addListener('appUrlOpen', ({ url }) => handleOAuthDeepLink(url));
    }
    // Démarrage à froid via lien profond (app tuée par l'OS pendant Custom
    // Tabs) : getLaunchUrl() porte l'intent de départ, jamais vu par
    // appUrlOpen (onNewIntent ne se déclenche que pour un intent reçu APRÈS
    // le démarrage). Vérifié dans le README/sources @capacitor/app plutôt
    // que supposé.
    if (App && typeof App.getLaunchUrl === 'function') {
      App.getLaunchUrl()
        .then((launch) => { if (launch && launch.url) handleOAuthDeepLink(launch.url); })
        .catch(() => {});
    }
  }
})();
