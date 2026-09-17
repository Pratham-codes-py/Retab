-- ============================================================
-- Retab — Migration 009: Fix RLS Infinite Recursion
--
-- Root cause: migration 008 created a "users: read own cafe v2"
-- policy on the users table that queries the users table itself:
--
--   USING (cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid()))
--                                         ^^^^^^^^^^^ recursive!
--
-- PostgreSQL catches this immediately: "infinite recursion detected
-- in policy for relation users".
--
-- Additionally, any other table policy that contained a subquery
-- SELECT ... FROM users triggered the same recursion when Postgres
-- evaluated the users RLS while processing that subquery.
--
-- Fix strategy:
--   1. Create a SECURITY DEFINER helper function that looks up the
--      caller's cafe_id by bypassing RLS entirely — no recursion.
--   2. Rewrite the users table policy to use auth_user_id = auth.uid()
--      directly (no subquery into users at all).
--   3. Rewrite every other table's staff-read policy to call the
--      helper function instead of SELECT ... FROM users.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. SECURITY DEFINER helper: returns the current user's cafe_id
--    by reading the users table with RLS bypassed.
--    Returns NULL for owners (who don't have a staff profile row)
--    or for unauthenticated callers.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth_user_cafe_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cafe_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION auth_user_cafe_id() TO authenticated, anon;


-- ─────────────────────────────────────────────────────────────
-- 2. Fix users table — drop and replace the recursive policy.
--
--    New logic (no subquery into users):
--      • Any user can read their own row (auth_user_id = auth.uid())
--      • An owner can read all rows in their cafe
--        (cafe_id IN cafes owned by auth.uid())
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users: read own cafe v2" ON users;

CREATE POLICY "users: read own cafe v3"
  ON users
  FOR SELECT
  USING (
    auth_user_id = auth.uid()
    OR cafe_id IN (
      SELECT id FROM cafes WHERE owner_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 3. Fix cafes — staff read policy used a subquery into users
--    which cascaded into the recursive users policy.
--    Replace with the SECURITY DEFINER helper.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cafes: staff read own cafe" ON cafes;

CREATE POLICY "cafes: staff read own cafe v2"
  ON cafes
  FOR SELECT
  USING (id = auth_user_cafe_id());


-- ─────────────────────────────────────────────────────────────
-- 4. Fix all other tables — replace every
--      cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
--    with:
--      cafe_id = auth_user_cafe_id()
--      OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
--
--    The OR arm covers owners who don't have a staff users row
--    (auth_user_cafe_id() would return NULL for them).
-- ─────────────────────────────────────────────────────────────

-- menu_items
DROP POLICY IF EXISTS "menu_items: same cafe read v2" ON menu_items;

CREATE POLICY "menu_items: same cafe read v3"
  ON menu_items
  FOR SELECT
  USING (
    cafe_id = auth_user_cafe_id()
    OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );

-- customers
DROP POLICY IF EXISTS "customers: same cafe read v2" ON customers;
DROP POLICY IF EXISTS "customers: same cafe write v2" ON customers;

CREATE POLICY "customers: same cafe read v3"
  ON customers
  FOR SELECT
  USING (
    cafe_id = auth_user_cafe_id()
    OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );

CREATE POLICY "customers: same cafe write v3"
  ON customers
  FOR ALL
  USING (
    cafe_id = auth_user_cafe_id()
    OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    cafe_id = auth_user_cafe_id()
    OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );

-- orders
DROP POLICY IF EXISTS "orders: same cafe read v2" ON orders;
DROP POLICY IF EXISTS "orders: same cafe write v2" ON orders;

CREATE POLICY "orders: same cafe read v3"
  ON orders
  FOR SELECT
  USING (
    cafe_id = auth_user_cafe_id()
    OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );

CREATE POLICY "orders: same cafe write v3"
  ON orders
  FOR ALL
  USING (
    cafe_id = auth_user_cafe_id()
    OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    cafe_id = auth_user_cafe_id()
    OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );

-- order_items (joins through orders → cafe_id)
DROP POLICY IF EXISTS "order_items: same cafe read v2" ON order_items;
DROP POLICY IF EXISTS "order_items: same cafe write v2" ON order_items;

CREATE POLICY "order_items: same cafe read v3"
  ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id = auth_user_cafe_id()
         OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "order_items: same cafe write v3"
  ON order_items
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id = auth_user_cafe_id()
         OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id = auth_user_cafe_id()
         OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
    )
  );

-- reviews (joins through orders → cafe_id)
DROP POLICY IF EXISTS "reviews: same cafe read v2" ON reviews;
DROP POLICY IF EXISTS "reviews: same cafe write v2" ON reviews;

CREATE POLICY "reviews: same cafe read v3"
  ON reviews
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id = auth_user_cafe_id()
         OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "reviews: same cafe write v3"
  ON reviews
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id = auth_user_cafe_id()
         OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id = auth_user_cafe_id()
         OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
    )
  );

-- messages_log
DROP POLICY IF EXISTS "messages_log: same cafe read v2" ON messages_log;
DROP POLICY IF EXISTS "messages_log: same cafe write v2" ON messages_log;

CREATE POLICY "messages_log: same cafe read v3"
  ON messages_log
  FOR SELECT
  USING (
    cafe_id = auth_user_cafe_id()
    OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );

CREATE POLICY "messages_log: same cafe write v3"
  ON messages_log
  FOR ALL
  USING (
    cafe_id = auth_user_cafe_id()
    OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    cafe_id = auth_user_cafe_id()
    OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );

-- credit_transactions
DROP POLICY IF EXISTS "credit_transactions: same cafe read v2" ON credit_transactions;
DROP POLICY IF EXISTS "credit_transactions: owner write v2" ON credit_transactions;

CREATE POLICY "credit_transactions: same cafe read v3"
  ON credit_transactions
  FOR SELECT
  USING (
    cafe_id = auth_user_cafe_id()
    OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );

CREATE POLICY "credit_transactions: owner write v3"
  ON credit_transactions
  FOR ALL
  USING (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );
