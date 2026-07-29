-- ═══════════════════════════════════════════════════════════
-- Angadi — Sample Seed Data
-- Run this in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── Unit Groups ──────────────────────────────────────────────
INSERT INTO unit_groups (id, name) VALUES
  ('ug-weight',  'Weight'),
  ('ug-volume',  'Volume'),
  ('ug-count',   'Count'),
  ('ug-length',  'Length')
ON CONFLICT DO NOTHING;

-- ── Units ────────────────────────────────────────────────────
INSERT INTO units (id, name, symbol, unit_group_id, base_multiplier) VALUES
  ('u-kg',   'Kilogram',  'kg',  'ug-weight', 1000),
  ('u-g',    'Gram',      'g',   'ug-weight', 1),
  ('u-500g', '500g Pack', '500g','ug-weight', 500),
  ('u-250g', '250g Pack', '250g','ug-weight', 250),
  ('u-l',    'Litre',     'L',   'ug-volume', 1000),
  ('u-ml',   'Millilitre','ml',  'ug-volume', 1),
  ('u-pcs',  'Piece',     'pcs', 'ug-count',  1),
  ('u-doz',  'Dozen',     'doz', 'ug-count',  12),
  ('u-bun',  'Bunch',     'bun', 'ug-count',  1)
ON CONFLICT DO NOTHING;

-- ── Categories ───────────────────────────────────────────────
INSERT INTO categories (id, name, description) VALUES
  ('cat-veg',    'Vegetables',    'Fresh farm vegetables'),
  ('cat-fruit',  'Fruits',        'Seasonal fruits'),
  ('cat-dairy',  'Dairy & Eggs',  'Milk, curd, eggs'),
  ('cat-grain',  'Grains & Pulses','Rice, dal, wheat'),
  ('cat-spice',  'Spices',        'Whole and ground spices'),
  ('cat-bakery', 'Bakery',        'Bread, biscuits, snacks'),
  ('cat-oil',    'Oils',          'Cooking oils'),
  ('cat-meat',   'Meat & Fish',   'Fresh meat and seafood')
ON CONFLICT DO NOTHING;

-- category ↔ unit group mapping
INSERT INTO category_unit_groups (category_id, unit_group_id) VALUES
  ('cat-veg',    'ug-weight'),
  ('cat-fruit',  'ug-weight'),
  ('cat-dairy',  'ug-count'),
  ('cat-grain',  'ug-weight'),
  ('cat-spice',  'ug-weight'),
  ('cat-bakery', 'ug-count'),
  ('cat-oil',    'ug-volume'),
  ('cat-meat',   'ug-weight')
ON CONFLICT DO NOTHING;

-- ── Locations ────────────────────────────────────────────────
INSERT INTO locations (id, name, latitude, longitude, type) VALUES
  ('loc-1', 'Main Bazaar',        12.971599, 77.594566, 'market'),
  ('loc-2', 'Village Center',     12.965000, 77.600000, 'market'),
  ('loc-3', 'East Block',         12.978000, 77.608000, 'block'),
  ('loc-4', 'West Colony',        12.960000, 77.585000, 'colony'),
  ('loc-areeckode', 'Areeckode',  11.2333, 76.0333, 'town')
ON CONFLICT DO NOTHING;

-- ── Shops ────────────────────────────────────────────────────
INSERT INTO shops (id, name, type, location_id) VALUES
  ('shop-1', 'Ravi Fresh Vegetables', 'grocery',   'loc-1'),
  ('shop-2', 'Lakshmi Dairy & More',  'dairy',     'loc-2'),
  ('shop-3', 'Ahmed Meat & Fish',     'meat',      'loc-3'),
  ('shop-4', 'Priya Bakery & Sweets', 'bakery',    'loc-4')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- SHOP 1 — Ravi Fresh Vegetables
-- ═══════════════════════════════════════════════════════════

INSERT INTO items (id, shop_id, category_id, name, description, is_active, has_variants) VALUES
  ('i-s1-1', 'shop-1', 'cat-veg',   'Tomato',           'Fresh red tomatoes',          true, true),
  ('i-s1-2', 'shop-1', 'cat-veg',   'Onion',            'Red onions',                  true, true),
  ('i-s1-3', 'shop-1', 'cat-veg',   'Potato',           'Medium potatoes',             true, true),
  ('i-s1-4', 'shop-1', 'cat-veg',   'Spinach',          'Fresh green spinach',         true, false),
  ('i-s1-5', 'shop-1', 'cat-fruit', 'Banana',           'Robusta bananas',             true, true),
  ('i-s1-6', 'shop-1', 'cat-fruit', 'Apple',            'Kashmiri red apples',         true, true),
  ('i-s1-7', 'shop-1', 'cat-veg',   'Carrot',           'Orange carrots',              true, true),
  ('i-s1-8', 'shop-1', 'cat-veg',   'Capsicum',         'Green bell pepper',           true, false)
