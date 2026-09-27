import { getActiveCafe } from '@/lib/active-cafe';
import { redirect } from 'next/navigation';
import ReviewsClient from './reviews-client';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function ReviewsPage() {
  const { cafe } = await getActiveCafe();

  if (!cafe) {
    redirect('/login');
  }

  // Fetch initial reviews (all filter) server-side
  const serviceRoleSupabase = createServiceRoleClient();

  const { data: cafeOrders } = await serviceRoleSupabase
    .from('orders')
    .select('id')
    .eq('cafe_id', cafe.id);

  const orderIds = (cafeOrders || []).map(o => o.id);

  let initialReviews: any[] = [];
  if (orderIds.length > 0) {
    const { data } = await serviceRoleSupabase
      .from('reviews')
      .select(`
        id,
        rating,
        feedback_text,
        is_private,
        is_resolved,
        created_at,
        customer:customers(id, name),
        orders(id, table_number, source)
      `)
      .in('order_id', orderIds)
      .order('created_at', { ascending: false });

    initialReviews = data || [];
  }

  return <ReviewsClient initialReviews={initialReviews} />;
}
