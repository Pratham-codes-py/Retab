'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CREDIT_PACKS, type CreditPack } from '@/lib/billing/packs';

// ---------------------------------------------------------------------------
// Design tokens (matches settings-client.tsx)
// ---------------------------------------------------------------------------
const T = {
  primary: '#853423',
  primaryContainer: '#a44b38',
  onPrimary: '#ffffff',
  surface: '#fcf9f8',
  surfaceContainerLow: '#f6f3f2',
  outlineVariant: '#dbc1bb',
  onSurface: '#1c1b1b',
  onSurfaceVariant: '#55423e',
} as const;

// ---------------------------------------------------------------------------
// Cashfree SDK loader (lazy, once)
// ---------------------------------------------------------------------------
let cashfreeSDKLoaded = false;

function loadCashfreeSDK(): Promise<void> {
  if (cashfreeSDKLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]'
    );
    if (existing) {
      cashfreeSDKLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      cashfreeSDKLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TopUpModal({ isOpen, onClose, onSuccess }: TopUpModalProps) {
  const router = useRouter();
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handlePurchase = useCallback(
    async (pack: CreditPack) => {
      setSelectedPack(pack);
      setApiError(null);
      setIsProcessing(true);

      try {
        // 1. Create Cashfree order via backend
        const res = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packId: pack.id }),
        });

        const json = await res.json();

        if (!res.ok || !json.paymentSessionId) {
          setApiError(json.error ?? 'Failed to create payment order. Please try again.');
          setIsProcessing(false);
          return;
        }

        const { paymentSessionId } = json;

        // 2. Load Cashfree SDK
        await loadCashfreeSDK();

        // 3. Launch Cashfree checkout
        const cashfree = (window as any).Cashfree({ mode: 'sandbox' });
        await cashfree.checkout({
          paymentSessionId,
          redirectTarget: '_modal',
        });

        // 4. Checkout closed — refresh data and notify parent
        router.refresh();
        onSuccess?.();
        onClose();
      } catch (err: any) {
        console.error('[TopUpModal] Checkout error:', err);
        setApiError(err?.message ?? 'An unexpected error occurred.');
      } finally {
        setIsProcessing(false);
        setSelectedPack(null);
      }
    },
    [router, onClose, onSuccess]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Modal panel — stop click propagation so clicks inside don't close */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: T.surfaceContainerLow,
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: T.onSurfaceVariant,
            }}
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              close
            </span>
          </button>

          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: T.primary,
                marginBottom: '6px',
                letterSpacing: '-0.02em',
              }}
            >
              Top Up Credits
            </h2>
            <p style={{ fontSize: '14px', color: T.onSurfaceVariant }}>
              Credits are used to send WhatsApp receipts and marketing messages. Choose a pack below.
            </p>
          </div>

          {/* Error banner */}
          {apiError && (
            <div
              style={{
                background: '#fff1f1',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '18px', color: '#dc2626', flexShrink: 0, marginTop: '1px' }}
              >
                error
              </span>
              <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{apiError}</p>
            </div>
          )}

          {/* Pack cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {CREDIT_PACKS.map((pack) => {
              const isSelected = selectedPack?.id === pack.id;
              const isThisLoading = isProcessing && isSelected;

              return (
                <button
                  key={pack.id}
                  onClick={() => !isProcessing && handlePurchase(pack)}
                  disabled={isProcessing}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: `2px solid ${isSelected ? T.primary : T.outlineVariant}`,
                    background: isSelected ? '#fff5f3' : '#ffffff',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing && !isSelected ? 0.5 : 1,
                    transition: 'all 0.15s',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: T.onSurface,
                        marginBottom: '2px',
                      }}
                    >
                      {pack.label}
                    </p>
                    <p style={{ fontSize: '13px', color: T.onSurfaceVariant, margin: 0 }}>
                      {pack.credits.toLocaleString('en-IN')} credits
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {isThisLoading ? (
                      <span style={{ fontSize: '13px', color: T.onSurfaceVariant }}>
                        Processing…
                      </span>
                    ) : (
                      <>
                        <p
                          style={{
                            fontSize: '18px',
                            fontWeight: 800,
                            color: T.primary,
                            marginBottom: '0px',
                          }}
                        >
                          ₹{pack.priceINR.toLocaleString('en-IN')}
                        </p>
                        <p style={{ fontSize: '11px', color: T.onSurfaceVariant, margin: 0 }}>
                          ₹{(pack.priceINR / pack.credits).toFixed(2)} / credit
                        </p>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <p
            style={{
              marginTop: '20px',
              fontSize: '12px',
              color: T.onSurfaceVariant,
              display: 'flex',
              gap: '6px',
              alignItems: 'flex-start',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '14px', marginTop: '1px', flexShrink: 0 }}
            >
              lock
            </span>
            Payments are processed securely via Cashfree. Credits are added instantly after payment.
          </p>
        </div>
      </div>
    </>
  );
}
