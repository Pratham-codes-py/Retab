export const revalidate = 300; // Cache reviews for 5 minutes

import { createServiceRoleClient } from '@/lib/supabase/server';
import ReviewsClient from './reviews-client';

export default async function ReviewsPage() {
  const supabase = createServiceRoleClient();

  // Fetch reviews for all cafes the user has access to (owner/manager/staff)
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(`
      id, rating, feedback_text, is_private, is_resolved, created_at,
      customer:customers(id, name, phone),
      orders(id, table_number, source)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error loading reviews:', error);
    // Still render the client with empty state instead of crashing
    return <ReviewsClient initialReviews={[]} error={error.message} />;
  }

  return <ReviewsClient initialReviews={reviews || []} />;
}