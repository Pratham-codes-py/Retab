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

    // TODO: implement the full review flow
    // - 'interactive' button tap → record review rating in DB
    // - 'text' reply → store as feedback_text
    // - redirect high ratings (4–5) to google_review_link

    console.log(`[whatsapp/webhook] Message from ${from}, type: ${messageType}`);

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[whatsapp/webhook] Error:', err);
    // Always return 200 to Meta to prevent retry storms
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}
