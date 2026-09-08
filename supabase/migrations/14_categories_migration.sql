-- =========================================================================
-- 14 Standardized Product Categories & Unit Group Bindings Migration
-- =========================================================================

-- 1. Insert or update the 14 standard categories with display order & commission rates
INSERT INTO public.categories (name, description, is_active, display_order, commission_percentage)
VALUES
  ('Fresh Vegetables', 'Leafy, root, and exotic farm-fresh vegetables', true, 1, 2.5),
  ('Fresh Fruits', 'Tropical, imported, and organic seasonal fresh fruits', true, 2, 2.5),
  ('Rice, Atta & Flours', 'Staple grains, wheat flours, rice, and breakfast oats', true, 3, 2.5),
  ('Dals, Pulses & Beans', 'Whole and split lentils, chickpeas, rajma, and beans', true, 4, 2.5),
  ('Dairy', 'Fresh milk, curd, paneer, butter milk, and cheeses', true, 5, 2.5),
  ('Oils & Ghee', 'Cooking edible oils, pure cow ghee, and table butter', true, 6, 2.5),
  ('Spices & Masalas', 'Ground spice powders, whole spices, and curry blends', true, 7, 4.0),
  ('Bakery', 'Fresh breads, buns, slice cakes, brownies, and rusks', true, 8, 4.0),
  ('Biscuits & Cookies', 'Tea biscuits, cookies, cream sandwiches, and crackers', true, 9, 4.0),
  ('Dry Fruits & Cereals', 'Premium nuts, edible seeds, granola, and breakfast cereals', true, 10, 4.0),
  ('Beverages', 'Black tea, instant coffee, fruit juices, and soft drinks', true, 11, 4.0),
  ('Desserts & Ice Creams', 'Ice cream tubs, kulfi, cones, payasam mixes, and sweets', true, 12, 4.0),
  ('Meat & Fish', 'Fresh poultry, mutton, seafood, and farm eggs', true, 13, 4.0),
  ('Household & Stationery', 'Daily household essentials, cleaning products, and office paper', true, 14, 4.0)
ON CONFLICT (name) DO UPDATE
SET 
  description = EXCLUDED.description,
  is_active = true,
  display_order = EXCLUDED.display_order,
  commission_percentage = EXCLUDED.commission_percentage;

-- 2. Bind categories to unit groups (category_unit_groups)
DO $$
DECLARE
  v_g_wei UUID := (SELECT id FROM public.unit_groups WHERE name = 'Weight' LIMIT 1);
  v_g_vol UUID := (SELECT id FROM public.unit_groups WHERE name = 'Volume' LIMIT 1);
  v_g_cnt UUID := (SELECT id FROM public.unit_groups WHERE name = 'Count' LIMIT 1);

  c RECORD;
BEGIN
  FOR c IN SELECT id, name FROM public.categories LOOP
    IF c.name IN ('Fresh Vegetables', 'Fresh Fruits') THEN
      INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (c.id, v_g_wei) ON CONFLICT DO NOTHING;
    ELSIF c.name IN ('Rice, Atta & Flours', 'Dals, Pulses & Beans', 'Spices & Masalas', 'Dry Fruits & Cereals') THEN
      INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (c.id, v_g_wei) ON CONFLICT DO NOTHING;
      INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (c.id, v_g_cnt) ON CONFLICT DO NOTHING;
    ELSIF c.name IN ('Dairy', 'Oils & Ghee', 'Beverages', 'Desserts & Ice Creams') THEN
      INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (c.id, v_g_vol) ON CONFLICT DO NOTHING;
      INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (c.id, v_g_cnt) ON CONFLICT DO NOTHING;
      INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (c.id, v_g_wei) ON CONFLICT DO NOTHING;
    ELSIF c.name IN ('Bakery', 'Biscuits & Cookies', 'Household & Stationery') THEN
      INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (c.id, v_g_cnt) ON CONFLICT DO NOTHING;
      INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (c.id, v_g_wei) ON CONFLICT DO NOTHING;
    ELSIF c.name = 'Meat & Fish' THEN
      INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (c.id, v_g_wei) ON CONFLICT DO NOTHING;
      INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (c.id, v_g_cnt) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
