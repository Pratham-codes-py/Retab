export const dynamic = 'force-dynamic';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { getActiveCafe } from '@/lib/active-cafe';
import SettingsClient from './settings-client';

export default async function SettingsPage() {
  const { cafe } = await getActiveCafe();

  let payments: any[] = [];

  if (cafe?.id) {
    const adminClient = createServiceRoleClient();
    const { data } = await adminClient
      .from('payments')
      .select('id, cashfree_order_id, amount, credits, status, created_at')
      .eq('cafe_id', cafe.id)
      .order('created_at', { ascending: false })
      .limit(10);

    payments = data ?? [];
  }

  return <SettingsClient initialCafe={cafe} initialPayments={payments} />;
}
