-- Migration 010: Fix menu_items write RLS policy for staff

-- Drop the old policy which only allowed cafe owners
DROP POLICY IF EXISTS "menu_items: owner/manager write v2" ON menu_items;
DROP POLICY IF EXISTS "menu_items: owner/manager write" ON menu_items;

-- Create the new v3 write policy allowing owners and staff (using the helper)
CREATE POLICY "menu_items: same cafe write v3"
  ON menu_items
  FOR ALL
  USING (
    cafe_id = auth_user_cafe_id()
    OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    cafe_id = auth_user_cafe_id()
    OR cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );
