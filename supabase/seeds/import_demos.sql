-- =========================================================================
-- Supabase SQL Editor Seeding Script: Category Order, Demo Items & Variants
-- =========================================================================

-- 1. Ensure all categories exist and set their display orders
INSERT INTO public.categories (name, description, is_active, display_order)
VALUES
  ('Vegetables', 'Fresh vegetables', true, 1),
  ('Fruits', 'Fresh fruits', true, 2),
  ('Grocery', 'Dry grocery products', true, 3),
  ('Dairy & Beverages', 'Milk and beverages', true, 4),
  ('Meat & Fish', 'Fresh meat products', true, 5),
  ('Bakery', 'Bakery products', true, 6),
  ('Household Essentials', 'Daily essentials', true, 7),
  ('Stationery', 'Office and school items', true, 8)
ON CONFLICT (name) DO UPDATE 
SET display_order = EXCLUDED.display_order;

-- 2. Ensure missing units exist under Count Group
INSERT INTO public.units (name, symbol, unit_group_id, base_multiplier)
VALUES
  ('Pack', 'pack', '0cec5a1b-e9e3-47d7-9c70-2ca1874b8bf1', 1),
  ('Bottle', 'bottle', '0cec5a1b-e9e3-47d7-9c70-2ca1874b8bf1', 1)
ON CONFLICT (symbol) DO NOTHING;

-- 3. Clear existing demo data to prevent duplication
DELETE FROM public.demo_variants WHERE id IS NOT NULL;
DELETE FROM public.demo_sell_config WHERE id IS NOT NULL;
DELETE FROM public.demo_items WHERE id IS NOT NULL;
DELETE FROM public.category_unit_groups WHERE id IS NOT NULL;

-- 4. Function block to dynamically seed demo items and map IDs
DO $$
DECLARE
  -- Category IDs
  v_veg UUID := (SELECT id FROM public.categories WHERE name = 'Vegetables');
  v_fru UUID := (SELECT id FROM public.categories WHERE name = 'Fruits');
  v_gro UUID := (SELECT id FROM public.categories WHERE name = 'Grocery');
  v_dai UUID := (SELECT id FROM public.categories WHERE name = 'Dairy & Beverages');
  v_met UUID := (SELECT id FROM public.categories WHERE name = 'Meat & Fish');
  v_bak UUID := (SELECT id FROM public.categories WHERE name = 'Bakery');
  v_hou UUID := (SELECT id FROM public.categories WHERE name = 'Household Essentials');
  v_sta UUID := (SELECT id FROM public.categories WHERE name = 'Stationery');

  -- Unit IDs
  u_kg  UUID := (SELECT id FROM public.units WHERE symbol = 'kg');
  u_g   UUID := (SELECT id FROM public.units WHERE symbol = 'g');
  u_l   UUID := (SELECT id FROM public.units WHERE symbol = 'L');
  u_ml  UUID := (SELECT id FROM public.units WHERE symbol = 'ml');
  u_pcs UUID := (SELECT id FROM public.units WHERE symbol = 'pcs');
  u_pck UUID := (SELECT id FROM public.units WHERE symbol = 'pack');
  u_btl UUID := (SELECT id FROM public.units WHERE symbol = 'bottle');

  -- Unit Group IDs
  g_wei UUID := (SELECT id FROM public.unit_groups WHERE name = 'Weight');
  g_vol UUID := (SELECT id FROM public.unit_groups WHERE name = 'Volume');
  g_cnt UUID := (SELECT id FROM public.unit_groups WHERE name = 'Count');
  g_len UUID := (SELECT id FROM public.unit_groups WHERE name = 'Length');

  -- Temporary holders for inserted item IDs
  item_id UUID;
