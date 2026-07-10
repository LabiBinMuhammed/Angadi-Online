const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aadutygzgrbexxuznqlr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHV0eWd6Z3JiZXh4dXpucWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNTU3MiwiZXhwIjoyMDkzNjgxNTcyfQ.omCGKMc8gneLLbPM5_D0oyQgPgaBE3szA7WGmm8rfaQ';
const supabase = createClient(supabaseUrl, serviceKey);

// Define categories display order mapping
const CATEGORY_ORDERS = {
  'Vegetables': 1,
  'Fruits': 2,
  'Grocery': 3,
  'Dairy & Beverages': 4,
  'Meat & Fish': 5,
  'Bakery': 6,
  'Household Essentials': 7,
  'Stationery': 8
};

// Option templates mapping
const OPTION_TEMPLATES = {
  'PACK_WEIGHT': [
    { label: '250g Pack', value: 250, unit: 'g', display_order: 1 },
    { label: '500g Pack', value: 500, unit: 'g', display_order: 2, is_default: true },
    { label: '1kg Pack', value: 1000, unit: 'g', display_order: 3 },
    { label: '2kg Pack', value: 2000, unit: 'g', display_order: 4 },
    { label: '5kg Pack', value: 5000, unit: 'g', display_order: 5 }
  ],
  'PACK_VOLUME': [
    { label: '250ml Bottle', value: 250, unit: 'ml', display_order: 1 },
    { label: '500ml Bottle', value: 500, unit: 'ml', display_order: 2, is_default: true },
    { label: '1L Bottle', value: 1000, unit: 'ml', display_order: 3 },
    { label: '2L Bottle', value: 2000, unit: 'ml', display_order: 4 },
    { label: '5L Can', value: 5000, unit: 'ml', display_order: 5 }
  ],
  'PACK_COUNT': [
    { label: 'Single', value: 1, unit: 'pcs', display_order: 1, is_default: true },
    { label: 'Pack of 2', value: 2, unit: 'pcs', display_order: 2 },
    { label: 'Pack of 5', value: 5, unit: 'pcs', display_order: 3 },
    { label: 'Pack of 10', value: 10, unit: 'pcs', display_order: 4 },
    { label: 'Pack of 12', value: 12, unit: 'pcs', display_order: 5 },
    { label: 'Pack of 24', value: 24, unit: 'pcs', display_order: 6 }
  ],
  'CUT_PORTION': [
    { label: 'Quarter', value: 25, display_order: 1 },
    { label: 'Half', value: 50, display_order: 2, is_default: true },
    { label: '3 Quarter', value: 75, display_order: 3 },
    { label: 'Full', value: 100, display_order: 4 }
  ],
  'CUT_PORTION_SIZE': [
    { label: 'Quarter', value: 1.5, unit: 'kg', min_value: 1.5, max_value: 2.0, display_order: 1 },
    { label: 'Half', value: 3.0, unit: 'kg', min_value: 3.0, max_value: 4.0, display_order: 2, is_default: true },
    { label: '3 Quarter', value: 4.5, unit: 'kg', min_value: 4.5, max_value: 6.0, display_order: 3 },
    { label: 'Full', value: 6.0, unit: 'kg', min_value: 6.0, max_value: 8.0, display_order: 4 }
  ],
  'SIZE': [
    { label: 'Small', value: 800, unit: 'g', min_value: 800, max_value: 1100, display_order: 1 },
    { label: 'Medium', value: 1.5, unit: 'kg', min_value: 1.5, max_value: 2.0, display_order: 2, is_default: true },
    { label: 'Large', value: 2.5, unit: 'kg', min_value: 2.5, max_value: 3.2, display_order: 3 }
  ],
  'PACK_WEIGHT_VOLUME': [
    { label: 'Small Pack', value: 1, display_order: 1 },
    { label: 'Medium Pack', value: 2, display_order: 2, is_default: true },
    { label: 'Large Pack', value: 3, display_order: 3 }
  ]
};

