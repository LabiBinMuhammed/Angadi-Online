-- ═══════════════════════════════════════════════════════════════════════════
-- Angadi — Feedback & Reviews Schema
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Feedbacks Table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedbacks (
    id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID      REFERENCES users(id) ON DELETE SET NULL,
    type       TEXT      NOT NULL CHECK (type IN ('suggestion', 'complaint', 'bug_report', 'feature_request', 'general')),
    rating     INTEGER   CHECK (rating BETWEEN 1 AND 5),
    message    TEXT      NOT NULL,
    status     TEXT      NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'resolved', 'closed')),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ─── 2. Shop Reviews Table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_reviews (
    id                         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id                    UUID          NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id                    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id                   UUID          NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    product_quality_rating     INTEGER       NOT NULL CHECK (product_quality_rating BETWEEN 1 AND 5),
    delivery_experience_rating INTEGER       NOT NULL CHECK (delivery_experience_rating BETWEEN 1 AND 5),
    order_accuracy_rating      INTEGER       NOT NULL CHECK (order_accuracy_rating BETWEEN 1 AND 5),
    overall_experience_rating  INTEGER       NOT NULL CHECK (overall_experience_rating BETWEEN 1 AND 5),
    product_quality_description     TEXT,
    delivery_experience_description TEXT,
    order_accuracy_description      TEXT,
    overall_experience_description  TEXT,
    -- Redesigned / extended columns
    product_quality_review     TEXT,
    delivery_timeliness_rating INTEGER       CHECK (delivery_timeliness_rating BETWEEN 1 AND 5),
    delivery_timeliness_review TEXT,
    order_accuracy_review      TEXT,
    overall_experience_review  TEXT,
    final_rating               NUMERIC(3,2)  NOT NULL CHECK (final_rating BETWEEN 1.00 AND 5.00),
    title                      TEXT,
    review                     TEXT,
    created_at                 TIMESTAMP     DEFAULT now(),
    updated_at                 TIMESTAMP     DEFAULT now()
);

-- ─── 3. Shop Rating Summary Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_rating_summary (
    shop_id        UUID          PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
    average_rating NUMERIC(3,2)  NOT NULL DEFAULT 0.00,
    total_reviews  INTEGER       NOT NULL DEFAULT 0,
    stars          INTEGER       NOT NULL DEFAULT 0 CHECK (stars BETWEEN 0 AND 2), -- Customer Reviews Stars
    avg_product_quality     NUMERIC(3,2)  NOT NULL DEFAULT 0.00,
    avg_delivery_timeliness NUMERIC(3,2)  NOT NULL DEFAULT 0.00,
    avg_order_accuracy      NUMERIC(3,2)  NOT NULL DEFAULT 0.00,
    avg_overall_experience  NUMERIC(3,2)  NOT NULL DEFAULT 0.00,
    -- Future Performance Stars criteria columns
    commission_compliance_stars INTEGER  NOT NULL DEFAULT 0 CHECK (commission_compliance_stars BETWEEN 0 AND 1),
    order_performance_stars     INTEGER  NOT NULL DEFAULT 0 CHECK (order_performance_stars BETWEEN 0 AND 1),
    sales_performance_stars     INTEGER  NOT NULL DEFAULT 0 CHECK (sales_performance_stars BETWEEN 0 AND 1),
    updated_at     TIMESTAMP     DEFAULT now()
);

-- ─── 4. Notifications Table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT      NOT NULL,
    message    TEXT      NOT NULL,
    type       TEXT      NOT NULL,
    is_read    BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);

