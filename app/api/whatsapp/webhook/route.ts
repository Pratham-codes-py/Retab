// app/api/whatsapp/webhook/route.ts
// Receives incoming WhatsApp messages and status updates from Meta.
//
// Flow:
//  GET  — webhook verification (Meta sends a challenge during registration)
//  POST — incoming messages: button taps (review flow) and free-text replies

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? '';

// ---------------------------------------------------------------------------
// GET — Meta webhook verification handshake
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[whatsapp/webhook] Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn('[whatsapp/webhook] Verification failed — token mismatch');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — incoming messages
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Meta sends a nested structure; extract the first message entry
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages?.length) {
      // Delivery receipts / status updates — acknowledge without processing
      return NextResponse.json({ status: 'ok' });
    }

    const message = messages[0];
    const from: string = message.from; // sender phone in E.164
    const messageType: string = message.type;

    if (messageType === 'interactive') {
      const buttonReply = message.interactive?.button_reply;
      const title: string = buttonReply?.title ?? '';

      // Map button title → numeric rating stored in DB
      // Buttons: "Amazing!" (positive=5), "It was okay" (neutral=3), "Could be better" (negative=1)
      let rating: number | null = null;
      if (title === 'Amazing!') rating = 5;
      else if (title === 'It was okay') rating = 3;
      else if (title === 'Could be better') rating = 1;

      if (rating !== null) {
        const supabase = createServiceRoleClient();

        // Look up the customer by phone to find the most recent order
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', from)
          .single();

        if (customer) {
          const { data: order } = await supabase
            .from('orders')
            .select('id')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (order) {
            await supabase.from('reviews').insert({
              customer_id: customer.id,
              order_id: order.id,
              rating,
              channel: 'whatsapp',
            });
          }
        }

        console.log(`[whatsapp/webhook] Review recorded: "${title}" (rating ${rating}) from ${from}`);
      }
    }

    console.log(`[whatsapp/webhook] Message from ${from}, type: ${messageType}`);

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[whatsapp/webhook] Error:', err);
    // Always return 200 to Meta to prevent retry storms
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}
