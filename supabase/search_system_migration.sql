-- ═══════════════════════════════════════════════════════════════════════════
-- Angadi — Product Search System Migration
-- PostgreSQL / Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Define Normalization Function
CREATE OR REPLACE FUNCTION normalize_search_query(input TEXT)
RETURNS TEXT AS $$
DECLARE
  val TEXT;
BEGIN
  -- Convert uppercase to lowercase
  val := lower(input);
  
  -- Normalize Unicode (NFC) if supported by the DB version
  BEGIN
    val := normalize(val, NFC);
  EXCEPTION WHEN OTHERS THEN
    -- Fallback if normalize function is not available
  END;

  -- Remove punctuation, symbols, and all whitespace to produce a continuous clean token
  val := regexp_replace(val, '[^\w]', '', 'g');
  RETURN val;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Define Multilingual Phonetic Key Function (specifically tuned for English & Manglish transliterations)
CREATE OR REPLACE FUNCTION generate_phonetic_key(input TEXT)
RETURNS TEXT AS $$
DECLARE
  val TEXT;
BEGIN
  val := lower(input);
  
  -- Clean punctuation and spaces but keep word characters
  val := regexp_replace(val, '[^\w\s]', '', 'g');
  
  -- If input contains Latin (a-z) letters, apply phonetic rules for Manglish transliteration
  IF val ~ '[a-z]' THEN
    -- Keep only Latin characters
    val := regexp_replace(val, '[^a-z]', '', 'g');
    
    -- Map common phonetic variants in Manglish
    val := regexp_replace(val, 'zh', 'l', 'g'); -- kozhi -> koli
    val := regexp_replace(val, 'w', 'v', 'g');   -- sawala -> savala
    val := regexp_replace(val, 'oo', 'u', 'g');
    val := regexp_replace(val, 'ee', 'i', 'g');
    val := regexp_replace(val, 'ea', 'i', 'g');
    val := regexp_replace(val, 'aa', 'a', 'g');
    val := regexp_replace(val, 'o', 'a', 'g');   -- savola -> savala
    val := regexp_replace(val, 'sh', 's', 'g');
    val := regexp_replace(val, 'ph', 'f', 'g');
    val := regexp_replace(val, 'y', 'i', 'g');   -- pyaz -> piaz
    
    -- Collapse duplicate consonants/vowels (ulli -> uli, thakkali -> thakali)
    val := regexp_replace(val, '([a-z0-9])\1+', '\1', 'g');
  ELSE
    -- For non-Latin scripts (Malayalam, Hindi, Arabic), collapse spaces and duplicate letters
    val := regexp_replace(val, '\s+', '', 'g');
    val := regexp_replace(val, '(.)\1+', '\1', 'g');
  END IF;
  
  RETURN val;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Create dedicated search terms table
CREATE TABLE IF NOT EXISTS item_search_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    language_code TEXT REFERENCES languages(code) ON DELETE CASCADE,
    term TEXT NOT NULL,
    normalized_term TEXT NOT NULL,
    priority INT NOT NULL DEFAULT 1,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE item_search_terms ENABLE ROW LEVEL SECURITY;

-- 6. Setup RLS Policies
DROP POLICY IF EXISTS "Allow public read access to item_search_terms" ON item_search_terms;
CREATE POLICY "Allow public read access to item_search_terms" 
  ON item_search_terms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin write item_search_terms" ON item_search_terms;
CREATE POLICY "Allow admin write item_search_terms" 
  ON item_search_terms FOR ALL USING (true) WITH CHECK (true);