BEGIN
  -- =======================================================================
  -- 🥕 VEGETABLES
  -- =======================================================================
  
  -- VEG-MAN-001: By Weight (manual)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_veg, 'By Weight', u_kg, 'Manual', 'VEG-MAN-001', 1) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Manual', u_kg, 0, true, 15, 0);

  -- VEG-PACK-001: Packed Product (fixed)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_veg, 'Packed Product', u_pck, 'Fixed', 'VEG-PACK-001', 2) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Fixed', u_pck, 0, false, 15, 0);
  -- Variants for PACK_WEIGHT
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, is_default, is_active, display_order) VALUES
    (item_id, 'Fixed', '250g Pack', u_g, 250, 0, false, true, 1),
    (item_id, 'Fixed', '500g Pack', u_g, 500, 0, true, true, 2),
    (item_id, 'Fixed', '1kg Pack', u_g, 1000, 0, false, true, 3),
    (item_id, 'Fixed', '2kg Pack', u_g, 2000, 0, false, true, 4),
    (item_id, 'Fixed', '5kg Pack', u_g, 5000, 0, false, true, 5);

  -- VEG-DYN-001: Cut Portion (dynamic)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_veg, 'Cut Portion', u_kg, 'Dynamic', 'VEG-DYN-001', 3) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Dynamic', u_kg, 0, true, 15, 0);
  -- Variants for CUT_PORTION_SIZE
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, min_value, max_value, is_default, is_active, display_order) VALUES
    (item_id, 'Dynamic', 'Quarter', u_kg, 1.5, 0, 1.5, 2.0, false, true, 1),
    (item_id, 'Dynamic', 'Half', u_kg, 3.0, 0, 3.0, 4.0, true, true, 2),
    (item_id, 'Dynamic', '3 Quarter', u_kg, 4.5, 0, 4.5, 6.0, false, true, 3),
    (item_id, 'Dynamic', 'Full', u_kg, 6.0, 0, 6.0, 8.0, false, true, 4);

  -- VEG-POR-001: By Size (portion)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_veg, 'By Size', u_kg, 'Portion', 'VEG-POR-001', 4) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Portion', u_kg, 0, false, 15, 0);
  -- Variants for SIZE
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, min_value, max_value, is_default, is_active, display_order) VALUES
    (item_id, 'Portion', 'Small', u_g, 800, 0, 800, 1100, false, true, 1),
    (item_id, 'Portion', 'Medium', u_kg, 1.5, 0, 1.5, 2.0, true, true, 2),
    (item_id, 'Portion', 'Large', u_kg, 2.5, 0, 2.5, 3.2, false, true, 3);


  -- =======================================================================
  -- 🍎 FRUITS
  -- =======================================================================

  -- FRU-MAN-001: By Weight (manual)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_fru, 'By Weight', u_kg, 'Manual', 'FRU-MAN-001', 1) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Manual', u_kg, 0, true, 15, 0);

  -- FRU-PACK-001: Packed Product (fixed)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_fru, 'Packed Product', u_pck, 'Fixed', 'FRU-PACK-001', 2) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Fixed', u_pck, 0, false, 15, 0);
  -- Variants for PACK_WEIGHT
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, is_default, is_active, display_order) VALUES
    (item_id, 'Fixed', '250g Pack', u_g, 250, 0, false, true, 1),
    (item_id, 'Fixed', '500g Pack', u_g, 500, 0, true, true, 2),
    (item_id, 'Fixed', '1kg Pack', u_g, 1000, 0, false, true, 3),
    (item_id, 'Fixed', '2kg Pack', u_g, 2000, 0, false, true, 4),
    (item_id, 'Fixed', '5kg Pack', u_g, 5000, 0, false, true, 5);

  -- FRU-DYN-001: Cut Portion (dynamic)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_fru, 'Cut Portion', u_kg, 'Dynamic', 'FRU-DYN-001', 3) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Dynamic', u_kg, 0, true, 15, 0);
  -- Variants for CUT_PORTION_SIZE
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, min_value, max_value, is_default, is_active, display_order) VALUES
    (item_id, 'Dynamic', 'Quarter', u_kg, 1.5, 0, 1.5, 2.0, false, true, 1),
    (item_id, 'Dynamic', 'Half', u_kg, 3.0, 0, 3.0, 4.0, true, true, 2),
    (item_id, 'Dynamic', '3 Quarter', u_kg, 4.5, 0, 4.5, 6.0, false, true, 3),
    (item_id, 'Dynamic', 'Full', u_kg, 6.0, 0, 6.0, 8.0, false, true, 4);

  -- FRU-POR-001: By Size (portion)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_fru, 'By Size', u_kg, 'Portion', 'FRU-POR-001', 4) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Portion', u_kg, 0, false, 15, 0);
  -- Variants for SIZE
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, min_value, max_value, is_default, is_active, display_order) VALUES
    (item_id, 'Portion', 'Small', u_g, 800, 0, 800, 1100, false, true, 1),
    (item_id, 'Portion', 'Medium', u_kg, 1.5, 0, 1.5, 2.0, true, true, 2),
    (item_id, 'Portion', 'Large', u_kg, 2.5, 0, 2.5, 3.2, false, true, 3);


  -- =======================================================================
  -- 🥜 GROCERY
  -- =======================================================================

  -- GRO-MAN-001: By Weight (manual)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_gro, 'By Weight', u_kg, 'Manual', 'GRO-MAN-001', 1) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Manual', u_kg, 0, true, 15, 0);

  -- GRO-PACK-001: Packed Product (fixed)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_gro, 'Packed Product', u_pck, 'Fixed', 'GRO-PACK-001', 2) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Fixed', u_pck, 0, false, 15, 0);
  -- Variants for PACK_WEIGHT
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, is_default, is_active, display_order) VALUES
    (item_id, 'Fixed', '250g Pack', u_g, 250, 0, false, true, 1),
    (item_id, 'Fixed', '500g Pack', u_g, 500, 0, true, true, 2),
    (item_id, 'Fixed', '1kg Pack', u_g, 1000, 0, false, true, 3),
    (item_id, 'Fixed', '2kg Pack', u_g, 2000, 0, false, true, 4),
    (item_id, 'Fixed', '5kg Pack', u_g, 5000, 0, false, true, 5);


  -- =======================================================================
  -- 🥛 DAIRY & BEVERAGES
  -- =======================================================================

  -- DAI-MAN-001: By Volume (manual)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_dai, 'By Volume', u_l, 'Manual', 'DAI-MAN-001', 1) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Manual', u_l, 0, true, 15, 0);

  -- DAI-PACK-001: Packed Product (fixed)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_dai, 'Packed Product', u_btl, 'Fixed', 'DAI-PACK-001', 2) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Fixed', u_btl, 0, false, 15, 0);
  -- Variants for PACK_VOLUME
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, is_default, is_active, display_order) VALUES
    (item_id, 'Fixed', '250ml Bottle', u_ml, 250, 0, false, true, 1),
    (item_id, 'Fixed', '500ml Bottle', u_ml, 500, 0, true, true, 2),
    (item_id, 'Fixed', '1L Bottle', u_ml, 1000, 0, false, true, 3),
    (item_id, 'Fixed', '2L Bottle', u_ml, 2000, 0, false, true, 4),
    (item_id, 'Fixed', '5L Can', u_ml, 5000, 0, false, true, 5);


  -- =======================================================================
  -- 🥩 MEAT & FISH
  -- =======================================================================

  -- MEAT-MAN-001: By Weight (manual)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_met, 'By Weight', u_kg, 'Manual', 'MEAT-MAN-001', 1) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Manual', u_kg, 0, true, 15, 0);

  -- MEAT-PACK-001: Packed Product (fixed)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_met, 'Packed Product', u_pck, 'Fixed', 'MEAT-PACK-001', 2) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Fixed', u_pck, 0, false, 15, 0);
  -- Variants for PACK_WEIGHT
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, is_default, is_active, display_order) VALUES
    (item_id, 'Fixed', '250g Pack', u_g, 250, 0, false, true, 1),
    (item_id, 'Fixed', '500g Pack', u_g, 500, 0, true, true, 2),
    (item_id, 'Fixed', '1kg Pack', u_g, 1000, 0, false, true, 3),
    (item_id, 'Fixed', '2kg Pack', u_g, 2000, 0, false, true, 4),
    (item_id, 'Fixed', '5kg Pack', u_g, 5000, 0, false, true, 5);

  -- MEAT-DYN-001: Cut Portion (dynamic)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_met, 'Cut Portion', u_kg, 'Dynamic', 'MEAT-DYN-001', 3) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Dynamic', u_kg, 0, true, 15, 0);
  -- Variants for CUT_PORTION_SIZE
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, min_value, max_value, is_default, is_active, display_order) VALUES
    (item_id, 'Dynamic', 'Quarter', u_kg, 1.5, 0, 1.5, 2.0, false, true, 1),
    (item_id, 'Dynamic', 'Half', u_kg, 3.0, 0, 3.0, 4.0, true, true, 2),
    (item_id, 'Dynamic', '3 Quarter', u_kg, 4.5, 0, 4.5, 6.0, false, true, 3),
    (item_id, 'Dynamic', 'Full', u_kg, 6.0, 0, 6.0, 8.0, false, true, 4);

  -- MEAT-POR-001: By Size (portion)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_met, 'By Size', u_kg, 'Portion', 'MEAT-POR-001', 4) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Portion', u_kg, 0, false, 15, 0);
  -- Variants for SIZE
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, min_value, max_value, is_default, is_active, display_order) VALUES
    (item_id, 'Portion', 'Small', u_g, 800, 0, 800, 1100, false, true, 1),
    (item_id, 'Portion', 'Medium', u_kg, 1.5, 0, 1.5, 2.0, true, true, 2),
    (item_id, 'Portion', 'Large', u_kg, 2.5, 0, 2.5, 3.2, false, true, 3);


  -- =======================================================================
  -- 🍞 BAKERY
  -- =======================================================================

  -- BAK-MAN-001: By Weight (manual)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_bak, 'By Weight', u_kg, 'Manual', 'BAK-MAN-001', 1) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Manual', u_kg, 0, true, 15, 0);

  -- BAK-PACK-001: Packed Product (fixed)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_bak, 'Packed Product', u_pck, 'Fixed', 'BAK-PACK-001', 2) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Fixed', u_pck, 0, false, 15, 0);
  -- Variants for PACK_WEIGHT
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, is_default, is_active, display_order) VALUES
    (item_id, 'Fixed', '250g Pack', u_g, 250, 0, false, true, 1),
    (item_id, 'Fixed', '500g Pack', u_g, 500, 0, true, true, 2),
    (item_id, 'Fixed', '1kg Pack', u_g, 1000, 0, false, true, 3),
    (item_id, 'Fixed', '2kg Pack', u_g, 2000, 0, false, true, 4),
    (item_id, 'Fixed', '5kg Pack', u_g, 5000, 0, false, true, 5);

  -- BAK-POR-001: By Size (portion)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_bak, 'By Size', u_kg, 'Portion', 'BAK-POR-001', 3) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Portion', u_kg, 0, false, 15, 0);
  -- Variants for SIZE
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, min_value, max_value, is_default, is_active, display_order) VALUES
    (item_id, 'Portion', 'Small', u_g, 800, 0, 800, 1100, false, true, 1),
    (item_id, 'Portion', 'Medium', u_kg, 1.5, 0, 1.5, 2.0, true, true, 2),
    (item_id, 'Portion', 'Large', u_kg, 2.5, 0, 2.5, 3.2, false, true, 3);


  -- =======================================================================
  -- 🧼 HOUSEHOLD ESSENTIALS
  -- =======================================================================

  -- HOU-MAN-001: Bulk Product (manual)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_hou, 'Bulk Product', u_kg, 'Manual', 'HOU-MAN-001', 1) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Manual', u_kg, 0, true, 15, 0);

  -- HOU-PACK-001: Packed Product (fixed)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_hou, 'Packed Product', u_pck, 'Fixed', 'HOU-PACK-001', 2) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Fixed', u_pck, 0, false, 15, 0);
  -- Variants for PACK_WEIGHT_VOLUME
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, is_default, is_active, display_order) VALUES
    (item_id, 'Fixed', 'Small Pack', u_pck, 1, 0, false, true, 1),
    (item_id, 'Fixed', 'Medium Pack', u_pck, 2, 0, true, true, 2),
    (item_id, 'Fixed', 'Large Pack', u_pck, 3, 0, false, true, 3);


  -- =======================================================================
  -- ✏️ STATIONERY
  -- =======================================================================

  -- STA-MAN-001: Bulk Product (manual)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_sta, 'Bulk Product', u_pcs, 'Manual', 'STA-MAN-001', 1) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Manual', u_pcs, 0, true, 15, 0);

  -- STA-PACK-001: Packed Product (fixed)
  INSERT INTO public.demo_items (category_id, name, unit_id, sell_mode, code, display_order)
  VALUES (v_sta, 'Packed Product', u_pck, 'Fixed', 'STA-PACK-001', 2) RETURNING id INTO item_id;
  INSERT INTO public.demo_sell_config (demo_item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity, max_price_increase_percent, max_price_limit)
  VALUES (item_id, 'Fixed', u_pck, 0, false, 15, 0);
  -- Variants for PACK_COUNT
  INSERT INTO public.demo_variants (demo_item_id, variant_type, label, unit_id, value, price, is_default, is_active, display_order) VALUES
    (item_id, 'Fixed', 'Single', u_pcs, 1, 0, true, true, 1),
    (item_id, 'Fixed', 'Pack of 2', u_pcs, 2, 0, false, true, 2),
    (item_id, 'Fixed', 'Pack of 5', u_pcs, 5, 0, false, true, 3),
    (item_id, 'Fixed', 'Pack of 10', u_pcs, 10, 0, false, true, 4),
    (item_id, 'Fixed', 'Pack of 12', u_pcs, 12, 0, false, true, 5),
    (item_id, 'Fixed', 'Pack of 24', u_pcs, 24, 0, false, true, 6);

  -- =======================================================================
  -- 🔗 CATEGORY → UNIT GROUP MAPPINGS
  -- =======================================================================
  -- Map each category to one or more unit groups that make sense for it

  -- Vegetables → Weight (kg / g)
  INSERT INTO public.category_unit_groups (category_id, unit_group_id)
  VALUES (v_veg, g_wei) ON CONFLICT DO NOTHING;

  -- Fruits → Weight
  INSERT INTO public.category_unit_groups (category_id, unit_group_id)
  VALUES (v_fru, g_wei) ON CONFLICT DO NOTHING;

  -- Grocery → Weight + Count (can be sold in kg or in packs)
  INSERT INTO public.category_unit_groups (category_id, unit_group_id)
  VALUES (v_gro, g_wei) ON CONFLICT DO NOTHING;
  INSERT INTO public.category_unit_groups (category_id, unit_group_id)
  VALUES (v_gro, g_cnt) ON CONFLICT DO NOTHING;

  -- Dairy & Beverages → Volume + Count
  INSERT INTO public.category_unit_groups (category_id, unit_group_id)
  VALUES (v_dai, g_vol) ON CONFLICT DO NOTHING;
  INSERT INTO public.category_unit_groups (category_id, unit_group_id)
  VALUES (v_dai, g_cnt) ON CONFLICT DO NOTHING;

  -- Meat & Fish → Weight
  INSERT INTO public.category_unit_groups (category_id, unit_group_id)
  VALUES (v_met, g_wei) ON CONFLICT DO NOTHING;

  -- Bakery → Count + Weight
  INSERT INTO public.category_unit_groups (category_id, unit_group_id)
  VALUES (v_bak, g_cnt) ON CONFLICT DO NOTHING;
  INSERT INTO public.category_unit_groups (category_id, unit_group_id)
  VALUES (v_bak, g_wei) ON CONFLICT DO NOTHING;

  -- Household Essentials → Count + Weight + Volume
  INSERT INTO public.category_unit_groups (category_id, unit_group_id)
  VALUES (v_hou, g_cnt) ON CONFLICT DO NOTHING;
  INSERT INTO public.category_unit_groups (category_id, unit_group_id)
  VALUES (v_hou, g_wei) ON CONFLICT DO NOTHING;
  INSERT INTO public.category_unit_groups (category_id, unit_group_id)
  VALUES (v_hou, g_vol) ON CONFLICT DO NOTHING;

  -- Stationery → Count
  INSERT INTO public.category_unit_groups (category_id, unit_group_id)
  VALUES (v_sta, g_cnt) ON CONFLICT DO NOTHING;

END $$;

-- 5. Reload PostgREST schema cache to reflect updates immediately
NOTIFY pgrst, 'reload schema';
