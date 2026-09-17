export const dynamic = 'force-dynamic';

import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { getActiveCafe } from '@/lib/active-cafe';
import CustomersClient from './customers-client';
import { redirect } from 'next/navigation';

export default async function CustomersPage() {
  const supabase = await createSupabaseServerClient();
  const { cafe } = await getActiveCafe();
  const cafeId = cafe?.id || null;


  if (!cafeId) {
    console.warn('No cafe found for user, rendering empty customers list.');
    return <CustomersClient initialCustomers={[]} />;
  }

  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .eq('cafe_id', cafeId)
    .order('last_visit', { ascending: false });

  if (error) {
    console.error('Error fetching customers:', error);
  }

  return <CustomersClient initialCustomers={customers || []} />;
}
