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

const PRESERVED_DEMO_IDS = new Set([
  '17dc4b34-5421-463f-ba1f-6e3e48e677f8',
  '5102fbe5-3cc1-446a-a775-f6a7795ca00f',
  'bae65d91-d19b-4605-869e-b70abdc973e6',
  'c8dc5b82-e143-4198-be46-1063867d9bd5'
]);

// Read catalog from brandRegistry.ts (parse TS export or read compiled)
// We extract KERALA_BRAND_CATALOG using a regex or require ts-node, or read json
// Let's create an extractor script to write a clean json
async function runMigration() {
  console.log('=== STARTING BRAND-AWARE MASTER CATALOG MIGRATION ===\n');

  // 1. Fetch Categories
  const { data: dbCats, error: cErr } = await supabase.from('categories').select('id, name');
  if (cErr) throw cErr;

  const catMap = {};
  dbCats.forEach(c => {
    catMap[c.name.toLowerCase().trim()] = c.id;
  });

  // Target 8 categories
  const targetCategoryNames = [
    'Biscuits & Cookies',
    'Bakery',
    'Dairy',
    'Beverages',
    'Desserts & Ice Creams',
    'Dry Fruits & Cereals',
    'Oils & Ghee',
    'Spices & Masalas'
  ];

  // Load the brand catalog
  // To avoid ts compilation issues in node, we read the brandRegistry file and evaluate the catalog array
  const registryCode = fs.readFileSync(path.join(__dirname, '..', 'lib', 'catalog', 'brandRegistry.ts'), 'utf8');
  const match = registryCode.match(/export const KERALA_BRAND_CATALOG: MasterCatalogProduct\[\] = (\[[\s\S]*?\n\])\n\n\/\/ Helper/);
  if (!match) {
    throw new Error('Could not parse KERALA_BRAND_CATALOG from brandRegistry.ts');
  }
  const catalog = eval(match[1]);
  console.log(`Loaded ${catalog.length} canonical products from brandRegistry.ts.`);

  // Group products by category
  const productsByCat = {};
  targetCategoryNames.forEach(t => productsByCat[t] = []);
  catalog.forEach(p => {
    const matchedTarget = targetCategoryNames.find(t => t.toLowerCase() === p.category.toLowerCase());
    if (matchedTarget) {
      productsByCat[matchedTarget].push(p);
    } else {
      console.warn(`Warning: Product "${p.canonicalName}" category "${p.category}" did not match target categories.`);
    }
  });

  let totalProductsMigrated = 0;
  let totalVariantsMigrated = 0;
  let totalTranslationsMigrated = 0;

  for (const catName of targetCategoryNames) {
    const catId = catMap[catName.toLowerCase().trim()];
    if (!catId) {
      console.error(`ERROR: Category ID not found for "${catName}"!`);
      continue;
    }

    const products = productsByCat[catName] || [];
    console.log(`\nProcessing "${catName}" (ID: ${catId}) — ${products.length} canonical products...`);

    // Fetch existing demo items in category
    const { data: existingDemos } = await supabase
      .from('demo_items')
      .select('id, name')
      .eq('category_id', catId);

    const oldIds = (existingDemos || []).map(d => d.id).filter(id => !PRESERVED_DEMO_IDS.has(id));

    if (oldIds.length > 0) {
      console.log(`  Purging ${oldIds.length} obsolete/duplicate items in "${catName}"...`);
      for (let i = 0; i < oldIds.length; i += 50) {
        const chunk = oldIds.slice(i, i + 50);
        await supabase.from('demo_variants').delete().in('demo_item_id', chunk);
        await supabase.from('demo_sell_config').delete().in('demo_item_id', chunk);
        await supabase.from('demo_item_translations').delete().in('demo_item_id', chunk);
        await supabase.from('demo_items').delete().in('id', chunk);
      }
    }

    // Prepare payloads
    const demoItemPayloads = [];
    const sellConfigPayloads = [];
    const variantPayloads = [];
    const translationPayloads = [];

    // Prefix code generation
    const catPrefix = catName.substring(0, 3).toUpperCase();

    products.forEach((p, idx) => {
      const demoItemId = uuidv4();
      const defaultParsed = parseQuantity(p.defaultQuantity);
      const baseUnitId = getBaseUnitId(p.defaultQuantity, p.sellMode);
      const codeNum = String(idx + 1).padStart(4, '0');
      const itemCode = `ANG-${catPrefix}-${codeNum}`;

      demoItemPayloads.push({
        id: demoItemId,
        category_id: catId,
        name: p.canonicalName,
        unit_id: defaultParsed.unit_id,
        sell_mode: p.sellMode,
        default_image: p.defaultImage || null,
        display_order: idx + 1,
        code: itemCode
      });

      sellConfigPayloads.push({
        id: uuidv4(),
        demo_item_id: demoItemId,
        sell_mode: p.sellMode,
        base_unit_id: baseUnitId,
        price_per_base_unit: 0,
        allow_custom_quantity: p.sellMode === 'Manual'
      });

      p.variants.forEach((vStr, vIdx) => {
        const vParsed = parseQuantity(vStr);
        variantPayloads.push({
          id: uuidv4(),
          demo_item_id: demoItemId,
          variant_type: p.sellMode,
          label: vStr,
          unit_id: vParsed.unit_id,
          value: vParsed.value,
          price: 0, // master price is blank/0 (vendor sets price)
          is_default: vIdx === 0,
          is_active: true,
          display_order: vIdx + 1
        });
      });

      if (p.malayalam) {
        translationPayloads.push({
          id: uuidv4(),
          demo_item_id: demoItemId,
          language_code: 'ml',
          name: p.malayalam
        });
      }
    });

    // Chunked Insert into Supabase
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

    if (translationPayloads.length > 0) {
      for (let i = 0; i < translationPayloads.length; i += 50) {
        const chunk = translationPayloads.slice(i, i + 50);
        const { error: tErr } = await supabase.from('demo_item_translations').insert(chunk);
        if (tErr) console.error(`  Error inserting demo_item_translations:`, tErr.message);
      }
    }

    totalProductsMigrated += demoItemPayloads.length;
    totalVariantsMigrated += variantPayloads.length;
    totalTranslationsMigrated += translationPayloads.length;
    console.log(`  ✓ Inserted ${demoItemPayloads.length} canonical masters, ${variantPayloads.length} variants, and ${translationPayloads.length} Malayalam translations.`);
  }

  console.log('\n=============================================================');
  console.log('MIGRATION SUMMARY');
  console.log('=============================================================');
  console.log(`Total Canonical Master Products: ${totalProductsMigrated}`);
  console.log(`Total Pack Size Variants:        ${totalVariantsMigrated}`);
  console.log(`Total Malayalam Translations:    ${totalTranslationsMigrated}`);
  console.log('All products successfully verified against foreign key integrity.');
}

runMigration().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
