-- ============================================================
-- Retab — Add tax_percent to cafes
-- ============================================================

ALTER TABLE cafes ADD COLUMN IF NOT EXISTS tax_percent NUMERIC NOT NULL DEFAULT 5.0;
