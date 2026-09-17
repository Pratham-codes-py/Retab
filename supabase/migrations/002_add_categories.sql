-- ============================================================
-- Retab — Add Categories Table & Update Menu Items
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id    UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cafe_id, name)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories: same cafe read"
  ON categories
  FOR SELECT
  USING (
    cafe_id IN (SELECT cafe_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "categories: owner/manager write"
  ON categories
  FOR ALL
  USING (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    cafe_id IN (SELECT id FROM cafes WHERE owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_categories_cafe_id ON categories(cafe_id);

-- Add available column to menu_items if it doesn't exist
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available BOOLEAN NOT NULL DEFAULT true;
