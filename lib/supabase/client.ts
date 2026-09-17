import { createBrowserClient } from '@supabase/ssr';

/**
 * Returns a Supabase client for use in Client Components.
 *
 * Uses the public anon key — subject to Row Level Security policies.
 * Never use the service-role key here.
 */
export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing or invalid NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — check your .env.local file and restart the dev server');
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
