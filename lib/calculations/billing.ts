/**
 * Retab — Billing calculation utilities
 *
 * Shared between:
 *  - Frontend: bill preview in the billing UI
 *  - Backend: server-side verification in app/api/orders/route.ts
 *    (to prevent client-side total manipulation)
 *
 * All amounts are in the smallest currency unit (e.g. paise for INR).
 */

export interface BillLineItem {
  menuItemId: string;
  name: string;
  price: number;       // per-unit price in smallest currency unit
  quantity: number;
}

export interface BillTotal {
  subtotal: number;    // sum of (price × quantity) for all items
  tax: number;         // computed tax amount
  total: number;       // subtotal + tax
  taxRate: number;     // e.g. 0.05 for 5%
}

/**
 * Calculates the full bill total for a list of line items.
 *
 * @param items      - Array of ordered items with price and quantity
 * @param taxRate    - Fractional tax rate, e.g. 0.05 for 5% GST (default 0)
 * @returns          BillTotal breakdown
 */
export function calculateTotal(items: BillLineItem[], taxRate = 0): BillTotal {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total,
    taxRate,
  };
}

/**
 * Formats a smallest-unit amount to a display string.
 * e.g. formatCurrency(10050) → "₹100.50"
 *
 * @param amount       - Amount in smallest currency unit
 * @param currencyCode - ISO 4217 currency code (default "INR")
 * @param locale       - BCP 47 locale (default "en-IN")
 */
export function formatCurrency(
  amount: number,
  currencyCode = 'INR',
  locale = 'en-IN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
  }).format(amount);
}