-- 7. Define Indexes (optimized to avoid table scans)
CREATE INDEX IF NOT EXISTS idx_search_terms_item_id ON item_search_terms(item_id);
CREATE INDEX IF NOT EXISTS idx_search_terms_norm ON item_search_terms(normalized_term);
CREATE INDEX IF NOT EXISTS idx_search_terms_norm_pattern ON item_search_terms(normalized_term text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_search_terms_trgm ON item_search_terms USING gin (normalized_term gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_search_terms_phonetic ON item_search_terms(generate_phonetic_key(term));

-- 8. Define Rebuild Search Terms Function
CREATE OR REPLACE FUNCTION rebuild_item_search_terms(p_item_id UUID)
RETURNS VOID AS $$
DECLARE
  v_item_name TEXT;
  v_item_desc TEXT;
  v_cat_id UUID;
  v_cat_name TEXT;
  v_shop_id UUID;
  v_trans RECORD;
  v_term TEXT;
BEGIN
  -- 1. Remove all non-custom search terms for this item
  DELETE FROM item_search_terms 
  WHERE item_id = p_item_id AND is_custom = FALSE;

  -- 2. Fetch item core details
  SELECT name, description, category_id, shop_id 
  INTO v_item_name, v_item_desc, v_cat_id, v_shop_id
  FROM items 
  WHERE id = p_item_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- 3. Add base name (priority 10)
  IF v_item_name IS NOT NULL AND trim(v_item_name) <> '' THEN
    INSERT INTO item_search_terms (item_id, language_code, term, normalized_term, priority, is_custom)
    VALUES (p_item_id, 'en', v_item_name, normalize_search_query(v_item_name), 10, FALSE)
    ON CONFLICT DO NOTHING;
    
    -- Split name into separate words if multi-word name
    IF v_item_name LIKE '% %' THEN
      FOR v_term IN 
        SELECT DISTINCT lower(trim(w)) FROM regexp_split_to_table(v_item_name, '\s+') w
      LOOP
        IF length(v_term) >= 2 THEN
          INSERT INTO item_search_terms (item_id, language_code, term, normalized_term, priority, is_custom)
          VALUES (p_item_id, 'en', v_term, normalize_search_query(v_term), 6, FALSE)
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END IF;
  END IF;

  -- 4. Add base description words (priority 2)
  IF v_item_desc IS NOT NULL AND trim(v_item_desc) <> '' THEN
    FOR v_term IN 
      SELECT DISTINCT lower(trim(w)) 
      FROM regexp_split_to_table(regexp_replace(v_item_desc, '[^\w\s]', ' ', 'g'), '\s+') w
    LOOP
      IF length(v_term) >= 3 AND v_term NOT IN ('and', 'the', 'for', 'with', 'you', 'out', 'our', 'are', 'this', 'that', 'from') THEN
        INSERT INTO item_search_terms (item_id, language_code, term, normalized_term, priority, is_custom)
        VALUES (p_item_id, 'en', v_term, normalize_search_query(v_term), 2, FALSE)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  -- 5. Fetch and add item translations (priority 8 for name, 1 for description)
  FOR v_trans IN 
    SELECT language_code, name, description 
    FROM item_translations 
    WHERE item_id = p_item_id
  LOOP
    IF v_trans.name IS NOT NULL AND trim(v_trans.name) <> '' THEN
      INSERT INTO item_search_terms (item_id, language_code, term, normalized_term, priority, is_custom)
      VALUES (p_item_id, v_trans.language_code, v_trans.name, normalize_search_query(v_trans.name), 8, FALSE)
      ON CONFLICT DO NOTHING;

      -- If translated name is multi-word
      IF v_trans.name LIKE '% %' THEN
        FOR v_term IN 
          SELECT DISTINCT lower(trim(w)) FROM regexp_split_to_table(v_trans.name, '\s+') w
        LOOP
          IF length(v_term) >= 2 THEN
            INSERT INTO item_search_terms (item_id, language_code, term, normalized_term, priority, is_custom)
            VALUES (p_item_id, v_trans.language_code, v_term, normalize_search_query(v_term), 5, FALSE)
            ON CONFLICT DO NOTHING;
          END IF;
        END LOOP;
      END IF;
    END IF;
    
    IF v_trans.description IS NOT NULL AND trim(v_trans.description) <> '' THEN
      FOR v_term IN 
        SELECT DISTINCT lower(trim(w)) 
        FROM regexp_split_to_table(regexp_replace(v_trans.description, '[^\w\s]', ' ', 'g'), '\s+') w
      LOOP
        IF length(v_term) >= 3 THEN
          INSERT INTO item_search_terms (item_id, language_code, term, normalized_term, priority, is_custom)
          VALUES (p_item_id, v_trans.language_code, v_term, normalize_search_query(v_term), 1, FALSE)
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END IF;
  END FOR;

  -- 6. Add category names (English + translations) (priority 5 for category)
  IF v_cat_id IS NOT NULL THEN
    SELECT name INTO v_cat_name FROM categories WHERE id = v_cat_id AND is_active = TRUE;
    IF FOUND AND v_cat_name IS NOT NULL AND trim(v_cat_name) <> '' THEN
      INSERT INTO item_search_terms (item_id, language_code, term, normalized_term, priority, is_custom)
      VALUES (p_item_id, 'en', v_cat_name, normalize_search_query(v_cat_name), 5, FALSE)
      ON CONFLICT DO NOTHING;
    END IF;

    FOR v_trans IN 
      SELECT language_code, name 
      FROM category_translations 
      WHERE category_id = v_cat_id
    LOOP
      IF v_trans.name IS NOT NULL AND trim(v_trans.name) <> '' THEN
        INSERT INTO item_search_terms (item_id, language_code, term, normalized_term, priority, is_custom)
        VALUES (p_item_id, v_trans.language_code, v_trans.name, normalize_search_query(v_trans.name), 4, FALSE)
        ON CONFLICT DO NOTHING;
      END IF;
    END FOR;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Setup DB Triggers to automatically update search terms on items modifications
CREATE OR REPLACE FUNCTION trg_items_sync_search_terms()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM item_search_terms WHERE item_id = OLD.id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.name <> OLD.name OR 
       NEW.description IS DISTINCT FROM OLD.description OR 
       NEW.category_id IS DISTINCT FROM OLD.category_id OR
       NEW.deleted_at IS DISTINCT FROM OLD.deleted_at OR
       NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      PERFORM rebuild_item_search_terms(NEW.id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM rebuild_item_search_terms(NEW.id);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_items_sync_search_terms ON items;
CREATE TRIGGER trg_items_sync_search_terms
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW EXECUTE FUNCTION trg_items_sync_search_terms();

-- Trigger for item translations updates
CREATE OR REPLACE FUNCTION trg_item_trans_sync_search_terms()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM rebuild_item_search_terms(OLD.item_id);
    RETURN OLD;
  ELSE
    PERFORM rebuild_item_search_terms(NEW.item_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_item_trans_sync_search_terms ON item_translations;
CREATE TRIGGER trg_item_trans_sync_search_terms
  AFTER INSERT OR UPDATE OR DELETE ON item_translations
  FOR EACH ROW EXECUTE FUNCTION trg_item_trans_sync_search_terms();

-- 10. Implement Search RPC Function (The Core Product Search System)
CREATE OR REPLACE FUNCTION search_products_rpc(
  p_query TEXT,
  p_lang TEXT DEFAULT 'en',
  p_similarity_threshold REAL DEFAULT 0.3,
  p_shop_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  item_description TEXT,
  image_url TEXT,
  category_id UUID,
  category_name TEXT,
  shop_id UUID,
  shop_name TEXT,
  relevance_score REAL,
  matched_term TEXT,
  price NUMERIC,
  sell_mode sell_mode
) AS $$
DECLARE
  norm_q TEXT;
  phone_q TEXT;
  row_count INT;
BEGIN
  -- Normalize user input
  norm_q := normalize_search_query(p_query);
  phone_q := generate_phonetic_key(p_query);

  -- Set pg_trgm similarity threshold for local session execution
  EXECUTE format('SET LOCAL pg_trgm.similarity_threshold = %s', p_similarity_threshold);

  -- First attempt: Score matches on exact, prefix, phonetic, fuzzy, and partial matches
  RETURN QUERY
  WITH matched_terms AS (
    SELECT 
      ist.item_id,
      ist.term as matched_term,
      MAX(
        CASE 
          -- 1. Exact Match on normalized term
          WHEN ist.normalized_term = norm_q THEN 10.0 * ist.priority
          -- 2. Prefix Match
          WHEN ist.normalized_term LIKE norm_q || '%' THEN 7.0 * ist.priority
          -- 3. Phonetic Match
          WHEN generate_phonetic_key(ist.term) = phone_q THEN 5.0 * ist.priority
          -- 4. Fuzzy Match (pg_trgm)
          WHEN ist.normalized_term % norm_q THEN 4.0 * similarity(ist.normalized_term, norm_q) * ist.priority
          -- 5. Partial Match
          WHEN ist.normalized_term LIKE '%' || norm_q || '%' THEN 2.0 * ist.priority
          ELSE 1.0
        END
      ) as relevance
    FROM item_search_terms ist
    WHERE 
      (ist.language_code IS NULL OR ist.language_code = p_lang OR ist.language_code = 'en')
      AND (
        ist.normalized_term = norm_q
        OR ist.normalized_term LIKE norm_q || '%'
        OR generate_phonetic_key(ist.term) = phone_q
        OR ist.normalized_term % norm_q
        OR ist.normalized_term LIKE '%' || norm_q || '%'
      )
    GROUP BY ist.item_id, ist.term
  ),
  ranked_items AS (
    SELECT 
      mt.item_id,
      mt.matched_term,
      mt.relevance,
      ROW_NUMBER() OVER (PARTITION BY mt.item_id ORDER BY mt.relevance DESC) as rn
    FROM matched_terms mt
  )
  SELECT 
    i.id as item_id,
    COALESCE(it.name, i.name) as item_name,
    COALESCE(it.description, i.description) as item_description,
    img.image_url as image_url,
    c.id as category_id,
    COALESCE(ct.name, c.name) as category_name,
    s.id as shop_id,
    s.name as shop_name,
    ri.relevance::REAL as relevance_score,
    ri.matched_term,
    COALESCE(
      (SELECT min(price) FROM item_variants WHERE item_id = i.id AND is_active = true), 
      isc.price_per_base_unit
    ) as price,
    isc.sell_mode
  FROM ranked_items ri
  JOIN items i ON i.id = ri.item_id
  JOIN shops s ON s.id = i.shop_id
  LEFT JOIN categories c ON c.id = i.category_id
  LEFT JOIN item_translations it ON it.item_id = i.id AND it.language_code = p_lang
  LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = p_lang
  LEFT JOIN item_sell_config isc ON isc.item_id = i.id
  LEFT JOIN LATERAL (
    SELECT ii.image_url 
    FROM item_images ii 
    WHERE ii.item_id = i.id 
    ORDER BY ii.is_primary DESC, ii.sort_order ASC 
    LIMIT 1
  ) img ON TRUE
  WHERE 
    ri.rn = 1
    AND i.is_active = TRUE
    AND i.deleted_at IS NULL
    AND (p_shop_id IS NULL OR i.shop_id = p_shop_id)
    AND (p_category_id IS NULL OR i.category_id = p_category_id)
    AND NOT (s.type LIKE '%_inactive')
  ORDER BY relevance_score DESC;

  GET DIAGNOSTICS row_count = ROW_COUNT;

  -- Step 10: Fallback to broader fuzzy search if no results found
  IF row_count = 0 AND p_similarity_threshold > 0.15 THEN
    EXECUTE 'SET LOCAL pg_trgm.similarity_threshold = 0.15';
    
    RETURN QUERY
    WITH matched_terms AS (
      SELECT 
        ist.item_id,
        ist.term as matched_term,
        MAX(3.0 * similarity(ist.normalized_term, norm_q) * ist.priority) as relevance
      FROM item_search_terms ist
      WHERE 
        (ist.language_code IS NULL OR ist.language_code = p_lang OR ist.language_code = 'en')
        AND ist.normalized_term % norm_q
      GROUP BY ist.item_id, ist.term
    ),
    ranked_items AS (
      SELECT 
        mt.item_id,
        mt.matched_term,
        mt.relevance,
        ROW_NUMBER() OVER (PARTITION BY mt.item_id ORDER BY mt.relevance DESC) as rn
      FROM matched_terms mt
    )
    SELECT 
      i.id as item_id,
      COALESCE(it.name, i.name) as item_name,
      COALESCE(it.description, i.description) as item_description,
      img.image_url as image_url,
      c.id as category_id,
      COALESCE(ct.name, c.name) as category_name,
      s.id as shop_id,
      s.name as shop_name,
      ri.relevance::REAL as relevance_score,
      ri.matched_term,
      COALESCE(
        (SELECT min(price) FROM item_variants WHERE item_id = i.id AND is_active = true), 
        isc.price_per_base_unit
      ) as price,
      isc.sell_mode
    FROM ranked_items ri
    JOIN items i ON i.id = ri.item_id
    JOIN shops s ON s.id = i.shop_id
    LEFT JOIN categories c ON c.id = i.category_id
    LEFT JOIN item_translations it ON it.item_id = i.id AND it.language_code = p_lang
    LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = p_lang
    LEFT JOIN item_sell_config isc ON isc.item_id = i.id
    LEFT JOIN LATERAL (
      SELECT ii.image_url 
      FROM item_images ii 
      WHERE ii.item_id = i.id 
      ORDER BY ii.is_primary DESC, ii.sort_order ASC 
      LIMIT 1
    ) img ON TRUE
    WHERE 
      ri.rn = 1
      AND i.is_active = TRUE
      AND i.deleted_at IS NULL
      AND (p_shop_id IS NULL OR i.shop_id = p_shop_id)
      AND (p_category_id IS NULL OR i.category_id = p_category_id)
      AND NOT (s.type LIKE '%_inactive')
    ORDER BY relevance_score DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Seed sample search terms and translations for validation
-- Seed items translation helper
INSERT INTO item_translations (item_id, language_code, name, description) VALUES
  ('i-s1-2', 'ml', 'സവാള', 'ചുവന്ന സവാള'),
  ('i-s1-2', 'hi', 'प्याज', 'लाल प्याज'),
  ('i-s1-2', 'ar', 'بصل', 'بصل أحمر'),
  ('i-s1-1', 'ml', 'തക്കാളി', 'നല്ല ചുവന്ന തക്കാളി'),
  ('i-s1-1', 'hi', 'टमाटर', 'ताजा लाल टमाटर'),
  ('i-s1-1', 'ar', 'طماطم', 'طماطم حمراء طازجة'),
  ('i-s3-1', 'ml', 'കോഴി ഇറച്ചി', 'ഫ്രഷ് ചിക്കൻ'),
  ('i-s3-1', 'hi', 'चिकन', 'ताजा चिकन'),
  ('i-s3-1', 'ar', 'دجاج كامل', 'دجاج طازج')
ON CONFLICT (item_id, language_code) 
DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Rebuild search terms to register the translations first
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM items LOOP
    PERFORM rebuild_item_search_terms(r.id);
  END LOOP;
END;
$$;

-- Seed custom synonyms / aliases / Manglish terms explicitly
INSERT INTO item_search_terms (item_id, language_code, term, normalized_term, priority, is_custom) VALUES
  -- Onion aliases
  ('i-s1-2', 'en', 'onion', 'onion', 10, true),
  ('i-s1-2', 'en', 'onions', 'onions', 9, true),
  ('i-s1-2', 'en', 'ulli', 'ulli', 8, true),
  ('i-s1-2', 'en', 'savala', 'savala', 8, true),
  ('i-s1-2', 'en', 'savola', 'savola', 8, true),
  ('i-s1-2', 'en', 'sawala', 'sawala', 8, true),
  ('i-s1-2', 'ml', 'സവാള', 'സവാള', 9, true),
  ('i-s1-2', 'ml', 'ഉള്ളി', 'ഉള്ളി', 9, true),
  ('i-s1-2', 'hi', 'pyaz', 'pyaz', 8, true),
  ('i-s1-2', 'hi', 'pyaaz', 'pyaaz', 8, true),
  ('i-s1-2', 'hi', 'प्याज', 'प्याज', 9, true),
  ('i-s1-2', 'ar', 'بصل', 'بصل', 9, true),
  
  -- Tomato aliases
  ('i-s1-1', 'en', 'tomato', 'tomato', 10, true),
  ('i-s1-1', 'en', 'tomatoes', 'tomatoes', 9, true),
  ('i-s1-1', 'en', 'thakkali', 'thakkali', 8, true),
  ('i-s1-1', 'ml', 'തക്കാളി', 'തക്കാളി', 9, true),
  ('i-s1-1', 'hi', 'tamatar', 'tamatar', 8, true),
  ('i-s1-1', 'hi', 'टमाटर', 'टमाटर', 9, true),
  ('i-s1-1', 'ar', 'طماطم', 'طماطم', 9, true),

  -- Chicken aliases
  ('i-s3-1', 'en', 'chicken', 'chicken', 10, true),
  ('i-s3-1', 'en', 'chiken', 'chiken', 9, true),
  ('i-s3-1', 'en', 'kozhi', 'kozhi', 8, true),
  ('i-s3-1', 'ml', 'കോഴി', 'കോഴി', 9, true),
  ('i-s3-1', 'hi', 'murgi', 'murgi', 8, true),
  ('i-s3-1', 'hi', 'मुर्गी', 'मुर्गी', 9, true),
  ('i-s3-1', 'ar', 'دجاج', 'دجاج', 9, true)
ON CONFLICT DO NOTHING;
