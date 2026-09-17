'use client';

/**
 * app/(auth)/login/page.tsx
 *
 * Unified auth page — owner login + new account creation.
 * Toggle between "Log In" and "Create Account" modes on a single card.
 */

import { useActionState, useTransition, useState } from 'react';
import Link from 'next/link';
import { loginWithEmail, loginWithGoogle, signUp } from '../actions';
import type { AuthActionState } from '../actions';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:                     '#fcf9f8',
  primary:                '#853423',
  primaryContainer:       '#a44b38',
  onPrimary:              '#ffffff',
  onPrimaryContainer:     '#ffddd6',
  secondary:              '#576158',
  surface:                '#fcf9f8',
  surfaceContainerLow:    '#f6f3f2',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant:         '#e5e2e1',
  onSurface:              '#1c1b1b',
  onSurfaceVariant:       '#55423e',
  outlineVariant:         '#dbc1bb',
  outline:                '#88726d',
  errorContainer:         '#ffdad6',
  error:                  '#ba1a1a',
  onErrorContainer:       '#93000a',
  successContainer:       '#d1fae5',
  success:                '#065f46',
};

// ─── Google Icon ──────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const inputStyle = {
  width: '100%',
  background: C.surfaceContainerLowest,
  border: `1px solid ${C.outlineVariant}`,
  borderRadius: '8px',
  padding: '12px 16px',
  fontSize: '16px',
  fontWeight: 400,
  lineHeight: 1.6,
  color: C.onSurface,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

const primaryBtn = (pending: boolean) => ({
  width: '100%',
  padding: '14px',
  background: pending ? C.primaryContainer : C.primary,
  color: C.onPrimary,
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  cursor: pending ? 'not-allowed' : 'pointer',
  letterSpacing: '0.01em',
  transition: 'background 0.15s ease',
  boxShadow: '0 2px 8px rgba(133,52,35,0.25)',
});

// ─── Login Flow ───────────────────────────────────────────────────────────────
function LoginFlow() {
  const [emailState, emailAction, isEmailPending] = useActionState<AuthActionState, FormData>(loginWithEmail, null);
  const [isGooglePending, startGoogleTransition] = useTransition();

  function handleGoogle() {
    startGoogleTransition(async () => {
      const result = await loginWithGoogle();
      if (result && 'url' in result) window.location.href = result.url;
    });
  }

  return (
    <div>
      {/* Google OAuth */}
      <button
        type="button"
        id="google-signin-btn"
        onClick={handleGoogle}
        disabled={isGooglePending}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          width: '100%', padding: '12px',
          background: C.surfaceContainerLowest, border: `1px solid ${C.outlineVariant}`,
          borderRadius: '8px', color: C.onSurface, fontSize: '14px', fontWeight: 500,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          cursor: isGooglePending ? 'not-allowed' : 'pointer',
          opacity: isGooglePending ? 0.6 : 1, marginBottom: '20px',
          transition: 'background 0.15s ease',
        }}
      >
        <GoogleIcon />
        {isGooglePending ? 'Redirecting…' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1, height: '1px', background: C.outlineVariant }} />
        <span style={{ fontSize: '12px', color: C.onSurfaceVariant, fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: '1px', background: C.outlineVariant }} />
      </div>

      {emailState?.error && (
        <div style={{
          background: C.errorContainer, color: C.error, borderRadius: '8px',
          padding: '10px 14px', fontSize: '13px', marginBottom: '16px', fontWeight: 500,
        }}>
          {emailState.error}
        </div>
      )}

      {emailState?.message && (
        <div style={{
          background: C.successContainer, color: C.success, borderRadius: '8px',
          padding: '10px 14px', fontSize: '13px', marginBottom: '16px', fontWeight: 500,
        }}>
          {emailState.message}
        </div>
      )}

      <form action={emailAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: C.onSurfaceVariant, marginBottom: '4px' }}>
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="admin@cafe.com" required style={inputStyle} />
        </div>
        <div>
          <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: C.onSurfaceVariant, marginBottom: '4px' }}>
            Password
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required style={inputStyle} />
        </div>
        <button id="email-signin-btn" type="submit" disabled={isEmailPending} style={primaryBtn(isEmailPending)}>
          {isEmailPending ? 'Continuing…' : 'Sign In / Register'}
        </button>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        input:focus {
          border-color: ${C.primary} !important;
          box-shadow: 0 0 0 3px rgba(133,52,35,0.12) !important;
        }
      `}</style>

      <div style={{
        minHeight: '100vh', background: C.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: 'relative', overflow: 'hidden', padding: '32px',
      }}>
        {/* Giant watermark */}
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '20rem', fontWeight: 900, color: C.primary,
          opacity: 0.03, userSelect: 'none', pointerEvents: 'none',
          fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap', zIndex: 0,
        }}>
          Retab
        </div>

        <main style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '440px' }}>
          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, color: C.primary }}>
              Retab
            </h1>
            <p style={{ fontSize: '16px', color: C.onSurfaceVariant, marginTop: '4px', fontWeight: 400 }}>
              Precision POS for Modern Cafes
            </p>
          </div>

          {/* Auth card */}
          <div style={{
            background: C.surface,
            border: `1px solid rgba(219,193,187,0.2)`,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(133,52,35,0.08), 0 1px 3px rgba(0,0,0,0.05)',
            padding: '32px',
          }}>
            <LoginFlow />

            {/* Divider for staff */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0 20px' }}>
              <div style={{ flex: 1, height: '1px', background: C.outlineVariant }} />
              <span style={{ fontSize: '11px', color: C.outline, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff</span>
              <div style={{ flex: 1, height: '1px', background: C.outlineVariant }} />
            </div>

            {/* Prominent Staff Terminal Login Button */}
            <Link
              href="/staff-login"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', padding: '12px 16px',
                background: 'transparent', border: `2px solid ${C.primary}`,
                borderRadius: '8px', color: C.primary, fontSize: '14px', fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>badge</span>
              Staff Terminal Login →
            </Link>
          </div>

          {/* Footer */}
          <footer style={{ marginTop: '40px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '12px' }}>
              {['Privacy Policy', 'Terms of Service', 'Support'].map(label => (
                <a key={label} href="#" style={{ fontSize: '12px', color: C.onSurfaceVariant, textDecoration: 'none', fontWeight: 600, letterSpacing: '0.03em' }}>
                  {label}
                </a>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: C.outline, fontWeight: 600, letterSpacing: '0.03em' }}>
              © 2024 Retab. Made for Indian Cafes.
            </p>
          </footer>
        </main>

        {/* Decorative corner */}
        <div style={{
          position: 'fixed', bottom: '-100px', right: '-100px',
          width: '384px', height: '384px', opacity: 0.08,
          pointerEvents: 'none', borderRadius: '9999px', transform: 'rotate(12deg)',
          background: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD6Ns_aglZy1nM_JX_X71WoB79x9kFhxbk4lAy7WUGnmbrQhOjsGHDga0MkctAquS4SY3vO-M2wLgAHCwIMfx9Bp8mKkfoBAMO5XZlk_kGttQm9R0DwNOVlqhc_uQTN4KnDM0Xo7kpXk2gNq_zktr6t7zwbEJ52eJ1Yh1e70RJwcmbvzr7c5hydof5Wo19RBwnmEI8Ii0E_UswQL5AhAiUryl2P88Ku5jojzdZMkdBgMp3OHQlwVuvnPREK_HxN40obS9XYsm44cEL2') center/cover`,
        }} />
      </div>
    </>
  );
}
