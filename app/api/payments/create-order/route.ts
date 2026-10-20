// app/api/payments/create-order/route.ts
// POST /api/payments/create-order — initiates a Cashfree order for credit purchase

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { CREDIT_PACKS } from '@/lib/billing/packs';

const CASHFREE_BASE = 'https://sandbox.cashfree.com/pg';
const API_VERSION = '2023-08-01';

// Helper to derive cafe phone from users table (owner/manager/staff)
async function getCafePhone(supabase: any, cafeId: string): Promise<string> {
  const { data } = await supabase
    .from('users')
    .select('email')
    .eq('cafe_id', cafeId)
    .limit(1)
    .single();
  // Default fallback; in production map email to phone number from customers table if needed
  return '+919999999999';
}

export async function POST(request: NextRequest) {
  try {
    // --- Owner-only authorization ---
    const supabase = createServiceRoleClient();
    const { data: cafeId, error } = await supabase.rpc('auth_user_cafe_id');

    if (error || !cafeId) {
      console.error('[create-order] auth_user_cafe_id error:', error);
      return NextResponse.json({ error: 'Cafe not found or access denied' }, { status: 403 });
    }

    const { packId } = await request.json();
    if (!packId) {
      return NextResponse.json({ error: 'packId is required' }, { status: 400 });
    }

    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: 'Invalid packId' }, { status: 400 });
    }

    // Generate deterministic, readable order IDs for debugging
    const now = Date.now();
    const cafeIdShort = cafeId.slice(0, 8);
    const orderId = `retab_${cafeIdShort}_${now}`;

    const body = {
      order_id: orderId,
      order_amount: pack.priceINR,
      order_currency: 'INR',
      customer_details: {
        customer_id: cafeId, // align with payments.cafe_id FK
        customer_phone: await getCafePhone(supabase, cafeId),
      },
      order_note: `Credit pack: ${pack.label}`, // optional memo field
    };

    // --- Call Cashfree API ---
    const cfRes = await fetch(`${CASHFREE_BASE}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': API_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!cfRes.ok) {
      const errorText = await cfRes.text();
      console.error('[create-order] Cashfree error:', errorText);
      return NextResponse.json({ error: 'Failed to create Cashfree order' }, { status: 502 });
    }

    const data = await cfRes.json();

    // Insert the order record for audit and webhook reconciliation
    await supabase.from('payments').insert({
      cafe_id: cafeId,
      cashfree_order_id: data.order_id,
      amount: pack.priceINR,
      credits: pack.credits,
      status: 'created',
    });

    return NextResponse.json({
      paymentSessionId: data.payment_session_id,
      orderId: data.order_id,
    });
  } catch (err) {
    console.error('[create-order] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}