'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Design tokens matching Stitch project
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
  success: '#15803d',
  successContainer: '#dcfce7',
  warning: '#b45309',
  warningContainer: '#fef3c7',
} as const;

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'critical'>('all');

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const ratingParam = filter !== 'all' ? `?rating=${filter}` : '';
      const res = await fetch(`/api/reviews${ratingParam}`);
      const data = await res.json();
      if (data.reviews) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_resolved: true })
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, is_resolved: true } : r));
      } else {
        alert('Failed to resolve review: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error resolving review:', err);
    }
  };

  const getBadgeStyle = (style: string) => {
    if (style === 'negative') return { bg: T.primary, color: '#ffffff' };
    if (style === 'positive') return { bg: '#d1fae5', color: '#059669' };
    if (style === 'neutral') return { bg: '#fef3c7', color: '#d97706' };
    return { bg: T.surfaceVariant, color: T.onSurfaceVariant };
  };

  // Compute stats dynamically from the fetched reviews list
  const totalFeedback = reviews.length;
  
  const averageRating = totalFeedback > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalFeedback).toFixed(1)
    : '0.0';
    
  const positiveCount = reviews.filter(r => r.rating >= 4).length;
  const neutralCount = reviews.filter(r => r.rating === 3).length;
  const criticalCount = reviews.filter(r => r.rating <= 2).length;
  
  const sentimentScore = totalFeedback > 0
    ? Math.round((positiveCount / totalFeedback) * 100)
    : 0;

  // Sentiment Trends over last 7 days (grouped dynamically by day of week)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const trendsMap: Record<string, { positive: number; neutral: number; negative: number; total: number }> = {};
  
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = daysOfWeek[d.getDay()];
    trendsMap[dayName] = { positive: 0, neutral: 0, negative: 0, total: 0 };
  }
  
  reviews.forEach(r => {
    const d = new Date(r.created_at);
    const diffTime = Math.abs(new Date().getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      const dayName = daysOfWeek[d.getDay()];
      if (trendsMap[dayName]) {
        trendsMap[dayName].total++;
        if (r.rating >= 4) trendsMap[dayName].positive++;
        else if (r.rating === 3) trendsMap[dayName].neutral++;
        else trendsMap[dayName].negative++;
      }
    }
  });

  const trends = Object.keys(trendsMap).map(day => {
    const t = trendsMap[day];
    const total = t.total || 1; // avoid divide by zero
    return {
      day,
      positive: Math.round((t.positive / total) * 100),
      neutral: Math.round((t.neutral / total) * 100),
      negative: Math.round((t.negative / total) * 100),
    };
  });

  // Map backend reviews to existing UI representation
  const uiReviews = reviews.map(r => {
    const customerName = r.customer?.name || 'Anonymous Guest';
    const initials = customerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'AG';
    const table = r.orders?.table_number ? `Table ${r.orders.table_number}` : 'Takeaway';
    const source = r.orders?.source ? `via ${r.orders.source}` : 'via WhatsApp';
    
    const dateStr = new Date(r.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const subtext = `${table} • ${dateStr} ${source}`;
    
    let badge = 'OKAY';
    let badgeStyle = 'neutral';
    if (r.rating >= 4) {
      badge = 'LOVED IT';
      badgeStyle = 'positive';
    } else if (r.rating <= 2) {
      badge = 'NEEDS IMPROVEMENT';
      badgeStyle = 'negative';
    }
    
    const actionType = r.is_resolved ? 'message_guest' : 'reply_now';
    
    const highlightBg = !r.is_resolved && r.rating <= 2 ? '#fffaf8' : '#ffffff';
    const highlightBorder = !r.is_resolved && r.rating <= 2 ? '#f2d5d1' : T.outlineVariant;

    return {
      id: r.id,
      initials,
      customerName,
      subtext,
      badge,
      badgeStyle,
      feedbackText: r.feedback_text,
      isResolved: r.is_resolved,
      actionType,
      highlightBg,
      highlightBorder,
      stars: r.rating
    };
  });

  return (
    <div style={{ padding: '0px 0px 40px 0px' }}>
      <style>{`
        .btn-outline {
          border: 1px solid ${T.outlineVariant};
          background: ${T.surface};
          color: ${T.onSurface};
        }
        .btn-outline:hover { background: ${T.surfaceContainerLow}; border-color: ${T.outline}; }
        .btn-solid {
          background: ${T.primary};
          color: ${T.onPrimary};
          border: 1px solid ${T.primary};
        }
        .btn-solid:hover { opacity: 0.9; }
        
        .stat-card {
          background: ${T.surface};
          border: 1px solid ${T.outlineVariant};
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 180px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .icon-box {
          width: 40px; height: 40px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
        }

        .dark-grey-btn {
          background: #4b5563;
          color: #ffffff;
          border: none;
        }
        .dark-grey-btn:hover { background: #374151; }
      `}</style>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '15px', color: T.onSurfaceVariant, marginBottom: '24px' }}>
            Monitoring real-time feedback from WhatsApp flows.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(['all', 'positive', 'neutral', 'critical'] as const).map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? "btn-solid" : "btn-outline"}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            >
              {f === 'all' ? 'All Reviews' : f === 'positive' ? 'Loved It' : f === 'neutral' ? 'Okay' : 'Needs Work'}
            </button>
          ))}
          <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>picture_as_pdf</span>
            Export PDF
          </button>
        </div>
      </header>

      {/* Top Row: 3 Stats + 1 Action Required */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        
        {/* Stat 1: Average Rating */}
        <div className="stat-card">
          <div>
            <div className="icon-box" style={{ background: '#ffe4e1', color: T.primary }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>star</span>
            </div>
            <p style={{ fontSize: '14px', color: T.onSurfaceVariant, fontWeight: 500 }}>Average Rating</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: T.onSurface, lineHeight: 1 }}>{averageRating}</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: T.success }}>Live</span>
          </div>
        </div>

        {/* Stat 2: Total Feedback */}
        <div className="stat-card">
          <div>
            <div className="icon-box" style={{ background: '#e0f2f1', color: '#00695c' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>forum</span>
            </div>
            <p style={{ fontSize: '14px', color: T.onSurfaceVariant, fontWeight: 500 }}>Total Feedback</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: T.onSurface, lineHeight: 1 }}>{totalFeedback}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: T.onSurfaceVariant }}>Reviews</span>
          </div>
        </div>

        {/* Stat 3: Sentiment Score */}
        <div className="stat-card">
          <div>
            <div className="icon-box" style={{ background: '#fff3e0', color: '#e65100' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>sentiment_satisfied</span>
            </div>
            <p style={{ fontSize: '14px', color: T.onSurfaceVariant, fontWeight: 500 }}>Sentiment Score</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: T.onSurface, lineHeight: 1 }}>{sentimentScore}%</span>
            <div style={{ flex: 1, height: '6px', background: T.surfaceVariant, borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: `${sentimentScore}%`, height: '100%', background: T.primary, borderRadius: '9999px' }} />
            </div>
          </div>
        </div>

        {/* Action Required Panel */}
        <div style={{
          background: '#fff5f5',
          border: '1px solid #fed7d7',
          borderRadius: '12px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '180px'
        }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute', right: '-10px', bottom: '-10px',
            fontSize: '120px', color: '#fed7d7', opacity: 0.5, zIndex: 0,
            fontWeight: 800
          }}>
            warning
          </span>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800, color: '#c53030', marginBottom: '16px', letterSpacing: '0.05em' }}>
              <span style={{ fontSize: '16px', fontWeight: 900 }}>!</span> ACTION REQUIRED
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {criticalCount > 0 ? (
                <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#c53030', marginBottom: '2px' }}>{criticalCount} Critical Issue{criticalCount > 1 ? 's' : ''}</p>
                  <p style={{ fontSize: '11px', color: T.onSurfaceVariant }}>Requires resolution or guest follow-up.</p>
                </div>
              ) : (
                <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a', marginBottom: '2px' }}>0 Critical Issues</p>
                  <p style={{ fontSize: '11px', color: T.onSurfaceVariant }}>All negative feedback is resolved.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Trends & Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '32px' }}>
        
        {/* Sentiment Trends Chart */}
        <div style={{
          background: T.surface, border: `1px solid ${T.outlineVariant}`, borderRadius: '12px', padding: '24px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: T.onSurface }}>Sentiment Trends</h3>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '4px', background: T.surfaceContainerLow,
              border: `1px solid ${T.outlineVariant}`, padding: '4px 12px', borderRadius: '6px', fontSize: '13px', color: T.onSurfaceVariant, cursor: 'pointer'
            }}>
              Last 7 Days
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>expand_more</span>
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', gap: '16px', marginTop: '16px' }}>
            {trends.map((t) => (
              <div key={t.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1, height: '100%' }}>
                <div style={{ width: '100%', maxWidth: '40px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: `${t.positive}%`, background: '#f5ebe9', width: '100%' }} />
                  <div style={{ height: `${t.neutral}%`, background: '#d6b7b1', width: '100%' }} />
                  <div style={{ height: `${t.negative}%`, background: T.primary, width: '100%' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: T.onSurfaceVariant }}>{t.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div style={{
          background: T.surface, border: `1px solid ${T.outlineVariant}`, borderRadius: '12px', padding: '24px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: T.onSurface, marginBottom: '24px' }}>Categories</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '14px', color: T.onSurfaceVariant, fontWeight: 500 }}>Loved it</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: T.onSurface }}>{positiveCount}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontSize: '14px', color: T.onSurfaceVariant, fontWeight: 500 }}>Okay</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: T.onSurface }}>{neutralCount}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: T.primary }} />
                <span style={{ fontSize: '14px', color: T.onSurfaceVariant, fontWeight: 500 }}>Needs Work</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: T.onSurface }}>{criticalCount}</span>
            </div>
          </div>

          <div style={{
            background: T.surfaceContainerHighest,
            borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px', marginTop: '24px'
          }}>
            <span className="material-symbols-outlined" style={{ color: T.onSurfaceVariant }}>rocket_launch</span>
            <p style={{ fontSize: '12px', color: T.onSurfaceVariant, lineHeight: 1.4 }}>
              <strong>AI Tip:</strong> Most 'Needs Work' ratings cite wait times. Try optimizing kitchen tickets.
            </p>
          </div>
        </div>
      </div>

      {/* Live Feedback Stream */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: T.onSurface, marginBottom: '20px' }}>
          Live Feedback Stream
        </h3>

        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: T.onSurfaceVariant }}>
            Loading reviews...
          </div>
        ) : uiReviews.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: T.onSurfaceVariant, fontStyle: 'italic' }}>
            No reviews match the selected filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {uiReviews.map((r) => {
              const badgeTheme = getBadgeStyle(r.badgeStyle);

              return (
                <div key={r.id} style={{
                  background: r.highlightBg, 
                  border: `1px solid ${r.highlightBorder}`, 
                  borderRadius: '12px', 
                  padding: '24px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    
                    {/* Avatar & Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%', background: '#f5ebe9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '15px', fontWeight: 700, color: T.primary
                      }}>
                        {r.initials}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: T.onSurface, marginBottom: '2px' }}>{r.customerName}</h4>
                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>{r.subtext}</p>
                      </div>
                    </div>

                    {/* Actions & Badges */}
                    <div style={{ display: 'flex', gap: '20px' }}>
                      
                      {/* Badge */}
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                         <span style={{
                          padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em',
                          background: badgeTheme.bg, color: badgeTheme.color,
                          marginTop: '4px'
                        }}>
                          {r.badge}
                        </span>
                      </div>

                      {/* Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        
                        {r.actionType === 'reply_now' && (
                          <>
                            <button className="btn-solid" style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '160px'
                            }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>undo</span>
                              Reply Now <span style={{ opacity: 0.7, fontWeight: 400, fontSize: '11px' }}>(Free)</span>
                            </button>
                            <button className="btn-outline" onClick={() => handleResolve(r.id)} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '160px',
                              background: '#ffffff'
                            }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                              Mark Resolved
                            </button>
                          </>
                        )}

                        {r.actionType === 'message_guest' && (
                          <button className="dark-grey-btn" style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '160px'
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span>
                            Message Guest
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Feedback Text */}
                  <div style={{ marginTop: '8px', marginLeft: '60px', maxWidth: '75%' }}>
                     {r.feedbackText ? (
                       <p style={{ fontSize: '14px', color: T.onSurfaceVariant, fontStyle: 'italic', lineHeight: 1.6 }}>
                         "{r.feedbackText}"
                       </p>
                     ) : (
                       <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                         {[...Array(r.stars)].map((_, i) => (
                           <span key={i} className="material-symbols-outlined" style={{ fontSize: '20px', color: '#fbbf24' }}>star</span>
                         ))}
                       </div>
                     )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
