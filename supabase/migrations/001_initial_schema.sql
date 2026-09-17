-- ============================================================
-- Retab — Initial Database Schema
-- Run this in the Supabase SQL Editor or via: supabase db push
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. cafes  (root entity — one row per cafe/restaurant)
-- ============================================================
CREATE TABLE cafes (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL,
  owner_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_phone_number_id  TEXT,
  google_review_link        TEXT,
  plan                      TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
  credit_balance            INTEGER NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;

-- Owner can only read/write their own cafe
CREATE POLICY "cafes: owner full access"
  ON cafes
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());


-- ============================================================
-- 2. users  (staff / manager / owner profile rows)
-- ============================================================
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id    UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  email      TEXT,
  pin_hash   TEXT,            -- bcrypt hash; only set for staff/manager PIN login
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read users that belong to their own cafe
CREATE POLICY "users: read own cafe"
  ON users
  FOR SELECT
  USING (
    cafe_id IN (
      SELECT cafe_id FROM users WHERE id = auth.uid()
    )
  );

-- Only the owner can insert / update / delete staff rows
CREATE POLICY "users: owner manage"
  ON users
  FOR ALL
  USING (
    cafe_id IN (
      SELECT id FROM cafes WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    cafe_id IN (
      SELECT id FROM cafes WHERE owner_id = auth.uid()
    )
  );


-- ============================================================
-- 3. menu_items
-- ============================================================
CREATE TABLE menu_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id    UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'Uncategorised',
  price      INTEGER NOT NULL CHECK (price >= 0),  -- smallest unit (paise/cents)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_items: same cafe read"
  ON menu_items
  FOR SELECT
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "menu_items: owner/manager write"
  ON menu_items
  FOR ALL
  USING (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );


-- ============================================================
-- 4. customers
-- ============================================================
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id     UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Guest',
  phone       TEXT NOT NULL,
  first_visit TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_visit  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visit_count INTEGER NOT NULL DEFAULT 0,
  total_spend INTEGER NOT NULL DEFAULT 0,           -- cumulative, smallest currency unit
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cafe_id, phone)                           -- one customer row per phone per cafe
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers: same cafe read"
  ON customers
  FOR SELECT
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "customers: same cafe write"
  ON customers
  FOR ALL
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
  );


-- ============================================================
-- 5. orders
-- ============================================================
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id         UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,  -- filled by trigger
  customer_phone  TEXT NOT NULL,    -- used by trigger to upsert customer
  total_amount    INTEGER NOT NULL CHECK (total_amount >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders: same cafe read"
  ON orders
  FOR SELECT
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "orders: same cafe write"
  ON orders
  FOR ALL
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
  );


-- ============================================================
-- 6. order_items
-- ============================================================
CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity      INTEGER NOT NULL CHECK (quantity > 0)
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Join through orders → cafe_id for the policy check
CREATE POLICY "order_items: same cafe read"
  ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "order_items: same cafe write"
  ON order_items
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
    )
  );


-- ============================================================
-- 7. reviews
-- ============================================================
CREATE TABLE reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id    UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback_text  TEXT,
  is_private     BOOLEAN NOT NULL DEFAULT FALSE,  -- false → redirect to Google
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews: same cafe read"
  ON reviews
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "reviews: same cafe write"
  ON reviews
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
    )
  );


-- ============================================================
-- 8. messages_log
-- ============================================================
CREATE TABLE messages_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id      UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('bill', 'review_request', 'reply')),
  channel      TEXT NOT NULL CHECK (channel IN ('whatsapp')),
  cost         INTEGER NOT NULL DEFAULT 1,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE messages_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_log: same cafe read"
  ON messages_log
  FOR SELECT
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "messages_log: same cafe write"
  ON messages_log
  FOR ALL
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
  );


-- ============================================================
-- 9. credit_transactions
-- ============================================================
CREATE TABLE credit_transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id    UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,     -- positive = purchase, negative = debit
  type       TEXT NOT NULL CHECK (type IN ('purchase', 'debit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_transactions: same cafe read"
  ON credit_transactions
  FOR SELECT
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "credit_transactions: owner write"
  ON credit_transactions
  FOR ALL
  USING (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );


-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX idx_orders_cafe_id         ON orders(cafe_id);
CREATE INDEX idx_orders_customer_id     ON orders(customer_id);
CREATE INDEX idx_customers_cafe_phone   ON customers(cafe_id, phone);
CREATE INDEX idx_menu_items_cafe_id     ON menu_items(cafe_id);
CREATE INDEX idx_reviews_order_id       ON reviews(order_id);
CREATE INDEX idx_messages_log_cafe_id   ON messages_log(cafe_id);
CREATE INDEX idx_credit_txns_cafe_id    ON credit_transactions(cafe_id);


-- ============================================================
-- Trigger: handle_order_customer_upsert
--
-- Fires AFTER INSERT on orders.
-- Atomically:
--   1. Upserts a row in customers matched by (cafe_id, customer_phone)
--   2. Increments visit_count by 1
--   3. Adds order total_amount to total_spend
--   4. Updates last_visit to NOW()
--   5. Sets orders.customer_id to the resolved/created customer UUID
-- ============================================================
CREATE OR REPLACE FUNCTION handle_order_customer_upsert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER        -- runs as the function owner (superuser), bypassing RLS
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- 1. Upsert into customers.
  --    ON CONFLICT (cafe_id, phone): update stats in-place.
  INSERT INTO customers (cafe_id, phone, visit_count, total_spend, last_visit)
  VALUES (
    NEW.cafe_id,
    NEW.customer_phone,
    1,
    NEW.total_amount,
    NOW()
  )
  ON CONFLICT (cafe_id, phone) DO UPDATE
    SET
      visit_count = customers.visit_count + 1,
      total_spend = customers.total_spend + EXCLUDED.total_spend,
      last_visit  = NOW()
  RETURNING id INTO v_customer_id;

  -- 2. Patch the just-inserted order row with the resolved customer_id.
  UPDATE orders
  SET customer_id = v_customer_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_insert
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_customer_upsert();


-- ============================================================
-- Helper RPC: deduct_credit
-- Called from app/api/whatsapp/send/route.ts after sending a message.
-- Decrements cafes.credit_balance and logs a credit_transactions debit.
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_credit(p_cafe_id UUID, p_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE cafes
  SET credit_balance = credit_balance - p_amount
  WHERE id = p_cafe_id;

  INSERT INTO credit_transactions (cafe_id, amount, type)
  VALUES (p_cafe_id, -p_amount, 'debit');
END;
$$;
