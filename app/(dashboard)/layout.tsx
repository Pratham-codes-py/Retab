/**
 * app/(dashboard)/layout.tsx
 *
 * Session guard + role-based layout for all dashboard routes.
 *
 * Single auth path for everyone (owner and staff alike):
 *   1. supabase.auth.getUser() — no session → /login
 *   2. Look up the user's row in public.users by auth_user_id to get role + cafe
 *   3. If no users row but the auth user owns a cafe → self-heal insert, continue
 *   4. If no users row and no owned cafe → new owner, show cafe setup wizard
 *   5. Staff role → restrict to allowed paths, redirect others to /billing
 */

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getActiveCafe } from '@/lib/active-cafe';
import Sidebar from './sidebar';
import CafeSetupClient from './cafe-setup-client';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Resolve the active cafe (works for both owners and staff)
  const { cafe: activeCafe, isOwner } = await getActiveCafe();
  const hasCafe = !!activeCafe;

  // For owners with a cafe, ensure their public.users profile row exists (self-heal)
  if (isOwner && hasCafe && activeCafe) {
    const serviceRoleSupabase = createServiceRoleClient();
    const { data: dbUser } = await serviceRoleSupabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!dbUser) {
      await serviceRoleSupabase
        .from('users')
        .insert({
          id: user.id,
          auth_user_id: user.id,
          cafe_id: activeCafe.id,
          role: 'owner',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner',
          email: user.email,
        })
        .select()
        .maybeSingle();
    } else {
      // Ensure auth_user_id is set on legacy owner rows (back-fill)
      const { data: ownerRow } = await serviceRoleSupabase
        .from('users')
        .select('auth_user_id')
        .eq('id', user.id)
        .maybeSingle();
      if (ownerRow && !ownerRow.auth_user_id) {
        await serviceRoleSupabase
          .from('users')
          .update({ auth_user_id: user.id })
          .eq('id', user.id);
      }
    }
  }

  // No cafe: show setup wizard only to owners (staff can never reach this —
  // they always belong to an existing cafe)
  if (!hasCafe) {
    if (!isOwner) {
      // Staff member whose cafe was deleted or whose account is misconfigured.
      // Sign them out and send to login rather than leaving them in a broken state.
      await supabase.auth.signOut();
      redirect('/login');
    }
    // New owner with zero cafes — show the setup wizard
    return <CafeSetupClient />;
  }

  // Determine the role from the resolved session
  const role = isOwner ? 'owner' : 'staff';

  // Staff route guard — restrict to safe paths only
  if (!isOwner) {
    const headersList = await headers();
    const currentPath =
      headersList.get('x-invoke-path') ??
      headersList.get('x-pathname') ??
      new URL(
        headersList.get('x-url') ?? headersList.get('referer') ?? 'http://localhost/billing'
      ).pathname;

    const ALLOWED_STAFF_PATHS = ['/dashboard', '/billing', '/menu', '/customers', '/reviews'];
    const isAllowedPath = ALLOWED_STAFF_PATHS.some(path => currentPath === path || currentPath.startsWith(path + '/'));

    if (!isAllowedPath && currentPath !== '/') {
      redirect('/dashboard');
    }
  }

  return (
    <>
      {/* Google Fonts + Material Symbols for Stitch design */}
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        rel="stylesheet"
      />
      <div style={{ display: 'flex', minHeight: '100vh', background: '#fcf9f8' }}>
        <Sidebar role={role} currentCafeId={activeCafe?.id} />
        <main style={{
          flex: 1,
          marginLeft: '256px',
          padding: '32px',
          minHeight: '100vh',
          background: '#fcf9f8',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: '#1c1b1b',
        }}>
          {children}
        </main>
      </div>
    </>
  );
}