ON CONFLICT DO NOTHING;

-- sell configs for shop-1
INSERT INTO item_sell_config (item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity) VALUES
  ('i-s1-1', 'manual',  'u-kg',   40,   true),
  ('i-s1-2', 'manual',  'u-kg',   30,   true),
  ('i-s1-3', 'manual',  'u-kg',   25,   true),
  ('i-s1-4', 'packed',  'u-bun',  15,   false),
  ('i-s1-5', 'packed',  'u-doz',  60,   false),
  ('i-s1-6', 'manual',  'u-kg',   160,  true),
  ('i-s1-7', 'manual',  'u-kg',   50,   true),
  ('i-s1-8', 'manual',  'u-kg',   80,   true)
ON CONFLICT DO NOTHING;

-- variants for shop-1
INSERT INTO item_variants (id, item_id, variant_type, label, unit_id, value, price, is_default, is_active) VALUES
  ('v-s1-1a', 'i-s1-1', 'packed', '500g',  'u-500g', 500,  20,  true,  true),
  ('v-s1-1b', 'i-s1-1', 'packed', '1 kg',  'u-kg',   1000, 40,  false, true),
  ('v-s1-2a', 'i-s1-2', 'packed', '500g',  'u-500g', 500,  15,  true,  true),
  ('v-s1-2b', 'i-s1-2', 'packed', '1 kg',  'u-kg',   1000, 30,  false, true),
  ('v-s1-3a', 'i-s1-3', 'packed', '1 kg',  'u-kg',   1000, 25,  true,  true),
  ('v-s1-3b', 'i-s1-3', 'packed', '2 kg',  'u-kg',   2000, 48,  false, true),
  ('v-s1-5a', 'i-s1-5', 'packed', '6 pcs', 'u-pcs',  6,    30,  true,  true),
  ('v-s1-5b', 'i-s1-5', 'packed', 'Dozen', 'u-doz',  12,   60,  false, true),
  ('v-s1-6a', 'i-s1-6', 'packed', '500g',  'u-500g', 500,  80,  true,  true),
  ('v-s1-6b', 'i-s1-6', 'packed', '1 kg',  'u-kg',   1000, 160, false, true),
  ('v-s1-7a', 'i-s1-7', 'packed', '500g',  'u-500g', 500,  25,  true,  true),
  ('v-s1-7b', 'i-s1-7', 'packed', '1 kg',  'u-kg',   1000, 50,  false, true)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- SHOP 2 — Lakshmi Dairy & More
-- ═══════════════════════════════════════════════════════════

INSERT INTO items (id, shop_id, category_id, name, description, is_active, has_variants) VALUES
  ('i-s2-1', 'shop-2', 'cat-dairy', 'Full Cream Milk',   'Fresh cow milk daily',        true, true),
  ('i-s2-2', 'shop-2', 'cat-dairy', 'Curd (Dahi)',       'Set curd homemade',           true, true),
  ('i-s2-3', 'shop-2', 'cat-dairy', 'Paneer',            'Fresh cottage cheese',        true, true),
  ('i-s2-4', 'shop-2', 'cat-dairy', 'Eggs',              'Farm fresh brown eggs',       true, true),
  ('i-s2-5', 'shop-2', 'cat-dairy', 'Butter',            'Salted white butter',         true, true),
  ('i-s2-6', 'shop-2', 'cat-grain', 'Basmati Rice',      'Long grain aged basmati',     true, true),
  ('i-s2-7', 'shop-2', 'cat-grain', 'Toor Dal',          'Split pigeon peas',           true, true),
  ('i-s2-8', 'shop-2', 'cat-oil',   'Sunflower Oil',     'Refined sunflower oil',       true, true)
ON CONFLICT DO NOTHING;

INSERT INTO item_sell_config (item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity) VALUES
  ('i-s2-1', 'packed',  'u-l',    60,   false),
  ('i-s2-2', 'packed',  'u-kg',   70,   false),
  ('i-s2-3', 'manual',  'u-g',    0.4,  true),
  ('i-s2-4', 'packed',  'u-pcs',  8,    false),
  ('i-s2-5', 'packed',  'u-g',    0.5,  false),
  ('i-s2-6', 'packed',  'u-kg',   85,   false),
  ('i-s2-7', 'packed',  'u-kg',   110,  false),
  ('i-s2-8', 'packed',  'u-l',    130,  false)
ON CONFLICT DO NOTHING;

