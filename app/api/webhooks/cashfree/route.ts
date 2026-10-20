// app/api/webhooks/cashfree/route.ts
// POST /api/webhooks/cashfree — Cashfree webhook handler for payment success

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const API_VERSION = '2023-08-01';

function generateSignature(timestamp: string, body: string, secretKey: string): string {
  const hmac = require('crypto').createHmac('sha256', secretKey);
  hmac.update(timestamp + body);
  return hmac.digest('base64');
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const timestamp = request.headers.get('x-webhook-timestamp') || '';
  const incomingSignature = request.headers.get('x-webhook-signature') || '';

  if (!CASHFREE_SECRET_KEY) {
    console.error('[cashfree-webhook] CASHFREE_SECRET_KEY missing');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Verify signature
  const expectedSignature = generateSignature(timestamp, rawBody, CASHFREE_SECRET_KEY);
  if (!incomingSignature || incomingSignature !== expectedSignature) {
    console.warn('[cashfree-webhook] Signature mismatch');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error('[cashfree-webhook] Invalid JSON:', err);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Only handle payment success events
  if (event.type !== 'PAYMENT_SUCCESS_WEBHOOK') {
    console.log('[cashfree-webhook] Ignoring event type:', event.type);
    return NextResponse.json({ status: 'ignored' });
  }

  const { order_id, cf_payment_id } = event.data;
  if (!order_id || !cf_payment_id) {
    console.warn('[cashfree-webhook] Missing order or payment ID');
    return NextResponse.json({ error: 'Missing payment identifiers' }, { status: 400 });
  }

  // Idempotent credit addition via RPC
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc('credit_cafe', {
    p_payment_id: cf_payment_id,
    p_order_id: order_id,
  });

  if (error || !data) {
    console.warn('[cashfree-webhook] credit_cafe failed for order', order_id, error);
    return NextResponse.json({ error: 'Could not credit cafe' }, { status: 409 });
  }

  // data is boolean return value from the RPC
  const success = Boolean(data);

  console.log('[cashfree-webhook] Successfully credited cafe for order', order_id);
  return NextResponse.json({ status: 'processed' });
}