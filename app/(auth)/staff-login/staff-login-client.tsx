'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { loginWithStaffPin } from '../actions';
import type { AuthActionState } from '../actions';

function PinDisplay({ length }: { length: number }) {
  return (
    <div
      aria-label={`${length} of 4 digits entered`}
      style={{
        display: 'flex',
        gap: '18px',
        justifyContent: 'center',
        margin: '20px 0 8px',
      }}
    >
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: i < length
              ? 'linear-gradient(135deg, #853423, #a44b38)'
              : '#fcf9f8',
            border: i < length ? 'none' : '2px solid #dbc1bb',
            transition: 'all 0.15s cubic-bezier(0.34,1.56,0.64,1)',
            transform: i < length ? 'scale(1.15)' : 'scale(1)',
            boxShadow: i < length ? '0 0 10px rgba(133,52,35,0.3)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

function PadKey({
  label,
  sublabel,
  onClick,
  variant = 'digit',
}: {
  label: React.ReactNode;
  sublabel?: string;
  onClick: () => void;
  variant?: 'digit' | 'action' | 'empty';
}) {
  const [pressed, setPressed] = useState(false);

  if (variant === 'empty') {
    return <div style={{ width: '100%', height: '100%' }} />;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: '100%',
        minHeight: '64px',
        background: pressed
          ? '#e5e2e1'
          : variant === 'action'
            ? '#f6f3f2'
            : '#ffffff',
        border: '1px solid #dbc1bb',
        borderRadius: '16px',
        color: '#1c1b1b',
        cursor: 'pointer',
        transition: 'background 0.1s ease, transform 0.1s ease',
        transform: pressed ? 'scale(0.94)' : 'scale(1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation',
        boxShadow: '0 1px 2px rgba(133,52,35,0.05)',
      }}
      aria-label={typeof label === 'string' ? label : undefined}
    >
      <span
        style={{
          fontSize: '22px',
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: '-0.5px',
          color: '#55423e',
        }}
      >
        {label}
      </span>
      {sublabel && (
        <span
          style={{
            fontSize: '8px',
            letterSpacing: '0.15em',
            color: 'rgba(85,66,62,0.6)',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          {sublabel}
        </span>
      )}
    </button>
  );
}

function BackspaceIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <line x1="18" y1="9" x2="13" y2="14" />
      <line x1="13" y1="9" x2="18" y2="14" />
    </svg>
  );
}

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const;

