// app/api/customers/route.ts
// CRUD for customers — list, search, update.

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
      .from('customers')
      .select('*')
      .eq('cafe_id', cafe_id)
      .order('last_visit', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customers: data });
  } catch (err) {
    console.error('[customers/GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  // TODO: update customer name / phone
  return NextResponse.json({ message: 'PATCH /api/customers — to be implemented' });
}
