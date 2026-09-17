'use client';

import React, { useState } from 'react';
import { setupCafe } from './actions';

export default function CafeSetupClient() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsPending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      const result = await setupCafe(formData);
      if (result?.error) {
        setError(result.error);
        setIsPending(false);
      } else {
        // Success: reload window to resolve layout state
        window.location.reload();
      }
    } catch (err) {
      console.error('Error setting up cafe:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsPending(false);
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .setup-root {
          min-height: 100vh;
          background: #fcf9f8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }
        .setup-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border: 1px solid rgba(219,193,187,0.4);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 12px 40px rgba(133,52,35,0.06);
          position: relative;
          z-index: 10;
        }
        .setup-title {
          font-size: 28px;
          font-weight: 700;
          color: #853423;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .setup-sub {
          font-size: 15px;
          color: #55423e;
          line-height: 1.5;
          margin-bottom: 32px;
        }
        .input-group {
          margin-bottom: 24px;
        }
        .input-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #55423e;
          margin-bottom: 6px;
        }
        .input-field {
          width: 100%;
          padding: 12px 16px;
          font-size: 15px;
          border: 1px solid #dbc1bb;
          border-radius: 8px;
          outline: none;
          background: #ffffff;
          color: #1c1b1b;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-field:focus {
          border-color: #853423;
          box-shadow: 0 0 0 3px rgba(133,52,35,0.12);
        }
        .btn-submit {
          width: 100%;
          padding: 14px;
          background: #853423;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
          box-shadow: 0 2px 8px rgba(133,52,35,0.2);
        }
        .btn-submit:hover {
          opacity: 0.9;
        }
        .btn-submit:disabled {
          background: #a44b38;
          cursor: not-allowed;
        }
        .error-banner {
          background: #ffdad6;
          color: #ba1a1a;
          border-radius: 8px;
          padding: 12px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 20px;
        }
        .watermark {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-size: 20rem;
          font-weight: 900;
          color: #853423;
          opacity: 0.02;
          user-select: none;
          pointer-events: none;
          white-space: nowrap;
          z-index: 0;
        }
      `}</style>

      <div className="setup-root">
        <div className="watermark">Retab</div>
        <div className="setup-card">
          <h1 className="setup-title">Setup your cafe</h1>
          <p className="setup-sub">
            Let's initialize your dashboard. Enter your cafe's name to get started.
          </p>

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="cafe-name" className="input-label">Cafe Name</label>
              <input 
                id="cafe-name"
                type="text"
                required
                placeholder="e.g. Green Beans Cafe"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                disabled={isPending}
              />
            </div>

            <button type="submit" disabled={isPending} className="btn-submit">
              {isPending ? 'Initializing...' : 'Create Cafe & Continue'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
