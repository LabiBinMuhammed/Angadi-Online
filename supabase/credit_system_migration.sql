-- ═══════════════════════════════════════════════════════════════════════════
-- Village Market — Credit System Triggers & Repayments Migration
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Repayment Logs Table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_repayment_logs (
    id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id     UUID      NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id     UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      NUMERIC   NOT NULL CHECK (amount > 0),
    notes       TEXT,
    created_at  TIMESTAMP DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_repayment_logs_shop_id ON customer_repayment_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_repayment_logs_user_id ON customer_repayment_logs(user_id);

-- Enable RLS
ALTER TABLE customer_repayment_logs ENABLE ROW LEVEL SECURITY;

-- Select policies
DROP POLICY IF EXISTS "Users can view their own repayments" ON customer_repayment_logs;
CREATE POLICY "Users can view their own repayments" ON customer_repayment_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Shop owners can view their shop repayments" ON customer_repayment_logs;
CREATE POLICY "Shop owners can view their shop repayments" ON customer_repayment_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shop_owners 
            WHERE shop_id = customer_repayment_logs.shop_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all repayments" ON customer_repayment_logs;
CREATE POLICY "Admins can view all repayments" ON customer_repayment_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'::user_role
        )
    );

-- ─── 2. Credit Checkout Validation Trigger ───────────────────────────────────
CREATE OR REPLACE FUNCTION validate_order_credit()
RETURNS TRIGGER AS $$
DECLARE
    v_credit RECORD;
    v_order_total NUMERIC;
BEGIN
    -- Only validate if payment_type is 'credit' and status is not 'cancelled'
    IF NEW.payment_type = 'credit' AND NEW.status <> 'cancelled'::order_status THEN
        -- Get the order total amount
        v_order_total := COALESCE(NEW.total_final_price, NEW.total_estimated_price, 0);

        -- Find credit record
        SELECT * INTO v_credit 
        FROM shop_user_credit 
        WHERE shop_id = NEW.shop_id AND user_id = NEW.user_id;

        IF v_credit IS NULL THEN
            RAISE EXCEPTION 'Credit account is not enabled for this shop.';
        END IF;

        IF NOT v_credit.is_credit_enabled THEN
            RAISE EXCEPTION 'Credit is disabled for your account at this shop.';
        END IF;

        IF v_credit.is_blocked THEN
            RAISE EXCEPTION 'Your credit account at this shop is blocked.';
        END IF;

        IF v_credit.credit_limit IS NOT NULL AND (v_credit.used_amount + v_order_total) > v_credit.credit_limit THEN
            RAISE EXCEPTION 'This order exceeds your available credit limit of ₹%. Only ₹% remaining.', 
                v_credit.credit_limit, 
                GREATEST(0, v_credit.credit_limit - v_credit.used_amount);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_order_credit ON orders;
CREATE TRIGGER trg_validate_order_credit
    BEFORE INSERT OR UPDATE OF payment_type, total_final_price, total_estimated_price, status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_order_credit();

-- ─── 3. Credit Balance Update Trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_used_credit()
RETURNS TRIGGER AS $$
BEGIN
    -- Case 1: Order is delivered on credit
    IF NEW.payment_type = 'credit' AND NEW.status = 'delivered'::order_status AND (OLD.status IS NULL OR OLD.status <> 'delivered'::order_status) THEN
        UPDATE shop_user_credit
        SET used_amount = used_amount + COALESCE(NEW.total_final_price, 0)
        WHERE shop_id = NEW.shop_id AND user_id = NEW.user_id;
    
    -- Case 2: Order was delivered on credit, but status changes to cancelled/something else
    ELSIF OLD.payment_type = 'credit' AND OLD.status = 'delivered'::order_status AND NEW.status <> 'delivered'::order_status THEN
        UPDATE shop_user_credit
        SET used_amount = GREATEST(0, used_amount - COALESCE(OLD.total_final_price, 0))
        WHERE shop_id = OLD.shop_id AND user_id = OLD.user_id;

    -- Case 3: Order was delivered on credit, but payment type changed from credit to something else (e.g. COD/Cash)
    ELSIF OLD.payment_type = 'credit' AND OLD.status = 'delivered'::order_status AND NEW.payment_type <> 'credit' THEN
        UPDATE shop_user_credit
        SET used_amount = GREATEST(0, used_amount - COALESCE(OLD.total_final_price, 0))
        WHERE shop_id = OLD.shop_id AND user_id = OLD.user_id;

    -- Case 4: Order was delivered on COD/something else, but changed to credit
    ELSIF OLD.status = 'delivered'::order_status AND (OLD.payment_type IS NULL OR OLD.payment_type <> 'credit') AND NEW.payment_type = 'credit' THEN
        UPDATE shop_user_credit
        SET used_amount = used_amount + COALESCE(NEW.total_final_price, 0)
        WHERE shop_id = NEW.shop_id AND user_id = NEW.user_id;

    -- Case 5: Order final price changed while delivered on credit
    ELSIF NEW.payment_type = 'credit' AND NEW.status = 'delivered'::order_status AND OLD.status = 'delivered'::order_status AND COALESCE(NEW.total_final_price, 0) <> COALESCE(OLD.total_final_price, 0) THEN
        UPDATE shop_user_credit
        SET used_amount = GREATEST(0, used_amount - COALESCE(OLD.total_final_price, 0) + COALESCE(NEW.total_final_price, 0))
        WHERE shop_id = NEW.shop_id AND user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_user_used_credit ON orders;
