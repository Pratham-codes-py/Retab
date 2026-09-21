/**
 * Phone number normalization utilities
 *
 * All phone numbers stored in the database and sent to external APIs
 * (WhatsApp, SMS) must be in E.164 format: +[country][number] with no
 * spaces, dashes, or other formatting.
 */

/**
 * Normalizes a phone number to E.164 format for storage and API calls.
 *
 * Rules:
 * - Strips all non-digit characters except a leading +
 * - If the result is exactly 10 digits with no country code, prepends +91 (India)
 * - Otherwise returns the cleaned number with its existing country code
 *
 * Examples:
 *   "91-70203-71443"  → "+917020371443"
 *   "70203 71443"     → "+917020371443"
 *   "+917020371443"   → "+917020371443"
 *   "7020371443"      → "+917020371443"
 *   "+14155552671"    → "+14155552671"
 *
 * @param raw - The user-entered phone number (may contain spaces, dashes, etc.)
 * @returns E.164 formatted phone number, or null if the input is empty/invalid
 */
export function normalizePhoneNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Strip everything except digits and a leading +
  const cleaned = raw.trim().replace(/[^\d+]/g, '');

  if (!cleaned) return null;

  // If it starts with +, keep it as-is (already has country code)
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If exactly 10 digits with no country code, assume India and prepend +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  // If 11+ digits without +, assume the country code is already included
  // (e.g. "917020371443" → "+917020371443")
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }

  // Less than 10 digits — likely invalid, but store it with + anyway
  // (validation can reject it elsewhere if needed)
  return `+${cleaned}`;
}

/**
 * Formats a normalized E.164 phone number for human-readable display.
 *
 * Examples:
 *   "+917020371443" → "+91 70203 71443"
 *   "+14155552671"  → "+1 415 555 2671"
 *
 * Falls back to the raw input if it doesn't match expected patterns.
 */
export function formatPhoneForDisplay(e164: string | null | undefined): string {
  if (!e164) return '';

  // India: +91 XXXXX XXXXX
  const indiaMatch = e164.match(/^\+91(\d{5})(\d{5})$/);
  if (indiaMatch) {
    return `+91 ${indiaMatch[1]} ${indiaMatch[2]}`;
  }

  // US/Canada: +1 XXX XXX XXXX
  const usMatch = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (usMatch) {
    return `+1 ${usMatch[1]} ${usMatch[2]} ${usMatch[3]}`;
  }

  // Generic fallback: insert space after country code (first 2-3 digits after +)
  const genericMatch = e164.match(/^(\+\d{1,3})(\d+)$/);
  if (genericMatch) {
    return `${genericMatch[1]} ${genericMatch[2]}`;
  }

  return e164;
}
