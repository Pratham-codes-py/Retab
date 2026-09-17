import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';

/**
 * GET /api/auth/callback
 *
 * Supabase redirects here after a successful Google OAuth flow.
 * We exchange the one-time `code` for a session, then redirect the user
 * to the dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('[auth/callback] exchangeCodeForSession error:', error.message);
  }

  // Something went wrong — bounce back to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`);
}