CREATE TRIGGER trg_update_user_used_credit
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_user_used_credit();

-- ─── 4. Repayment RPC Function ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_customer_repayment(
    p_shop_id UUID,
    p_user_id UUID,
    p_amount NUMERIC,
    p_notes TEXT
)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    v_credit_id UUID;
    v_new_used NUMERIC;
BEGIN
    -- Check if credit profile exists
    SELECT id, used_amount INTO v_credit_id, v_new_used
    FROM shop_user_credit
    WHERE shop_id = p_shop_id AND user_id = p_user_id;

    IF v_credit_id IS NULL THEN
        RAISE EXCEPTION 'No credit account found for this user at this shop.';
    END IF;

    -- Perform subtraction
    v_new_used := GREATEST(0, v_new_used - p_amount);

    -- Update shop_user_credit
    UPDATE shop_user_credit
    SET used_amount = v_new_used,
        last_credit_used_at = now()
    WHERE id = v_credit_id;

    -- Insert into repayment logs
    INSERT INTO customer_repayment_logs (shop_id, user_id, amount, notes)
    VALUES (p_shop_id, p_user_id, p_amount, p_notes);

    RETURN jsonb_build_object(
        'success', true,
        'new_used_amount', v_new_used
    );
END;
$$ LANGUAGE plpgsql;

-- ─── 5. Transaction-Safe Checkout Placing Function ───────────────────────────
-- NOTE: order_addresses.order_id must have a UNIQUE constraint.
-- Run this first if not yet applied:
--   ALTER TABLE order_addresses ADD CONSTRAINT order_addresses_order_id_key UNIQUE (order_id);
-- Also add label column if not present:
--   ALTER TABLE order_addresses ADD COLUMN IF NOT EXISTS label TEXT DEFAULT 'Home';
CREATE OR REPLACE FUNCTION place_checkout_orders(
    p_order_ids UUID[],
    p_payment_type TEXT,
    p_delivery_date DATE,
    p_delivery_slot TEXT,
    p_contact_name TEXT,
    p_contact_phone TEXT,
    p_address_line_1 TEXT,
    p_address_line_2 TEXT DEFAULT NULL,
    p_landmark TEXT DEFAULT NULL,
    p_label TEXT DEFAULT 'Home'
)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_slot delivery_slot_enum;
BEGIN
    -- Cast text to enum (fallback to 'morning' if invalid)
    BEGIN
        IF p_delivery_slot IS NOT NULL THEN
            v_slot := p_delivery_slot::delivery_slot_enum;
        ELSE
            v_slot := 'morning'::delivery_slot_enum;
        END IF;
    EXCEPTION WHEN invalid_text_representation THEN
        v_slot := 'morning'::delivery_slot_enum;
    END;

    FOREACH v_order_id IN ARRAY p_order_ids LOOP
        -- Delete any existing address for this order to avoid constraint issues
        DELETE FROM order_addresses WHERE order_id = v_order_id;

        -- Insert fresh address record
        INSERT INTO order_addresses (
            order_id,
            label,
            contact_name,
            contact_phone,
            address_line_1,
            address_line_2,
            landmark
        )
        VALUES (
            v_order_id,
            COALESCE(p_label, 'Home'),
            p_contact_name,
            p_contact_phone,
            p_address_line_1,
            p_address_line_2,
            p_landmark
        );

        -- Update order: set payment & delivery info, keep status as 'pending'
        UPDATE orders
        SET payment_type  = p_payment_type,
            delivery_date = p_delivery_date,
            delivery_slot = v_slot,
            status        = 'pending'::order_status
        WHERE id = v_order_id;
    END LOOP;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
