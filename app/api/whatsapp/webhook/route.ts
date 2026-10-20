import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side admin client using service-role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && (token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || token === process.env.WHATSAPP_VERIFY_TOKEN)) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    // Filter out delivery/read status receipts
    if (!message) {
      return NextResponse.json({ status: 'ignored_status' }, { status: 200 });
    }

    const phoneId = value.metadata?.phone_number_id;
    const customerPhone = message.from;
    if (!phoneId || !customerPhone) {
      return NextResponse.json({ status: 'missing_metadata' }, { status: 200 });
    }

    // 1. Production-grade button text parser (handles template quick_reply & interactive)
    let buttonText: string | null = null;
    if (message.type === 'button') {
      buttonText = message.button?.text || message.button?.payload || null;
    } else if (message.type === 'interactive') {
      buttonText = message.interactive?.button_reply?.title || message.interactive?.button_reply?.id || null;
    }

    // 2. Multi-tenant cafe resolution (strict matching by phoneId)
    let { data: cafe } = await supabase
      .from('cafes')
      .select('id, name, google_review_link')
      .eq('whatsapp_phone_number_id', phoneId)
      .maybeSingle();

    if (!cafe) {
      const { data: defaultCafe } = await supabase
        .from('cafes')
        .select('id, name, google_review_link')
        .limit(1)
        .maybeSingle();
      cafe = defaultCafe;
    }

    if (!cafe) {
      console.error('[whatsapp/webhook] No cafe found in database');
      return NextResponse.json({ error: 'Cafe not found' }, { status: 200 });
    }

    // Now TypeScript knows cafe is guaranteed to be non-null:
    const cafeId: string = cafe.id;
    const reviewLink: string = cafe.google_review_link || 'https://maps.google.com';

    // 3. Process button review event
    if (buttonText) {
      const normalized = buttonText.trim().toLowerCase();
      const isLoved = normalized.includes('amazing') || normalized.includes('loved');
      const isOkay = normalized.includes('okay') || normalized === 'ok';
      const isPoor = normalized.includes('better') || normalized.includes('poor');

      const numericRating = isPoor ? 1 : isOkay ? 3 : 5;
      const ratingLabel = isPoor ? 'needs_improvement' : isOkay ? 'okay' : 'loved_it';
      const isPrivate = isPoor;

      // Insert into reviews table strictly matching Supabase schema types
      const { error: insertError } = await supabase.from('reviews').insert({
        cafe_id: cafeId,
        customer_phone: customerPhone,
        rating: numericRating,
        rating_label: ratingLabel,
        is_private: isPrivate,
        is_resolved: false,
        awaiting_feedback: isPrivate
      });

      if (insertError) {
        console.error('[whatsapp/webhook] Review insert failed:', insertError);
      }

      // Outbound dispatch: customer service window is open
      const token = process.env.WHATSAPP_ACCESS_TOKEN;
      if (!token) {
        console.error('[whatsapp/webhook] WHATSAPP_ACCESS_TOKEN missing');
        return NextResponse.json({ error: 'Missing token' }, { status: 200 });
      }

      if (isPoor) {
        await sendWhatsAppMessage(token, phoneId, customerPhone,
          "Thank you for letting us know. We're always trying to improve — what could we have done better during your visit? (Just reply here)"
        );
      } else {
        await sendWhatsAppMessage(token, phoneId, customerPhone,
          "Thank you for visiting! We're thrilled you had a great experience 😊"
        );

        if (reviewLink) {
          await sendWhatsAppMessage(token, phoneId, customerPhone,
            `It would mean the world to our team if you left us a quick Google review — it really helps independent spots like ours:\n${reviewLink}`
          );
        }
      }

      return NextResponse.json({ status: 'processed_button' }, { status: 200 });
    }

    // 4. Process free-text follow-up feedback
    if (message.type === 'text' && message.text?.body) {
      const feedbackText = message.text.body;
      const { data: pendingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('cafe_id', cafeId)
        .eq('customer_phone', customerPhone)
        .eq('awaiting_feedback', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pendingReview) {
        await supabase
          .from('reviews')
          .update({
            feedback_text: feedbackText,
            awaiting_feedback: false
          })
          .eq('id', pendingReview.id);

        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        if (token) {
          await sendWhatsAppMessage(token, phoneId, customerPhone,
            "Thank you for sharing your feedback with us 🙏 Our team has received it directly."
          );
        }
      }

      return NextResponse.json({ status: 'processed_text' }, { status: 200 });
    }

    return NextResponse.json({ status: 'unhandled_event' }, { status: 200 });
  } catch (err: any) {
    console.error('[whatsapp/webhook] Execution error:', err);
    return NextResponse.json({ error: err.message }, { status: 200 });
  }
}

async function sendWhatsAppMessage(token: string, phoneId: string, to: string, text: string) {
  const cleanPhone = to.replace(/^\+/, '');
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: { body: text },
    }),
  });

  const resData = await res.json();
  if (!res.ok) {
    console.error('[whatsapp/webhook] Outbound delivery failed:', res.status, resData);
  } else {
    console.log('[whatsapp/webhook] Outbound message delivered:', resData.messages?.[0]?.id);
  }
  return resData;
}
