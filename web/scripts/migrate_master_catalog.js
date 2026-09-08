const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    if (k) env[k] = v;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const UNITS = {
  kg: 'fc6f287c-0b3c-458e-8d4f-4679d0059c32',
  g: '32d0b812-34cc-415c-b7cf-1f96dc2f841f',
  L: '24f2e09f-23d1-4919-a6c3-7a3d11fae4ef',
  ml: '4d3b2515-c26d-4c05-ab72-13ff6c6d0938',
  pcs: '9137e686-0e75-4a6b-a261-891b1e4e9774',
  doz: '44923aab-4bd2-433d-acc4-df206dc59c10',
  pack: '5cb5e824-4974-40f9-82ec-6edaa9ad32aa',
  bottle: '6aece001-9ce7-4325-b1ff-5b4f9405a97a'
};

function parseQuantity(qStr) {
  const s = qStr.trim().toLowerCase();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)/);
  if (!m) {
    return { value: 1, unit_id: UNITS.pack, label: qStr };
  }
  const val = parseFloat(m[1]);
  const u = m[2];
  let unit_id = UNITS.pack;
  if (u === 'kg' || u === 'kgs') unit_id = UNITS.kg;
  else if (u === 'g' || u === 'gm' || u === 'gms') unit_id = UNITS.g;
  else if (u === 'l' || u === 'ltr' || u === 'litre' || u === 'litres') unit_id = UNITS.L;
  else if (u === 'ml') unit_id = UNITS.ml;
  else if (u === 'pc' || u === 'pcs' || u === 'piece' || u === 'pieces') unit_id = UNITS.pcs;
  else if (u === 'doz' || u === 'dozen') unit_id = UNITS.doz;
  else if (u === 'bottle' || u === 'bottles') unit_id = UNITS.bottle;
  else if (u === 'pack' || u === 'bags' || u === 'sheets') unit_id = UNITS.pack;

  return { value: val, unit_id, label: qStr };
}

function getBaseUnitId(defaultQuantity, sellMode) {
  const parsed = parseQuantity(defaultQuantity);
  if (parsed.unit_id === UNITS.g) return UNITS.kg;
  if (parsed.unit_id === UNITS.ml) return UNITS.L;
  return parsed.unit_id;
}

const CATEGORIES_DATA = [
  { name: 'Dairy', file: 'scripts/dairy_data.json' },
  { name: 'Bakery', file: 'scripts/bakery_data.json' },
  { name: 'Biscuits & Cookies', file: 'scripts/biscuits_data.json' },
  { name: 'Beverages', file: 'scripts/beverages_data.json' },
  { name: 'Meat & Fish', file: 'scripts/meat_fish_data.json' },
  { name: 'Household & Stationery', file: 'scripts/household_stationery_data.json' },
  { name: 'Desserts & Ice Creams', file: 'scripts/desserts_data.json' },
  { name: 'Dry Fruits & Cereals', file: 'scripts/dryfruits_data.json' }
];

const PRESERVED_DEMO_IDS = new Set([
  '17dc4b34-5421-463f-ba1f-6e3e48e677f8',
  '5102fbe5-3cc1-446a-a775-f6a7795ca00f',
  'bae65d91-d19b-4605-869e-b70abdc973e6',
  'c8dc5b82-e143-4198-be46-1063867d9bd5'
]);

