// supabase-client.js — client Supabase CÔTÉ NAVIGATEUR (clé anon, publique).
// Sert uniquement à l'OAuth Google : déclencher la redirection
// (signInWithOAuth) et récupérer la session que Supabase dépose dans l'URL
// au retour. Tout le reste (CRUD profils, etc.) continue de passer par le
// backend (client service_role) comme avant — ce client n'est jamais utilisé
// pour ça.
//
// Le SDK est chargé en CDN (voir index.html) ; s'il est absent (CDN
// injoignable), tout ici se dégrade proprement sans jamais lancer d'erreur —
// le bouton "Continuer avec Google" affiche juste un message clair.
(function () {
  const API_BASE = window.SAUVMOI_API || 'https://sauvmoi.onrender.com';

  // Un seul client par onglet, créé au premier besoin (auto-sync au chargement
  // si un callback OAuth est présent dans l'URL, ou clic sur le bouton Google).
  async function ensureClient() {
    if (window.SM_SUPABASE) return window.SM_SUPABASE;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    try {
      const cfgRes = await fetch(API_BASE + '/api/config');
      if (!cfgRes.ok) return null;
      const cfg = await cfgRes.json();
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
      // persistSession/autoRefreshToken désactivés : ce client ne sert qu'à
      // obtenir la session issue du callback OAuth, pas à gérer une session
      // dans la durée — c'est déjà le rôle de sm_token/sm_refresh_token et du
      // refresh automatique dans api-client.js. Deux gestionnaires de session
      // en parallèle risqueraient de diverger.
      window.SM_SUPABASE = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { detectSessionInUrl: true, persistSession: false, autoRefreshToken: false },
      });
      return window.SM_SUPABASE;
    } catch (e) {
      console.warn('[supabase-client] initialisation échouée:', e.message);
      return null;
    }
  }
  window.getSupabaseClient = ensureClient;

  // Tenté automatiquement à chaque chargement de page : si l'URL contient un
  // callback OAuth fraîchement reçu (#access_token=...), detectSessionInUrl
  // le fait apparaître ici via getSession() juste après la création du
  // client. Ne fait rien s'il n'y a pas de session (cas normal, immense
  // majorité des chargements).
  window.SM_GOOGLE_SYNC = (async function attemptGoogleSync() {
    try {
      const client = await ensureClient();
      if (!client) return;

      const { data, error: sessionErr } = await client.auth.getSession();
      if (sessionErr || !data || !data.session) return;
      const { session } = data;

      // Synchronise avec notre propre modèle de session applicatif — le
      // token Supabase est déjà valide en soi (même format que pour
      // email/mot de passe, vérifié par requireAuth côté backend), donc pas
      // besoin d'en obtenir un nouveau : /auth/google-sync ne fait que
      // compléter le profil (nom/photo Google) et renvoyer l'utilisateur.
      const syncRes = await fetch(API_BASE + '/api/auth/google-sync', {
        method: 'POST',
        headers: { authorization: 'Bearer ' + session.access_token },
      });
      if (!syncRes.ok) return;
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

      // Nettoie le fragment #access_token=... de l'URL — évite de le laisser
      // visible/réutilisable si l'URL est copiée ou dans l'historique.
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch (e) {
      console.warn('[supabase-client] synchronisation Google échouée:', e.message);
    }
  })();
})();
