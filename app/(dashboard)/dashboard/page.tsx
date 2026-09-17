/**
 * app/(dashboard)/dashboard/page.tsx
 *
 * Owner Dashboard — matches the Stitch "Modern Hospitality SaaS" design.
 * Uses realistic mock data; wire to Supabase queries once endpoints exist.
 *
 * Sections:
 *  1. Greeting header + quick-action buttons (New Order / Add Menu Item)
 *  2. Four KPI stat cards
 *  3. WhatsApp credit balance widget + Alerts / Action Required panel
 *  4. Recent Activity feed (table)
 */

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/ssr-server';
import { getActiveCafe } from '@/lib/active-cafe';
import { redirect } from 'next/navigation';

// ---------------------------------------------------------------------------
// Design tokens (from Stitch project 12728354932300995367)
// ---------------------------------------------------------------------------
const T = {
  primary: '#853423',
  primaryContainer: '#a44b38',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#ffddd6',
  secondary: '#576158',
  secondaryContainer: '#dbe5d9',
  onSecondaryContainer: '#5d675d',
  surface: '#fcf9f8',
  surfaceContainerLow: '#f6f3f2',
  surfaceContainerHigh: '#eae7e7',
  surfaceContainerHighest: '#e5e2e1',
  surfaceVariant: '#e5e2e1',
  onSurface: '#1c1b1b',
  onSurfaceVariant: '#55423e',
  outline: '#88726d',
  outlineVariant: '#dbc1bb',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
} as const;

// ---------------------------------------------------------------------------
// Helpers and Configuration
// ---------------------------------------------------------------------------
const planLimits: Record<string, number> = {
  free: 100,
  starter: 250,
  pro: 1000,
};

