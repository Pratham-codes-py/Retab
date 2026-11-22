// app/api/payments/create-order/route.ts
// POST /api/payments/create-order — initiates a Cashfree order for credit purchase

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getActiveCafe } from '@/lib/active-cafe';
import { CREDIT_PACKS } from '@/lib/billing/packs';

const CASHFREE_BASE = 'https://sandbox.cashfree.com/pg';
const API_VERSION = '2023-08-01';

export async function POST(request: NextRequest) {
  try {
    // --- Auth: resolve the caller's cafe via the same helper used by /settings ---
    const { cafe, isOwner } = await getActiveCafe();

    if (!cafe) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isOwner) {
      return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
    }

    const cafeId = cafe.id;

    // --- Validate pack ---
    const { packId } = await request.json();
    if (!packId) {
      return NextResponse.json({ error: 'packId is required' }, { status: 400 });
    }

    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: 'Invalid packId' }, { status: 400 });
    }

    // --- Cashfree credentials ---
    const appId = process.env.CASHFREE_APP_ID || '';
    const secretKey = process.env.CASHFREE_SECRET_KEY || '';
    if (!appId || !secretKey) {
      return NextResponse.json({ error: 'Cashfree credentials not configured' }, { status: 500 });
    }

    // Generate a deterministic, readable order ID for debugging
    const orderId = `retab_${cafeId.slice(0, 8)}_${Date.now()}`;

    const orderBody = {
      order_id: orderId,
      order_amount: pack.priceINR,
      order_currency: 'INR',
      customer_details: {
        customer_id: cafeId, // aligns with payments.cafe_id FK
        customer_phone: '+919999999999', // required by Cashfree; use a real phone in production
      },
      order_note: `Credit pack: ${pack.label}`,
    };

    // --- Call Cashfree API ---
    const cfRes = await fetch(`${CASHFREE_BASE}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderBody),
    });

    if (!cfRes.ok) {
      const errorText = await cfRes.text();
      console.error('[create-order] Cashfree error:', errorText);
      return NextResponse.json({ error: 'Failed to create Cashfree order' }, { status: 502 });
    }

    const cfData = await cfRes.json();
    const paymentSessionId: string = cfData.payment_session_id;

    if (!paymentSessionId) {
      console.error('[create-order] Cashfree response missing payment_session_id:', cfData);
      return NextResponse.json({ error: 'Cashfree did not return a payment session' }, { status: 502 });
    }

    // --- Persist the order for audit and webhook reconciliation ---
    const adminClient = createServiceRoleClient();
    const { error: insertError } = await adminClient.from('payments').insert({
      cafe_id: cafeId,
      cashfree_order_id: cfData.order_id,
      amount: pack.priceINR,
      credits: pack.credits,
      status: 'created',
    });

    if (insertError) {
      // Non-fatal: log but still return session so the user can pay
      console.error('[create-order] payments insert error:', insertError);
    }

    return NextResponse.json(
      { paymentSessionId, orderId: cfData.order_id },
      { status: 200 }
    );
  } catch (err) {
    console.error('[create-order] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
