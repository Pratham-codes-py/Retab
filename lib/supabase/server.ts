import { createClient } from '@supabase/supabase-js';

/**
 * Returns a Supabase client authenticated with the SERVICE ROLE key.
 *
 * ⚠️  IMPORTANT:
 *  - This client bypasses Row Level Security entirely.
 *  - Import ONLY inside app/api/** route handlers (Server-side only).
 *  - NEVER import this file in any Client Component or shared module
 *    that could be bundled into the browser.
 *
 * The SUPABASE_SERVICE_ROLE_KEY env var is intentionally NOT prefixed
 * with NEXT_PUBLIC_ so Next.js will never expose it to the browser.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. ' +
        'Check your .env.local file.'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      // Disable automatic token refresh — this client is stateless per request
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
