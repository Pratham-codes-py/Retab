-- ============================================================
-- Retab — Add Slug to Cafes Table
-- ============================================================

-- 1. Add slug column (nullable initially)
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Create slug generator function
CREATE OR REPLACE FUNCTION generate_cafe_slug()
RETURNS TRIGGER AS $$
DECLARE
  v_base_slug TEXT;
  v_slug TEXT;
  v_counter INTEGER := 1;
BEGIN
  -- If slug is not provided or is empty, generate it
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Lowercase, replace non-alphanumeric with hyphen
    v_base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Trim hyphens from ends
    v_base_slug := regexp_replace(v_base_slug, '^-+|-+$', '', 'g');
    
    IF v_base_slug = '' THEN
      v_base_slug := 'cafe';
    END IF;
    
    v_slug := v_base_slug;
    
    -- Collision check loop
    WHILE EXISTS (SELECT 1 FROM cafes WHERE slug = v_slug AND id != NEW.id) LOOP
      v_slug := v_base_slug || '-' || v_counter;
      v_counter := v_counter + 1;
    END LOOP;
    
    NEW.slug := v_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger
DROP TRIGGER IF EXISTS trigger_generate_cafe_slug ON cafes;
CREATE TRIGGER trigger_generate_cafe_slug
  BEFORE INSERT OR UPDATE OF name, slug ON cafes
  FOR EACH ROW
  EXECUTE FUNCTION generate_cafe_slug();

-- 4. Update existing cafes to trigger slug generation
UPDATE cafes SET name = name WHERE slug IS NULL;

-- 5. Add unique constraint and make it not null
ALTER TABLE cafes ALTER COLUMN slug SET NOT NULL;
ALTER TABLE cafes ADD CONSTRAINT cafes_slug_unique UNIQUE (slug);
