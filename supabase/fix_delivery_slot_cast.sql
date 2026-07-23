-- Fix: Cast p_delivery_slot to delivery_slot_enum in place_checkout_orders
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
    -- Cast text to the enum type (default to 'morning' if null or invalid)
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

        -- Update order status and delivery info
        UPDATE orders
        SET payment_type = p_payment_type,
            delivery_date = p_delivery_date,
            delivery_slot = v_slot,
            status = 'placed'
        WHERE id = v_order_id;
    END LOOP;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
