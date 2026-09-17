/**
 * app/page.tsx
 *
 * Landing page — matches the Stitch "Retab | Modern Cafe Management" design exactly.
 * Sections: Nav → Hero → Features Bento → Pricing → Stats → CTA → Footer
 */

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Retab | Automated Billing & WhatsApp Reviews for Cafes',
  description: 'Send bills and get reviews on WhatsApp automatically. Delight your customers with paperless billing and grow your online reputation.',
};

// ─── Image URLs from Stitch design ───────────────────────────────────────────
const HERO_IMG    = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5lzb7PhDJwblnW8dfhCxchWrdRQUTEMItSI5kiAhAxRCaZuCzwQ0tkoREyDpRPzEGHUlqdy_JU-BDCw1mPCy_sOewqWwwAFWgBp5aCcRwca1EyLJQ7uZqMdPrBbBTmqV4h4ttedNmWyjWRbob5BWpRcOGGKIMoJkPETUOZ5-yuNopQTUCYhLZ0hqVGlZjh94n5i3IkoGCxJlXYHv1WBfQ5DdG2t3NHHGnjeeINLvIjqDk0KMdDsM1kOaboHmLI2mQrNLFnMlaYM4E';
const BILLING_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQu7CxkG1R5T2c1S_CLy8c53r9FOwkr5Gx4JQoetkGL51yLb-isrt2ZavVO6m6ySeFkLMMJ99BqwKMP2mAfCkf4rKMhLzu-8iWlVKK-fEC20pfCrnPTvQlie8rM2b4rMl3idxjl1lVrDDygKUP42-hKaTJhOEp_f3fzm-WV3xoD2hkfvaB-PP4hY9g_9TOuwtlj5pUL3Z6HOjphFpFVY46lGrzIemsbEKIXeXZyRKSAA46v0yReurUyAOKFnuoGRBYtptbe-znfdSw';
const POS_IMG     = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvZ6jZoCAy4JjFvsJCJAQ8QHlVdgiFQiizQwLkIgCiN3iot8EFaFNnceSr1-KKGyFXRhk5-nmYL1jBxWMvNDTj4321XXjiGdMpi040HerlHZ-Q7iNSROXgaIZTec5SPhZCKzdG_RIvAq--mmyHd0LFCt4VAX7iTzjbpEbTqySUBJogPNH8zrtLUzLroc7kcntaIlKbX9MJmyiEb3exYrZnvnvr0w7iQGrKlzQ6PQ_XdFX5-tLUYNh0YmbtD9iFRy2hIscTVLQ6R-cc';
const CTA_IMG     = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYnHJUSPkxwpxIFmwzJSr6MPRNF7F60eQI3jsJ5pvAA9sIzQ2cMAA7_EcWXxnEQMPk1gb1eLvH5ta-f9TPQaQkGtKchX5OqdHPvUkblb5GxPnkngSoK1qCDbv_5MR3PX76XJkHNhqGRdAD7xqFyHPpjioBYMfqdbkLNQpLBqoSbbhLGATjsGqlBQzffR7LZCqpbwrV8v8mVrXZDMf9rrARNdvMSp_srcZZY6pHYVhW01Ieh4FS9GuxFbXEcQMYyD5AWQMNaIvhjzib';

