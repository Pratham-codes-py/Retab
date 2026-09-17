-- ============================================================
-- Retab — Migration 008: Supabase Auth for Staff
--
-- Replaces the custom RPC/cookie staff-login system with real
-- Supabase Auth accounts. Every staff member now has a real
-- auth.users row; the users table links to it via auth_user_id.
-- ============================================================


-- 1. Add auth_user_id column to users (nullable initially for back-fill)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Back-fill owner rows: the owner's users.id IS their auth.users id
--    (setupCafe inserts with id: user.id, so they match already).
UPDATE users
SET auth_user_id = id
WHERE role = 'owner'
  AND auth_user_id IS NULL
  AND EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = users.id);

-- 3. Drop old plain-text pin column (auth is now in Supabase Auth).
--    Keep plain 'pin' column as a lookup key so login can find the email.
--    Drop pin_hash — bcrypt is no longer used.
ALTER TABLE users DROP COLUMN IF EXISTS pin_hash;

-- 4. Drop old RPC functions that are replaced by real Supabase Auth.
DROP FUNCTION IF EXISTS verify_staff_login(TEXT, TEXT);
DROP FUNCTION IF EXISTS check_staff_exists(UUID, UUID);
DROP FUNCTION IF EXISTS get_staff_cafe(UUID, UUID);

-- 5. Update RLS policies so the real auth session (auth.uid()) works for
--    both owners and staff. The key is that users.auth_user_id = auth.uid().

-- Drop old policies on users table that relied on users.id = auth.uid()
DROP POLICY IF EXISTS "users: read own cafe" ON users;
DROP POLICY IF EXISTS "users: owner manage" ON users;

-- Unified read: any authenticated user whose auth_user_id matches a row
-- in users can read all users in the same cafe.
CREATE POLICY "users: read own cafe v2"
  ON users
  FOR SELECT
  USING (
    cafe_id IN (
      SELECT cafe_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Owner-only write: only if the user owns the cafe (owner_id check on cafes).
CREATE POLICY "users: owner manage v2"
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

-- 6. Update cafes RLS: owners already use owner_id = auth.uid().
--    Staff need SELECT access to read their own cafe's data.
--    Drop and recreate the cafe policy to add staff read access.
DROP POLICY IF EXISTS "cafes: owner full access" ON cafes;

CREATE POLICY "cafes: owner full access v2"
  ON cafes
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "cafes: staff read own cafe"
  ON cafes
  FOR SELECT
  USING (
    id IN (
      SELECT cafe_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- 7. Update all other table policies to resolve staff sessions correctly.
--    These policies join through users.cafe_id but currently key on users.id = auth.uid().
--    We need them to key on users.auth_user_id = auth.uid() instead.

-- menu_items
DROP POLICY IF EXISTS "menu_items: same cafe read" ON menu_items;
DROP POLICY IF EXISTS "menu_items: owner/manager write" ON menu_items;

CREATE POLICY "menu_items: same cafe read v2"
  ON menu_items
  FOR SELECT
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "menu_items: owner/manager write v2"
  ON menu_items
  FOR ALL
  USING (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );

-- customers
DROP POLICY IF EXISTS "customers: same cafe read" ON customers;
DROP POLICY IF EXISTS "customers: same cafe write" ON customers;

CREATE POLICY "customers: same cafe read v2"
  ON customers
  FOR SELECT
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "customers: same cafe write v2"
  ON customers
  FOR ALL
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
  );

-- orders
DROP POLICY IF EXISTS "orders: same cafe read" ON orders;
DROP POLICY IF EXISTS "orders: same cafe write" ON orders;

CREATE POLICY "orders: same cafe read v2"
  ON orders
  FOR SELECT
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "orders: same cafe write v2"
  ON orders
  FOR ALL
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
  );

-- order_items
DROP POLICY IF EXISTS "order_items: same cafe read" ON order_items;
DROP POLICY IF EXISTS "order_items: same cafe write" ON order_items;

CREATE POLICY "order_items: same cafe read v2"
  ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "order_items: same cafe write v2"
  ON order_items
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- reviews
DROP POLICY IF EXISTS "reviews: same cafe read" ON reviews;
DROP POLICY IF EXISTS "reviews: same cafe write" ON reviews;

CREATE POLICY "reviews: same cafe read v2"
  ON reviews
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "reviews: same cafe write v2"
  ON reviews
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders
      WHERE cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- messages_log
DROP POLICY IF EXISTS "messages_log: same cafe read" ON messages_log;
DROP POLICY IF EXISTS "messages_log: same cafe write" ON messages_log;

CREATE POLICY "messages_log: same cafe read v2"
  ON messages_log
  FOR SELECT
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "messages_log: same cafe write v2"
  ON messages_log
  FOR ALL
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
  );

-- credit_transactions
DROP POLICY IF EXISTS "credit_transactions: same cafe read" ON credit_transactions;
DROP POLICY IF EXISTS "credit_transactions: owner write" ON credit_transactions;

CREATE POLICY "credit_transactions: same cafe read v2"
  ON credit_transactions
  FOR SELECT
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "credit_transactions: owner write v2"
  ON credit_transactions
  FOR ALL
  USING (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );

-- 8. Add index on auth_user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
