-- ============================================================
-- Migration 011 — WhatsApp review branching columns
--
-- Adds columns required for the WhatsApp button-reply → rating
-- branching flow and the free-text follow-up feedback loop.
--
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS.
-- ============================================================

-- 1. Make order_id nullable so WhatsApp-originated reviews (which
--    have no POS order) can be inserted without a dummy order row.
ALTER TABLE reviews
  ALTER COLUMN order_id DROP NOT NULL;

-- 2. Make customer_id nullable for the same reason — WhatsApp reviews
--    are keyed by phone, not by a pre-existing customers row.
ALTER TABLE reviews
  ALTER COLUMN customer_id DROP NOT NULL;

-- 3. Add cafe_id so WhatsApp reviews can be tenant-scoped directly
--    without joining through orders (which may be NULL).
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE;

-- 4. Store the sender's phone in E.164 — used for the 24h follow-up
--    lookup (awaiting_feedback window) independent of customer_id.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- 5. Text-enum rating label — parallel to the existing numeric rating.
--    WhatsApp button taps write here; POS flow continues using rating (SMALLINT).
--    CHECK constraint keeps values bounded.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS rating_label TEXT
    CHECK (rating_label IN ('loved_it', 'okay', 'needs_improvement'));

-- 6. is_resolved — dashboard "mark resolved" flag.
--    Already used in application code; added here for completeness.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN NOT NULL DEFAULT FALSE;

-- 7. awaiting_feedback — true while we're waiting for the customer
--    to reply with free-text ("Could be better" path only).
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS awaiting_feedback BOOLEAN NOT NULL DEFAULT FALSE;

-- Index so the 24h follow-up query is fast: filter by phone +
-- awaiting_feedback + created_at, scoped to a cafe.
CREATE INDEX IF NOT EXISTS idx_reviews_phone_awaiting
  ON reviews (customer_phone, awaiting_feedback, created_at DESC)
  WHERE awaiting_feedback = TRUE;