-- ─── 5. Indexes ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_shop_reviews_shop_id ON shop_reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_reviews_user_id ON shop_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_reviews_order_id ON shop_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ─── 6. Auto-Update updated_at Triggers ──────────────────────────────────
CREATE OR REPLACE TRIGGER trg_feedbacks_updated_at
  BEFORE UPDATE ON feedbacks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_shop_reviews_updated_at
  BEFORE UPDATE ON shop_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 7. Calculate final_rating Trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_shop_review_final_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync ratings between timeliness and experience
  IF NEW.delivery_timeliness_rating IS NULL AND NEW.delivery_experience_rating IS NOT NULL THEN
    NEW.delivery_timeliness_rating := NEW.delivery_experience_rating;
  ELSIF NEW.delivery_timeliness_rating IS NOT NULL AND NEW.delivery_experience_rating IS NULL THEN
    NEW.delivery_experience_rating := NEW.delivery_timeliness_rating;
  END IF;

  -- Sync review text / descriptions
  IF NEW.product_quality_review IS NULL AND NEW.product_quality_description IS NOT NULL THEN
    NEW.product_quality_review := NEW.product_quality_description;
  ELSIF NEW.product_quality_review IS NOT NULL AND NEW.product_quality_description IS NULL THEN
    NEW.product_quality_description := NEW.product_quality_review;
  END IF;

  IF NEW.delivery_timeliness_review IS NULL AND NEW.delivery_experience_description IS NOT NULL THEN
    NEW.delivery_timeliness_review := NEW.delivery_experience_description;
  ELSIF NEW.delivery_timeliness_review IS NOT NULL AND NEW.delivery_experience_description IS NULL THEN
    NEW.delivery_experience_description := NEW.delivery_timeliness_review;
  END IF;

  IF NEW.order_accuracy_review IS NULL AND NEW.order_accuracy_description IS NOT NULL THEN
    NEW.order_accuracy_review := NEW.order_accuracy_description;
  ELSIF NEW.order_accuracy_review IS NOT NULL AND NEW.order_accuracy_description IS NULL THEN
    NEW.order_accuracy_description := NEW.order_accuracy_review;
  END IF;

  IF NEW.overall_experience_review IS NULL AND NEW.overall_experience_description IS NOT NULL THEN
    NEW.overall_experience_review := NEW.overall_experience_description;
  ELSIF NEW.overall_experience_review IS NOT NULL AND NEW.overall_experience_description IS NULL THEN
    NEW.overall_experience_description := NEW.overall_experience_review;
  END IF;

  -- Calculate final rating
  NEW.final_rating := ROUND(
    (
      NEW.product_quality_rating +
      COALESCE(NEW.delivery_timeliness_rating, NEW.delivery_experience_rating) +
      NEW.order_accuracy_rating +
      NEW.overall_experience_rating
    )::numeric / 4.0,
    2
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_calculate_shop_review_final_rating
  BEFORE INSERT OR UPDATE ON shop_reviews
  FOR EACH ROW EXECUTE FUNCTION calculate_shop_review_final_rating();

-- ─── 8. Verify Review Eligibility Trigger ───────────────────────────────
CREATE OR REPLACE FUNCTION verify_review_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  v_order_status order_status;
  v_order_user_id UUID;
  v_order_shop_id UUID;
BEGIN
  -- Fetch order details
  SELECT status, user_id, shop_id
  INTO v_order_status, v_order_user_id, v_order_shop_id
  FROM orders
  WHERE id = NEW.order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Must be delivered
  IF v_order_status <> 'delivered'::order_status THEN
    RAISE EXCEPTION 'You can only review delivered orders';
  END IF;

  -- Must belong to the user
  IF v_order_user_id <> NEW.user_id THEN
    RAISE EXCEPTION 'You can only review your own orders';
  END IF;

  -- Must match the shop
  IF v_order_shop_id <> NEW.shop_id THEN
    RAISE EXCEPTION 'Order shop does not match the review shop';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_verify_review_eligibility
  BEFORE INSERT ON shop_reviews
  FOR EACH ROW EXECUTE FUNCTION verify_review_eligibility();

-- ─── 9. Update Shop Rating Summary Trigger ────────────────────────────────
CREATE OR REPLACE FUNCTION update_shop_rating_summary()
RETURNS TRIGGER AS $$
DECLARE
  v_shop_id UUID;
  v_avg_rating NUMERIC(3,2);
  v_total_reviews INTEGER;
  v_stars INTEGER;
  v_avg_quality NUMERIC(3,2);
  v_avg_delivery NUMERIC(3,2);
  v_avg_accuracy NUMERIC(3,2);
  v_avg_overall NUMERIC(3,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_shop_id := OLD.shop_id;
  ELSE
    v_shop_id := NEW.shop_id;
  END IF;

  -- Recalculate averages and counts
  SELECT 
    COALESCE(AVG(final_rating), 0.00), 
    COUNT(*),
    COALESCE(AVG(product_quality_rating), 0.00),
    COALESCE(AVG(COALESCE(delivery_timeliness_rating, delivery_experience_rating)), 0.00),
    COALESCE(AVG(order_accuracy_rating), 0.00),
    COALESCE(AVG(overall_experience_rating), 0.00)
  INTO 
    v_avg_rating, 
    v_total_reviews,
    v_avg_quality,
    v_avg_delivery,
    v_avg_accuracy,
    v_avg_overall
  FROM shop_reviews
  WHERE shop_id = v_shop_id;

  -- Stars calculation:
  -- Star 1: Average Rating >= 4.0, Minimum 20 Reviews
  -- Star 2: Average Rating >= 4.5, Minimum 100 Reviews
  IF v_avg_rating >= 4.5 AND v_total_reviews >= 100 THEN
    v_stars := 2;
  ELSIF v_avg_rating >= 4.0 AND v_total_reviews >= 20 THEN
    v_stars := 1;
  ELSE
    v_stars := 0;
  END IF;

  INSERT INTO shop_rating_summary (
    shop_id, 
    average_rating, 
    total_reviews, 
    stars, 
    avg_product_quality,
    avg_delivery_timeliness,
    avg_order_accuracy,
    avg_overall_experience,
    updated_at
  )
  VALUES (
    v_shop_id, 
    v_avg_rating, 
    v_total_reviews, 
    v_stars, 
    v_avg_quality,
    v_avg_delivery,
    v_avg_accuracy,
    v_avg_overall,
    now()
  )
  ON CONFLICT (shop_id) DO UPDATE
  SET average_rating = EXCLUDED.average_rating,
      total_reviews = EXCLUDED.total_reviews,
      stars = EXCLUDED.stars,
      avg_product_quality = EXCLUDED.avg_product_quality,
      avg_delivery_timeliness = EXCLUDED.avg_delivery_timeliness,
      avg_order_accuracy = EXCLUDED.avg_order_accuracy,
      avg_overall_experience = EXCLUDED.avg_overall_experience,
      updated_at = now();

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_update_shop_rating_summary
  AFTER INSERT OR UPDATE OR DELETE ON shop_reviews
  FOR EACH ROW EXECUTE FUNCTION update_shop_rating_summary();

-- ─── 10. Automatically Create Shop Rating Summary Row Trigger ─────────────
CREATE OR REPLACE FUNCTION handle_new_shop_rating_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO shop_rating_summary (shop_id, average_rating, total_reviews, stars, updated_at)
  VALUES (NEW.id, 0.00, 0, 0, now())
  ON CONFLICT (shop_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_create_shop_rating_summary
  AFTER INSERT ON shops
  FOR EACH ROW EXECUTE FUNCTION handle_new_shop_rating_summary();

-- Populate rating summary for existing shops
INSERT INTO shop_rating_summary (shop_id, average_rating, total_reviews, stars, updated_at)
SELECT id, 0.00, 0, 0, now() FROM shops
ON CONFLICT (shop_id) DO NOTHING;

-- Populate summaries with existing reviews (if any)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT shop_id FROM shop_reviews LOOP
    -- Trigger recalculation by performing a dummy update/insert logic
    PERFORM update_shop_rating_summary_for_shop(r.shop_id);
  END LOOP;
END;
$$;

-- Helper function to recalculate manually if needed
CREATE OR REPLACE FUNCTION update_shop_rating_summary_for_shop(p_shop_id UUID)
RETURNS VOID AS $$
DECLARE
  v_avg_rating NUMERIC(3,2);
  v_total_reviews INTEGER;
  v_stars INTEGER;
  v_avg_quality NUMERIC(3,2);
  v_avg_delivery NUMERIC(3,2);
  v_avg_accuracy NUMERIC(3,2);
  v_avg_overall NUMERIC(3,2);
BEGIN
  SELECT 
    COALESCE(AVG(final_rating), 0.00), 
    COUNT(*),
    COALESCE(AVG(product_quality_rating), 0.00),
    COALESCE(AVG(COALESCE(delivery_timeliness_rating, delivery_experience_rating)), 0.00),
    COALESCE(AVG(order_accuracy_rating), 0.00),
    COALESCE(AVG(overall_experience_rating), 0.00)
  INTO 
    v_avg_rating, 
    v_total_reviews,
    v_avg_quality,
    v_avg_delivery,
    v_avg_accuracy,
    v_avg_overall
  FROM shop_reviews
  WHERE shop_id = p_shop_id;

  IF v_avg_rating >= 4.5 AND v_total_reviews >= 100 THEN
    v_stars := 2;
  ELSIF v_avg_rating >= 4.0 AND v_total_reviews >= 20 THEN
    v_stars := 1;
  ELSE
    v_stars := 0;
  END IF;

  INSERT INTO shop_rating_summary (
    shop_id, 
    average_rating, 
    total_reviews, 
    stars, 
    avg_product_quality,
    avg_delivery_timeliness,
    avg_order_accuracy,
    avg_overall_experience,
    updated_at
  )
  VALUES (
    p_shop_id, 
    v_avg_rating, 
    v_total_reviews, 
    v_stars, 
    v_avg_quality,
    v_avg_delivery,
    v_avg_accuracy,
    v_avg_overall,
    now()
  )
  ON CONFLICT (shop_id) DO UPDATE
  SET average_rating = EXCLUDED.average_rating,
      total_reviews = EXCLUDED.total_reviews,
      stars = EXCLUDED.stars,
      avg_product_quality = EXCLUDED.avg_product_quality,
      avg_delivery_timeliness = EXCLUDED.avg_delivery_timeliness,
      avg_order_accuracy = EXCLUDED.avg_order_accuracy,
      avg_overall_experience = EXCLUDED.avg_overall_experience,
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 11. Review Notifications Trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_shop_owner_on_review()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_record RECORD;
  v_shop_name TEXT;
BEGIN
  SELECT name INTO v_shop_name FROM shops WHERE id = NEW.shop_id;

  FOR v_owner_record IN SELECT user_id FROM shop_owners WHERE shop_id = NEW.shop_id LOOP
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      v_owner_record.user_id,
      'New Review Received',
      'Your shop "' || v_shop_name || '" received a new review with a rating of ' || NEW.final_rating || ' stars.',
      'review'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_notify_shop_owner_on_review
  AFTER INSERT ON shop_reviews
  FOR EACH ROW EXECUTE FUNCTION notify_shop_owner_on_review();

-- ─── 12. Feedback Notifications Trigger ───────────────────────────────────
CREATE OR REPLACE FUNCTION notify_admin_on_feedback()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_record RECORD;
BEGIN
  FOR v_admin_record IN SELECT id FROM users WHERE role = 'admin'::user_role LOOP
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      v_admin_record.id,
      'New Platform Feedback',
      'New platform feedback submitted: (' || NEW.type || ') ' || LEFT(NEW.message, 100),
      'feedback'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_notify_admin_on_feedback
  AFTER INSERT ON feedbacks
  FOR EACH ROW EXECUTE FUNCTION notify_admin_on_feedback();

-- ─── 13. Enable RLS and Policies ──────────────────────────────────────────
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_rating_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Feedbacks Policies
DROP POLICY IF EXISTS "Users can insert their own feedbacks" ON feedbacks;
CREATE POLICY "Users can insert their own feedbacks" ON feedbacks
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can select their own feedbacks" ON feedbacks;
CREATE POLICY "Users can select their own feedbacks" ON feedbacks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update feedbacks" ON feedbacks;
CREATE POLICY "Admins can update feedbacks" ON feedbacks
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'::user_role
  );

-- Shop Reviews Policies
DROP POLICY IF EXISTS "Allow public read access to reviews" ON shop_reviews;
CREATE POLICY "Allow public read access to reviews" ON shop_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert reviews for their own orders" ON shop_reviews;
CREATE POLICY "Users can insert reviews for their own orders" ON shop_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON shop_reviews;
CREATE POLICY "Users can update their own reviews" ON shop_reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON shop_reviews;
CREATE POLICY "Users can delete their own reviews" ON shop_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Shop Rating Summary Policies
DROP POLICY IF EXISTS "Allow public read access to shop rating summaries" ON shop_rating_summary;
CREATE POLICY "Allow public read access to shop rating summaries" ON shop_rating_summary
  FOR SELECT USING (true);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
CREATE POLICY "Users can read their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Migration helpers for adding new description columns to shop_reviews table
ALTER TABLE shop_reviews ADD COLUMN IF NOT EXISTS product_quality_description TEXT;
ALTER TABLE shop_reviews ADD COLUMN IF NOT EXISTS delivery_experience_description TEXT;
ALTER TABLE shop_reviews ADD COLUMN IF NOT EXISTS order_accuracy_description TEXT;
ALTER TABLE shop_reviews ADD COLUMN IF NOT EXISTS overall_experience_description TEXT;

-- Redesigned / extended columns for shop_reviews
ALTER TABLE shop_reviews ADD COLUMN IF NOT EXISTS product_quality_review TEXT;
ALTER TABLE shop_reviews ADD COLUMN IF NOT EXISTS delivery_timeliness_rating INTEGER CHECK (delivery_timeliness_rating BETWEEN 1 AND 5);
ALTER TABLE shop_reviews ADD COLUMN IF NOT EXISTS delivery_timeliness_review TEXT;
ALTER TABLE shop_reviews ADD COLUMN IF NOT EXISTS order_accuracy_review TEXT;
ALTER TABLE shop_reviews ADD COLUMN IF NOT EXISTS overall_experience_review TEXT;

-- Redesigned / extended columns for shop_rating_summary
ALTER TABLE shop_rating_summary ADD COLUMN IF NOT EXISTS avg_product_quality NUMERIC(3,2) NOT NULL DEFAULT 0.00;
ALTER TABLE shop_rating_summary ADD COLUMN IF NOT EXISTS avg_delivery_timeliness NUMERIC(3,2) NOT NULL DEFAULT 0.00;
ALTER TABLE shop_rating_summary ADD COLUMN IF NOT EXISTS avg_order_accuracy NUMERIC(3,2) NOT NULL DEFAULT 0.00;
ALTER TABLE shop_rating_summary ADD COLUMN IF NOT EXISTS avg_overall_experience NUMERIC(3,2) NOT NULL DEFAULT 0.00;

-- Future Performance Stars criteria columns
ALTER TABLE shop_rating_summary ADD COLUMN IF NOT EXISTS commission_compliance_stars INTEGER NOT NULL DEFAULT 0 CHECK (commission_compliance_stars BETWEEN 0 AND 1);
ALTER TABLE shop_rating_summary ADD COLUMN IF NOT EXISTS order_performance_stars INTEGER NOT NULL DEFAULT 0 CHECK (order_performance_stars BETWEEN 0 AND 1);
ALTER TABLE shop_rating_summary ADD COLUMN IF NOT EXISTS sales_performance_stars INTEGER NOT NULL DEFAULT 0 CHECK (sales_performance_stars BETWEEN 0 AND 1);