// Demo templates mapping
const DEMO_TEMPLATES = [
  // Vegetables
  { code: 'VEG-MAN-001', category: 'Vegetables', name: 'By Weight', sell_mode: 'Manual', base_unit: 'kg', display_order: 1 },
  { code: 'VEG-PACK-001', category: 'Vegetables', name: 'Packed Product', sell_mode: 'Fixed', base_unit: 'pack', option_template: 'PACK_WEIGHT', display_order: 2 },
  { code: 'VEG-DYN-001', category: 'Vegetables', name: 'Cut Portion', sell_mode: 'Dynamic', base_unit: 'kg', option_template: 'CUT_PORTION_SIZE', display_order: 3 },
  { code: 'VEG-POR-001', category: 'Vegetables', name: 'By Size', sell_mode: 'Portion', base_unit: 'kg', option_template: 'SIZE', display_order: 4 },

  // Fruits
  { code: 'FRU-MAN-001', category: 'Fruits', name: 'By Weight', sell_mode: 'Manual', base_unit: 'kg', display_order: 1 },
  { code: 'FRU-PACK-001', category: 'Fruits', name: 'Packed Product', sell_mode: 'Fixed', base_unit: 'pack', option_template: 'PACK_WEIGHT', display_order: 2 },
  { code: 'FRU-DYN-001', category: 'Fruits', name: 'Cut Portion', sell_mode: 'Dynamic', base_unit: 'kg', option_template: 'CUT_PORTION_SIZE', display_order: 3 },
  { code: 'FRU-POR-001', category: 'Fruits', name: 'By Size', sell_mode: 'Portion', base_unit: 'kg', option_template: 'SIZE', display_order: 4 },

  // Grocery
  { code: 'GRO-MAN-001', category: 'Grocery', name: 'By Weight', sell_mode: 'Manual', base_unit: 'kg', display_order: 1 },
  { code: 'GRO-PACK-001', category: 'Grocery', name: 'Packed Product', sell_mode: 'Fixed', base_unit: 'pack', option_template: 'PACK_WEIGHT', display_order: 2 },

  // Dairy & Beverages
  { code: 'DAI-MAN-001', category: 'Dairy & Beverages', name: 'By Volume', sell_mode: 'Manual', base_unit: 'L', display_order: 1 },
  { code: 'DAI-PACK-001', category: 'Dairy & Beverages', name: 'Packed Product', sell_mode: 'Fixed', base_unit: 'bottle', option_template: 'PACK_VOLUME', display_order: 2 },

  // Meat & Fish
  { code: 'MEAT-MAN-001', category: 'Meat & Fish', name: 'By Weight', sell_mode: 'Manual', base_unit: 'kg', display_order: 1 },
  { code: 'MEAT-PACK-001', category: 'Meat & Fish', name: 'Packed Product', sell_mode: 'Fixed', base_unit: 'pack', option_template: 'PACK_WEIGHT', display_order: 2 },
  { code: 'MEAT-DYN-001', category: 'Meat & Fish', name: 'Cut Portion', sell_mode: 'Dynamic', base_unit: 'kg', option_template: 'CUT_PORTION_SIZE', display_order: 3 },
  { code: 'MEAT-POR-001', category: 'Meat & Fish', name: 'By Size', sell_mode: 'Portion', base_unit: 'kg', option_template: 'SIZE', display_order: 4 },

  // Bakery
  { code: 'BAK-MAN-001', category: 'Bakery', name: 'By Weight', sell_mode: 'Manual', base_unit: 'kg', display_order: 1 },
  { code: 'BAK-PACK-001', category: 'Bakery', name: 'Packed Product', sell_mode: 'Fixed', base_unit: 'pack', option_template: 'PACK_WEIGHT', display_order: 2 },
  { code: 'BAK-POR-001', category: 'Bakery', name: 'By Size', sell_mode: 'Portion', base_unit: 'kg', option_template: 'SIZE', display_order: 3 },

  // Household Essentials
  { code: 'HOU-MAN-001', category: 'Household Essentials', name: 'Bulk Product', sell_mode: 'Manual', base_unit: 'kg', display_order: 1 },
  { code: 'HOU-PACK-001', category: 'Household Essentials', name: 'Packed Product', sell_mode: 'Fixed', base_unit: 'pack', option_template: 'PACK_WEIGHT_VOLUME', display_order: 2 },

  // Stationery
  { code: 'STA-MAN-001', category: 'Stationery', name: 'Bulk Product', sell_mode: 'Manual', base_unit: 'piece', display_order: 1 },
  { code: 'STA-PACK-001', category: 'Stationery', name: 'Packed Product', sell_mode: 'Fixed', base_unit: 'pack', option_template: 'PACK_COUNT', display_order: 2 }
];

