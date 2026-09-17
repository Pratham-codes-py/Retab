-- ============================================================
-- Retab — Fix RLS Policy Infinite Recursion
-- ============================================================

-- Drop the recursive SELECT policy on public.users
DROP POLICY IF EXISTS "users: read own cafe" ON users;

-- Recreate a recursion-free SELECT policy on public.users
-- This permits:
-- 1. Users to read their own user profile row (id = auth.uid())
-- 2. Owners to read all user profile rows belonging to their cafe
CREATE POLICY "users: read own cafe"
  ON users
  FOR SELECT
  USING (
    id = auth.uid()
    OR
    cafe_id IN (
      SELECT id FROM cafes WHERE owner_id = auth.uid()
    )
  );