export default function LandingPage() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #fcf9f8;
          color: #1c1b1b;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow-x: hidden;
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          display: inline-block; line-height: 1; vertical-align: middle;
        }
        .glass-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(133,52,35,0.1);
        }
        .hero-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(255,218,211,0.4) 0%, rgba(252,249,248,1) 100%);
        }
        .feature-card:hover > div { transform: translateY(0) !important; }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .bounce { animation: bounce-slow 3s ease-in-out infinite; }
        .nav-link:hover { color: #853423 !important; }
        .cta-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(133,52,35,0.3) !important; }
        .cta-btn-outline:hover { background: #e5e2e1 !important; }
        .pricing-card:hover { box-shadow: 0 20px 60px rgba(0,0,0,0.12) !important; }
        .footer-link:hover { color: #853423 !important; }
        @keyframes reveal { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .reveal { animation: reveal 0.6s ease both; }
      `}</style>

      {/* ── Navbar ────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, zIndex: 50, width: '100%',
        background: 'rgba(246,243,242,0.85)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 1px 0 #dbc1bb',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          maxWidth: '1280px', margin: '0 auto',
          padding: '8px 32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#853423', lineHeight: 1.3 }}>Retab</span>
            <div style={{ display: 'flex', gap: '24px' }}>
              {[['#features','Features'],['#pricing','Pricing'],['#about','About']].map(([href,label]) => (
                <a key={href} href={href} className="nav-link" style={{ color: '#55423e', fontWeight: 500, textDecoration: 'none', fontSize: '15px', transition: 'color 0.15s ease' }}>{label}</a>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/login" style={{ color: '#55423e', fontWeight: 500, padding: '10px 16px', textDecoration: 'none', fontSize: '15px', transition: 'color 0.15s ease' }}
              className="nav-link">
              Login
            </Link>
            <Link href="/login" style={{
              background: '#853423', color: '#fff',
              fontWeight: 700, padding: '10px 20px',
              borderRadius: '8px', textDecoration: 'none', fontSize: '14px',
              boxShadow: '0 1px 3px rgba(133,52,35,0.3)',
              transition: 'opacity 0.15s ease',
            }}>
              Start Free Pilot
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="hero-gradient" style={{ paddingTop: '128px', paddingBottom: '64px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span style={{
            background: '#ffdad3', color: '#7c2d1d',
            padding: '4px 16px', borderRadius: '9999px',
            fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: '24px', display: 'inline-block',
          }}>For Indian Cafes</span>

          <h1 style={{
            fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 700,
            letterSpacing: '-0.02em', lineHeight: 1.1,
            color: '#853423',
            maxWidth: '900px', marginBottom: '24px',
          }}>
            Send bills and get reviews on WhatsApp{' '}
            <span style={{ color: '#55423e' }}>automatically.</span>
          </h1>

          <p style={{ fontSize: '18px', color: '#55423e', maxWidth: '640px', lineHeight: 1.6, marginBottom: '40px' }}>
            Delight your customers with paperless billing and grow your online reputation with automated feedback requests.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/login" className="cta-btn-primary" style={{
              background: '#853423', color: '#fff',
              fontWeight: 700, padding: '16px 40px',
              borderRadius: '12px', textDecoration: 'none', fontSize: '18px',
              boxShadow: '0 4px 20px rgba(133,52,35,0.25)',
              transition: 'all 0.2s ease',
            }}>
              Start a Free Pilot
            </Link>
            <a href="#features" className="cta-btn-outline" style={{
              border: '1px solid #88726d', color: '#853423',
              fontWeight: 700, padding: '16px 40px',
              borderRadius: '12px', textDecoration: 'none', fontSize: '18px',
              transition: 'all 0.2s ease', background: 'transparent',
            }}>
              Book a Demo
            </a>
          </div>
        </div>

        {/* Floating hero image */}
        <div style={{ marginTop: '64px', maxWidth: '1120px', margin: '64px auto 0', padding: '0 32px', position: 'relative' }}>
          <div style={{
            background: '#f0eded', borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.15)',
            border: '1px solid #dbc1bb',
            padding: '8px',
          }}>
            <div style={{ borderRadius: '10px', overflow: 'hidden', height: 'clamp(280px, 40vw, 520px)' }}>
              <div style={{ width: '100%', height: '100%', backgroundImage: `url('${HERO_IMG}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            </div>
          </div>

          {/* Floating WhatsApp bubble */}
          <div className="bounce glass-card" style={{
            position: 'absolute', bottom: '-8px', right: '0px',
            padding: '16px 20px', borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', gap: '16px',
            maxWidth: '280px',
            zIndex: 10,
          }}>
            <div style={{ width: '48px', height: '48px', background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '24px' }}>chat</span>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#1c1b1b', marginBottom: '2px' }}>New Review Received!</p>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>&ldquo;Amazing coffee, 5 stars!&rdquo;</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Bento Grid ───────────────────────────────────── */}
      <section id="features" style={{ padding: '80px 0', background: '#fcf9f8' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, color: '#1c1b1b', marginBottom: '12px' }}>
              Modern Tools for Modern Cafes
            </h2>
            <p style={{ color: '#55423e', maxWidth: '560px', margin: '0 auto', fontSize: '16px', lineHeight: 1.6 }}>
              Simplify your daily operations with tools built specifically for the chaos and craft of hospitality.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', gridAutoRows: '280px' }}>
            {/* Feature 1: Automated Billing (col-span-8) */}
            <div className="feature-card" style={{
              gridColumn: 'span 8',
              background: '#f6f3f2', borderRadius: '24px', padding: '40px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              overflow: 'hidden', position: 'relative',
            }}>
              <div style={{ zIndex: 10, position: 'relative' }}>
                <div style={{ width: '48px', height: '48px', background: '#853423', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '24px' }}>receipt_long</span>
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 600, color: '#853423', marginBottom: '12px', lineHeight: 1.3 }}>Automated Billing</h3>
                <p style={{ color: '#55423e', maxWidth: '360px', fontSize: '15px', lineHeight: 1.6 }}>
                  No more paper mess. Send digital invoices directly to your customer&apos;s WhatsApp the moment they pay.
                </p>
              </div>
              <div style={{ position: 'absolute', right: 0, bottom: 0, width: '45%', height: '100%', overflow: 'hidden', borderTopLeftRadius: '24px' }}>
                <div style={{ width: '100%', height: '100%', backgroundImage: `url('${BILLING_IMG}')`, backgroundSize: 'cover', backgroundPosition: 'center', transform: 'translateY(8px)', transition: 'transform 0.5s ease' }} />
              </div>
            </div>

            {/* Feature 2: Deep Insights (col-span-4) */}
            <div style={{
              gridColumn: 'span 4',
              background: '#686561', borderRadius: '24px', padding: '40px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              color: '#e8e3de',
            }}>
              <div>
                <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#fff' }}>leaderboard</span>
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>Deep Insights</h3>
                <p style={{ opacity: 0.8, fontSize: '15px', lineHeight: 1.6 }}>Track repeat customers, popular items, and peak hours effortlessly.</p>
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '64px' }}>
                {[50,75,100,67].map((h,i) => (
                  <div key={i} style={{ flex: 1, background: `rgba(255,255,255,${0.3 + i*0.15})`, height: `${h}%`, borderRadius: '2px 2px 0 0' }} />
                ))}
              </div>
            </div>

            {/* Feature 3: 5-Star Reputation (col-span-4) */}
            <div style={{
              gridColumn: 'span 4',
              background: '#dbe5d9', borderRadius: '24px', padding: '40px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center',
            }}>
              <div style={{ width: '64px', height: '64px', background: '#a44b38', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <span className="material-symbols-outlined" style={{ color: '#ffddd6', fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 600, color: '#1c1b1b', marginBottom: '12px' }}>5-Star Reputation</h3>
              <p style={{ color: '#55423e', fontSize: '14px', lineHeight: 1.6 }}>Auto-request Google reviews from your happiest customers.</p>
            </div>

            {/* Feature 4: One-Touch POS (col-span-8) */}
            <div style={{
              gridColumn: 'span 8',
              background: '#eae7e7', borderRadius: '24px', padding: '40px',
              display: 'flex', gap: '40px', alignItems: 'center',
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '24px', fontWeight: 600, color: '#853423', marginBottom: '12px' }}>One-Touch POS</h3>
                <p style={{ color: '#55423e', fontSize: '15px', lineHeight: 1.6, marginBottom: '16px' }}>
                  The fastest order-taking experience in the industry. Built for high-speed lunch rushes.
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['Split Bill Support', 'Inventory Sync'].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
                      <span className="material-symbols-outlined" style={{ color: '#853423', fontSize: '18px' }}>check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ flex: 1, height: '100%', minHeight: '180px' }}>
                <div style={{
                  width: '100%', height: '100%',
                  backgroundImage: `url('${POS_IMG}')`, backgroundSize: 'cover', backgroundPosition: 'center',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(219,193,187,0.3)',
                }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '80px 0', background: '#f6f3f2' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1c1b1b', marginBottom: '12px' }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{ color: '#55423e', fontSize: '16px' }}>Scale your cafe with a partner that grows with you.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', alignItems: 'center' }}>
            {/* Pilot */}
            <div className="pricing-card" style={{ background: '#fcf9f8', borderRadius: '24px', padding: '40px', border: '1px solid #dbc1bb', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s ease' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1c1b1b', marginBottom: '4px' }}>The Pilot</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                <span style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1c1b1b' }}>Free</span>
              </div>
              <p style={{ fontSize: '14px', color: '#55423e', marginBottom: '40px' }}>Perfect for new cafes testing the waters.</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', flex: 1 }}>
                {[['check','Up to 100 bills/mo',true],['check','Standard WhatsApp Billing',true],['close','Advanced Insights',false]].map(([icon,label,active]) => (
                  <li key={label as string} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: active ? '#1c1b1b' : 'rgba(28,27,27,0.4)' }}>
                    <span className="material-symbols-outlined" style={{ color: active ? '#853423' : '#88726d', fontSize: '18px' }}>{icon}</span>
                    {label}
                  </li>
                ))}
              </ul>
              <Link href="/login" style={{ display: 'block', textAlign: 'center', padding: '12px', border: '1px solid #88726d', color: '#853423', fontWeight: 700, borderRadius: '8px', textDecoration: 'none', fontSize: '14px', transition: 'background 0.15s ease' }}>
                Choose Pilot
              </Link>
            </div>

            {/* Growth (popular - scaled up) */}
            <div style={{
              background: '#853423', color: '#fff',
              borderRadius: '24px', padding: '40px',
              boxShadow: '0 24px 60px rgba(133,52,35,0.35)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              transform: 'scale(1.04)', zIndex: 10,
            }}>
              <div style={{
                position: 'absolute', top: '16px', right: '16px',
                background: '#fff', color: '#853423',
                padding: '4px 12px', borderRadius: '9999px',
                fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em',
              }}>POPULAR</div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>Growth</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                <span style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}>₹2,999</span>
                <span style={{ opacity: 0.8 }}>/month</span>
              </div>
              <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '40px' }}>For busy cafes ready to scale their reputation.</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', flex: 1 }}>
                {['Unlimited Billing','WhatsApp Review Engine','1-Click Inventory Sync'].map(label => (
                  <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '18px' }}>check</span>
                    {label}
                  </li>
                ))}
              </ul>
              <Link href="/login" style={{ display: 'block', textAlign: 'center', padding: '14px', background: '#fff', color: '#853423', fontWeight: 700, borderRadius: '12px', textDecoration: 'none', fontSize: '14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', transition: 'background 0.15s ease' }}>
                Start 14-Day Trial
              </Link>
            </div>

            {/* Multi-Chain */}
            <div className="pricing-card" style={{ background: '#fcf9f8', borderRadius: '24px', padding: '40px', border: '1px solid #dbc1bb', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s ease' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1c1b1b', marginBottom: '4px' }}>Multi-Chain</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                <span style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1c1b1b' }}>Custom</span>
              </div>
              <p style={{ fontSize: '14px', color: '#55423e', marginBottom: '40px' }}>Advanced analytics for restaurant groups.</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', flex: 1 }}>
                {['Centralized Dashboard','Priority Support','White-label Billing'].map(label => (
                  <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#1c1b1b' }}>
                    <span className="material-symbols-outlined" style={{ color: '#853423', fontSize: '18px' }}>check</span>
                    {label}
                  </li>
                ))}
              </ul>
              <a href="#" style={{ display: 'block', textAlign: 'center', padding: '12px', border: '1px solid #88726d', color: '#853423', fontWeight: 700, borderRadius: '8px', textDecoration: 'none', fontSize: '14px', transition: 'background 0.15s ease' }}>
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <section id="about" style={{ padding: '80px 0', background: '#fff' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '40px', textAlign: 'center' }}>
          {[['500+','Cafes in India'],['1M+','Bills Sent'],['4.9/5','Average Rating'],['30%','Review Increase']].map(([val,label]) => (
            <div key={label}>
              <p style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', color: '#853423', lineHeight: 1.2, marginBottom: '4px' }}>{val}</p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#55423e', letterSpacing: '0.01em' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('${CTA_IMG}')`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.65)' }} />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '900px', margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '24px' }}>
            Ready to modernize your cafe?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px', lineHeight: 1.6, marginBottom: '40px' }}>
            Join the hundreds of cafes moving away from paper and into the future of automated guest delight.
          </p>
          <Link href="/login" className="cta-btn-primary" style={{
            display: 'inline-block',
            background: '#fff', color: '#853423',
            fontWeight: 700, padding: '18px 48px',
            borderRadius: '16px', textDecoration: 'none', fontSize: '18px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease',
          }}>
            Start My Free Pilot
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer style={{ background: '#e5e2e1', padding: '64px 0 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '24px' }}>
          <div>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#1c1b1b', display: 'block', marginBottom: '16px' }}>Retab</span>
            <p style={{ color: '#55423e', fontSize: '14px', lineHeight: 1.6 }}>Making billing delightful for Indian cafes since 2024. Smart, simple, and paperless.</p>
          </div>
          {[
            ['Product', ['Features','POS Integration','WhatsApp Engine']],
            ['Company', ['About Us','Careers','Privacy Policy']],
            ['Connect', ['Contact Support','Terms of Service']],
          ].map(([heading, links]) => (
            <div key={heading as string}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1c1b1b', letterSpacing: '0.01em', marginBottom: '16px' }}>{heading}</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(links as string[]).map(link => (
                  <li key={link}><a href="#" className="footer-link" style={{ color: '#55423e', fontSize: '14px', textDecoration: 'none', transition: 'color 0.15s ease' }}>{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{
          maxWidth: '1280px', margin: '40px auto 0', padding: '24px 32px',
          borderTop: '1px solid rgba(219,193,187,0.5)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ color: '#55423e', fontSize: '12px', fontWeight: 600, letterSpacing: '0.03em' }}>© 2024 Retab. Made for Indian Cafes.</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span className="material-symbols-outlined" style={{ color: '#55423e', cursor: 'pointer', fontSize: '22px' }}>share</span>
            <span className="material-symbols-outlined" style={{ color: '#55423e', cursor: 'pointer', fontSize: '22px' }}>alternate_email</span>
          </div>
        </div>
      </footer>
    </>
  );
}
