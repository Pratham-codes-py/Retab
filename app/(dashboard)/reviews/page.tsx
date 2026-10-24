export const revalidate = 60;

import { createServiceRoleClient } from '@/lib/supabase/server';
import ReviewsClient from './reviews-client';
import { getActiveCafe } from '@/lib/active-cafe';

export default async function ReviewsPage() {
  const supabase = createServiceRoleClient();

  const { cafe } = await getActiveCafe();

  let reviews: any[] = [];
  let customers: any[] = [];

  if (cafe?.id) {
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select(
        'id, cafe_id, order_id, customer_id, customer_phone, rating, rating_label, feedback_text, is_private, is_resolved, awaiting_feedback, created_at, customer:customers(id, name, phone), orders(id, total_amount, created_at)'
      )
      .eq('cafe_id', cafe.id)
      .order('created_at', { ascending: false })
      .limit(100);
    reviews = reviewsData || [];

    const { data: customerData } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('cafe_id', cafe.id);
    customers = customerData || [];
  }

  // Enrich reviews with customer name matching
  const enrichedReviews = reviews.map((review: any) => {
    const reviewPhoneRaw = (review.customer_phone || '').replace(/\D/g, '');
    const last10 = reviewPhoneRaw.slice(-10);

    let matchedCustomer = null;
    if (!review.customer?.name && last10) {
      matchedCustomer = customers.find((c: any) => {
        const cPhone = (c.phone || '').replace(/\D/g, '');
        return cPhone.slice(-10) === last10;
      });
    }

    const customerName = review.customer?.name || matchedCustomer?.name || null;
    const phoneFormatted = review.customer_phone
      ? `+${review.customer_phone.replace(/\D/g, '').slice(-10)}`
      : '';

    return {
      ...review,
      customer_name: customerName,
      customer_phone: phoneFormatted
    };
  });

  return <ReviewsClient initialReviews={enrichedReviews} />;
}
