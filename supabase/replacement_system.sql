-- ═══════════════════════════════════════════════════════════════════════════
-- Angadi — Replacement Request System Schema Migration
-- PostgreSQL / Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Extend Shop Settings ────────────────────────────────────────────────
ALTER TABLE shops ADD COLUMN IF NOT EXISTS replacement_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS return_window_hours INTEGER NOT NULL DEFAULT 24 CHECK (return_window_hours BETWEEN 1 AND 168);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS replacement_policy TEXT;

-- ─── 2. Create replacement_requests Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS replacement_requests (
    id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id         UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shop_id         UUID      NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    reason          TEXT      NOT NULL CHECK (reason IN ('Wrong Item', 'Damaged', 'Poor Quality', 'Expired', 'Missing Item', 'Other')),
    description     TEXT,
    status          TEXT      NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled')),
    customer_images TEXT[]    DEFAULT '{}'::TEXT[],
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

-- ─── 3. Create replacement_items Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS replacement_items (
    id                     UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    replacement_request_id UUID    NOT NULL REFERENCES replacement_requests(id) ON DELETE CASCADE,
    order_item_id          UUID    NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    quantity               NUMERIC NOT NULL CHECK (quantity > 0),
    seller_notes           TEXT
);

-- ─── 4. Create replacement_status_logs Table ────────────────────────────────
CREATE TABLE IF NOT EXISTS replacement_status_logs (
    id                     UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    replacement_request_id UUID      NOT NULL REFERENCES replacement_requests(id) ON DELETE CASCADE,
    from_status            TEXT,
    to_status              TEXT      NOT NULL,
    changed_by             UUID      REFERENCES users(id) ON DELETE SET NULL,
    notes                  TEXT,
    created_at             TIMESTAMP DEFAULT now()
);

-- ─── 5. Indexes ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_replacement_requests_order_id ON replacement_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_replacement_requests_user_id ON replacement_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_replacement_requests_shop_id ON replacement_requests(shop_id);
CREATE INDEX IF NOT EXISTS idx_replacement_requests_status ON replacement_requests(status);
CREATE INDEX IF NOT EXISTS idx_replacement_items_request_id ON replacement_items(replacement_request_id);
CREATE INDEX IF NOT EXISTS idx_replacement_items_order_item_id ON replacement_items(order_item_id);
CREATE INDEX IF NOT EXISTS idx_replacement_status_logs_request_id ON replacement_status_logs(replacement_request_id);

-- ─── 6. Auto-Update updated_at Trigger ─────────────────────────────────────
DROP TRIGGER IF EXISTS trg_replacement_requests_updated_at ON replacement_requests;
CREATE TRIGGER trg_replacement_requests_updated_at
  BEFORE UPDATE ON replacement_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 7. Status Logs Trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_replacement_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO replacement_status_logs (replacement_request_id, from_status, to_status, notes)
    VALUES (NEW.id, NULL, NEW.status, 'Request submitted');
  ELSIF (TG_OP = 'UPDATE' AND OLD.status <> NEW.status) THEN
    INSERT INTO replacement_status_logs (replacement_request_id, from_status, to_status, notes)
    VALUES (NEW.id, OLD.status, NEW.status, 'Status updated');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_replacement_status_change ON replacement_requests;
CREATE TRIGGER trg_log_replacement_status_change
  AFTER INSERT OR UPDATE ON replacement_requests
  FOR EACH ROW EXECUTE FUNCTION log_replacement_status_change();

-- ─── 8. Validation Trigger ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validate_replacement_request_item()
RETURNS TRIGGER AS $$
DECLARE
  v_order_status order_status;
  v_order_updated_at TIMESTAMP;
  v_shop_id UUID;
  v_replacement_enabled BOOLEAN;
  v_return_window_hours INTEGER;
  v_ordered_qty NUMERIC;
  v_order_id UUID;
  v_existing_active_count INTEGER;
BEGIN
  -- Fetch order details through order_item_id
  SELECT oi.order_id, o.status, o.updated_at, o.shop_id, 
         COALESCE(oi.actual_value, oi.requested_value, 1.0)
  INTO v_order_id, v_order_status, v_order_updated_at, v_shop_id, v_ordered_qty
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE oi.id = NEW.order_item_id;

  -- Fetch shop replacement settings
  SELECT replacement_enabled, return_window_hours
  INTO v_replacement_enabled, v_return_window_hours
  FROM shops
  WHERE id = v_shop_id;

  -- 1. Validate Replacement is Enabled
  IF NOT COALESCE(v_replacement_enabled, TRUE) THEN
    RAISE EXCEPTION 'Replacements are not enabled for this shop.';
  END IF;

  -- 2. Validate Order Status is Delivered
  IF v_order_status <> 'delivered' THEN
    RAISE EXCEPTION 'Replacement requests can only be created for delivered orders.';
  END IF;

  -- 3. Validate Replacement Window
  IF (now() - v_order_updated_at) > (v_return_window_hours * INTERVAL '1 hour') THEN
    RAISE EXCEPTION 'The replacement window for this order has expired (% hours).', v_return_window_hours;
  END IF;

  -- 4. Validate quantity
  IF NEW.quantity > v_ordered_qty THEN
    RAISE EXCEPTION 'Requested replacement quantity (%) exceeds purchased quantity (%).', NEW.quantity, v_ordered_qty;
  END IF;

  -- 5. Validate Duplicate Active Request
  -- Check if there is an active request (Pending, Approved, Completed) containing the same order_item_id
  SELECT COUNT(*) INTO v_existing_active_count
  FROM replacement_items ri
  JOIN replacement_requests rr ON ri.replacement_request_id = rr.id
  WHERE ri.order_item_id = NEW.order_item_id
    AND rr.status IN ('Pending', 'Approved', 'Completed')
    -- If updating, exclude the current row's request
    AND rr.id <> NEW.replacement_request_id;

  IF v_existing_active_count > 0 THEN
    RAISE EXCEPTION 'An active replacement request already exists for this order item.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_replacement_request_item ON replacement_items;
CREATE TRIGGER trg_validate_replacement_request_item
  BEFORE INSERT OR UPDATE ON replacement_items
  FOR EACH ROW EXECUTE FUNCTION validate_replacement_request_item();

-- ─── 9. Notifications Trigger ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_replacement_change()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_record RECORD;
  v_shop_name TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Get shop name
  SELECT name INTO v_shop_name FROM shops WHERE id = NEW.shop_id;

  -- 1. Handle INSERT (New Request Created)
  IF (TG_OP = 'INSERT') THEN
    -- Notify customer that request was submitted
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Replacement Submitted',
      'Your replacement request for order #' || LEFT(NEW.order_id::text, 8) || ' has been submitted successfully.',
      'replacement'
    );

    -- Notify shop owner(s)
    FOR v_owner_record IN SELECT user_id FROM shop_owners WHERE shop_id = NEW.shop_id LOOP
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        v_owner_record.user_id,
        'New Replacement Request',
        'A new replacement request has been submitted for your shop "' || v_shop_name || '" (Order #' || LEFT(NEW.order_id::text, 8) || ').',
        'replacement'
      );
    END LOOP;

  -- 2. Handle UPDATE (Status Changed)
  ELSIF (TG_OP = 'UPDATE' AND OLD.status <> NEW.status) THEN
    IF NEW.status = 'Approved' THEN
      v_title := 'Replacement Approved';
      v_message := 'Your replacement request for order #' || LEFT(NEW.order_id::text, 8) || ' has been approved by "' || v_shop_name || '".';
    ELSIF NEW.status = 'Rejected' THEN
      v_title := 'Replacement Rejected';
      v_message := 'Your replacement request for order #' || LEFT(NEW.order_id::text, 8) || ' has been rejected by "' || v_shop_name || '".';
    ELSIF NEW.status = 'Completed' THEN
      v_title := 'Replacement Delivered';
      v_message := 'Your replacement item for order #' || LEFT(NEW.order_id::text, 8) || ' has been delivered.';
    ELSIF NEW.status = 'Cancelled' THEN
      v_title := 'Replacement Cancelled';
      v_message := 'You have cancelled your replacement request for order #' || LEFT(NEW.order_id::text, 8) || '.';
    END IF;

    -- Insert customer notification if it is a matching status change
    IF v_title IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (NEW.user_id, v_title, v_message, 'replacement');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_replacement_change ON replacement_requests;
