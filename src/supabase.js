// Client Supabase — clé service_role (accès complet, contourne RLS).
// Usage strictement backend : ne jamais exposer SUPABASE_SERVICE_ROLE_KEY au frontend.
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
