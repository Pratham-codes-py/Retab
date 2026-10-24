import { getActiveCafe } from '@/lib/active-cafe';
import { redirect } from 'next/navigation';
import AnalyticsClient from './analytics-client';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { subDays, format } from 'date-fns';

export const revalidate = 300; // Cache analytics for 5 minutes

export default async function AnalyticsPage() {
  const { cafe } = await getActiveCafe();

  if (!cafe) {
    redirect('/login');
  }

  // Fetch initial 30-day analytics data server-side
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  const defaultStartDate = subDays(now, 30);

  const getISTDayStart = (date: Date) => {
    const istDate = new Date(date.getTime() + IST_OFFSET_MS);
    return new Date(Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate()) - IST_OFFSET_MS);
  };
  const getISTDayEnd = (date: Date) => {
    const start = getISTDayStart(date);
    return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  };

  const startDate = getISTDayStart(defaultStartDate).toISOString();
  const endDate = getISTDayEnd(now).toISOString();

  const serviceRoleSupabase = createServiceRoleClient();

  // Fetch orders
  const { data: orders } = await serviceRoleSupabase
    .from('orders')
    .select('id, created_at, total_amount, customer_id, created_by, customers(first_visit)')
    .eq('cafe_id', cafe.id)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const orderIds = (orders || []).map(o => o.id);

  // Fetch staff
  const { data: staffMembers } = await serviceRoleSupabase
    .from('users')
    .select('id, name')
    .eq('cafe_id', cafe.id)
    .in('role', ['manager', 'staff']);

  // Fetch order items - separate parallel queries
  let queryOrderItems: any[] = [];
  let queryReviews: any[] = [];

  // Fetch order items and reviews - parallel queries

  // Fetch reviews directly by cafe_id to include WhatsApp reviews
  const { data: reviewsByCafe } = await serviceRoleSupabase
    .from('reviews')
    .select('rating')
    .eq('cafe_id', cafe.id);
  queryReviews = reviewsByCafe || [];

  if (orderIds.length > 0) {
    const orderItemsResult = await serviceRoleSupabase
      .from('order_items')
      .select('quantity, menu_items(name, price)')
      .in('order_id', orderIds);

    queryOrderItems = orderItemsResult.data || [];
  }

  // Parallel queries: top regulars + performance aggregations
  const [
    { data: topRegulars },
    { data: reviewsStats },
    { data: performanceData }
  ] = await Promise.all([
    serviceRoleSupabase
      .from('customers')
      .select('id, name, total_spend, visit_count')
      .eq('cafe_id', cafe.id)
      .order('total_spend', { ascending: false })
      .limit(5),

    serviceRoleSupabase
      .from('reviews')
      .select('rating')
      .eq('cafe_id', cafe.id),

    (async () => {
      const { data: orders } = await serviceRoleSupabase
        .from('orders')
        .select('id, created_by, total_amount')
        .eq('cafe_id', cafe.id);
      const orderIds = (orders || []).map(o => o.id);
      const { data: orderItemsData } = orderIds.length > 0
        ? await serviceRoleSupabase
            .from('order_items')
            .select('quantity, menu_items(name, price)')
            .in('order_id', orderIds)
        : { data: [] };
      return { data: { orders, orderItems: orderItemsData || [] } };
    })()
  ]);

  // Process aggregations
  const revenueTrendMap: Record<string, number> = {};
  let currentDate = new Date(startDate);
  const endLimit = new Date(endDate);
  while (currentDate <= endLimit) {
    revenueTrendMap[format(currentDate, 'yyyy-MM-dd')] = 0;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  orders?.forEach(o => {
    const dateKey = format(new Date(o.created_at), 'yyyy-MM-dd');
    if (dateKey in revenueTrendMap) {
      revenueTrendMap[dateKey] += o.total_amount || 0;
    }
  });

  const revenueTrend = Object.keys(revenueTrendMap).map(date => ({
    date,
    total: Math.round(revenueTrendMap[date])
  }));

  const { orders: perfOrders = [], orderItems: perfOrderItems = [] } = performanceData || {};
  const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  (perfOrderItems || []).forEach((item: any) => {
    const name = item.menu_items?.name || 'Unknown Item';
    const price = item.menu_items?.price || 0;
    if (!itemMap[name]) {
      itemMap[name] = { name, quantity: 0, revenue: 0 };
    }
    itemMap[name].quantity += item.quantity || 0;
    itemMap[name].revenue += (item.quantity || 0) * price;
  });

  const bestSellers = Object.values(itemMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const revenueByDayMap: Record<string, number> = {};
  daysOfWeek.forEach(d => { revenueByDayMap[d] = 0; });

  orders?.forEach(o => {
    const dayName = daysOfWeek[new Date(o.created_at).getDay()];
    revenueByDayMap[dayName] += o.total_amount || 0;
  });

  const revenueByDay = daysOfWeek.map(day => ({
    day,
    revenue: Math.round(revenueByDayMap[day])
  }));

  let newCustomerRevenue = 0;
  let returningCustomerRevenue = 0;

  orders?.forEach(o => {
    const customerData = Array.isArray(o.customers) ? o.customers[0] : (o.customers as any);
    const firstVisit = customerData?.first_visit;
    const isNew = firstVisit && format(new Date(firstVisit), 'yyyy-MM-dd') === format(new Date(o.created_at), 'yyyy-MM-dd');
    if (isNew) {
      newCustomerRevenue += o.total_amount || 0;
    } else {
      returningCustomerRevenue += o.total_amount || 0;
    }
  });

  let loved_it = 0;
  let okay = 0;
  let needs_improvement = 0;

  (reviewsStats ?? []).forEach((r: any) => {
    if (r.rating >= 4) loved_it++;
    else if (r.rating === 3) okay++;
    else needs_improvement++;
  });

  const staffMap = new Map<string, string>();
  staffMembers?.forEach(s => {
    staffMap.set(s.id, s.name);
  });

  const performanceMap: Record<string, { name: string; orders: number; revenue: number }> = {};
  orders?.forEach(o => {
    const creatorId = o.created_by;
    const creatorName = creatorId ? (staffMap.get(creatorId) || 'Owner/Deleted Staff') : 'Owner';
    const key = creatorId || 'owner';

    if (!performanceMap[key]) {
      performanceMap[key] = { name: creatorName, orders: 0, revenue: 0 };
    }
    performanceMap[key].orders += 1;
    performanceMap[key].revenue += o.total_amount || 0;
  });

  const staffPerformance = Object.values(performanceMap)
    .sort((a, b) => b.revenue - a.revenue);

  const initialData = {
    revenueTrend,
    bestSellers,
    revenueByDay,
    customerSplit: {
      new: Math.round(newCustomerRevenue),
      returning: Math.round(returningCustomerRevenue)
    },
    ratingBreakdown: {
      loved_it,
      okay,
      needs_improvement
    },
    topRegulars: (topRegulars || []).map(r => ({
      name: r.name,
      spend: Math.round(r.total_spend || 0),
      visits: r.visit_count || 0
    })),
    staffPerformance
  };

  return <AnalyticsClient initialData={initialData} />;
}
