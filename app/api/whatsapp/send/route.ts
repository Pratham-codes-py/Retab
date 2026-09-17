// app/api/whatsapp/send/route.ts
// Sends the bill + review-request WhatsApp template to a customer.
// Deducts one credit per message and logs the send in messages_log.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendBillAndReviewTemplate } from '@/lib/whatsapp/client';
import { formatCurrency } from '@/lib/calculations/billing';

const CREDIT_COST_PER_MESSAGE = 1;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cafe_id, customer_id, customer_phone, order_id, total_amount } = body as {
      cafe_id: string;
      customer_id: string;
      customer_phone: string;
      order_id: string;
      total_amount: number;
    };

    if (!cafe_id || !customer_phone || !order_id || total_amount == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // 1. Check credit balance
    const { data: cafe, error: cafeErr } = await supabase
      .from('cafes')
      .select('credit_balance, name, google_review_link')
      .eq('id', cafe_id)
      .single();

    if (cafeErr || !cafe) {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }

    if (cafe.credit_balance < CREDIT_COST_PER_MESSAGE) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // 2. Send WhatsApp template
    const billDisplay = formatCurrency(total_amount);
    await sendBillAndReviewTemplate(
      customer_phone,
      billDisplay,
      cafe.name,
      cafe.google_review_link ?? ''
    );

    // 3. Deduct credits atomically
    const { error: deductErr } = await supabase.rpc('deduct_credit', {
      p_cafe_id: cafe_id,
      p_amount: CREDIT_COST_PER_MESSAGE,
    });

    if (deductErr) {
      console.error('[whatsapp/send] Credit deduction failed:', deductErr);
      // Message was sent — log the error but don't fail the request
    }

    // 4. Log the send in messages_log
    await supabase.from('messages_log').insert({
      cafe_id,
      customer_id,
      type: 'bill',
      channel: 'whatsapp',
      cost: CREDIT_COST_PER_MESSAGE,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[whatsapp/send] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