function formatRupees(amountInPaise: number): string {
  const rupees = amountInPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

// ---------------------------------------------------------------------------
// Helper: day greeting
// ---------------------------------------------------------------------------
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
function StatCard({
  icon, label, value, badge, badgeColor,
}: {
  icon: string;
  label: string;
  value: string | number;
  badge?: string;
  badgeColor?: 'positive' | 'negative';
}) {
  return (
    <div style={{
      background: T.surface,
      borderRadius: '12px',
      padding: '24px',
      border: `1px solid ${T.outlineVariant}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <span
          className="material-symbols-outlined"
          style={{
            padding: '8px',
            background: T.secondaryContainer,
            color: T.onSecondaryContainer,
            borderRadius: '8px',
            fontSize: '20px',
          }}
        >
          {icon}
        </span>
        {badge && (
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.03em',
            padding: '4px 8px',
            borderRadius: '9999px',
            background: badgeColor === 'negative' ? T.errorContainer : T.secondaryContainer,
            color: badgeColor === 'negative' ? T.onErrorContainer : T.onSecondaryContainer,
          }}>
            {badge}
          </span>
        )}
      </div>
      <p style={{ fontSize: '14px', fontWeight: 500, color: T.onSurfaceVariant, letterSpacing: '0.01em', marginBottom: '4px' }}>
        {label}
      </p>
      <p style={{ fontSize: '32px', fontWeight: 700, color: T.onSurface, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag badge in activity table
// ---------------------------------------------------------------------------
function Tag({ text, style }: { text: string; style: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    positive: { bg: T.secondaryContainer, color: T.onSecondaryContainer },
    neutral:  { bg: T.surfaceVariant,     color: T.onSurfaceVariant },
    negative: { bg: T.errorContainer,     color: T.onErrorContainer },
  };
  const s = styles[style] ?? styles.neutral;
  return (
    <span style={{
      padding: '4px 12px',
      background: s.bg,
      color: s.color,
      fontSize: '12px',
      fontWeight: 700,
      borderRadius: '9999px',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function DashboardPage() {
  const { cafe: activeCafe } = await getActiveCafe();
  if (!activeCafe) {
    redirect('/login');
  }

  const cafeId = activeCafe.id;
  const cafeName = activeCafe.name;
  const creditBalance = activeCafe.credit_balance;
  const rawPlan = activeCafe.plan;

  const supabase = await createSupabaseServerClient();

  // ---------------------------------------------------------------------------
  // Load Stats & Data from Supabase
  // ---------------------------------------------------------------------------
  const now = new Date();
  
  // Today's boundaries (local timezone start of day)
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = todayStart;

  // 1. Today's and Yesterday's orders for Revenue / Bills count
  const { data: todayOrders } = cafeId ? await supabase
    .from('orders')
    .select('total_amount')
    .eq('cafe_id', cafeId)
    .gte('created_at', todayStart.toISOString()) : { data: [] };

  const { data: yesterdayOrders } = cafeId ? await supabase
    .from('orders')
    .select('total_amount')
    .eq('cafe_id', cafeId)
    .gte('created_at', yesterdayStart.toISOString())
    .lt('created_at', yesterdayEnd.toISOString()) : { data: [] };

  const todayRevenue = (todayOrders || []).reduce((sum, o) => sum + o.total_amount, 0);
  const yesterdayRevenue = (yesterdayOrders || []).reduce((sum, o) => sum + o.total_amount, 0);

  let revenueDelta = '+0%';
  if (yesterdayRevenue > 0) {
    const pct = Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
    revenueDelta = `${pct >= 0 ? '+' : ''}${pct}%`;
  } else if (todayRevenue > 0) {
    revenueDelta = '+100%';
  }

  const billsSent = todayOrders ? todayOrders.length : 0;

  // 2. New customers today
  const { data: todayCustomers } = cafeId ? await supabase
    .from('customers')
    .select('id')
    .eq('cafe_id', cafeId)
    .gte('first_visit', todayStart.toISOString()) : { data: [] };
  const newCustomers = todayCustomers ? todayCustomers.length : 0;

  // 3. Avg Rating & counts
  const { data: cafeOrders } = cafeId ? await supabase
    .from('orders')
    .select('id')
    .eq('cafe_id', cafeId) : { data: [] };

  const orderIds = (cafeOrders || []).map(o => o.id);

  let avgRating = 'N/A';
  let negativeReviewsCount = 0;

  if (orderIds.length > 0) {
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: weekReviews } = await supabase
      .from('reviews')
      .select('rating')
      .in('order_id', orderIds)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (weekReviews && weekReviews.length > 0) {
      const sum = weekReviews.reduce((acc, r) => acc + r.rating, 0);
      avgRating = (sum / weekReviews.length).toFixed(1);
    }

    const { count } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .in('order_id', orderIds)
      .lte('rating', 2);
    negativeReviewsCount = count || 0;
  }

  // 4. Credits calculation
  const totalCredits = planLimits[rawPlan.toLowerCase()] || 100;
  const creditsUsed = Math.max(0, totalCredits - creditBalance);
  const planName = rawPlan === 'pro' ? 'Pro Plan' : rawPlan === 'starter' ? 'Starter Plan' : 'Free Plan';

  const stats = {
    revenue: formatRupees(todayRevenue),
    revenueDelta,
    billsSent,
    newCustomers,
    avgRating,
  };

  const credits = {
    used: creditsUsed,
    total: totalCredits,
    plan: planName,
  };

  // 5. Inactive customers (last visit > 30 days ago)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: inactiveCustomersCount } = cafeId ? await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('cafe_id', cafeId)
    .lte('last_visit', thirtyDaysAgo.toISOString()) : { count: 0 };

  const alerts = [];
  if (negativeReviewsCount > 0) {
    alerts.push({
      id: 1,
      text: `${negativeReviewsCount} negative review${negativeReviewsCount > 1 ? 's' : ''} haven't been responded to`,
      cta: 'Respond Now',
      href: '/reviews'
    });
  }
  if (inactiveCustomersCount && inactiveCustomersCount > 0) {
    alerts.push({
      id: 2,
      text: `${inactiveCustomersCount} customer${inactiveCustomersCount > 1 ? 's' : ''} haven't visited in 30+ days`,
      cta: 'View Customers',
      href: '/customers'
    });
  }

  // 6. Recent Activity
  const { data: recentOrders } = cafeId ? await supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      created_at,
      customer_phone,
      customers (
        name
      )
    `)
    .eq('cafe_id', cafeId)
    .order('created_at', { ascending: false })
    .limit(7) : { data: [] };

  let activity: {
    initials: string;
    name: string;
    bill: string;
    amount: string;
    time: string;
    tag: string;
    tagStyle: string;
  }[] = [];
  if (recentOrders && recentOrders.length > 0) {
    const recentOrderIds = recentOrders.map(o => o.id);
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('order_id, rating, feedback_text')
      .in('order_id', recentOrderIds);

    const reviewMap = new Map((recentReviews || []).map(r => [r.order_id, r]));

    activity = recentOrders.map(order => {
      const rawName = order.customers && (order.customers as any).name ? (order.customers as any).name : 'Guest';
      const initials = rawName
        .split(' ')
        .map((p: string) => p[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'G';
        
      const amountStr = formatRupees(order.total_amount);

      const timeStr = new Date(order.created_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const review = reviewMap.get(order.id);
      let tag = 'Awaiting reply';
      let tagStyle = 'neutral';

      if (review) {
        if (review.rating >= 4) {
          tag = 'Loved it!';
          tagStyle = 'positive';
        } else if (review.rating === 3) {
          tag = 'Okay';
          tagStyle = 'neutral';
        } else {
          tag = 'Critical';
          tagStyle = 'negative';
        }
      }

      return {
        initials,
        name: rawName,
        bill: `#${order.id.slice(-4)}`,
        amount: amountStr,
        time: timeStr,
        tag,
        tagStyle
      };
    });
  }

  const creditPct = (credits.used / credits.total) * 100;
  const greeting = getGreeting();
  const dateStr = formatDate();

  return (
    <>
      <style>{`
        .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; }
        .activity-row:hover { background: ${T.surfaceContainerLow} !important; }
        .nav-action-btn:hover { opacity: 0.88; }
        .alert-cta:hover { gap: 8px !important; }
        @keyframes bar-grow {
          from { width: 0%; }
          to   { width: ${creditPct.toFixed(1)}%; }
        }
        .credit-bar { animation: bar-grow 1s cubic-bezier(0.16,1,0.3,1) 0.4s both; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: T.onSurface, lineHeight: 1.3, marginBottom: '2px' }}>
            {greeting}, {cafeName}
          </h2>
          <p style={{ fontSize: '16px', color: T.onSurfaceVariant, fontWeight: 400 }}>
            {dateStr}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Add Menu Item */}
          <Link
            href="/menu"
            id="add-menu-item-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 20px',
              border: `1px solid ${T.outline}`,
              borderRadius: '12px',
              color: T.primary,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0.01em',
              textDecoration: 'none',
              background: 'transparent',
              transition: 'background 0.15s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Add Menu Item
          </Link>

          {/* New Order */}
          <Link
            href="/billing"
            id="new-order-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 20px',
              background: T.primary,
              borderRadius: '12px',
              color: T.onPrimary,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0.01em',
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              transition: 'opacity 0.15s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span>
            New Order
          </Link>

          {/* Icon buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
            {['notifications', 'calendar_today'].map(icon => (
              <button
                key={icon}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '40px', height: '40px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '9999px',
                  color: T.onSurfaceVariant,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                title={icon.replace(/_/g, ' ')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{icon}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── KPI Stat Cards ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <StatCard
          icon="payments"
          label="Today's Revenue"
          value={stats.revenue}
          badge={stats.revenueDelta}
          badgeColor={stats.revenueDelta.startsWith('-') ? 'negative' : 'positive'}
        />
        <StatCard
          icon="receipt_long"
          label="Bills Sent Today"
          value={stats.billsSent}
        />
        <StatCard
          icon="person_add"
          label="New Customers Today"
          value={stats.newCustomers}
        />
        <StatCard
          icon="star"
          label="Avg Rating This Week"
          value={stats.avgRating}
        />
      </div>

      {/* ── Bento Row: Credits + Alerts ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

        {/* WhatsApp Credits Widget */}
        <div style={{
          background: T.primary,
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(133,52,35,0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circle */}
          <div style={{
            position: 'absolute', right: '-40px', bottom: '-40px',
            width: '128px', height: '128px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '9999px',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,221,214,0.8)', letterSpacing: '0.03em', marginBottom: '4px' }}>
                Current Plan
              </p>
              <p style={{ fontSize: '20px', fontWeight: 600, color: T.onPrimary, lineHeight: 1.4 }}>
                {credits.plan}
              </p>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: '30px', color: 'rgba(255,255,255,0.5)' }}>
              chat_bubble
            </span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: T.onPrimary, letterSpacing: '0.01em' }}>
                WhatsApp Credits
              </p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: T.onPrimary }}>
                {credits.used} / {credits.total}
              </p>
            </div>
            <div style={{
              width: '100%', height: '8px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}>
              <div
                className="credit-bar"
                style={{
                  height: '100%',
                  background: T.onPrimary,
                  borderRadius: '9999px',
                  width: `${creditPct.toFixed(1)}%`,
                }}
              />
            </div>
          </div>

          <Link
            href="/settings"
            id="top-up-credits-btn"
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              background: T.onPrimary,
              color: T.primary,
              borderRadius: '12px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              textAlign: 'center',
              textDecoration: 'none',
              transition: 'background 0.15s ease',
            }}
          >
            Top Up Credits
          </Link>
        </div>

        {/* Action Required / Alerts Panel */}
        <div style={{
          background: T.surface,
          borderRadius: '12px',
          border: `1px solid ${T.outlineVariant}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: '24px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <h3 style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '20px', fontWeight: 600, color: T.onSurface, lineHeight: 1.4,
            marginBottom: '24px',
          }}>
            <span className="material-symbols-outlined" style={{ color: T.primary, fontSize: '22px' }}>priority_high</span>
            Action Required
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.length === 0 ? (
              <div style={{
                padding: '16px',
                background: T.surfaceContainerLow,
                borderRadius: '8px',
                textAlign: 'center',
                color: T.onSurfaceVariant,
                fontSize: '14px',
                fontStyle: 'italic'
              }}>
                All caught up! No actions required today.
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  style={{
                    padding: '16px',
                    background: T.surfaceContainerLow,
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <p style={{ fontSize: '14px', fontWeight: 500, color: T.onSurface, letterSpacing: '0.01em', lineHeight: 1.4 }}>
                    {alert.text}
                  </p>
                  <Link
                    href={alert.href}
                    className="alert-cta"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: T.primary,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'gap 0.15s ease',
                    }}
                  >
                    {alert.cta}
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Activity ──────────────────────────────────────────── */}
      <div style={{
        background: T.surface,
        borderRadius: '12px',
        border: `1px solid ${T.outlineVariant}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        {/* Table header row */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${T.outlineVariant}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: T.onSurface, lineHeight: 1.4 }}>
            Recent Activity
          </h3>
          <Link
            href="/billing"
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: T.primary,
              letterSpacing: '0.01em',
              textDecoration: 'none',
            }}
          >
            View All
          </Link>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
              <tr>
                <th>Customer</th>
                <th>Amount</th>
                <th>Time</th>
                <th>Tag</th>
              </tr>
            </thead>
            <tbody>
              {activity.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: T.onSurfaceVariant, fontSize: '14px', fontStyle: 'italic' }}>
                    No recent orders.
                  </td>
                </tr>
              ) : (
                activity.map((row, i) => (
                  <tr
                    key={row.bill}
                    className="activity-row"
                    style={{
                      borderTop: i > 0 ? `1px solid ${T.surfaceContainerLow}` : 'none',
                      transition: 'background 0.15s ease',
                      background: 'transparent',
                      cursor: 'default',
                    }}
                  >
                    {/* Customer */}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px',
                          borderRadius: '9999px',
                          background: T.surfaceContainerHighest,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: T.primary,
                          flexShrink: 0,
                        }}>
                          {row.initials}
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: T.onSurface, letterSpacing: '0.01em' }}>
                            {row.name}
                          </p>
                          <p style={{ fontSize: '12px', color: T.onSurfaceVariant, marginTop: '1px' }}>
                            Bill {row.bill}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 700, color: T.onSurface, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                      {row.amount}
                    </td>

                    {/* Time */}
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: T.onSurfaceVariant, whiteSpace: 'nowrap' }}>
                      {row.time}
                    </td>

                    {/* Tag */}
                    <td style={{ padding: '16px 24px' }}>
                      <Tag text={row.tag} style={row.tagStyle} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
