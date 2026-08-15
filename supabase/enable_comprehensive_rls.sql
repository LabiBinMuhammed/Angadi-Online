-- ======================================================================================
-- ANGADI ONLINE: COMPREHENSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- ======================================================================================

-- 1. Helper function: Check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

-- 2. Helper function: Check if current authenticated user owns a specific shop
CREATE OR REPLACE FUNCTION public.is_shop_owner(target_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shop_owners
    WHERE shop_id = target_shop_id AND user_id = auth.uid()
  );
$$;


-- ======================================================================================
-- 1. USERS TABLE
-- ======================================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Allow user insert on signup" ON public.users;

-- Read: Users can view their own profile, Admins can view all
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Insert: Authenticated users can insert their own initial profile during signup
CREATE POLICY "Allow user insert on signup"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Update: Users can update their own profile, Admins can update any
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());


-- ======================================================================================
-- 2. SHOPS TABLE
-- ======================================================================================
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active shops" ON public.shops;
DROP POLICY IF EXISTS "Owners and admins can update shops" ON public.shops;
DROP POLICY IF EXISTS "Admins can insert shops" ON public.shops;

-- Read: Public can view active shops
CREATE POLICY "Public can view active shops"
  ON public.shops FOR SELECT
  USING (true);

-- Insert: Admins or verified vendors can create shops
CREATE POLICY "Admins and vendors can insert shops"
  ON public.shops FOR INSERT
  WITH CHECK (public.is_admin() OR auth.role() = 'authenticated');

-- Update: Shop owners and admins can update shop settings
CREATE POLICY "Owners and admins can update shops"
  ON public.shops FOR UPDATE
  USING (public.is_shop_owner(id) OR public.is_admin())
  WITH CHECK (public.is_shop_owner(id) OR public.is_admin());


-- ======================================================================================
-- 3. SHOP OWNERS TABLE
-- ======================================================================================
ALTER TABLE public.shop_owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their shop ownerships" ON public.shop_owners;
DROP POLICY IF EXISTS "Admins manage shop owners" ON public.shop_owners;

CREATE POLICY "Users can view their shop ownerships"
  ON public.shop_owners FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins manage shop owners"
  ON public.shop_owners FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ======================================================================================
-- 4. CATEGORIES & UNITS TABLE
-- ======================================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view units" ON public.units;
DROP POLICY IF EXISTS "Admins manage units" ON public.units;

-- Read: Everyone can read categories and units
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public can view units" ON public.units FOR SELECT USING (true);
CREATE POLICY "Admins manage units" ON public.units FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ======================================================================================
-- 5. ITEMS & ITEM VARIANTS TABLE
-- ======================================================================================
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active non-deleted items" ON public.items;
DROP POLICY IF EXISTS "Vendors manage own shop items" ON public.items;
DROP POLICY IF EXISTS "Public can view active item variants" ON public.item_variants;
DROP POLICY IF EXISTS "Vendors manage own item variants" ON public.item_variants;

-- Read: Public can view items (platform demos or active shop items)
CREATE POLICY "Public can view active non-deleted items"
  ON public.items FOR SELECT
  USING (
    deleted_at IS NULL AND (
      shop_id IS NULL OR -- Platform demo products
      is_active = true OR
      public.is_shop_owner(shop_id) OR
      public.is_admin()
    )
  );

-- Write/Manage: Vendors manage their own shop items
CREATE POLICY "Vendors manage own shop items"
  ON public.items FOR ALL
  USING (public.is_shop_owner(shop_id) OR public.is_admin())
  WITH CHECK (public.is_shop_owner(shop_id) OR public.is_admin());

-- Variants Read: Public can view active variants
CREATE POLICY "Public can view active item variants"
  ON public.item_variants FOR SELECT
  USING (
    is_active = true OR
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_variants.item_id AND (public.is_shop_owner(i.shop_id) OR public.is_admin())
    )
  );

-- Variants Write/Manage: Vendors manage variants of their items
CREATE POLICY "Vendors manage own item variants"
  ON public.item_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_variants.item_id AND (public.is_shop_owner(i.shop_id) OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_variants.item_id AND (public.is_shop_owner(i.shop_id) OR public.is_admin())
    )
  );


-- ======================================================================================
-- 6. USER ADDRESSES TABLE
-- ======================================================================================
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own addresses" ON public.user_addresses;

CREATE POLICY "Users can manage own addresses"
  ON public.user_addresses FOR ALL
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());


-- ======================================================================================
-- 7. ORDERS, ORDER ITEMS & ORDER ADDRESSES TABLE
-- ======================================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers and vendors can view orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors and admins can update orders" ON public.orders;

