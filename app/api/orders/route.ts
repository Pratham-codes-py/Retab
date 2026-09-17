// app/api/orders/route.ts
// Handles creating a new order and verifying the total server-side.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { calculateTotal } from '@/lib/calculations/billing';
import type { BillLineItem } from '@/lib/calculations/billing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cafe_id, customer_phone, customer_name, items } = body as {
      cafe_id: string;
      customer_phone: string;
      customer_name?: string;
      items: BillLineItem[];
    };

    if (!cafe_id || !customer_phone || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Server-side total verification — prevents client-side manipulation
    const { total } = calculateTotal(items);

    const adminClient = createServiceRoleClient();

    // Resolve the caller's profile id for order attribution.
    // If they are an owner, created_by should be null.
    // If they are staff/manager, set created_by to their users.id.
    let createdBy: string | null = null;
    try {
      const supabaseUser = await createSupabaseServerClient();
      const { data: { user: authUser } } = await supabaseUser.auth.getUser();
      if (authUser) {
        // Look up their profile row in public.users
        const { data: profile } = await adminClient
          .from('users')
          .select('id, role')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        if (profile && profile.role !== 'owner') {
          createdBy = profile.id;
        }
      }
    } catch {
      // Non-fatal — created_by is nullable
    }

    const { data: order, error } = await adminClient
      .from('orders')
      .insert({
        cafe_id,
        customer_phone,
        total_amount: total,
        created_by: createdBy,
        // customer_id is set by the DB trigger after insert
      })
      .select()
      .single();

    if (error) {
      console.error('[orders/POST] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Insert order items
    const orderItemsToInsert = items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
    }));

    const { error: itemsInsertError } = await adminClient
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsInsertError) {
      console.error('[orders/POST] order_items insert error:', itemsInsertError);
      // Roll back the order to keep data consistent
      await adminClient.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: itemsInsertError.message }, { status: 500 });
    }

    // Update customer name if provided (the DB trigger handle_order_customer_upsert created/resolved it)
    if (customer_name) {
      await adminClient
        .from('customers')
        .update({ name: customer_name.trim() })
        .eq('cafe_id', cafe_id)
        .eq('phone', customer_phone);
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error('[orders/POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // TODO: list orders for a cafe with pagination
  return NextResponse.json({ message: 'GET /api/orders — to be implemented' });
}
