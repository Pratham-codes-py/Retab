import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendBillAndReviewTemplate } from '@/lib/whatsapp/client';

const CREDIT_COST_PER_MESSAGE = 1;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_phone, total_amount, customer_name, cafe_id } = body;

    const supabase = createServiceRoleClient();

    // 1. Verify cafe exists and has credits
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
    const billDisplay = String(Math.round(total_amount * 100) / 100).replace(/\.00$/, '');
    await sendBillAndReviewTemplate(
      customer_phone,
      billDisplay,
      cafe.name,
      cafe.google_review_link ?? '',
      customer_name
    );

    // 3. Deduct exactly 1 credit (with direct fallback)
    let deductErr: any = null;
    try {
      const { error } = await supabase.rpc('decrement_credit', {
        p_cafe_id: cafe_id,
        p_amount: 1,
      });
      deductErr = error;
    } catch (rpcErr) {
      deductErr = rpcErr;
    }

    // Fallback: direct update if RPC missing/failed (Math.max(0, current-1))
    if (deductErr) {
      const { data: cafeData } = await supabase
        .from('cafes')
        .select('credit_balance')
        .eq('id', cafe_id)
        .single();
      const current = cafeData?.credit_balance ?? 0;
      await supabase.from('cafes').update({ credit_balance: Math.max(0, current - 1) }).eq('id', cafe_id);
    }

    // 4. Log the send in messages_log
    await supabase.from('messages_log').insert({
      cafe_id,
      customer_id: body.customer_id || null,
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
