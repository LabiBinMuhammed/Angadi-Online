-- 0. Ensure the enum types exist before defining functions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_status') THEN
        CREATE TYPE item_status AS ENUM ('draft', 'incomplete', 'ready', 'published', 'hidden', 'rejected', 'out_of_stock');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sell_mode') THEN
        CREATE TYPE sell_mode AS ENUM ('manual', 'packed', 'dynamic', 'portion');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'variant_type') THEN
        CREATE TYPE variant_type AS ENUM ('manual', 'packed', 'dynamic', 'portion');
    END IF;
END $$;

-- 1. Add demo_item_id and image_url columns to items table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'demo_item_id') THEN
        ALTER TABLE items ADD COLUMN demo_item_id UUID REFERENCES demo_items(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'image_url') THEN
        ALTER TABLE items ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- 2. Create the RPC function to add items transactionally
CREATE OR REPLACE FUNCTION create_shop_item_transaction(payload JSONB)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  new_item_id UUID;
  new_config_id UUID;
  v_var JSONB;
  v_status item_status;
  v_primary_image_url TEXT;
BEGIN
  v_status := COALESCE((payload->>'status')::item_status, 'draft'::item_status);

  -- Extract primary image url from payload images if present
  IF payload ? 'images' AND jsonb_array_length(payload->'images') > 0 THEN
    v_primary_image_url := payload->'images'->0->>'image_url';
  ELSE
    v_primary_image_url := NULL;
  END IF;

  -- Insert into items
  INSERT INTO items (
    shop_id, 
    category_id, 
    demo_item_id, 
    name, 
    description, 
    status, 
    has_variants,
    demo_version,
    translations,
    image_url
  )
  VALUES (
    (payload->>'shop_id')::uuid,
    NULLIF(payload->>'category_id', '')::uuid,
    NULLIF(payload->>'demo_item_id', '')::uuid,
    payload->>'name',
    NULLIF(payload->>'description', ''),
    v_status,
    COALESCE((payload->>'has_variants')::boolean, false),
    COALESCE((payload->>'demo_version')::integer, 1),
    COALESCE(payload->'translations', '{}'::jsonb),
    v_primary_image_url
  ) RETURNING id INTO new_item_id;

  -- Insert into item_sell_config
  IF payload ? 'sell_config' AND payload->'sell_config' IS NOT NULL THEN
    INSERT INTO item_sell_config (
      item_id, 
      sell_mode, 
      base_unit_id, 
      price_per_base_unit, 
      allow_custom_quantity,
      max_price_increase_percent,
      max_price_limit
    )
    VALUES (
      new_item_id,
      (payload->'sell_config'->>'sell_mode')::sell_mode,
      NULLIF(payload->'sell_config'->>'base_unit_id', '')::uuid,
      (payload->'sell_config'->>'price_per_base_unit')::numeric,
      COALESCE((payload->'sell_config'->>'allow_custom_quantity')::boolean, true),
      (payload->'sell_config'->>'max_price_increase_percent')::numeric,
      (payload->'sell_config'->>'max_price_limit')::numeric
    ) RETURNING id INTO new_config_id;
  END IF;

  -- Insert into item_variants
  IF payload ? 'variants' AND jsonb_array_length(payload->'variants') > 0 THEN
    FOR v_var IN SELECT * FROM jsonb_array_elements(payload->'variants')
    LOOP
      INSERT INTO item_variants (
        item_id, 
        variant_type, 
        label, 
        unit_id, 
        value, 
        price, 
        min_value, 
        max_value, 
        is_default, 
        is_active,
        image_url
      )
      VALUES (
        new_item_id,
        (v_var->>'variant_type')::variant_type,
        v_var->>'label',
        NULLIF(v_var->>'unit_id', '')::uuid,
        (v_var->>'value')::numeric,
        (v_var->>'price')::numeric,
        (v_var->>'min_value')::numeric,
        (v_var->>'max_value')::numeric,
        COALESCE((v_var->>'is_default')::boolean, false),
        COALESCE((v_var->>'is_active')::boolean, true),
        v_var->>'image_url'
      );
    END LOOP;
  END IF;

  -- Insert into item_images
  IF payload ? 'images' AND jsonb_array_length(payload->'images') > 0 THEN
    FOR v_var IN SELECT * FROM jsonb_array_elements(payload->'images')
    LOOP
      INSERT INTO item_images (item_id, image_url, is_primary, sort_order)
      VALUES (
        new_item_id,
        v_var->>'image_url',
        COALESCE((v_var->>'is_primary')::boolean, false),
        COALESCE((v_var->>'sort_order')::integer, 0)
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'item_id', new_item_id);

EXCEPTION WHEN OTHERS THEN
  -- Raise exception to rollback transaction
  RAISE EXCEPTION 'Item creation failed: %', SQLERRM;
END;
$$;
