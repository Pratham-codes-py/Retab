export const dynamic = 'force-dynamic';

import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { getActiveCafe } from '@/lib/active-cafe';
import BillingClient from './billing-client';

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const { cafe } = await getActiveCafe();


  let menuItems = [];
  if (cafe) {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('cafe_id', cafe.id)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (data) menuItems = data;
  }

  return <BillingClient cafe={cafe} menuItems={menuItems} />;
}
