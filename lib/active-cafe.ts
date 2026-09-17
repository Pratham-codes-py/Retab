import 'server-only';
import { createServiceRoleClient } from './supabase/server';
import { createSupabaseServerClient } from './supabase/ssr-server';
import { Cafe } from '@/types';

/**
 * Resolves the currently active cafe for the authenticated user.
 *
 * Uses the service-role client for ALL database lookups so this function
 * works regardless of whether the RLS migration has run yet. RLS is still
 * enforced per-table for page-level queries; this function is purely for
 * determining which cafe to scope the session to.
 *
 * - Owner:  cafes.owner_id = user.id
 * - Staff:  users.auth_user_id = user.id  (role in ['staff','manager'])
 *
 * Returns { cafe: null, isOwner: true } when an owner has no cafe yet.
 * Returns { cafe: null, isOwner: false } when auth.getUser() returns null.
 */
export async function getActiveCafe(): Promise<{
  cafe: Cafe | null;
  isOwner: boolean;
  staffProfileId: string | null;   // users.id for the staff member (null for owners)
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { cafe: null, isOwner: false, staffProfileId: null };
    }

    // Use service-role for ALL DB reads — bypasses RLS entirely.
    // This makes this function work regardless of RLS migration state.
    const adminClient = createServiceRoleClient();

    // First: check if this user is an owner (owns a cafe directly)
    const { data: ownedCafe } = await adminClient
      .from('cafes')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (ownedCafe) {
      return { cafe: ownedCafe as Cafe, isOwner: true, staffProfileId: null };
    }

    // Second: check if this is a staff/manager account
    const { data: profileRow } = await adminClient
      .from('users')
      .select('id, cafe_id, role')
      .eq('auth_user_id', user.id)
      .in('role', ['staff', 'manager'])
      .maybeSingle();

    if (profileRow?.cafe_id) {
      const { data: staffCafe } = await adminClient
        .from('cafes')
        .select('*')
        .eq('id', profileRow.cafe_id)
        .maybeSingle();

      if (staffCafe) {
        return { cafe: staffCafe as Cafe, isOwner: false, staffProfileId: profileRow.id };
      }
    }

    // Authenticated user with no cafe (new owner needs setup wizard)
    return { cafe: null, isOwner: true, staffProfileId: null };
  } catch (err: any) {
    // Re-throw Next.js dynamic server errors (redirect, notFound, etc.)
    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('Dynamic server usage')) {
      throw err;
    }
    console.error('[getActiveCafe] Error:', err);
    // On DB errors: return isOwner: null so the layout can distinguish
    // "DB failed" from "no profile" — prevents incorrectly signing the user out.
    return { cafe: null, isOwner: false, staffProfileId: null };
  }
}