INSERT INTO item_variants (id, item_id, variant_type, label, unit_id, value, price, is_default, is_active) VALUES
  ('v-s2-1a', 'i-s2-1', 'packed', '500 ml',  'u-ml',  500,  30,  true,  true),
  ('v-s2-1b', 'i-s2-1', 'packed', '1 Litre', 'u-l',   1000, 60,  false, true),
  ('v-s2-2a', 'i-s2-2', 'packed', '400g',    'u-g',   400,  35,  true,  true),
  ('v-s2-2b', 'i-s2-2', 'packed', '1 kg',    'u-kg',  1000, 80,  false, true),
  ('v-s2-3a', 'i-s2-3', 'packed', '200g',    'u-g',   200,  80,  true,  true),
  ('v-s2-3b', 'i-s2-3', 'packed', '500g',    'u-500g',500,  200, false, true),
  ('v-s2-4a', 'i-s2-4', 'packed', '6 Eggs',  'u-pcs', 6,    48,  true,  true),
  ('v-s2-4b', 'i-s2-4', 'packed', 'Dozen',   'u-doz', 12,   90,  false, true),
  ('v-s2-5a', 'i-s2-5', 'packed', '100g',    'u-g',   100,  50,  true,  true),
  ('v-s2-5b', 'i-s2-5', 'packed', '500g',    'u-500g',500,  240, false, true),
  ('v-s2-6a', 'i-s2-6', 'packed', '1 kg',    'u-kg',  1000, 85,  true,  true),
  ('v-s2-6b', 'i-s2-6', 'packed', '5 kg',    'u-kg',  5000, 400, false, true),
  ('v-s2-7a', 'i-s2-7', 'packed', '500g',    'u-500g',500,  55,  true,  true),
  ('v-s2-7b', 'i-s2-7', 'packed', '1 kg',    'u-kg',  1000, 110, false, true),
  ('v-s2-8a', 'i-s2-8', 'packed', '1 Litre', 'u-l',   1000, 130, true,  true),
  ('v-s2-8b', 'i-s2-8', 'packed', '5 Litre', 'u-l',   5000, 620, false, true)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- SHOP 3 — Ahmed Meat & Fish
-- ═══════════════════════════════════════════════════════════

INSERT INTO items (id, shop_id, category_id, name, description, is_active, has_variants) VALUES
  ('i-s3-1', 'shop-3', 'cat-meat', 'Chicken (Whole)',    'Farm fresh broiler chicken',  true, true),
  ('i-s3-2', 'shop-3', 'cat-meat', 'Mutton',             'Fresh goat meat, curry cut',  true, true),
  ('i-s3-3', 'shop-3', 'cat-meat', 'Rohu Fish',          'Fresh water rohu fish',       true, true),
  ('i-s3-4', 'shop-3', 'cat-meat', 'Prawns',             'Medium sized prawns',         true, true),
  ('i-s3-5', 'shop-3', 'cat-meat', 'Chicken Keema',      'Minced chicken',              true, true),
  ('i-s3-6', 'shop-3', 'cat-meat', 'Egg (Desi)',         'Country hen eggs',            true, true)
ON CONFLICT DO NOTHING;

INSERT INTO item_sell_config (item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity) VALUES
  ('i-s3-1', 'manual', 'u-kg',  190, true),
  ('i-s3-2', 'manual', 'u-kg',  700, true),
  ('i-s3-3', 'manual', 'u-kg',  180, true),
  ('i-s3-4', 'manual', 'u-kg',  350, true),
  ('i-s3-5', 'packed', 'u-g',   0.22, false),
  ('i-s3-6', 'packed', 'u-pcs', 12,  false)
ON CONFLICT DO NOTHING;

INSERT INTO item_variants (id, item_id, variant_type, label, unit_id, value, price, is_default, is_active) VALUES
  ('v-s3-1a', 'i-s3-1', 'manual', '500g',   'u-500g', 500,  95,   true,  true),
  ('v-s3-1b', 'i-s3-1', 'manual', '1 kg',   'u-kg',   1000, 190,  false, true),
  ('v-s3-2a', 'i-s3-2', 'manual', '250g',   'u-g',    250,  175,  true,  true),
  ('v-s3-2b', 'i-s3-2', 'manual', '500g',   'u-500g', 500,  350,  false, true),
  ('v-s3-2c', 'i-s3-2', 'manual', '1 kg',   'u-kg',   1000, 700,  false, true),
  ('v-s3-3a', 'i-s3-3', 'manual', '500g',   'u-500g', 500,  90,   true,  true),
  ('v-s3-3b', 'i-s3-3', 'manual', '1 kg',   'u-kg',   1000, 180,  false, true),
  ('v-s3-4a', 'i-s3-4', 'manual', '250g',   'u-g',    250,  88,   true,  true),
  ('v-s3-4b', 'i-s3-4', 'manual', '500g',   'u-500g', 500,  175,  false, true),
  ('v-s3-5a', 'i-s3-5', 'packed', '250g',   'u-g',    250,  55,   true,  true),
  ('v-s3-5b', 'i-s3-5', 'packed', '500g',   'u-500g', 500,  110,  false, true),
  ('v-s3-6a', 'i-s3-6', 'packed', '6 Eggs', 'u-pcs',  6,    72,   true,  true),
  ('v-s3-6b', 'i-s3-6', 'packed', 'Dozen',  'u-doz',  12,   140,  false, true)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- SHOP 4 — Priya Bakery & Sweets
