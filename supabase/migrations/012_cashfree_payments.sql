-- ============================================================
-- Migration 012 — Cashfree Payment tracking table
--
-- Adds the payments table and helper RPC for idempotent credit purchases.
-- ============================================================

-- ----------------------------------------------------------
-- 1. payments
-- ----------------------------------------------------------
CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id           UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  cashfree_order_id TEXT NOT NULL,
  cashfree_payment_id TEXT UNIQUE, -- null until webhook confirms payment
  amount            NUMERIC NOT NULL, -- INR amount from Cashfree
  credits           INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Owners can manage their cafe's payments
CREATE POLICY "payments: owner full access"
  ON payments
  FOR ALL
  USING (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );

-- ----------------------------------------------------------
-- 2. RPC: credit_cafe — idempotent credit top‑up
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION credit_cafe(
  p_payment_id TEXT,
  p_order_id  TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cafe_id   UUID;
  v_credits   INTEGER;
  v_already   BOOLEAN := false;
BEGIN
  -- Guard: prevent duplicate credit posting for the same Cashfree payment ID
  IF EXISTS (
    SELECT 1
    FROM payments
    WHERE cashfree_payment_id = p_payment_id
      AND status = 'paid'
  ) THEN
    RETURN false;
  END IF;

  -- Lock the row so concurrent calls wait on the same order
  UPDATE payments
  SET status = 'paid', cashfree_payment_id = p_payment_id
  WHERE cashfree_order_id = p_order_id AND status = 'created'
  RETURNING cafe_id, credits INTO v_cafe_id, v_credits;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Credit the cafe's balance
  UPDATE cafes
  SET credit_balance = credit_balance + v_credits
  WHERE id = v_cafe_id;

  -- Audit the credit addition
  INSERT INTO credit_transactions (
    cafe_id, amount, type, created_at
  ) VALUES (
    v_cafe_id,
    v_credits,
    'purchase',
    NOW()
  );

  RETURN true;
END;
$$;