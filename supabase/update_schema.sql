-- village_market schema update script

-- 1. Add image_url to item_variants and items for variant-specific image support and primary image fallback
ALTER TABLE item_variants 
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create index on the new column for performance
CREATE INDEX IF NOT EXISTS idx_item_variants_image_url ON item_variants(image_url);

-- 3. Create helper View to resolve variant image fallbacks dynamically
CREATE OR REPLACE VIEW vw_item_variants_with_fallback AS
SELECT 
    iv.id,
    iv.item_id,
    iv.variant_type,
    iv.label,
    iv.unit_id,
    iv.value,
    iv.price,
    iv.min_value,
    iv.max_value,
    iv.is_default,
    iv.is_active,
    iv.image_url AS variant_image_url,
    COALESCE(iv.image_url, (
        SELECT ii.image_url 
        FROM item_images ii 
        WHERE ii.item_id = iv.item_id 
        ORDER BY ii.is_primary DESC, ii.sort_order ASC 
        LIMIT 1
    )) AS image_url
FROM item_variants iv;
