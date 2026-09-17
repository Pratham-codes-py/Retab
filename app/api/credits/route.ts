// app/api/credits/route.ts
// Manages credit balance: query balance and log transactions.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cafe_id = searchParams.get('cafe_id');

    if (!cafe_id) {
      return NextResponse.json({ error: 'cafe_id is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('cafes')
      .select('credit_balance')
      .eq('id', cafe_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ credit_balance: data.credit_balance });
  } catch (err) {
    console.error('[credits/GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // TODO: handle credit purchase webhook from payment provider
  return NextResponse.json({ message: 'POST /api/credits — to be implemented' });
}
