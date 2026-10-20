export const revalidate = 300; // Cache settings for 5 minutes

import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { getActiveCafe } from '@/lib/active-cafe';
import SettingsClient from './settings-client';

export default async function SettingsPage() {
  const { cafe } = await getActiveCafe();
  return <SettingsClient initialCafe={cafe} />;
}
