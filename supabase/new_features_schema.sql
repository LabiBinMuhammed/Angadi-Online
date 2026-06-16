-- ═══════════════════════════════════════════════════════════════════════════
-- Village Market — New Features Schema (Pinned Shops, Recent Purchases, Favorite Items)
-- ═══════════════════════════════════════════════════════════════════════════

-- Ensure the item_status type, status column, and shops.logo_url exist in the database
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_status') THEN
        CREATE TYPE item_status AS ENUM ('draft', 'incomplete', 'ready', 'published', 'hidden', 'rejected', 'out_of_stock');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'status') THEN
        ALTER TABLE items ADD COLUMN status item_status DEFAULT 'draft';
        UPDATE items SET status = CASE WHEN is_active THEN 'ready'::item_status ELSE 'draft'::item_status END WHERE status IS NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'logo_url') THEN
        ALTER TABLE shops ADD COLUMN logo_url TEXT;
    END IF;
END $$;



-- ─── 1. Pinned Shops Table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_pinned_shops (
    id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shop_id    UUID      NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE (user_id, shop_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_pinned_shops_user_id ON customer_pinned_shops(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_pinned_shops_shop_id ON customer_pinned_shops(shop_id);

-- Enable RLS
ALTER TABLE customer_pinned_shops ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can manage their own pinned shops" ON customer_pinned_shops;
CREATE POLICY "Users can manage their own pinned shops" ON customer_pinned_shops
    FOR ALL
    USING (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'::user_role)
    WITH CHECK (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'::user_role);


-- ─── 2. Favorite Products Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_favorite_items (
    id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id    UUID      NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE (user_id, item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_favorite_items_user_id ON customer_favorite_items(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorite_items_item_id ON customer_favorite_items(item_id);

-- Enable RLS
ALTER TABLE customer_favorite_items ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can manage their own favorite items" ON customer_favorite_items;
CREATE POLICY "Users can manage their own favorite items" ON customer_favorite_items
    FOR ALL
    USING (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'::user_role)
    WITH CHECK (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'::user_role);


-- ─── 3. Recent Purchases RPC Function ─────────────────────────────────────
CREATE OR REPLACE FUNCTION get_recent_purchases(
    p_user_id UUID,
    p_days INT DEFAULT 90,
    p_sort_by TEXT DEFAULT 'recent', -- 'recent' or 'ordered'
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    item_id UUID,
    product_name TEXT,
    shop_id UUID,
    shop_name TEXT,
    last_purchased_date TIMESTAMP,
    last_purchased_qty NUMERIC,
    last_purchased_price NUMERIC,
    last_variant_id UUID,
    total_ordered_count BIGINT,
    image_url TEXT,
    is_active BOOLEAN,
    has_variants BOOLEAN,
    item_status item_status
) AS $$
BEGIN
    -- Security check
    IF p_user_id <> auth.uid() AND (SELECT role FROM users WHERE id = auth.uid()) <> 'admin'::user_role THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    WITH filtered_orders AS (
        SELECT o.id AS order_id, o.created_at, o.shop_id
        FROM orders o
        WHERE o.user_id = p_user_id
          AND o.status = 'delivered'::order_status
          AND (p_days IS NULL OR o.created_at >= now() - (p_days || ' days')::INTERVAL)
    ),
    item_purchases AS (
        SELECT 
            oi.item_id,
            fo.created_at,
            oi.requested_value,
            oi.final_price,
            oi.variant_id,
            ROW_NUMBER() OVER (PARTITION BY oi.item_id ORDER BY fo.created_at DESC) as rn,
            COUNT(*) OVER (PARTITION BY oi.item_id) as total_count
        FROM order_items oi
        JOIN filtered_orders fo ON oi.order_id = fo.order_id
    )
    SELECT 
        ip.item_id,
        i.name AS product_name,
        s.id AS shop_id,
        s.name AS shop_name,
        ip.created_at AS last_purchased_date,
        ip.requested_value AS last_purchased_qty,
        ip.final_price AS last_purchased_price,
        ip.variant_id AS last_variant_id,
        ip.total_count AS total_ordered_count,
        COALESCE(i.image_url, (
            SELECT ii.image_url 
            FROM item_images ii 
            WHERE ii.item_id = ip.item_id 
            ORDER BY ii.is_primary DESC, ii.sort_order ASC 
            LIMIT 1
        )) AS image_url,
        i.is_active,
        i.has_variants,
        i.status AS item_status
    FROM item_purchases ip
    JOIN items i ON ip.item_id = i.id
    JOIN shops s ON i.shop_id = s.id
    WHERE ip.rn = 1
    ORDER BY 
        CASE WHEN p_sort_by = 'ordered' THEN ip.total_count END DESC,
        ip.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ─── 4. Purchase History Stats RPC Function ──────────────────────────────
CREATE OR REPLACE FUNCTION get_purchase_history_stats(
    p_user_id UUID,
    p_date_filter TEXT DEFAULT 'all' -- 'today', 'week', 'month', 'year', 'all'
)
RETURNS TABLE (
    total_orders BIGINT,
    total_spent NUMERIC,
    favorite_shop_name TEXT,
    favorite_category_name TEXT
) AS $$
DECLARE
    v_start_date TIMESTAMP;
BEGIN
    -- Determine start date
    IF p_date_filter = 'today' THEN
        v_start_date := date_trunc('day', now());
    ELSIF p_date_filter = 'week' THEN
        v_start_date := date_trunc('week', now());
    ELSIF p_date_filter = 'month' THEN
        v_start_date := date_trunc('month', now());
    ELSIF p_date_filter = 'year' THEN
        v_start_date := date_trunc('year', now());
    ELSE
        v_start_date := '-infinity'::TIMESTAMP;
    END IF;

    -- Security check
    IF p_user_id <> auth.uid() AND (SELECT role FROM users WHERE id = auth.uid()) <> 'admin'::user_role THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    WITH user_orders AS (
        SELECT o.id, o.total_final_price, o.shop_id
        FROM orders o
        WHERE o.user_id = p_user_id
          AND o.status = 'delivered'::order_status
          AND o.created_at >= v_start_date
    ),
    fav_shop AS (
        SELECT s.name
        FROM user_orders uo
        JOIN shops s ON uo.shop_id = s.id
        GROUP BY s.name
        ORDER BY count(*) DESC, s.name
        LIMIT 1
    ),
    fav_cat AS (
        SELECT c.name
        FROM user_orders uo
        JOIN order_items oi ON uo.id = oi.order_id
        JOIN items i ON oi.item_id = i.id
        JOIN categories c ON i.category_id = c.id
        GROUP BY c.name
        ORDER BY count(*) DESC, c.name
        LIMIT 1
    )
    SELECT 
        (SELECT COALESCE(count(*), 0) FROM user_orders),
        (SELECT COALESCE(sum(total_final_price), 0.0) FROM user_orders),
        (SELECT name FROM fav_shop),
        (SELECT name FROM fav_cat);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
