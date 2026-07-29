-- ═══════════════════════════════════════════════════════════════════════════
-- Angadi — Multilingual Schema Migration
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create languages table
CREATE TABLE IF NOT EXISTS languages (
    code      TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Seed supported languages
INSERT INTO languages (code, name, is_active) VALUES
  ('en', 'English', true),
  ('ml', 'Malayalam', true),
  ('hi', 'Hindi', true),
  ('ar', 'Arabic', true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- 2. Update user_profiles preferred_language default constraint
ALTER TABLE user_profiles 
  ALTER COLUMN preferred_language SET DEFAULT 'en';

-- Ensure all existing profiles with null preferred_language are defaulted to 'en'
UPDATE user_profiles 
  SET preferred_language = 'en' 
  WHERE preferred_language IS NULL;

-- 3. Create translation tables
CREATE TABLE IF NOT EXISTS category_translations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT now(),
    updated_at    TIMESTAMP DEFAULT now(),
    UNIQUE (category_id, language_code)
);

CREATE TABLE IF NOT EXISTS demo_item_translations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_item_id  UUID NOT NULL REFERENCES demo_items(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT now(),
    updated_at    TIMESTAMP DEFAULT now(),
    UNIQUE (demo_item_id, language_code)
);

CREATE TABLE IF NOT EXISTS item_translations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id       UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    description   TEXT,
    created_at    TIMESTAMP DEFAULT now(),
    updated_at    TIMESTAMP DEFAULT now(),
    UNIQUE (item_id, language_code)
);

CREATE TABLE IF NOT EXISTS variant_translations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id    UUID NOT NULL REFERENCES item_variants(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
    label         TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT now(),
    updated_at    TIMESTAMP DEFAULT now(),
    UNIQUE (variant_id, language_code)
);

-- 4. Enable Row Level Security (RLS) on new tables
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_item_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_translations ENABLE ROW LEVEL SECURITY;

-- Drop previous policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to languages" ON languages;
DROP POLICY IF EXISTS "Allow public read access to category_translations" ON category_translations;
DROP POLICY IF EXISTS "Allow public read access to demo_item_translations" ON demo_item_translations;
DROP POLICY IF EXISTS "Allow public read access to item_translations" ON item_translations;
DROP POLICY IF EXISTS "Allow public read access to variant_translations" ON variant_translations;

DROP POLICY IF EXISTS "Allow admin write languages" ON languages;
DROP POLICY IF EXISTS "Allow admin write category_translations" ON category_translations;
DROP POLICY IF EXISTS "Allow admin write demo_item_translations" ON demo_item_translations;
DROP POLICY IF EXISTS "Allow admin write item_translations" ON item_translations;
DROP POLICY IF EXISTS "Allow admin write variant_translations" ON variant_translations;

-- Read policies: Allow all users (public) to view translations
CREATE POLICY "Allow public read access to languages" ON languages FOR SELECT USING (true);
CREATE POLICY "Allow public read access to category_translations" ON category_translations FOR SELECT USING (true);
CREATE POLICY "Allow public read access to demo_item_translations" ON demo_item_translations FOR SELECT USING (true);
CREATE POLICY "Allow public read access to item_translations" ON item_translations FOR SELECT USING (true);
CREATE POLICY "Allow public read access to variant_translations" ON variant_translations FOR SELECT USING (true);

-- Write/Modify policies: Allow service_role / admins (or application queries) full access
CREATE POLICY "Allow admin write languages" ON languages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write category_translations" ON category_translations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write demo_item_translations" ON demo_item_translations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write item_translations" ON item_translations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin write variant_translations" ON variant_translations FOR ALL USING (true) WITH CHECK (true);

-- 5. Triggers to automatically update updated_at on modify
DROP TRIGGER IF EXISTS trg_category_translations_updated_at ON category_translations;
CREATE TRIGGER trg_category_translations_updated_at
  BEFORE UPDATE ON category_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_demo_item_translations_updated_at ON demo_item_translations;
CREATE TRIGGER trg_demo_item_translations_updated_at
  BEFORE UPDATE ON demo_item_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_item_translations_updated_at ON item_translations;
CREATE TRIGGER trg_item_translations_updated_at
  BEFORE UPDATE ON item_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_variant_translations_updated_at ON variant_translations;
CREATE TRIGGER trg_variant_translations_updated_at
  BEFORE UPDATE ON variant_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Create index on foreign keys for optimization
CREATE INDEX IF NOT EXISTS idx_category_trans_cat_id ON category_translations(category_id);
CREATE INDEX IF NOT EXISTS idx_demo_item_trans_demo_id ON demo_item_translations(demo_item_id);
CREATE INDEX IF NOT EXISTS idx_item_trans_item_id ON item_translations(item_id);
CREATE INDEX IF NOT EXISTS idx_variant_trans_var_id ON variant_translations(variant_id);

-- 7. Multilingual search RPC function
CREATE OR REPLACE FUNCTION search_items_multilingual(search_query TEXT)
RETURNS SETOF items AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT i.*
  FROM items i
  WHERE 
    i.deleted_at IS NULL
    AND (
      i.name ILIKE '%' || search_query || '%'
      OR EXISTS (
        SELECT 1 FROM item_translations it
        WHERE it.item_id = i.id AND it.name ILIKE '%' || search_query || '%'
      )
      OR EXISTS (
        SELECT 1 FROM demo_item_translations dt
        WHERE dt.demo_item_id = i.demo_item_id AND dt.name ILIKE '%' || search_query || '%'
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
