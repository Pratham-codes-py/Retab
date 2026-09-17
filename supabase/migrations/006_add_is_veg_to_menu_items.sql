-- ============================================================
-- Retab — Add Veg/Non-Veg Toggle Column to Menu Items
-- ============================================================

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN NOT NULL DEFAULT true;