-- ═══════════════════════════════════════════════════════════

INSERT INTO items (id, shop_id, category_id, name, description, is_active, has_variants) VALUES
  ('i-s4-1', 'shop-4', 'cat-bakery', 'White Bread',       'Soft sliced white bread',     true, true),
  ('i-s4-2', 'shop-4', 'cat-bakery', 'Whole Wheat Bread', 'Multigrain wheat bread',       true, false),
  ('i-s4-3', 'shop-4', 'cat-bakery', 'Bun (Pav)',         'Soft dinner rolls',           true, true),
  ('i-s4-4', 'shop-4', 'cat-bakery', 'Cream Biscuits',    'Vanilla cream biscuits',      true, true),
  ('i-s4-5', 'shop-4', 'cat-bakery', 'Cake Slice',        'Fresh chocolate cake slice',  true, true),
  ('i-s4-6', 'shop-4', 'cat-bakery', 'Samosa',            'Crispy vegetable samosa',     true, true),
  ('i-s4-7', 'shop-4', 'cat-bakery', 'Ladoo',             'Besan ladoo (sweets)',        true, true),
  ('i-s4-8', 'shop-4', 'cat-spice',  'Chai Masala',       'Aromatic tea spice mix',      true, true)
ON CONFLICT DO NOTHING;

INSERT INTO item_sell_config (item_id, sell_mode, base_unit_id, price_per_base_unit, allow_custom_quantity) VALUES
  ('i-s4-1', 'packed', 'u-pcs',  40,   false),
  ('i-s4-2', 'packed', 'u-pcs',  50,   false),
  ('i-s4-3', 'packed', 'u-pcs',  5,    false),
  ('i-s4-4', 'packed', 'u-g',    0.35, false),
  ('i-s4-5', 'packed', 'u-pcs',  45,   false),
  ('i-s4-6', 'packed', 'u-pcs',  15,   false),
  ('i-s4-7', 'manual', 'u-kg',   400,  true),
  ('i-s4-8', 'packed', 'u-g',    1.2,  false)
ON CONFLICT DO NOTHING;

INSERT INTO item_variants (id, item_id, variant_type, label, unit_id, value, price, is_default, is_active) VALUES
  ('v-s4-1a', 'i-s4-1', 'packed', 'Small (400g)',  'u-g',   400,  40,  true,  true),
  ('v-s4-1b', 'i-s4-1', 'packed', 'Large (800g)',  'u-g',   800,  75,  false, true),
  ('v-s4-3a', 'i-s4-3', 'packed', '4 Pcs',         'u-pcs', 4,    20,  true,  true),
  ('v-s4-3b', 'i-s4-3', 'packed', '8 Pcs',         'u-pcs', 8,    40,  false, true),
  ('v-s4-4a', 'i-s4-4', 'packed', '100g Pack',     'u-g',   100,  35,  true,  true),
  ('v-s4-4b', 'i-s4-4', 'packed', '250g Pack',     'u-g',   250,  80,  false, true),
  ('v-s4-5a', 'i-s4-5', 'packed', '1 Slice',       'u-pcs', 1,    45,  true,  true),
  ('v-s4-5b', 'i-s4-5', 'packed', '2 Slices',      'u-pcs', 2,    85,  false, true),
  ('v-s4-6a', 'i-s4-6', 'packed', '2 Pcs',         'u-pcs', 2,    30,  true,  true),
  ('v-s4-6b', 'i-s4-6', 'packed', '4 Pcs',         'u-pcs', 4,    55,  false, true),
  ('v-s4-7a', 'i-s4-7', 'packed', '250g',          'u-g',   250,  100, true,  true),
  ('v-s4-7b', 'i-s4-7', 'packed', '500g',          'u-500g',500,  200, false, true),
  ('v-s4-8a', 'i-s4-8', 'packed', '50g Pouch',     'u-g',   50,   60,  true,  true),
  ('v-s4-8b', 'i-s4-8', 'packed', '100g Pouch',    'u-g',   100,  110, false, true)
ON CONFLICT DO NOTHING;
