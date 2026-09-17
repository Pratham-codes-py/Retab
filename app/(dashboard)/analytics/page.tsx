export const dynamic = 'force-dynamic';

import { getActiveCafe } from '@/lib/active-cafe';
import { redirect } from 'next/navigation';
import AnalyticsClient from './analytics-client';

export default async function AnalyticsPage() {
  const { cafe: activeCafe } = await getActiveCafe();

  if (!activeCafe) {
    redirect('/login');
  }

  return <AnalyticsClient />;
}