CREATE TRIGGER trg_notify_on_replacement_change
  AFTER INSERT OR UPDATE ON replacement_requests
  FOR EACH ROW EXECUTE FUNCTION notify_on_replacement_change();

-- ─── 10. Enable Row Level Security (RLS) ───────────────────────────────────
ALTER TABLE replacement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE replacement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE replacement_status_logs ENABLE ROW LEVEL SECURITY;

-- ─── 11. replacement_requests Policies ──────────────────────────────────────
DROP POLICY IF EXISTS "Customers can view own replacement requests" ON replacement_requests;
CREATE POLICY "Customers can view own replacement requests" ON replacement_requests
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Shop owners can view replacement requests for their shop" ON replacement_requests;
CREATE POLICY "Shop owners can view replacement requests for their shop" ON replacement_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM shop_owners
            WHERE shop_owners.shop_id = replacement_requests.shop_id
              AND shop_owners.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all replacement requests" ON replacement_requests;
CREATE POLICY "Admins can view all replacement requests" ON replacement_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'::user_role
        )
    );

DROP POLICY IF EXISTS "Customers can insert own replacement requests" ON replacement_requests;
CREATE POLICY "Customers can insert own replacement requests" ON replacement_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can update own replacement requests" ON replacement_requests;
CREATE POLICY "Customers can update own replacement requests" ON replacement_requests
    FOR UPDATE
    USING (auth.uid() = user_id AND status = 'Pending')
    WITH CHECK (auth.uid() = user_id AND status IN ('Pending', 'Cancelled'));

