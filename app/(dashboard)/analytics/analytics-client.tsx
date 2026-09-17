'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, Cell,
  PieChart, Pie,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ---------------------------------------------------------------------------
// Design tokens (Stitch project)
// ---------------------------------------------------------------------------
const T = {
  primary: '#853423',
  primaryContainer: '#a44b38',
  onPrimary: '#ffffff',
  secondary: '#576158',
  surface: '#fcf9f8',
  surfaceContainerLow: '#f6f3f2',
  surfaceContainerHighest: '#e5e2e1',
  surfaceVariant: '#e5e2e1',
  onSurface: '#1c1b1b',
  onSurfaceVariant: '#55423e',
  outlineVariant: '#dbc1bb',
  success: '#059669', // Green for positive trends
} as const;

export default function AnalyticsClient() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'30' | '90' | '180'>('30');

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      try {
        const days = period === '30' ? 30 : period === '90' ? 90 : 180;
        const start = new Date();
        start.setDate(start.getDate() - days);
        const startStr = start.toISOString().split('T')[0];
        const endStr = new Date().toISOString().split('T')[0];
        
        const res = await fetch(`/api/analytics?start_date=${startStr}&end_date=${endStr}`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, [period]);

  const formatCurrency = (val: number) => `₹${(val / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  // ─────────────────────────────────────────────────────────────────────────
  // Data Mapping for UI
  // ─────────────────────────────────────────────────────────────────────────

  // A. Revenue Trend Line Chart
  const revenueTrendData = data?.revenueTrend?.map((d: any) => ({
    day: d.date.split('-')[2], // just the day number
    revenue: d.total
  })) || [];

  const totalPeriodRevenue = data?.revenueTrend?.reduce((acc: number, d: any) => acc + d.total, 0) || 0;

  // B. Customer Mix Donut Chart
  const totalCustomerSpend = (data?.customerSplit?.new || 0) + (data?.customerSplit?.returning || 0);
  const newShare = totalCustomerSpend > 0 ? Math.round((data.customerSplit.new / totalCustomerSpend) * 100) : 0;
  const returningShare = totalCustomerSpend > 0 ? Math.round((data.customerSplit.returning / totalCustomerSpend) * 100) : 0;

  const customerMixData = [
    { name: 'Returning', value: returningShare, count: data?.customerSplit?.returning || 0 },
    { name: 'New', value: newShare, count: data?.customerSplit?.new || 0 },
  ];
  const MIX_COLORS = [T.primary, '#4b5563'];

  // C. Best Sellers
  const maxBestSellerQuantity = data?.bestSellers?.length > 0
    ? Math.max(...data.bestSellers.map((x: any) => x.quantity))
    : 10;

  const bestSellers = data?.bestSellers?.map((item: any, idx: number) => ({
    id: idx + 1,
    name: item.name,
    sales: item.quantity,
    max: maxBestSellerQuantity || 10
  })) || [];

  // D. Revenue by Day of Week Bar Chart
  const revenueByDay = data?.revenueByDay?.map((d: any) => ({
    day: d.day,
    amount: d.revenue
  })) || [];

  // E. Review Rating Breakdown
  const lovedIt = data?.ratingBreakdown?.loved_it || 0;
  const okay = data?.ratingBreakdown?.okay || 0;
  const needsWork = data?.ratingBreakdown?.needs_improvement || 0;
  const totalReviews = lovedIt + okay + needsWork;
  
  const averageRating = totalReviews > 0
    ? ((lovedIt * 5 + okay * 3 + needsWork * 1) / totalReviews).toFixed(1)
    : '0.0';

  const ratingRows = [
    { stars: 5, pct: totalReviews > 0 ? Math.round((lovedIt / totalReviews) * 100) : 0 },
    { stars: 3, pct: totalReviews > 0 ? Math.round((okay / totalReviews) * 100) : 0 },
    { stars: 1, pct: totalReviews > 0 ? Math.round((needsWork / totalReviews) * 100) : 0 }
  ];

  // F. Top Regulars Table
  const topRegulars = data?.topRegulars?.map((customer: any, idx: number) => ({
    id: idx + 1,
    initials: customer.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'RG',
    name: customer.name,
    visits: customer.visits,
    spend: customer.spend
  })) || [];

  // G. Staff Performance Table
  const staffPerformance = data?.staffPerformance || [];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: T.onSurfaceVariant }}>
        <p style={{ fontSize: '16px', fontWeight: 500 }}>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0px 0px 40px 0px' }}>
      <style>{`
        .panel {
          background: #ffffff;
          border: 1px solid ${T.outlineVariant};
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .panel-title {
          font-size: 18px;
          font-weight: 700;
          color: ${T.onSurface};
        }
      `}</style>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: 700, color: T.onSurface, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '8px' }}>
            Analytics Overview
          </h2>
          <p style={{ fontSize: '15px', color: T.onSurfaceVariant }}>
            Track sales performance, customer trends, and popular menu items.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value as any)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: `1px solid ${T.outlineVariant}`,
              background: T.surface, color: T.onSurface, fontSize: '14px', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 180 Days</option>
          </select>
        </div>
      </header>

      {/* Row 1: Revenue Trend (2/3) + Customer Mix (1/3) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Revenue Trend */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h3 className="panel-title" style={{ marginBottom: '4px' }}>Revenue Trend</h3>
              <p style={{ fontSize: '14px', color: T.onSurfaceVariant }}>Growth trajectory for the current period</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '24px', fontWeight: 700, color: T.primary }}>{formatCurrency(totalPeriodRevenue)}</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: T.success, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>trending_up</span>
                Live
              </p>
            </div>
          </div>
          
          <div style={{ flex: 1, minHeight: '300px', width: '100%', marginLeft: '-20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: `1px solid ${T.outlineVariant}`, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke={T.primary} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: T.primary, stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Mix */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="panel-title" style={{ marginBottom: '24px' }}>Customer Mix</h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            
            {/* Donut Chart */}
            <div style={{ height: '220px', width: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerMixData}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {customerMixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MIX_COLORS[index % MIX_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: `1px solid ${T.outlineVariant}` }}
                    formatter={(value: any) => [`${value}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Text */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: T.onSurface, lineHeight: 1.1 }}>{returningShare}%</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Returning</span>
              </div>
            </div>
            
            {/* Custom Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '24px' }}>
              {customerMixData.map((item, i) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: MIX_COLORS[i] }} />
                    <span style={{ fontSize: '14px', color: T.onSurfaceVariant }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: T.onSurface }}>{formatCurrency(item.count)}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* Row 2: Best Sellers (1/3) + Revenue by Day (1/3) + Review Breakdown (1/3) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
        
        {/* Best Sellers */}
        <div className="panel" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', paddingBottom: '16px' }}>
            <h3 className="panel-title" style={{ margin: 0 }}>Best Sellers</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px 24px 24px', gap: '20px', flex: 1, justifyContent: 'center' }}>
            {bestSellers.length === 0 ? (
              <p style={{ textAlign: 'center', color: T.onSurfaceVariant, fontStyle: 'italic', fontSize: '13px' }}>No items sold in this period.</p>
            ) : (
              bestSellers.map((item: any) => (
                <div key={item.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: T.onSurfaceVariant, fontWeight: 500 }}>{item.name}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: T.primary }}>{item.sales} sold</span>
                  </div>
                  <div style={{ height: '6px', background: T.surfaceVariant, borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(item.sales / item.max) * 100}%`, background: T.primary, borderRadius: '9999px' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Revenue by Day */}
        <div className="panel">
          <h3 className="panel-title" style={{ marginBottom: '24px' }}>Revenue by Day</h3>
          <div style={{ height: '240px', width: '100%', marginLeft: '-20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByDay} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.outlineVariant} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: T.onSurfaceVariant }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: T.onSurfaceVariant }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: T.surfaceContainerLow }}
                  contentStyle={{ borderRadius: '8px', border: `1px solid ${T.outlineVariant}` }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                />
                <Bar dataKey="amount" fill="#4b5563" radius={[2, 2, 0, 0]} barSize={16}>
                  {revenueByDay.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4b5563' : T.primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Review Breakdown */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="panel-title" style={{ marginBottom: '24px' }}>Review Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '48px', fontWeight: 800, color: T.onSurface, lineHeight: 1 }}>{averageRating}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map(i => {
                    const starsNum = parseFloat(averageRating);
                    return (
                      <span key={i} className="material-symbols-outlined" style={{ fontSize: '20px', color: T.primary, fontVariationSettings: i <= starsNum ? "'FILL' 1" : "'FILL' 0" }}>
                        {i <= starsNum ? 'star' : i - 0.5 <= starsNum ? 'star_half' : 'star'}
                      </span>
                    );
                  })}
                </div>
                <span style={{ fontSize: '12px', color: T.onSurfaceVariant }}>Based on {totalReviews} reviews</span>
              </div>
            </div>
            
            {/* Breakdown bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              {ratingRows.map(row => (
                <div key={row.stars} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: T.onSurfaceVariant, width: '12px' }}>{row.stars}</span>
                  <div style={{ flex: 1, height: '8px', background: T.surfaceVariant, borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${row.pct}%`, background: T.primary, borderRadius: '9999px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Top Regulars Table */}
      <div className="panel" style={{ padding: '0' }}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${T.outlineVariant}` }}>
          <h3 className="panel-title" style={{ margin: 0 }}>Top Regulars</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: T.surfaceContainerLow, borderBottom: `1px solid ${T.outlineVariant}` }}>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Visits</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Spend</th>
              </tr>
            </thead>
            <tbody>
              {topRegulars.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: T.onSurfaceVariant, fontStyle: 'italic' }}>
                    No customer history recorded.
                  </td>
                </tr>
              ) : (
                topRegulars.map((customer: any, i: number) => (
                  <tr key={customer.id} style={{ borderBottom: i < topRegulars.length - 1 ? `1px solid ${T.surfaceVariant}` : 'none' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: '#f5ebe9', color: T.primary,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 700
                        }}>
                          {customer.initials}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: T.onSurface }}>{customer.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500, color: T.onSurfaceVariant }}>
                      {customer.visits} visits
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 700, color: T.onSurface }}>
                      {formatCurrency(customer.spend)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Row 4: Staff Performance Table */}
      <div className="panel" style={{ padding: '0', marginTop: '32px' }}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${T.outlineVariant}` }}>
          <h3 className="panel-title" style={{ margin: 0 }}>Staff Performance</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: T.surfaceContainerLow, borderBottom: `1px solid ${T.outlineVariant}` }}>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Member</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders Completed</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: T.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {staffPerformance.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: T.onSurfaceVariant, fontStyle: 'italic' }}>
                    No staff sales performance recorded in this range.
                  </td>
                </tr>
              ) : (
                staffPerformance.map((member: any, i: number) => (
                  <tr key={i} style={{ borderBottom: i < staffPerformance.length - 1 ? `1px solid ${T.surfaceVariant}` : 'none' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: T.onSurface }}>{member.name}</span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500, color: T.onSurfaceVariant }}>
                      {member.orders} order{member.orders !== 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 700, color: T.onSurface }}>
                      {formatCurrency(member.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