export default function StaffLoginClient() {
  const [cafeCode, setCafeCode] = useState('');
  const [pin, setPin] = useState('');
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [state, action, isPending] = useActionState<AuthActionState, FormData>(
    loginWithStaffPin,
    null
  );

  // Auto-submit when 4 digits entered and Cafe ID is provided
  useEffect(() => {
    if (pin.length === 4) {
      if (!cafeCode.trim()) {
        setValidationError('Please enter your Cafe ID first.');
        setPin('');
      } else {
        setValidationError(null);
        setAutoSubmit(true);
      }
    }
  }, [pin, cafeCode]);

  // Trigger form submission programmatically
  useEffect(() => {
    if (autoSubmit && pin.length === 4) {
      const form = document.getElementById('pin-form') as HTMLFormElement | null;
      form?.requestSubmit();
      setAutoSubmit(false);
    }
  }, [autoSubmit, pin]);

  // Clear PIN when error comes back, but keep the error message visible
  useEffect(() => {
    if (state?.error) {
      setPin('');
      // Don't clear validationError here — the state.error will be shown
    }
  }, [state]);

  function handleKey(key: string) {
    if (isPending) return;

    if (key === 'back') {
      setPin(p => p.slice(0, -1));
    } else if (pin.length < 4 && /^\d$/.test(key)) {
      setPin(p => p + key);
    }
  }

  const activeError = state?.error || validationError;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .staff-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #fcf9f8;
          padding: 24px;
        }

        .staff-card {
          width: 100%;
          max-width: 380px;
          background: #ffffff;
          border: 1px solid rgba(219,193,187,0.4);
          border-radius: 28px;
          padding: 36px 28px 32px;
          box-shadow:
            0 8px 32px rgba(133,52,35,0.08),
            0 1px 3px rgba(0,0,0,0.05),
            0 0 60px rgba(133,52,35,0.02);
          animation: cardIn 0.35s ease both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .staff-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          justify-content: center;
        }

        .staff-logo-mark {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #853423, #a44b38);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 800;
          color: #fff;
          box-shadow: 0 4px 16px rgba(133,52,35,0.35);
        }

        .staff-logo-text {
          font-size: 18px;
          font-weight: 700;
          color: #853423;
          letter-spacing: -0.5px;
        }

        .staff-heading {
          font-size: 20px;
          font-weight: 700;
          color: #1c1b1b;
          letter-spacing: -0.4px;
          text-align: center;
          margin-bottom: 4px;
        }

        .staff-sub {
          font-size: 13px;
          color: #55423e;
          text-align: center;
          margin-bottom: 24px;
        }

        .cafe-id-group {
          margin-bottom: 16px;
        }

        .cafe-id-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #55423e;
          margin-bottom: 6px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .cafe-id-input {
          width: 100%;
          background: #ffffff;
          border: 1px solid #dbc1bb;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 16px;
          color: #1c1b1b;
          outline: none;
          text-align: center;
          font-family: inherit;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }

        .cafe-id-input:focus {
          border-color: #853423;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(133, 52, 35, 0.12);
        }

        .error-box {
          background: #ffdad6;
          border: 1px solid #ba1a1a;
          border-radius: 10px;
          padding: 10px 14px;
          color: #ba1a1a;
          font-size: 13px;
          text-align: center;
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }

        .pad-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 20px;
        }

        .submitting-overlay {
          position: absolute;
          inset: 0;
          border-radius: 28px;
          background: rgba(252,249,248,0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(133,52,35,0.1);
          border-top-color: #853423;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .owner-link {
          display: block;
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: #55423e;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .owner-link:hover {
          color: #853423;
        }

        .owner-link span {
          color: #853423;
          font-weight: 700;
        }
      `}</style>

      <div className="staff-root">
        <div className="staff-card" style={{ position: 'relative' }}>
          {/* Submitting overlay */}
          {isPending && (
            <div className="submitting-overlay" aria-label="Verifying Credentials">
              <div className="spinner" />
            </div>
          )}

          {/* Logo */}
          <div className="staff-logo">
            <div className="staff-logo-mark">R</div>
            <span className="staff-logo-text">Retab</span>
          </div>

          {/* Heading */}
          <h1 className="staff-heading">Terminal Login</h1>
          <p className="staff-sub">Enter Cafe ID and 4-digit PIN</p>

          {/* Cafe ID Input Field */}
          <div className="cafe-id-group">
            <label htmlFor="cafeCode" className="cafe-id-label">Cafe ID</label>
            <input
              id="cafeCode"
              type="text"
              className="cafe-id-input"
              placeholder="e.g. GRB482"
              maxLength={12}
              value={cafeCode}
              onChange={(e) => {
                setCafeCode(e.target.value);
                setValidationError(null);
              }}
              disabled={isPending}
              autoComplete="off"
            />
          </div>

          {/* PIN dots */}
          <PinDisplay length={pin.length} />

          {/* Error */}
          {activeError && (
            <div className="error-box" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {activeError}
            </div>
          )}

          {/* Hidden form — submitted programmatically */}
          <form id="pin-form" action={action} style={{ display: 'none' }}>
            <input type="hidden" name="pin" value={pin} readOnly />
            <input type="hidden" name="cafeCode" value={cafeCode} readOnly />
          </form>

          {/* Numeric pad */}
          <div className="pad-grid" role="group" aria-label="PIN numeric keypad">
            {PAD_KEYS.map((key, idx) => {
              if (key === '') {
                return <div key={`empty-${idx}`} />;
              }
              if (key === 'back') {
                return (
                  <PadKey
                    key="back"
                    label={<BackspaceIcon />}
                    onClick={() => handleKey('back')}
                    variant="action"
                  />
                );
              }
              const sublabels: Record<string, string> = {
                '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL',
                '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ',
              };
              return (
                <PadKey
                  key={key}
                  label={key}
                  sublabel={sublabels[key]}
                  onClick={() => handleKey(key)}
                />
              );
            })}
          </div>

          {/* Owner link */}
          <Link href="/login" className="owner-link">
            Owner? <span>Sign in with email →</span>
          </Link>
        </div>
      </div>
    </>
  );
}
