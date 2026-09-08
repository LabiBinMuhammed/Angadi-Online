-- Only insert category_unit_groups demo data (run this in Supabase SQL Editor)

-- First clear existing mappings
DELETE FROM public.category_unit_groups WHERE id IS NOT NULL;

-- Re-insert mappings using subqueries to find UUIDs dynamically
DO $$
DECLARE
  v_veg UUID := (SELECT id FROM public.categories WHERE name = 'Vegetables' LIMIT 1);
  v_fru UUID := (SELECT id FROM public.categories WHERE name = 'Fruits' LIMIT 1);
  v_gro UUID := (SELECT id FROM public.categories WHERE name = 'Grocery' LIMIT 1);
  v_dai UUID := (SELECT id FROM public.categories WHERE name = 'Dairy & Beverages' LIMIT 1);
  v_met UUID := (SELECT id FROM public.categories WHERE name = 'Meat & Fish' LIMIT 1);
  v_bak UUID := (SELECT id FROM public.categories WHERE name = 'Bakery' LIMIT 1);
  v_hou UUID := (SELECT id FROM public.categories WHERE name = 'Household Essentials' LIMIT 1);
  v_sta UUID := (SELECT id FROM public.categories WHERE name = 'Stationery' LIMIT 1);

  g_wei UUID := (SELECT id FROM public.unit_groups WHERE name = 'Weight' LIMIT 1);
  g_vol UUID := (SELECT id FROM public.unit_groups WHERE name = 'Volume' LIMIT 1);
  g_cnt UUID := (SELECT id FROM public.unit_groups WHERE name = 'Count' LIMIT 1);
BEGIN
  IF v_veg IS NOT NULL AND g_wei IS NOT NULL THEN
    INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (v_veg, g_wei) ON CONFLICT DO NOTHING;
  END IF;
  IF v_fru IS NOT NULL AND g_wei IS NOT NULL THEN
    INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (v_fru, g_wei) ON CONFLICT DO NOTHING;
  END IF;
  IF v_gro IS NOT NULL AND g_wei IS NOT NULL THEN
    INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (v_gro, g_wei) ON CONFLICT DO NOTHING;
  END IF;
  IF v_gro IS NOT NULL AND g_cnt IS NOT NULL THEN
    INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (v_gro, g_cnt) ON CONFLICT DO NOTHING;
  END IF;
  IF v_dai IS NOT NULL AND g_vol IS NOT NULL THEN
    INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (v_dai, g_vol) ON CONFLICT DO NOTHING;
  END IF;
  IF v_dai IS NOT NULL AND g_cnt IS NOT NULL THEN
    INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (v_dai, g_cnt) ON CONFLICT DO NOTHING;
  END IF;
  IF v_met IS NOT NULL AND g_wei IS NOT NULL THEN
    INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (v_met, g_wei) ON CONFLICT DO NOTHING;
  END IF;
  IF v_bak IS NOT NULL AND g_cnt IS NOT NULL THEN
    INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (v_bak, g_cnt) ON CONFLICT DO NOTHING;
  END IF;
  IF v_bak IS NOT NULL AND g_wei IS NOT NULL THEN
    INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (v_bak, g_wei) ON CONFLICT DO NOTHING;
  END IF;
  IF v_hou IS NOT NULL AND g_cnt IS NOT NULL THEN
    INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (v_hou, g_cnt) ON CONFLICT DO NOTHING;
  END IF;
  IF v_hou IS NOT NULL AND g_wei IS NOT NULL THEN
    INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (v_hou, g_wei) ON CONFLICT DO NOTHING;
  END IF;
  IF v_hou IS NOT NULL AND g_vol IS NOT NULL THEN
    INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (v_hou, g_vol) ON CONFLICT DO NOTHING;
  END IF;
  IF v_sta IS NOT NULL AND g_cnt IS NOT NULL THEN
    INSERT INTO public.category_unit_groups (category_id, unit_group_id) VALUES (v_sta, g_cnt) ON CONFLICT DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Category-Unit Group mappings seeded successfully!';
END $$;

NOTIFY pgrst, 'reload schema';