async function migrateAll() {
  console.log('--- STARTING MASTER CATALOG MIGRATION ---');

  // 1. Get categories map
  const { data: dbCats } = await supabase.from('categories').select('id, name');
  const catMap = {};
  dbCats.forEach(c => catMap[c.name] = c.id);

  let totalMigrated = 0;
  let totalVariants = 0;

  for (const catInfo of CATEGORIES_DATA) {
    const catId = catMap[catInfo.name];
    if (!catId) {
      console.error(`Category not found in DB: ${catInfo.name}`);
      continue;
    }

    const items = JSON.parse(fs.readFileSync(catInfo.file, 'utf8'));
    console.log(`\nProcessing "${catInfo.name}" (${items.length} master products)...`);

    // Fetch existing demo items in category
    const { data: existingDemos } = await supabase
      .from('demo_items')
      .select('id')
      .eq('category_id', catId);

    const oldIds = (existingDemos || []).map(d => d.id).filter(id => !PRESERVED_DEMO_IDS.has(id));

    if (oldIds.length > 0) {
      console.log(`  Cleaning up ${oldIds.length} old demo items in "${catInfo.name}"...`);
      // Delete old variants & sell configs in chunks of 50
      for (let i = 0; i < oldIds.length; i += 50) {
        const chunk = oldIds.slice(i, i + 50);
        await supabase.from('demo_variants').delete().in('demo_item_id', chunk);
        await supabase.from('demo_sell_config').delete().in('demo_item_id', chunk);
        await supabase.from('demo_items').delete().in('id', chunk);
      }
    }

    // Insert new master items
    const demoItemPayloads = [];
    const sellConfigPayloads = [];
    const variantPayloads = [];

    items.forEach((item, idx) => {
      const demoItemId = uuidv4();
      const defaultParsed = parseQuantity(item.default_quantity);
      const baseUnitId = getBaseUnitId(item.default_quantity, item.sell_mode);

      demoItemPayloads.push({
        id: demoItemId,
        category_id: catId,
        name: item.name,
        unit_id: defaultParsed.unit_id,
        sell_mode: item.sell_mode,
        default_image: item.default_image,
        display_order: idx + 1
      });

      sellConfigPayloads.push({
        id: uuidv4(),
        demo_item_id: demoItemId,
        sell_mode: item.sell_mode,
        base_unit_id: baseUnitId,
        price_per_base_unit: 0,
        allow_custom_quantity: item.sell_mode === 'Manual' || item.sell_mode === 'Dynamic'
      });

      const variants = item.variants && item.variants.length > 0 ? item.variants : [item.default_quantity];
      variants.forEach((vStr, vIdx) => {
        const vParsed = parseQuantity(vStr);
        variantPayloads.push({
          id: uuidv4(),
          demo_item_id: demoItemId,
          variant_type: item.sell_mode,
          label: vStr,
          unit_id: vParsed.unit_id,
          value: vParsed.value,
          price: 0,
          is_default: vIdx === 0,
          is_active: true,
          display_order: vIdx + 1
        });
      });
    });

    // Chunked insert
    for (let i = 0; i < demoItemPayloads.length; i += 50) {
      const chunk = demoItemPayloads.slice(i, i + 50);
      const { error: dErr } = await supabase.from('demo_items').insert(chunk);
      if (dErr) console.error(`  Error inserting demo_items:`, dErr.message);
    }

    for (let i = 0; i < sellConfigPayloads.length; i += 50) {
      const chunk = sellConfigPayloads.slice(i, i + 50);
      const { error: scErr } = await supabase.from('demo_sell_config').insert(chunk);
      if (scErr) console.error(`  Error inserting demo_sell_config:`, scErr.message);
    }

    for (let i = 0; i < variantPayloads.length; i += 50) {
      const chunk = variantPayloads.slice(i, i + 50);
      const { error: vErr } = await supabase.from('demo_variants').insert(chunk);
      if (vErr) console.error(`  Error inserting demo_variants:`, vErr.message);
    }

    totalMigrated += demoItemPayloads.length;
    totalVariants += variantPayloads.length;
    console.log(`  Successfully inserted ${demoItemPayloads.length} master products & ${variantPayloads.length} variants.`);
  }

  console.log(`\n=== MIGRATION COMPLETE ===`);
  console.log(`Total Master Products Inserted: ${totalMigrated}`);
  console.log(`Total Variants Inserted: ${totalVariants}`);
}

migrateAll();