async function run() {
  console.log("--- START SEEDING ---");

  // 1. Ensure Bakery Category exists and update display_orders
  console.log("Seeding categories...");
  for (const [name, order] of Object.entries(CATEGORY_ORDERS)) {
    const { data: cat, error: selectErr } = await supabase
      .from('categories')
      .select('*')
      .eq('name', name)
      .maybeSingle();

    if (selectErr) {
      console.error(`Error querying category ${name}:`, selectErr.message);
      continue;
    }

    if (!cat) {
      console.log(`Inserting category: ${name}`);
      const { error: insertErr } = await supabase
        .from('categories')
        .insert({
          name,
          description: `${name} products`,
          is_active: true,
          display_order: order
        });
      if (insertErr) console.error(`Error inserting ${name}:`, insertErr.message);
    } else {
      console.log(`Updating display order for: ${name} to ${order}`);
      const { error: updateErr } = await supabase
        .from('categories')
        .update({ display_order: order })
        .eq('id', cat.id);
      if (updateErr) console.error(`Error updating ${name}:`, updateErr.message);
    }
  }

  // 2. Ensure new units exist
  console.log("\nSeeding units...");
  const countGroupId = '0cec5a1b-e9e3-47d7-9c70-2ca1874b8bf1'; // Count Group ID
  const newUnits = [
    { name: 'Pack', symbol: 'pack', unit_group_id: countGroupId, base_multiplier: 1 },
    { name: 'Bottle', symbol: 'bottle', unit_group_id: countGroupId, base_multiplier: 1 }
  ];

  for (const u of newUnits) {
    const { data: existing, error: unitSelectErr } = await supabase
      .from('units')
      .select('*')
      .eq('symbol', u.symbol)
      .maybeSingle();

    if (unitSelectErr) {
      console.error(`Error querying unit ${u.symbol}:`, unitSelectErr.message);
      continue;
    }

    if (!existing) {
      console.log(`Inserting unit: ${u.name} (${u.symbol})`);
      const { error: unitInsertErr } = await supabase
        .from('units')
        .insert(u);
      if (unitInsertErr) console.error(`Error inserting unit ${u.symbol}:`, unitInsertErr.message);
    } else {
      console.log(`Unit ${u.name} already exists.`);
    }
  }

  // Fetch all categories and units for reference mapping
  const { data: dbCats } = await supabase.from('categories').select('id, name');
  const { data: dbUnits } = await supabase.from('units').select('id, symbol');

  const catMap = {};
  dbCats.forEach(c => { catMap[c.name] = c.id; });

  const unitMap = {};
  dbUnits.forEach(u => {
    unitMap[u.symbol] = u.id;
    if (u.symbol === 'pcs') {
      unitMap['piece'] = u.id; // Map 'piece' base unit to 'pcs' unit id
    }
  });

  // 3. Keep seeding idempotent (instead of deleting everything from demo_items)
  console.log("\nInserting/updating demo templates...");
  for (const d of DEMO_TEMPLATES) {
    const categoryId = catMap[d.category];
    const unitId = unitMap[d.base_unit];

    if (!categoryId) {
      console.error(`Category ${d.category} not found in DB mapping.`);
      continue;
    }
    if (!unitId) {
      console.error(`Unit ${d.base_unit} not found in DB mapping.`);
      continue;
    }

    // Check if the demo item already exists by code
    const { data: existingItem, error: selectErr } = await supabase
      .from('demo_items')
      .select('*')
      .eq('code', d.code)
      .maybeSingle();

    let itemId;
    if (existingItem) {
      console.log(`Updating existing demo item: ${d.code} (${d.name})`);
      const { error: updateErr } = await supabase
        .from('demo_items')
        .update({
          category_id: categoryId,
          name: d.name,
          unit_id: unitId,
          sell_mode: d.sell_mode,
          display_order: d.display_order
        })
        .eq('id', existingItem.id);
      if (updateErr) {
        console.error(`Failed to update demo item ${d.code}:`, updateErr.message);
        continue;
      }
      itemId = existingItem.id;
    } else {
      console.log(`Inserting new demo item: ${d.code} (${d.name})`);
      const { data: insertedItem, error: itemInsertErr } = await supabase
        .from('demo_items')
        .insert({
          category_id: categoryId,
          name: d.name,
          unit_id: unitId,
          sell_mode: d.sell_mode,
          code: d.code,
          display_order: d.display_order
        })
        .select()
        .single();

      if (itemInsertErr) {
        console.error(`Failed to insert demo item ${d.code}:`, itemInsertErr.message);
        continue;
      }
      itemId = insertedItem.id;
    }

    // Delete existing sell configs and variants for this itemId
    const { error: cfgDelErr } = await supabase.from('demo_sell_config').delete().eq('demo_item_id', itemId);
    if (cfgDelErr) console.error(`Error clearing config for ${d.code}:`, cfgDelErr.message);

    const { error: varDelErr } = await supabase.from('demo_variants').delete().eq('demo_item_id', itemId);
    if (varDelErr) console.error(`Error clearing variants for ${d.code}:`, varDelErr.message);

    // Insert demo_sell_config
    const { error: configInsertErr } = await supabase
      .from('demo_sell_config')
      .insert({
        demo_item_id: itemId,
        sell_mode: d.sell_mode,
        base_unit_id: unitId,
        price_per_base_unit: 0,
        allow_custom_quantity: d.sell_mode === 'Manual' || d.sell_mode === 'Dynamic',
        max_price_increase_percent: 15,
        max_price_limit: 0
      });

    if (configInsertErr) {
      console.error(`Failed to insert config for demo ${d.code}:`, configInsertErr.message);
    }

    // Insert demo_variants if template exists
    if (d.option_template && OPTION_TEMPLATES[d.option_template]) {
      const variantsList = OPTION_TEMPLATES[d.option_template];
      for (const v of variantsList) {
        const variantUnitId = v.unit ? unitMap[v.unit] : unitId; // Default to item base unit if no variant unit specified
        
        const { error: varInsertErr } = await supabase
          .from('demo_variants')
          .insert({
            demo_item_id: itemId,
            variant_type: d.sell_mode,
            label: v.label,
            unit_id: variantUnitId || null,
            value: v.value || 1,
            price: 0,
            is_default: v.is_default || false,
            is_active: true,
            min_value: v.min_value !== undefined ? v.min_value : null,
            max_value: v.max_value !== undefined ? v.max_value : null,
            display_order: v.display_order
          });

        if (varInsertErr) {
          console.error(`Failed to insert variant ${v.label} for demo ${d.code}:`, varInsertErr.message);
        }
      }
    }
  }

  console.log("\n--- SEEDING COMPLETED SUCCESS ---");
}

run();
