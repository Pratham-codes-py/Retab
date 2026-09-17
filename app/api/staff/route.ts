import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getActiveCafe } from '@/lib/active-cafe';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Supabase Auth Admin REST helpers
//
// We call the Supabase Auth Admin API directly via fetch rather than using
// adminClient.auth.admin.*  — this is necessary because the new Supabase
// key format (sb_publishable_ / sb_secret_) is handled correctly by the REST
// endpoint regardless of SDK version quirks.
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function createAuthUser(email: string, password: string): Promise<{
  userId: string | null;
  error: string | null;
}> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true, // skip confirmation email — internal account
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.msg || data?.error_description || data?.message || `HTTP ${res.status}`;
    if (res.status === 401 || data?.error_code === 'no_authorization') {
      return {
        userId: null,
        error:
          'Service role key is invalid or missing. ' +
          'Go to Supabase Dashboard → Project Settings → API and copy the Secret key ' +
          '(not the Publishable key). Paste it as SUPABASE_SERVICE_ROLE_KEY in .env.local ' +
          'then restart the dev server.',
      };
    }
    return { userId: null, error: msg };
  }

  return { userId: data.id ?? null, error: null };
}

async function deleteAuthUser(authUserId: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${authUserId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
}

// ---------------------------------------------------------------------------
// GET /api/staff  — list staff for the owner's cafe
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cafe, isOwner } = await getActiveCafe();

    if (!cafe || !isOwner) {
      return NextResponse.json({ error: 'Cafe not found or unauthorized' }, { status: 404 });
    }

    const adminClient = createServiceRoleClient();
    const { data: staff, error: staffError } = await adminClient
      .from('users')
      .select('id, name, role, pin, email')
      .eq('cafe_id', cafe.id)
      .in('role', ['manager', 'staff'])
      .order('name', { ascending: true });

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 });
    }

    const formattedStaff = (staff || []).map(s => ({
      id: s.id,
      name: s.name,
      role: s.role === 'manager' ? 'Manager' : 'Cashier',
      pin: s.pin || '****',
      initials: s.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'ST',
    }));

    return NextResponse.json({ staff: formattedStaff });
  } catch (err) {
    console.error('[staff/GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/staff  — create a new staff member
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cafe, isOwner } = await getActiveCafe();

    if (!cafe || !isOwner) {
      return NextResponse.json({ error: 'Cafe not found or unauthorized' }, { status: 404 });
    }

    const { name, role, pin } = await request.json();

    if (!name || !role || !pin) {
      return NextResponse.json({ error: 'Missing name, role, or PIN' }, { status: 400 });
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    const adminClient = createServiceRoleClient();

    // Check PIN uniqueness at this cafe
    const { data: existingPin } = await adminClient
      .from('users')
      .select('id')
      .eq('cafe_id', cafe.id)
      .eq('pin', pin)
      .in('role', ['staff', 'manager'])
      .maybeSingle();

    if (existingPin) {
      return NextResponse.json(
        { error: 'This PIN is already in use by another staff member at this cafe' },
        { status: 400 }
      );
    }

    const staffProfileId = randomUUID();
    const internalEmail = `staff_${staffProfileId}@retab-internal.app`;
    const password = `${cafe.cafe_code}-${pin}`;
    const dbRole = role.toLowerCase() === 'manager' ? 'manager' : 'staff';

    // Create the Supabase Auth account via REST (works with all key formats)
    const { userId: authUserId, error: authError } = await createAuthUser(internalEmail, password);

    if (authError || !authUserId) {
      console.error('[staff/POST] Auth createUser error:', authError);
      return NextResponse.json({ error: authError || 'Failed to create auth account' }, { status: 500 });
    }

    // Insert the profile row
    const { data: newStaff, error: insertError } = await adminClient
      .from('users')
      .insert({
        id: staffProfileId,
        auth_user_id: authUserId,
        cafe_id: cafe.id,
        name,
        role: dbRole,
        email: internalEmail,
        pin,
      })
      .select('id, name, role, pin')
      .single();

    if (insertError) {
      // Roll back the auth account to avoid orphans
      await deleteAuthUser(authUserId);
      console.error('[staff/POST] Profile insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ staff: newStaff }, { status: 201 });
  } catch (err) {
    console.error('[staff/POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/staff?id=<profileId>  — remove a staff member
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cafe, isOwner } = await getActiveCafe();

    if (!cafe || !isOwner) {
      return NextResponse.json({ error: 'Cafe not found or unauthorized' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('id');

    if (!staffId) {
      return NextResponse.json({ error: 'Missing staff ID' }, { status: 400 });
    }

    const adminClient = createServiceRoleClient();

    // Get auth_user_id before deleting the profile row
    const { data: staffRow } = await adminClient
      .from('users')
      .select('auth_user_id')
      .eq('id', staffId)
      .eq('cafe_id', cafe.id)
      .maybeSingle();

    // Delete the profile row
    const { error: deleteError } = await adminClient
      .from('users')
      .delete()
      .eq('id', staffId)
      .eq('cafe_id', cafe.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Delete the Auth account — invalidates all active sessions immediately
    if (staffRow?.auth_user_id) {
      await deleteAuthUser(staffRow.auth_user_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[staff/DELETE] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
