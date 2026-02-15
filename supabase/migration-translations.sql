-- ============================================================
-- MIGRATION: Multi-language Menu Translations
-- ============================================================

-- Add default_language and supported_languages to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS default_language TEXT DEFAULT 'es';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS supported_languages TEXT[] DEFAULT ARRAY['es'];

-- Product translations
CREATE TABLE IF NOT EXISTS product_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, language)
);

-- Category translations
CREATE TABLE IF NOT EXISTS category_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, language)
);

-- RLS
ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;

-- Owner manages translations (through product/category ownership)
CREATE POLICY "Owner manages product translations" ON product_translations
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN restaurants r ON p.restaurant_id = r.id
      WHERE r.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Owner manages category translations" ON category_translations
  FOR ALL USING (
    category_id IN (
      SELECT c.id FROM categories c
      JOIN restaurants r ON c.restaurant_id = r.id
      WHERE r.owner_user_id = auth.uid()
    )
  );

-- Public reads translations
CREATE POLICY "Public reads product translations" ON product_translations
  FOR SELECT USING (true);

CREATE POLICY "Public reads category translations" ON category_translations
  FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_translations_product ON product_translations(product_id, language);
CREATE INDEX IF NOT EXISTS idx_category_translations_category ON category_translations(category_id, language);