DROP POLICY IF EXISTS "Shop owners can update replacement requests" ON replacement_requests;
CREATE POLICY "Shop owners can update replacement requests" ON replacement_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM shop_owners
            WHERE shop_owners.shop_id = replacement_requests.shop_id
              AND shop_owners.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM shop_owners
            WHERE shop_owners.shop_id = replacement_requests.shop_id
              AND shop_owners.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can update any replacement requests" ON replacement_requests;
CREATE POLICY "Admins can update any replacement requests" ON replacement_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'::user_role
        )
    );

-- ─── 12. replacement_items Policies ──────────────────────────────────────────
DROP POLICY IF EXISTS "Users can select replacement items if they can select request" ON replacement_items;
CREATE POLICY "Users can select replacement items if they can select request" ON replacement_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM replacement_requests
            WHERE replacement_requests.id = replacement_items.replacement_request_id
        )
    );

DROP POLICY IF EXISTS "Users can insert replacement items if they can insert request" ON replacement_items;
CREATE POLICY "Users can insert replacement items if they can insert request" ON replacement_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM replacement_requests
            WHERE replacement_requests.id = replacement_items.replacement_request_id
        )
    );

DROP POLICY IF EXISTS "Users can update replacement items if they can update request" ON replacement_items;
CREATE POLICY "Users can update replacement items if they can update request" ON replacement_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM replacement_requests
            WHERE replacement_requests.id = replacement_items.replacement_request_id
        )
    );

-- ─── 13. replacement_status_logs Policies ────────────────────────────────────
DROP POLICY IF EXISTS "Users can view replacement status logs if they can view request" ON replacement_status_logs;
CREATE POLICY "Users can view replacement status logs if they can view request" ON replacement_status_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM replacement_requests
            WHERE replacement_requests.id = replacement_status_logs.replacement_request_id
        )
    );

DROP POLICY IF EXISTS "Users can insert replacement status logs if they can update request" ON replacement_status_logs;
CREATE POLICY "Users can insert replacement status logs if they can update request" ON replacement_status_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM replacement_requests
            WHERE replacement_requests.id = replacement_status_logs.replacement_request_id
        )
    );
