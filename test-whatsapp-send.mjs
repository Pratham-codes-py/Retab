/**
 * test-whatsapp-send.mjs
 *
 * Smoke-tests WhatsApp transport by calling the real sendTemplateMessage()
 * from lib/whatsapp/client.ts with the "hello_world" template.
 *
 * NOTE: This proves the message can be sent.
 * It does NOT test webhook replies or button logic — hello_world has no buttons.
 *
 * Usage:
 *   node test-whatsapp-send.mjs +91XXXXXXXXXX
 *
 * Reads WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN from .env.local
 * (same vars the app uses — no duplicate config needed).
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// 1. Load .env.local (Next.js style — no dotenv dep needed)
// ---------------------------------------------------------------------------
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '.env.local');

try {
  const raw = readFileSync(envPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    // Don't override vars that were already set in the real env
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.error('Could not read .env.local — make sure it exists next to this script.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Validate CLI arg
// ---------------------------------------------------------------------------
const to = process.argv[2];
if (!to) {
  console.error('Usage: node test-whatsapp-send.mjs +91XXXXXXXXXX');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3. Inline the same logic as sendTemplateMessage() from lib/whatsapp/client.ts
//    (we can't import .ts directly in plain Node — we replicate the 10-line
//    fetch call so there's no transpile step required)
// ---------------------------------------------------------------------------
const TEMPLATE_NAME = 'hello_world'; // ← change here to try a different template
const GRAPH_API_VERSION = 'v25.0';

const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;

if (!phoneNumberId || !accessToken) {
  console.error('Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN in .env.local');
  process.exit(1);
}

console.log(`\nSending WhatsApp test message`);
console.log(`  To:       ${to}`);
console.log(`  Template: ${TEMPLATE_NAME}   ← verify this is "hello_world", not "order_review_request"`);
console.log(`  Phone ID: ${phoneNumberId}\n`);

const payload = {
  messaging_product: 'whatsapp',
  to,
  type: 'template',
  template: {
    name: TEMPLATE_NAME,
    language: { code: 'en_US' },
  },
};

try {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  const json = await res.json();

  console.log('--- Full API response ---');
  console.log(JSON.stringify(json, null, 2));
  console.log('-------------------------\n');

  if (res.ok) {
    const msgId = json?.messages?.[0]?.id ?? '(no id)';
    console.log(`✅  SUCCESS — message queued. Meta message ID: ${msgId}`);
  } else {
    const errMsg = json?.error?.message ?? JSON.stringify(json);
    console.log(`❌  FAILED — Meta returned ${res.status}: ${errMsg}`);
    process.exit(1);
  }
} catch (err) {
  console.error('❌  Network or unexpected error:', err.message);
  process.exit(1);
}
