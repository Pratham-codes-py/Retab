import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { subDays, format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { getActiveCafe } from '@/lib/active-cafe';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve active cafe
    const { cafe, isOwner } = await getActiveCafe();

    if (!cafe || !isOwner) {
      return NextResponse.json({ error: 'Cafe not found or unauthorized' }, { status: 404 });
    }


    // Parse date query params
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

    const today = new Date();
    const defaultStartDate = subDays(today, 30);

    const startDate = startDateParam ? startOfDay(parseISO(startDateParam)).toISOString() : startOfDay(defaultStartDate).toISOString();
    const endDate = endDateParam ? endOfDay(parseISO(endDateParam)).toISOString() : endOfDay(today).toISOString();

    const serviceRoleSupabase = createServiceRoleClient();

    // 1. Fetch Orders for Revenue Trend, Day of Week, and Customer Split
    const { data: orders, error: ordersError } = await serviceRoleSupabase
      .from('orders')
      .select('created_at, total_amount, customer_id, created_by, customers(first_visit)')
      .eq('cafe_id', cafe.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Fetch staff members to map user_id -> name for staff performance
    const { data: staffMembers } = await serviceRoleSupabase
      .from('users')
      .select('id, name')
      .eq('cafe_id', cafe.id)
      .in('role', ['manager', 'staff']);

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    // 2. Fetch Order Items for Best-selling Items
    const { data: orderItems, error: itemsError } = await serviceRoleSupabase
      .from('order_items')
      .select('quantity, price, menu_items!inner(name, cafe_id), orders!inner(created_at, cafe_id)')
      .eq('orders.cafe_id', cafe.id)
      .gte('orders.created_at', startDate)
      .lte('orders.created_at', endDate);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // 3. Fetch Reviews for Rating Breakdown
    const { data: reviews, error: reviewsError } = await serviceRoleSupabase
      .from('reviews')
      .select('rating, orders!inner(cafe_id, created_at)')
      .eq('orders.cafe_id', cafe.id)
      .gte('orders.created_at', startDate)
      .lte('orders.created_at', endDate);

    if (reviewsError) {
      return NextResponse.json({ error: reviewsError.message }, { status: 500 });
    }

    // 4. Fetch Top Regulars
    const { data: topRegulars, error: regularsError } = await serviceRoleSupabase
      .from('customers')
      .select('id, name, total_spend, visit_count')
      .eq('cafe_id', cafe.id)
      .order('total_spend', { ascending: false })
      .limit(5);

    if (regularsError) {
      return NextResponse.json({ error: regularsError.message }, { status: 500 });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Processing Aggregations in Javascript
    // ─────────────────────────────────────────────────────────────────────────

    // A. Revenue Trend (Daily Totals)
    const revenueTrendMap: Record<string, number> = {};
    // Populate all dates in the range with 0 initially to avoid gaps
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

    // B. Best-selling Items
    const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orderItems?.forEach((item: any) => {
      const name = item.menu_items?.name || 'Unknown Item';
      if (!itemMap[name]) {
        itemMap[name] = { name, quantity: 0, revenue: 0 };
      }
      itemMap[name].quantity += item.quantity || 0;
      itemMap[name].revenue += (item.quantity || 0) * (item.price || 0);
    });

    const bestSellers = Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // C. Revenue by Day of Week
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

    // D. New vs Returning Customer Split
    let newCustomerRevenue = 0;
    let returningCustomerRevenue = 0;

    orders?.forEach(o => {
      // If customer was created on the same day as the order, they are "new"
      const customerData = Array.isArray(o.customers) ? o.customers[0] : (o.customers as any);
      const firstVisit = customerData?.first_visit;
      const isNew = firstVisit && format(new Date(firstVisit), 'yyyy-MM-dd') === format(new Date(o.created_at), 'yyyy-MM-dd');
      if (isNew) {
        newCustomerRevenue += o.total_amount || 0;
      } else {
        returningCustomerRevenue += o.total_amount || 0;
      }
    });

    // E. Review Rating Breakdown
    let loved_it = 0;
    let okay = 0;
    let needs_improvement = 0;

    reviews?.forEach(r => {
      if (r.rating >= 4) loved_it++;
      else if (r.rating === 3) okay++;
      else needs_improvement++;
    });

    // F. Staff Performance Calculation
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

    return NextResponse.json({
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
    });
  } catch (err) {
    console.error('[analytics/GET] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
