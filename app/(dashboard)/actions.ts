'use server';

import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { revalidatePath } from 'next/cache';

export async function setupCafe(formData: FormData) {
  try {
    const name = (formData.get('name') as string)?.trim();
    if (!name) {
      return { error: 'Cafe name is required' };
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Unauthorized: Owner session not found' };
    }

    const { data: newCafe, error: cafeError } = await supabase
      .from('cafes')
      .insert({
        name,
        owner_id: user.id
      })
      .select('id')
      .single();

    if (cafeError || !newCafe) {
      console.error('Error inserting cafe:', cafeError);
      return { error: cafeError?.message || 'Failed to create cafe' };
    }

    // Insert owner record in the public users table using service role client to bypass any initial constraint checks
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    const serviceRoleSupabase = createServiceRoleClient();
    const { error: userError } = await serviceRoleSupabase
      .from('users')
      .insert({
        id: user.id,
        cafe_id: newCafe.id,
        role: 'owner',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Owner',
        email: user.email
      });

    if (userError) {
      console.error('Error inserting owner profile:', userError);
      return { error: userError.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('[setupCafe] Exception:', err);
    return { error: err.message || 'Unexpected server error' };
  }
}

export async function setActiveCafeId(cafeId: string) {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.set('active_cafe_id', cafeId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  revalidatePath('/dashboard');
  revalidatePath('/billing');
  revalidatePath('/menu');
  revalidatePath('/customers');
  revalidatePath('/reviews');
  revalidatePath('/analytics');
  revalidatePath('/settings');
}

