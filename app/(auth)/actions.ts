'use server';

/**
 * app/(auth)/actions.ts
 *
 * Server Actions for authentication flows:
 *  - loginWithEmail      — owner email/password via Supabase Auth
 *  - signUp              — new owner account creation
 *  - loginWithGoogle     — owner Google OAuth via Supabase Auth
 *  - loginWithStaffPin   — staff PIN login via real Supabase Auth (no custom cookies)
 *  - logout              — sign out of Supabase Auth
 */

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthActionState = {
  error?: string;
  message?: string;
} | null;

// ---------------------------------------------------------------------------
// Owner: Email / Password login
// ---------------------------------------------------------------------------

export async function loginWithEmail(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  let shouldRedirect = false;
  let errorMsg: string | null = null;
  let infoMsg: string | null = null;

  try {
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;

    if (!email || !password) {
      return { error: 'Email and password are required.' };
    }

    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters.' };
    }

    const supabase = await createSupabaseServerClient();

    // 1. Try to sign in first (for existing users)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (!signInError) {
      shouldRedirect = true;
    } else {
      // 2. Sign in failed. Try standard signUp (for new users)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        // If the error is that the email already exists, it means the initial sign-in failed because of a wrong password!
        if (signUpError.message.includes('already exists') || signUpError.status === 422) {
          errorMsg = 'Invalid email or password.';
        } else {
          errorMsg = signUpError.message;
        }
      } else {
        // 3. Check if we have an active session (means email confirmation is disabled)
        if (signUpData.session) {
          shouldRedirect = true;
        } else {
          infoMsg = 'Account created! Please check your email to confirm your address before logging in.';
        }
      }
    }
  } catch (err: any) {
    console.error('[loginWithEmail] Unhandled error:', err);
    errorMsg = err.message || 'An unexpected error occurred during sign in.';
  }

  if (shouldRedirect) {
    redirect('/dashboard');
  }

  return { 
    error: errorMsg || undefined,
    message: infoMsg || undefined
  };
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  // Deprecated in favor of unified loginWithEmail which auto-registers new users.
  return loginWithEmail(_prevState, formData);
}

// ---------------------------------------------------------------------------
// Owner: Google OAuth
// ---------------------------------------------------------------------------

export async function loginWithGoogle(): Promise<{ url: string } | AuthActionState> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/auth/callback`,
    },
  });

  if (error || !data.url) {
    return { error: error?.message ?? 'Could not initiate Google sign-in.' };
  }

  return { url: data.url };
}

// ---------------------------------------------------------------------------
// Staff: PIN login
//
// The login form still only asks for Cafe ID + 4-digit PIN.
// Server-side we:
//   1. Look up the cafe by cafe_code (service-role to bypass RLS on anon path).
//   2. Look up the staff member at that cafe with the matching plain PIN.
//   3. Derive the Supabase Auth password: `${cafeCode}-${pin}`.
//   4. Call signInWithPassword with their internal email + derived password.
//   5. Real Supabase Auth session cookie is set — no custom cookie needed.
// ---------------------------------------------------------------------------

export async function loginWithStaffPin(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const pin = ((formData.get('pin') as string) ?? '').trim();
  const cafeCode = ((formData.get('cafeCode') as string) ?? '').trim().toUpperCase();

  if (!cafeCode) {
    return { error: 'Please enter a Cafe ID.' };
  }
  if (!/^\d{4}$/.test(pin)) {
    return { error: 'Please enter a 4-digit PIN.' };
  }

  // Use service-role client for all lookups — the user is unauthenticated at this point.
  const adminClient = createServiceRoleClient();

  // Step 1: look up the cafe by its code
  const { data: cafe, error: cafeError } = await adminClient
    .from('cafes')
    .select('id, cafe_code')
    .ilike('cafe_code', cafeCode)
    .maybeSingle();

  if (cafeError || !cafe) {
    return { error: 'Invalid Cafe ID.' };
  }

  // Step 2: find the staff member with this PIN at this cafe
  const { data: staffRow, error: staffError } = await adminClient
    .from('users')
    .select('id, auth_user_id, email, role')
    .eq('cafe_id', cafe.id)
    .eq('pin', pin)
    .in('role', ['staff', 'manager'])
    .maybeSingle();

  if (staffError || !staffRow) {
    return { error: 'Invalid Cafe ID or PIN.' };
  }

  if (!staffRow.auth_user_id || !staffRow.email) {
    // This staff member was created before the migration — their Auth account
    // doesn't exist yet. Guide the owner to re-create them in Settings.
    return { error: 'This staff account needs to be re-created by your cafe owner in Settings.' };
  }

  // Step 3: sign in with the real Supabase Auth account
  const password = `${cafe.cafe_code}-${pin}`;
  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: staffRow.email,
    password,
  });

  if (signInError) {
    return { error: 'Invalid Cafe ID or PIN.' };
  }

  redirect('/dashboard');
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
