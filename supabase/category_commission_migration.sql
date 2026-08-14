-- =========================================================
-- CATEGORY-BASED COMMISSION SYSTEM MIGRATION
-- =========================================================

-- 1. Add commission_percentage column to categories table if not exists
ALTER TABLE categories ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5, 2) DEFAULT 4.0;

-- 2. Update default commission rates based on category margin tiers
-- Low Margin Tiers (2.5%): Vegetables, Fruits, Grocery, Dairy & Beverages
UPDATE categories 
SET commission_percentage = 2.5 
WHERE LOWER(name) IN ('vegetables', 'fruits', 'grocery', 'dairy & beverages', 'dairy', 'beverages');

-- Medium / High Margin Tiers (4.0%): Bakery, Meat & Fish, Household Essentials, Stationery
UPDATE categories 
SET commission_percentage = 4.0 
WHERE LOWER(name) IN ('bakery', 'meat & fish', 'household essentials', 'stationery', 'meat', 'fish');

-- 3. Update Order Commission Trigger Function to calculate per Order Item
CREATE OR REPLACE FUNCTION record_order_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_trigger TEXT;
    v_shop_sub RECORD;
    v_is_trial_active BOOLEAN;
    v_rate NUMERIC(5, 2);
    v_commission NUMERIC(10, 2) := 0.0;
    v_total_item_sales NUMERIC(10, 2) := 0.0;
    v_item RECORD;
    v_item_comm NUMERIC(10, 2);
    v_item_price NUMERIC(10, 2);
    v_cat_rate NUMERIC(5, 2);
BEGIN
    -- Fetch calculation trigger setting (default 'delivered')
    SELECT calculation_trigger INTO v_trigger 
    FROM commission_settings 
    WHERE id = 1;
    
    IF v_trigger IS NULL THEN
        v_trigger := 'delivered';
    END IF;

    -- Case 1: Order status changes to trigger status (e.g. delivered)
    IF NEW.status::TEXT = v_trigger OR NEW.status::TEXT = 'delivered' THEN
        -- Get or create shop subscription record
        SELECT * INTO v_shop_sub 
        FROM shop_subscription 
        WHERE shop_id = NEW.shop_id;

        IF NOT FOUND THEN
            INSERT INTO shop_subscription (
                shop_id, trial_start_date, trial_end_date, is_trial_active, commission_enabled, commission_rate
            ) VALUES (
                NEW.shop_id, now(), now() + INTERVAL '30 days', TRUE, TRUE, 4.0
            ) RETURNING * INTO v_shop_sub;
        END IF;

        -- Check if trial has expired
        v_is_trial_active := v_shop_sub.is_trial_active;
        IF v_is_trial_active AND now() > v_shop_sub.trial_end_date THEN
            UPDATE shop_subscription 
            SET is_trial_active = FALSE 
            WHERE shop_id = NEW.shop_id;
            v_is_trial_active := FALSE;
        END IF;

        -- Check promo / trial status
        IF v_shop_sub.commission_enabled = FALSE OR v_is_trial_active = TRUE THEN
            v_rate := 0.0;
            v_commission := 0.0;
        ELSE
            -- Calculate itemized category commission for each item in the order
            FOR v_item IN
                SELECT 
                    oi.final_price,
                    oi.estimated_price,
                    c.commission_percentage
                FROM order_items oi
                JOIN items i ON oi.item_id = i.id
                LEFT JOIN categories c ON i.category_id = c.id
                WHERE oi.order_id = NEW.id
            LOOP
                v_item_price := COALESCE(v_item.final_price, v_item.estimated_price, 0.0);
                v_cat_rate := COALESCE(v_item.commission_percentage, 4.0);
                
                v_item_comm := ROUND(v_item_price * (v_cat_rate / 100.0), 2);
                v_commission := v_commission + v_item_comm;
                v_total_item_sales := v_total_item_sales + v_item_price;
            END LOOP;

            -- Calculate effective weighted average rate % for transaction record
            IF COALESCE(NEW.total_final_price, v_total_item_sales, 0.0) > 0 THEN
                v_rate := ROUND((v_commission / COALESCE(NEW.total_final_price, v_total_item_sales)) * 100.0, 2);
            ELSE
                v_rate := 4.0;
            END IF;
        END IF;

        -- Insert or update commission transaction
        INSERT INTO commission_transactions (
            shop_id, order_id, order_amount, commission_rate, commission_amount, commission_status
        )
        VALUES (
            NEW.shop_id, 
            NEW.id, 
            COALESCE(NEW.total_final_price, v_total_item_sales, 0.0), 
            v_rate, 
            v_commission, 
            CASE WHEN v_commission = 0 THEN 'paid'::TEXT ELSE 'pending'::TEXT END
        )
        ON CONFLICT (order_id) DO UPDATE 
        SET order_amount = EXCLUDED.order_amount,
            commission_rate = EXCLUDED.commission_rate,
            commission_amount = EXCLUDED.commission_amount,
            commission_status = EXCLUDED.commission_status;

    -- Case 2: Order status changes from delivered to cancelled or pending (remove commission)
    ELSIF (OLD.status::TEXT = v_trigger OR OLD.status::TEXT = 'delivered') AND NEW.status::TEXT IN ('cancelled', 'pending') THEN
        DELETE FROM commission_transactions WHERE order_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
