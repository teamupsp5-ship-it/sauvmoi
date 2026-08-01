// Client Supabase — clé service_role (accès complet, contourne RLS).
// Usage strictement backend : ne jamais exposer SUPABASE_SERVICE_ROLE_KEY au frontend.
//
// ⚠️ NE JAMAIS appeler supabase.auth.signInWithPassword() (ni signUp(),
// signOut(), refreshSession()...) sur CE client. Ce sont des opérations qui
// gèrent une session : dès qu'elles réussissent, le SDK Supabase déclenche
// un changement d'état d'auth interne qui fait basculer l'en-tête
// Authorization utilisé par TOUTES les requêtes PostgREST suivantes
// (.from(...)) du service_role vers le JWT de l'utilisateur qui vient de se
// connecter — et comme ce client est un singleton partagé par tout le
// process Node, ça affecte aussi les autres requêtes HTTP concurrentes, pas
// seulement celle qui a fait l'appel. C'est exactement ce qui a produit
// l'erreur "new row violates row-level security policy for table profiles"
// en prod : après le premier signInWithPassword() sur ce client, toutes les
// écritures profiles suivantes se retrouvaient soumises aux policies RLS
// (auth.uid() = id) au lieu de les contourner.
//
// getUser(token) et les méthodes admin.* (createUser, updateUserById...)
// restent sûres ici : elles sont sans état côté client (le token/la clé sont
// passés explicitement à chaque appel), elles ne déclenchent jamais ce
// changement d'état. Pour signInWithPassword(), utiliser createAuthClient()
// ci-dessous — une instance clé anon isolée, jetée après usage.
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Client jetable (clé anon) pour les opérations qui gèrent une session
// (signInWithPassword...) — une nouvelle instance à chaque appel, pour ne
// jamais partager d'état de session entre requêtes concurrentes.
export function createAuthClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
