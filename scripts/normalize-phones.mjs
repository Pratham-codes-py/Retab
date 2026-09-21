#!/usr/bin/env node
/**
 * scripts/normalize-phones.mjs
 *
 * One-time migration: normalizes all phone numbers in the customers table
 * to E.164 format (+91XXXXXXXXXX for 10-digit Indian numbers).
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 *
 * Usage:
 *   node scripts/normalize-phones.mjs
 *   node scripts/normalize-phones.mjs --dry-run   ← preview only, no writes
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env.local');
try {
  const raw = readFileSync(envPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.error('Could not read .env.local');
  process.exit(1);
}

const isDryRun = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Same normalization logic as lib/utils/phone.ts
// ---------------------------------------------------------------------------
function normalizePhoneNumber(raw) {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length > 10) return `+${cleaned}`;
  return `+${cleaned}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

console.log(`\nPhone normalization migration${isDryRun ? ' (DRY RUN — no writes)' : ''}\n`);

// Fetch all customers with a phone number
const { data: customers, error } = await supabase
  .from('customers')
  .select('id, phone')
  .not('phone', 'is', null);

if (error) {
  console.error('Failed to fetch customers:', error.message);
  process.exit(1);
}

console.log(`Fetched ${customers.length} customers with a phone number.\n`);

let changed = 0;
let skipped = 0;
let failed = 0;

for (const customer of customers) {
  const normalized = normalizePhoneNumber(customer.phone);

  if (normalized === customer.phone) {
    skipped++;
    continue;
  }

  console.log(`  ${customer.id}: "${customer.phone}" → "${normalized}"`);

  if (!isDryRun) {
    const { error: updateErr } = await supabase
      .from('customers')
      .update({ phone: normalized })
      .eq('id', customer.id);

    if (updateErr) {
      console.error(`    ✗ Failed: ${updateErr.message}`);
      failed++;
    } else {
      changed++;
    }
  } else {
    changed++;
  }
}

console.log(`
Summary:
  ${changed} updated${isDryRun ? ' (would be)' : ''}
  ${skipped} already clean
  ${failed} failed
`);

if (isDryRun) {
  console.log('Run without --dry-run to apply changes.\n');
}
