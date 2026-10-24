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
export default function ReviewsClient({ initialReviews, error }: { initialReviews?: any[]; error?: string }) {
  const [reviews, setReviews] = useState<any[]>(initialReviews || []);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'critical'>('all');

  useEffect(() => {
    if (!initialReviews) return;
    async function fetchReviews() {
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
    }
    fetchReviews();
  }, [filter]);

  const handleToggleResolved = async (id: string, currentState: boolean) => {
    const newState = !currentState;
    // Optimistic update
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_resolved: newState } : r));
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_resolved: newState })
      });
      if (!res.ok) {
        const data = await res.json();
        console.error('Failed to toggle resolved:', data.error);
        // Revert on failure
        setReviews(prev => prev.map(r => r.id === id ? { ...r, is_resolved: currentState } : r));
      }
    } catch (err) {
      console.error('Error toggling resolved:', err);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_resolved: currentState } : r));
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

  const googleLinksSent = reviews.filter(r => r.rating >= 4 || r.rating_label === 'loved_it').length;

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

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const handleSendReply = async (reviewId: string, customerPhone: string) => {
    if (!replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      const response = await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, message: replyMessage })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setReviews(prev => prev.map(r =>
          r.id === reviewId
            ? { ...r, is_resolved: true }
            : r
        ));
        setReplyMessage('');
        setReplyingTo(null);
        console.log('Reply sent successfully:', data);
      } else {
        const errorData = await response.json();
        console.error('Failed to send reply:', errorData.error);
        alert(`Failed to send reply: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Map backend reviews to existing UI representation
  const uiReviews = reviews.map(r => {
    const customerName = r.customer?.name || 'Anonymous Guest';
    const initials = customerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'AG';

    const dateStr = new Date(r.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    const subtext = `Placed ${dateStr}`;

    let badge = 'IT WAS OKAY';
    let badgeStyle = 'neutral';
    if (r.rating >= 4) {
      badge = 'AMAZING!';
      badgeStyle = 'positive';
    } else if (r.rating <= 2) {
      badge = 'COULD BE BETTER';
      badgeStyle = 'negative';
    }

    const actionType = r.is_resolved ? 'message_guest' : 'reply_now';

    const highlightBg = !r.is_resolved && r.rating <= 2 ? '#fffaf8' : '#ffffff';
    const highlightBorder = !r.is_resolved && r.rating <= 2 ? '#f2d5d1' : T.outlineVariant;

    const customerPhone = r.customer_phone || r.customer?.phone || '';
    const label = r.rating_label || (r.rating >= 4 ? 'loved_it' : r.rating === 3 ? 'okay' : 'needs_improvement');

    return {
      id: r.id,
      initials,
      customerName,
      customerPhone,
      subtext,
      badge,
      badgeStyle,
      feedbackText: r.feedback_text || '',
      ratingLabel: label,
      isPrivate: r.is_private,
      awaitingFeedback: r.awaiting_feedback,
      isResolved: r.is_resolved,
      actionType,
      highlightBg,
      highlightBorder,
      stars: r.rating
    };
  });

  return (
    <div style={{ padding: '0px 0px 40px 0px' }}>
      {error && (
        <div style={{ padding: '12px 16px', background: '#fff0f0', border: '1px solid #ba1a1a', borderRadius: '8px', marginBottom: '16px', color: '#93000a', fontWeight: 600 }}>
          {error}
        </div>
      )}
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
              {f === 'all' ? 'All Reviews' : f === 'positive' ? 'Amazing!' : f === 'neutral' ? 'It was okay' : 'Could be better'}
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

        {/* Stat 3: Google Links Sent */}
        <div className="stat-card">
          <div>
            <div className="icon-box" style={{ background: '#fff3e0', color: '#e65100' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>link</span>
            </div>
            <p style={{ fontSize: '14px', color: T.onSurfaceVariant, fontWeight: 500 }}>Google Links Sent</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: T.onSurface, lineHeight: 1 }}>{googleLinksSent}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: T.onSurfaceVariant }}>Pushed to Google Maps</span>
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
                <span style={{ fontSize: '14px', color: T.onSurfaceVariant, fontWeight: 500 }}>Amazing!</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: T.onSurface }}>{positiveCount}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontSize: '14px', color: T.onSurfaceVariant, fontWeight: 500 }}>It was okay</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: T.onSurface }}>{neutralCount}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: T.primary }} />
                <span style={{ fontSize: '14px', color: T.onSurfaceVariant, fontWeight: 500 }}>Could be better</span>
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {uiReviews.slice(0, 12).map((r) => {
                const badgeTheme = getBadgeStyle(r.badgeStyle);
                const customerName = (r as any).customer_name || r.customerName || 'Walk-in Guest';
                const phoneDisplay = (r as any).customer_phone || r.customerPhone || '';
                const isResolved = r.isResolved || (r as any).is_resolved;

                return (
                  <div key={r.id} style={{
                    background: isResolved ? '#f0fdf4' : '#ffffff',
                    border: `1px solid ${isResolved ? '#bbf7d0' : '#E6E1DA'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {/* Header: Name, Phone, Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1C1917', marginBottom: '2px', lineHeight: 1.2 }}>
                          {customerName}
                        </h4>
                        {phoneDisplay && (
                          <p style={{ fontSize: '12px', color: '#6b7280', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
                            {phoneDisplay}
                          </p>
                        )}
                      </div>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                        background: badgeTheme.bg,
                        color: badgeTheme.color,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        marginLeft: '8px'
                      }}>
                        {r.badge}
                      </span>
                    </div>

                    {/* Stars */}
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{
                          fontSize: '18px',
                          color: i < r.stars ? '#D97706' : '#E5E7EB'
                        }}>
                          ★
                        </span>
                      ))}
                    </div>

                    {/* Feedback */}
                    <div style={{
                      background: '#FAF7F2',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #E6E1DA',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#1C1917',
                      lineHeight: 1.4,
                      minHeight: '48px'
                    }}>
                      {r.feedbackText ? (
                        `"${r.feedbackText}"`
                      ) : r.stars >= 5 ? (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic', fontWeight: 400 }}>Tapped 'Amazing!' on WhatsApp</span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </div>

                    {/* Footer: Mark Read + Reply */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
                      <button
                        onClick={() => handleToggleResolved(r.id, isResolved)}
                        style={{
                          flex: 1,
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: `1px solid ${isResolved ? '#bbf7d0' : '#E6E1DA'}`,
                          background: isResolved ? '#dcfce7' : '#fff',
                          color: isResolved ? '#15803d' : '#374151',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        {isResolved ? '✓ Read' : 'Mark as Read'}
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(replyingTo === r.id ? null : r.id);
                          if (replyingTo !== r.id) setReplyMessage('');
                        }}
                        style={{
                          flex: 1,
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid #E6E1DA',
                          background: '#fff',
                          color: '#374151',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        Reply
                      </button>
                    </div>

                    {/* Inline Reply Input */}
                    {replyingTo === r.id && (
                      <div style={{ display: 'flex', gap: '6px', paddingTop: '4px', borderTop: '1px solid #E6E1DA' }}>
                        <input
                          type="text"
                          value={replyMessage}
                          onChange={e => setReplyMessage(e.target.value)}
                          placeholder="Type reply..."
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid #E6E1DA',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSendReply(r.id, (r as any).customer_phone || r.customerPhone || '');
                          }}
                        />
                        <button
                          onClick={() => handleSendReply(r.id, (r as any).customer_phone || r.customerPhone || '')}
                          disabled={isSendingReply || !replyMessage.trim()}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#853423',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: isSendingReply || !replyMessage.trim() ? 'not-allowed' : 'pointer',
                            opacity: isSendingReply || !replyMessage.trim() ? 0.7 : 1
                          }}
                        >
                          {isSendingReply ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {uiReviews.length > 12 && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  onClick={() => {}}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: '1px solid #E6E1DA',
                    background: '#fff',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Show All Reviews
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
