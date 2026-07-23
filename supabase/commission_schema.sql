-- Commission Management System - Database Schema

-- 1. Commission Settings Table (Singleton)
CREATE TABLE IF NOT EXISTS commission_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    default_commission_rate NUMERIC NOT NULL DEFAULT 5.0,
    free_trial_duration INTEGER NOT NULL DEFAULT 30, -- In days
    calculation_trigger TEXT NOT NULL DEFAULT 'delivered' CHECK (calculation_trigger IN ('delivered', 'completed')),
    auto_generate_reports BOOLEAN NOT NULL DEFAULT TRUE,
    report_generation_day INTEGER NOT NULL DEFAULT 1 CHECK (report_generation_day BETWEEN 1 AND 28),
    grace_period_warning INTEGER NOT NULL DEFAULT 15, -- Days overdue for Level 1 Warning
    grace_period_restriction INTEGER NOT NULL DEFAULT 20, -- Days overdue for Level 2 Reduced Visibility
    grace_period_block INTEGER NOT NULL DEFAULT 30, -- Days overdue for Level 3 Blocked Orders
    updated_at TIMESTAMP DEFAULT now()
);

-- Insert default settings if not exists
INSERT INTO commission_settings (id, default_commission_rate, free_trial_duration, calculation_trigger, auto_generate_reports, report_generation_day, grace_period_warning, grace_period_restriction, grace_period_block)
VALUES (1, 5.0, 30, 'delivered', TRUE, 1, 15, 20, 30)
ON CONFLICT (id) DO NOTHING;

-- 2. Shop Subscription Table
CREATE TABLE IF NOT EXISTS shop_subscription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
    trial_start_date TIMESTAMP NOT NULL DEFAULT now(),
    trial_end_date TIMESTAMP NOT NULL,
    is_trial_active BOOLEAN NOT NULL DEFAULT TRUE,
    commission_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    commission_rate NUMERIC NOT NULL DEFAULT 5.0,
    restriction_level INTEGER NOT NULL DEFAULT 0 CHECK (restriction_level BETWEEN 0 AND 3), -- 0=None, 1=Warning, 2=Reduced Visibility, 3=Blocked Orders
    created_at TIMESTAMP DEFAULT now()
);

-- 3. Commission Transactions Table
CREATE TABLE IF NOT EXISTS commission_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    order_id UUID UNIQUE REFERENCES orders(id) ON DELETE SET NULL,
    order_amount NUMERIC NOT NULL CHECK (order_amount >= 0),
    commission_rate NUMERIC NOT NULL CHECK (commission_rate >= 0),
    commission_amount NUMERIC NOT NULL CHECK (commission_amount >= 0),
    commission_status TEXT NOT NULL DEFAULT 'pending' CHECK (commission_status IN ('pending', 'paid', 'waived')),
    waive_reason TEXT,
    generated_at TIMESTAMP DEFAULT now()
);

-- 4. Monthly Commission Reports Table
CREATE TABLE IF NOT EXISTS monthly_commission_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    total_orders INTEGER NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
    total_sales NUMERIC NOT NULL DEFAULT 0.0 CHECK (total_sales >= 0),
    commission_rate NUMERIC NOT NULL DEFAULT 5.0 CHECK (commission_rate >= 0),
    total_commission NUMERIC NOT NULL DEFAULT 0.0 CHECK (total_commission >= 0),
    amount_paid NUMERIC NOT NULL DEFAULT 0.0 CHECK (amount_paid >= 0),
    balance_due NUMERIC NOT NULL DEFAULT 0.0 CHECK (balance_due >= 0),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partially_paid', 'paid')),
    generated_at TIMESTAMP DEFAULT now(),
    UNIQUE (shop_id, month, year)
);

-- 5. Commission Payments Table
CREATE TABLE IF NOT EXISTS commission_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    report_id UUID REFERENCES monthly_commission_reports(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank_transfer')),
    transaction_reference TEXT,
    notes TEXT,
    paid_at TIMESTAMP DEFAULT now()
);

-- 6. Commission Audit Logs Table
CREATE TABLE IF NOT EXISTS commission_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL, -- e.g., 'Commission Rate Changed', 'Trial Extended', 'Commission Waived', 'Payment Recorded'
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    previous_value TEXT,
    new_value TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- 7. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_shop_subscription_shop_id ON shop_subscription(shop_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_shop_id ON commission_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_order_id ON commission_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_monthly_commission_reports_shop_id ON monthly_commission_reports(shop_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_report_id ON commission_payments(report_id);
CREATE INDEX IF NOT EXISTS idx_commission_audit_logs_shop_id ON commission_audit_logs(shop_id);

-- ─── Database Triggers ────────────────────────────────────────────────────────

-- Trigger A: Automatically create a shop_subscription when a shop is created
CREATE OR REPLACE FUNCTION handle_new_shop_subscription()
RETURNS TRIGGER AS $$
DECLARE
    v_rate NUMERIC;
    v_trial_days INTEGER;
BEGIN
    -- Fetch global defaults
    SELECT default_commission_rate, free_trial_duration 
    INTO v_rate, v_trial_days 
    FROM commission_settings 
    WHERE id = 1;
    
    -- Fallback defaults
    IF v_rate IS NULL THEN v_rate := 5.0; END IF;
    IF v_trial_days IS NULL THEN v_trial_days := 30; END IF;
    
    -- Insert subscription
    INSERT INTO shop_subscription (shop_id, trial_start_date, trial_end_date, is_trial_active, commission_enabled, commission_rate)
    VALUES (
        NEW.id, 
        now(), 
        now() + (v_trial_days || ' days')::INTERVAL, 
        TRUE, 
        TRUE, 
        v_rate
    )
    ON CONFLICT (shop_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_create_shop_subscription
    AFTER INSERT ON shops
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_shop_subscription();

-- Trigger B: Automatically calculate commission when an order status is updated to Delivered (or configured trigger)
CREATE OR REPLACE FUNCTION handle_order_commission_calc()
RETURNS TRIGGER AS $$
DECLARE
    v_trigger TEXT;
    v_shop_sub RECORD;
    v_is_trial_active BOOLEAN;
    v_rate NUMERIC;
    v_commission NUMERIC;
BEGIN
    -- Fetch the global setting for calculation trigger
    SELECT calculation_trigger INTO v_trigger FROM commission_settings WHERE id = 1;
    IF v_trigger IS NULL THEN
        v_trigger := 'delivered';
    END IF;

    -- Case 1: Order reaches the trigger status
    IF NEW.status = v_trigger::order_status AND (OLD.status IS NULL OR OLD.status <> NEW.status) THEN
        -- Get or create shop subscription
        SELECT * INTO v_shop_sub FROM shop_subscription WHERE shop_id = NEW.shop_id;
        
        -- If subscription does not exist, create a default one
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

        -- Check if trial has expired
        v_is_trial_active := v_shop_sub.is_trial_active;
        IF v_is_trial_active AND now() > v_shop_sub.trial_end_date THEN
            UPDATE shop_subscription 
            SET is_trial_active = FALSE 
            WHERE shop_id = NEW.shop_id;
            v_is_trial_active := FALSE;
        END IF;

        -- Calculate commission based on settings
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

        -- Insert or update commission transaction
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

    -- Case 2: Order status changes from the trigger status to cancelled or pending (commission should be removed)
    ELSIF (OLD.status = v_trigger::order_status OR OLD.status = 'delivered') AND NEW.status IN ('cancelled', 'pending') THEN
        DELETE FROM commission_transactions WHERE order_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_calculate_order_commission
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_commission_calc();
