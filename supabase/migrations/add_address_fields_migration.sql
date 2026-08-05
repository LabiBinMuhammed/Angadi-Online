-- Migration to add village address management columns and update place_checkout_orders

-- 1. Update user_addresses
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS house_name TEXT;
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS village TEXT;
ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS delivery_note TEXT;
ALTER TABLE user_addresses ALTER COLUMN address_line_1 DROP NOT NULL;

-- 2. Update order_addresses
ALTER TABLE order_addresses ADD COLUMN IF NOT EXISTS house_name TEXT;
ALTER TABLE order_addresses ADD COLUMN IF NOT EXISTS village TEXT;
ALTER TABLE order_addresses ADD COLUMN IF NOT EXISTS delivery_note TEXT;
ALTER TABLE order_addresses ALTER COLUMN address_line_1 DROP NOT NULL;

-- 3. Update the place_checkout_orders RPC function to copy all village address fields
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
    p_label TEXT DEFAULT 'Home',
    p_house_name TEXT DEFAULT NULL,
    p_village TEXT DEFAULT NULL,
    p_delivery_note TEXT DEFAULT NULL,
    p_latitude NUMERIC DEFAULT NULL,
    p_longitude NUMERIC DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_slot delivery_slot_enum;
BEGIN
    -- Cast text to delivery_slot_enum (only 'morning' or 'evening' are valid)
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
        -- Delete existing address (safe upsert pattern)
        DELETE FROM order_addresses WHERE order_id = v_order_id;

        -- Insert fresh address record
        INSERT INTO order_addresses (
            order_id,
            label,
            contact_name,
            contact_phone,
            address_line_1,
            address_line_2,
            landmark,
            latitude,
            longitude,
            house_name,
            village,
            delivery_note
        )
        VALUES (
            v_order_id,
            COALESCE(p_label, 'Home'),
            p_contact_name,
            p_contact_phone,
            p_address_line_1,
            p_address_line_2,
            p_landmark,
            p_latitude,
            p_longitude,
            p_house_name,
            p_village,
            p_delivery_note
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