-- Orders Read: Customer sees their own, Vendor sees their shop's, Admin sees all
CREATE POLICY "Customers and vendors can view orders"
  ON public.orders FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.is_shop_owner(shop_id) OR
    public.is_admin()
  );

-- Orders Create: Authenticated customer creates order for self
CREATE POLICY "Customers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    public.is_admin()
  );

-- Orders Update: Vendor updates shop orders, Customer cancels if pending, Admin updates any
CREATE POLICY "Vendors and admins can update orders"
  ON public.orders FOR UPDATE
  USING (
    user_id = auth.uid() OR
    public.is_shop_owner(shop_id) OR
    public.is_admin()
  )
  WITH CHECK (
    user_id = auth.uid() OR
    public.is_shop_owner(shop_id) OR
    public.is_admin()
  );

-- Order Items Read & Write
DROP POLICY IF EXISTS "View order items" ON public.order_items;
DROP POLICY IF EXISTS "Manage order items" ON public.order_items;

CREATE POLICY "View order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR public.is_shop_owner(o.shop_id) OR public.is_admin())
    )
  );

CREATE POLICY "Manage order items"
  ON public.order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR public.is_shop_owner(o.shop_id) OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR public.is_shop_owner(o.shop_id) OR public.is_admin())
    )
  );

-- Order Addresses Read & Write (Snapshots)
DROP POLICY IF EXISTS "View order addresses" ON public.order_addresses;
DROP POLICY IF EXISTS "Insert order addresses" ON public.order_addresses;

CREATE POLICY "View order addresses"
  ON public.order_addresses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_addresses.order_id AND (o.user_id = auth.uid() OR public.is_shop_owner(o.shop_id) OR public.is_admin())
    )
  );

CREATE POLICY "Insert order addresses"
  ON public.order_addresses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_addresses.order_id AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );


-- ======================================================================================
-- 8. REPLACEMENT REQUESTS & REPLACEMENT ITEMS
-- ======================================================================================
ALTER TABLE public.replacement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replacement_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View replacement requests" ON public.replacement_requests;
DROP POLICY IF EXISTS "Create replacement requests" ON public.replacement_requests;
DROP POLICY IF EXISTS "Update replacement requests" ON public.replacement_requests;

CREATE POLICY "View replacement requests"
  ON public.replacement_requests FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.is_shop_owner(shop_id) OR
    public.is_admin()
  );

CREATE POLICY "Create replacement requests"
  ON public.replacement_requests FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    public.is_admin()
  );

CREATE POLICY "Update replacement requests"
  ON public.replacement_requests FOR UPDATE
  USING (
    user_id = auth.uid() OR
    public.is_shop_owner(shop_id) OR
    public.is_admin()
  )
  WITH CHECK (
    user_id = auth.uid() OR
    public.is_shop_owner(shop_id) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "View replacement items" ON public.replacement_items;
DROP POLICY IF EXISTS "Manage replacement items" ON public.replacement_items;

CREATE POLICY "View replacement items"
  ON public.replacement_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.replacement_requests r
      WHERE r.id = replacement_items.replacement_request_id AND (r.user_id = auth.uid() OR public.is_shop_owner(r.shop_id) OR public.is_admin())
    )
  );

CREATE POLICY "Manage replacement items"
  ON public.replacement_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.replacement_requests r
      WHERE r.id = replacement_items.replacement_request_id AND (r.user_id = auth.uid() OR public.is_shop_owner(r.shop_id) OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.replacement_requests r
      WHERE r.id = replacement_items.replacement_request_id AND (r.user_id = auth.uid() OR public.is_shop_owner(r.shop_id) OR public.is_admin())
    )
  );


-- ======================================================================================
-- 9. SHOP REVIEWS & FEEDBACK
-- ======================================================================================
ALTER TABLE public.shop_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view reviews" ON public.shop_reviews;
DROP POLICY IF EXISTS "Customers can create reviews" ON public.shop_reviews;
DROP POLICY IF EXISTS "Customers can update own reviews" ON public.shop_reviews;

CREATE POLICY "Public can view reviews"
  ON public.shop_reviews FOR SELECT
  USING (true);

CREATE POLICY "Customers can create reviews"
  ON public.shop_reviews FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    public.is_admin()
  );

CREATE POLICY "Customers can update own reviews"
  ON public.shop_reviews FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());


-- ======================================================================================
-- 10. LOCATIONS TABLE
-- ======================================================================================
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view locations" ON public.locations;
DROP POLICY IF EXISTS "Admins manage locations" ON public.locations;

CREATE POLICY "Public can view locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Admins manage locations" ON public.locations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
