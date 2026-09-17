import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getActiveCafe } from '@/lib/active-cafe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, customer_id, rating, feedback_text, is_private } = body as {
      order_id: string;
      customer_id: string;
      rating: number;
      feedback_text?: string;
      is_private: boolean;
    };

    if (!order_id || !customer_id || rating == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('reviews')
      .insert({ order_id, customer_id, rating, feedback_text: feedback_text ?? null, is_private })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review: data }, { status: 201 });
  } catch (err) {
    console.error('[reviews/POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Resolve active cafe
    const { cafe } = await getActiveCafe();

    if (!cafe) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('rating'); // e.g. positive, critical, neutral

    const serviceRoleSupabase = createServiceRoleClient();
    let query = serviceRoleSupabase
      .from('reviews')
      .select(`
        id,
        rating,
        feedback_text,
        is_private,
        is_resolved,
        created_at,
        customer:customers(id, name),
        orders!inner(id, cafe_id, table_number, source)
      `)
      .eq('orders.cafe_id', cafe.id);

    if (filter === 'positive' || filter === 'loved_it') {
      query = query.gte('rating', 4);
    } else if (filter === 'neutral' || filter === 'okay') {
      query = query.eq('rating', 3);
    } else if (filter === 'critical' || filter === 'needs_improvement' || filter === 'negative') {
      query = query.lte('rating', 2);
    }

    const { data: reviews, error: reviewsError } = await query.order('created_at', { ascending: false });

    if (reviewsError) {
      return NextResponse.json({ error: reviewsError.message }, { status: 500 });
    }

    return NextResponse.json({ reviews: reviews || [] });
  } catch (err) {
    console.error('[reviews/GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Resolve active cafe
    const { cafe } = await getActiveCafe();

    if (!cafe) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, is_resolved } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing review ID' }, { status: 400 });
    }

    const serviceRoleSupabase = createServiceRoleClient();

    // Verify ownership
    const { data: reviewOrder } = await serviceRoleSupabase
      .from('reviews')
      .select('orders(cafe_id)')
      .eq('id', id)
      .single();

    if (!reviewOrder || (reviewOrder.orders as any)?.cafe_id !== cafe.id) {
      return NextResponse.json({ error: 'Unauthorized review operation' }, { status: 403 });
    }

    const { data, error } = await serviceRoleSupabase
      .from('reviews')
      .update({ is_resolved })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review: data });
  } catch (err) {
    console.error('[reviews/PATCH] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
