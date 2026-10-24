import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { reviewId, message } = await request.json();

    if (!reviewId || !message) {
      return NextResponse.json({ error: 'Missing reviewId or message' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Get review details
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, cafe_id, customer_phone')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Get cafe WhatsApp details
    const { data: cafe, error: cafeError } = await supabase
      .from('cafes')
      .select('whatsapp_phone_number_id')
      .eq('id', review.cafe_id)
      .single();

    if (cafeError || !cafe) {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }

    const phoneId = cafe.whatsapp_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || '1379415518580795';

    const phoneNumber = review.customer_phone?.replace(/^\+/, '') || '';
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Customer phone not available' }, { status: 400 });
    }

    // Send message via WhatsApp API
    const whatsappResponse = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      })
    });

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text();
      console.error('WhatsApp API error:', errorData);
      return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 });
    }

    // Mark review as resolved
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({ is_resolved: true })
      .eq('id', reviewId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: 'WhatsApp message sent and review resolved successfully'
    }, { status: 200 });

  } catch (err) {
    console.error('[reviews/reply/POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}