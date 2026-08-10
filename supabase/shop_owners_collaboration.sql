-- ─── Multi-Owner Collaboration Enforcement (Max 3 Owners Per Shop) ─────────

-- Function to check owner count before insert
CREATE OR REPLACE FUNCTION check_max_3_shop_owners()
RETURNS TRIGGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM shop_owners
    WHERE shop_id = NEW.shop_id;

    IF v_count >= 3 THEN
        RAISE EXCEPTION 'A shop can have at most 3 owners. Maximum limit reached.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on shop_owners table
DROP TRIGGER IF EXISTS trigger_check_max_3_shop_owners ON shop_owners;
CREATE TRIGGER trigger_check_max_3_shop_owners
BEFORE INSERT ON shop_owners
FOR EACH ROW
EXECUTE FUNCTION check_max_3_shop_owners();
