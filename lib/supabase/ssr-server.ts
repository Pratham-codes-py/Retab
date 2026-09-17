import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Returns a Supabase client that reads/writes the auth session from cookies.
 *
 * Use this in:
 *   - Server Components (layout.tsx, page.tsx)
 *   - Server Actions ('use server' files)
 *
 * Unlike lib/supabase/client.ts (browser) and lib/supabase/server.ts
 * (service-role), this client operates as the signed-in user and respects RLS.
 */
export async function createSupabaseServerClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing or invalid NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — check your .env.local file and restart the dev server');
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from Server Components where cookies cannot be
            // mutated. The middleware (if added) handles session refresh instead.
          }
        },
      },
    }
  );
}
