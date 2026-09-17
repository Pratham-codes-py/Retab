export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import StaffLoginClient from './staff-login-client';

/**
 * Staff login page — server component.
 *
 * If there is already a real Supabase Auth session AND the user is a
 * staff/manager (not an owner), redirect straight to /billing.
 *
 * If an owner somehow lands here they get sent to /dashboard.
 * Otherwise render the login form.
 */
export default async function StaffLoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if this is an owner (owns a cafe directly)
    const { data: ownedCafe } = await supabase
      .from('cafes')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (ownedCafe) {
      redirect('/dashboard');
    }

    // Check if this is a staff/manager with a valid profile
    const adminClient = createServiceRoleClient();
    const { data: staffRow } = await adminClient
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .in('role', ['staff', 'manager'])
      .maybeSingle();

    if (staffRow) {
      redirect('/billing');
    }
  }

  return <StaffLoginClient />;
}
