-- ============================================================
-- Retab — Staff Login and Per-Staff Revenue Tracking Schema
-- ============================================================

-- 1. Add cafe_code column to cafes table (nullable initially)
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS cafe_code TEXT;

-- 2. Create function to generate a unique 6-character cafe code (uppercase letters + numbers)
CREATE OR REPLACE FUNCTION generate_unique_cafe_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT;
  i INT;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Collision check: check if code is already used in cafes
    IF NOT EXISTS (SELECT 1 FROM cafes WHERE cafe_code = code) THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Populate existing cafes with a unique code
UPDATE cafes SET cafe_code = generate_unique_cafe_code() WHERE cafe_code IS NULL;

-- 4. Set NOT NULL and UNIQUE constraints on cafe_code
ALTER TABLE cafes ALTER COLUMN cafe_code SET NOT NULL;
ALTER TABLE cafes ADD CONSTRAINT cafes_cafe_code_unique UNIQUE (cafe_code);

-- 5. Set default value for future inserts
ALTER TABLE cafes ALTER COLUMN cafe_code SET DEFAULT generate_unique_cafe_code();


-- 6. Add plain-text pin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin TEXT;


-- 7. Create RPC function for secure staff login verification
-- Since this is defined as SECURITY DEFINER, it bypasses RLS and runs with superuser privileges.
-- This allows unauthenticated staff login pages to verify credentials without requiring a service role key.
CREATE OR REPLACE FUNCTION verify_staff_login(p_cafe_code TEXT, p_pin TEXT)
RETURNS TABLE (
  id UUID,
  cafe_id UUID,
  role TEXT,
  name TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.cafe_id, u.role, u.name
  FROM users u
  JOIN cafes c ON u.cafe_id = c.id
  WHERE UPPER(c.cafe_code) = UPPER(p_cafe_code)
    AND u.pin = p_pin
    AND u.role IN ('manager', 'staff');
END;
$$ LANGUAGE plpgsql;

-- Grant execution to anon and authenticated roles so unauthenticated users can verify login
GRANT EXECUTE ON FUNCTION verify_staff_login(TEXT, TEXT) TO anon, authenticated;


-- 8. Add a nullable created_by column to the orders table referencing users.id
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;


-- 9. Create an RPC function to check if a staff member exists, bypassing RLS
CREATE OR REPLACE FUNCTION check_staff_exists(p_user_id UUID, p_cafe_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = p_user_id 
      AND cafe_id = p_cafe_id
      AND role IN ('manager', 'staff')
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execution to anon and authenticated roles so unauthenticated layouts can resolve session
GRANT EXECUTE ON FUNCTION check_staff_exists(UUID, UUID) TO anon, authenticated;


-- 10. Create RPC function to fetch cafe details for a verified staff member
CREATE OR REPLACE FUNCTION get_staff_cafe(p_user_id UUID, p_cafe_id UUID)
RETURNS SETOF cafes
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM users WHERE id = p_user_id AND cafe_id = p_cafe_id AND role IN ('manager', 'staff')
  ) THEN
    RETURN QUERY SELECT * FROM cafes WHERE id = p_cafe_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_staff_cafe(UUID, UUID) TO anon, authenticated;
