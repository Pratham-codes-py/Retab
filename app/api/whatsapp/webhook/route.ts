// app/api/whatsapp/webhook/route.ts
// Receives incoming WhatsApp messages and status updates from Meta.
//
// Flow:
//  GET  — webhook verification (Meta sends a challenge during registration)
//  POST — incoming messages:
//           • interactive (button_reply) — customer tapped a rating button
//           • text                       — free-text follow-up reply

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendTextMessage } from '@/lib/whatsapp/client';

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? '';

// ---------------------------------------------------------------------------
// Rating button label → DB enum + privacy flag
// ---------------------------------------------------------------------------
const BUTTON_MAP: Record<string, { label: 'loved_it' | 'okay' | 'needs_improvement'; isPrivate: boolean }> = {
  'Amazing!':        { label: 'loved_it',          isPrivate: false },
  'Loved it!':       { label: 'loved_it',          isPrivate: false },
  'It was okay':     { label: 'okay',              isPrivate: false },
  'Could be better': { label: 'needs_improvement', isPrivate: true  },
};

// ---------------------------------------------------------------------------
// GET — Meta webhook verification handshake
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
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
    const entry   = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;
    const messages = value?.messages;

    if (!messages?.length) {
      // Delivery receipts / status updates — acknowledge without processing
      return NextResponse.json({ status: 'ok' });
    }

    const message       = messages[0];
    const from: string  = message.from;  // sender phone in E.164
    const messageType: string = message.type;

    // The phone_number_id in metadata identifies which cafe this is for
    // (one cafe ↔ one WhatsApp number → strict multi-tenant isolation)
    const phoneNumberId: string = value?.metadata?.phone_number_id ?? '';

    const supabase = createServiceRoleClient();

    // Resolve the cafe by its WhatsApp phone number ID
    const { data: cafe } = await supabase
      .from('cafes')
      .select('id, google_review_link')
      .eq('whatsapp_phone_number_id', phoneNumberId)
      .single();

    if (!cafe) {
      console.warn(`[whatsapp/webhook] No cafe found for phone_number_id: ${phoneNumberId}`);
      return NextResponse.json({ status: 'ok' });  // always 200 to Meta
    }

    // -----------------------------------------------------------------------
    // Path A — button tap (interactive / button_reply)
    // -----------------------------------------------------------------------
    if (messageType === 'interactive') {
      const title: string = message.interactive?.button_reply?.title ?? '';
      const mapped = BUTTON_MAP[title];

      if (!mapped) {
        console.warn(`[whatsapp/webhook] Unrecognised button title: "${title}"`);
        return NextResponse.json({ status: 'ok' });
      }

      const { label, isPrivate } = mapped;

      await supabase.from('reviews').insert({
        cafe_id:          cafe.id,
        customer_phone:   from,
        rating_label:     label,
        is_private:       isPrivate,
        is_resolved:      false,
        awaiting_feedback: isPrivate,  // true only for "needs_improvement"
      });

      console.log(`[whatsapp/webhook] Review inserted: "${title}" → ${label} (private=${isPrivate}) from ${from}`);

      // Reply based on sentiment
      if (!isPrivate) {
        // Positive / neutral: thank them, optionally nudge a Google review
        await sendTextMessage(
          phoneNumberId,
          from,
          "Thank you for visiting! We're thrilled you had a great experience 😊"
        );

        if (cafe.google_review_link) {
          await sendTextMessage(
            phoneNumberId,
            from,
            `It would mean a lot if you left us a quick Google review — it really helps independent spots like ours:\n${cafe.google_review_link}`
          );
        }
      } else {
        // Negative: invite free-text follow-up
        await sendTextMessage(
          phoneNumberId,
          from,
          "Thank you for letting us know. We're always trying to improve — what could we have done better during your visit? (Just reply directly to this message)"
        );
      }
    }

    // -----------------------------------------------------------------------
    // Path B — plain-text reply (follow-up feedback in the 24h window)
    // -----------------------------------------------------------------------
    if (messageType === 'text') {
      const feedbackText: string = message.text?.body ?? '';

      // Look for an open feedback request from this phone within the last 24h
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: pending } = await supabase
        .from('reviews')
        .select('id')
        .eq('cafe_id', cafe.id)
        .eq('customer_phone', from)
        .eq('awaiting_feedback', true)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pending) {
        await supabase
          .from('reviews')
          .update({ feedback_text: feedbackText, awaiting_feedback: false })
          .eq('id', pending.id);

        await sendTextMessage(
          phoneNumberId,
          from,
          'Thank you for sharing your feedback with us 🙏 Our team has received it directly.'
        );

        console.log(`[whatsapp/webhook] Feedback captured for review ${pending.id} from ${from}`);
      } else {
        // No pending review — ignore silently (could be a random message)
        console.log(`[whatsapp/webhook] Text from ${from} — no pending review, ignored`);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[whatsapp/webhook] Error:', err);
    // Always return 200 to Meta to prevent retry storms
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}
