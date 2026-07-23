-- ─── Fix for commission triggers RLS policy violations ──────────────────────────
-- Problem: 
--   When the customer confirms delivery, the order status updates to 'delivered'.
--   This fires handle_order_commission_calc() which attempts to update/insert 
--   into shop_subscription and commission_transactions tables.
--   Since the trigger function originally ran with SECURITY INVOKER (default), 
--   it used the customer's permissions and violated RLS policies.
--
-- Solution:
--   Redefine the trigger functions with SECURITY DEFINER so they execute with 
--   elevated database owner privileges and bypass row-level security.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Redefine handle_new_shop_subscription with SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_new_shop_subscription()
RETURNS TRIGGER AS $$
DECLARE
    v_trial_days INTEGER;
    v_rate NUMERIC;
BEGIN
    SELECT free_trial_duration, default_commission_rate 
    INTO v_trial_days, v_rate 
    FROM commission_settings 
    WHERE id = 1;
    
    INSERT INTO shop_subscription (
        shop_id, trial_start_date, trial_end_date, is_trial_active, commission_enabled, commission_rate
    )
    VALUES (
        NEW.id, 
        now(), 
        now() + (COALESCE(v_trial_days, 30) || ' days')::INTERVAL, 
        TRUE, 
        TRUE, 
        COALESCE(v_rate, 5.0)
    )
    ON CONFLICT (shop_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Redefine handle_order_commission_calc with SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_order_commission_calc()
RETURNS TRIGGER AS $$
DECLARE
    v_trigger TEXT;
    v_shop_sub RECORD;
    v_is_trial_active BOOLEAN;
    v_rate NUMERIC;
    v_commission NUMERIC;
BEGIN
    SELECT calculation_trigger INTO v_trigger FROM commission_settings WHERE id = 1;
    IF v_trigger IS NULL THEN
        v_trigger := 'delivered';
    END IF;

    IF NEW.status = v_trigger::order_status AND (OLD.status IS NULL OR OLD.status <> NEW.status) THEN
        SELECT * INTO v_shop_sub FROM shop_subscription WHERE shop_id = NEW.shop_id;
        
        IF NOT FOUND THEN
            DECLARE
                v_def_rate NUMERIC;
                v_def_duration INTEGER;
            BEGIN
                SELECT default_commission_rate, free_trial_duration 
                INTO v_def_rate, v_def_duration 
                FROM commission_settings 
                WHERE id = 1;
                
                INSERT INTO shop_subscription (shop_id, trial_start_date, trial_end_date, is_trial_active, commission_enabled, commission_rate)
                VALUES (
                    NEW.shop_id, 
                    now(), 
                    now() + (COALESCE(v_def_duration, 30) || ' days')::INTERVAL, 
                    TRUE, 
                    TRUE, 
                    COALESCE(v_def_rate, 5.0)
                )
                RETURNING * INTO v_shop_sub;
            END;
        END IF;

        v_is_trial_active := v_shop_sub.is_trial_active;
        IF v_is_trial_active AND now() > v_shop_sub.trial_end_date THEN
            UPDATE shop_subscription 
            SET is_trial_active = FALSE 
            WHERE shop_id = NEW.shop_id;
            v_is_trial_active := FALSE;
        END IF;

        IF v_shop_sub.commission_enabled = FALSE THEN
            v_rate := 0.0;
            v_commission := 0.0;
        ELSIF v_is_trial_active THEN
            v_rate := 0.0;
            v_commission := 0.0;
        ELSE
            v_rate := v_shop_sub.commission_rate;
            v_commission := ROUND(NEW.total_final_price * (v_rate / 100.0), 2);
        END IF;

        INSERT INTO commission_transactions (shop_id, order_id, order_amount, commission_rate, commission_amount, commission_status)
        VALUES (
            NEW.shop_id, 
            NEW.id, 
            NEW.total_final_price, 
            v_rate, 
            v_commission, 
            CASE WHEN v_commission = 0 THEN 'paid'::TEXT ELSE 'pending'::TEXT END
        )
        ON CONFLICT (order_id) DO UPDATE 
        SET order_amount = EXCLUDED.order_amount,
            commission_rate = EXCLUDED.commission_rate,
            commission_amount = EXCLUDED.commission_amount,
            commission_status = EXCLUDED.commission_status;

    ELSIF (OLD.status = v_trigger::order_status OR OLD.status = 'delivered') AND NEW.status IN ('cancelled', 'pending') THEN
        DELETE FROM commission_transactions WHERE order_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reload schema
NOTIFY pgrst, 'reload schema';
