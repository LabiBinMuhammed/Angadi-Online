-- Migration: Add availability_confidence to items and update create_shop_item_transaction RPC

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'items' AND column_name = 'availability_confidence'
    ) THEN
        ALTER TABLE items ADD COLUMN availability_confidence INTEGER DEFAULT 5 CHECK (availability_confidence BETWEEN 1 AND 5);
    END IF;
END $$;

-- Update create_shop_item_transaction to persist availability_confidence
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
  v_confidence INTEGER;
BEGIN
  v_status := COALESCE((payload->>'status')::item_status, 'draft'::item_status);
  v_confidence := COALESCE((payload->>'availability_confidence')::integer, 5);

  -- Extract primary image url from payload images if present
  IF payload ? 'images' AND jsonb_array_length(payload->'images') > 0 THEN
    v_primary_image_url := payload->'images'->0->>'image_url';
  ELSIF payload ? 'image_url' AND payload->>'image_url' IS NOT NULL THEN
    v_primary_image_url := payload->>'image_url';
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
    image_url,
    availability_confidence,
    is_active
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
    v_primary_image_url,
    v_confidence,
    COALESCE((payload->>'is_active')::boolean, v_status = 'published')
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
      COALESCE((payload->'sell_config'->>'max_price_increase_percent')::numeric, 15),
      COALESCE((payload->'sell_config'->>'max_price_limit')::numeric, 0)
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
END;
$$;
