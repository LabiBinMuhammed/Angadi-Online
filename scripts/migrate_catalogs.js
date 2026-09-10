const fs = require('fs');
const path = require('path');
const { createClient } = require('d:/Labeeb/ANGADI/web/node_modules/@supabase/supabase-js');
const { getMalayalamName } = require(path.join(__dirname, '../cateloge/malayalam_translations'));

// Load environment variables
const envContent = fs.readFileSync('d:/Labeeb/ANGADI/web/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = match[2] ? match[2].trim().replace(/^['"]|['"]$/g, '') : '';
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Target Category IDs
const CAT_IDS = {
  'Spices & Masalas': '629d2052-6c3c-4102-95c5-6db8a85706f8',
  'Dairy': 'f75a228d-4a1b-418f-ba0f-0fe75383fada',
  'Oils & Ghee': 'f2429c0e-d038-4557-8aa1-969af9a4f99a',
  'Bakery': '456d611f-a322-48ce-a6d8-287b225afde4',
  'Biscuits & Cookies': '00f4fa99-45e1-4001-b541-8a094d62adaa',
  'Rice, Atta & Flours': 'a57fb3c9-db6b-41ae-afd5-864a14134afe',
  'Desserts & Ice Creams': '48a2b255-5f70-49de-b383-c5cf877f9d3e',
  'Beverages': 'cc30f6b9-532d-48ad-8c1c-7e2542e62454'
};

const UNIT_MAP = {
  'g': { id: '32d0b812-34cc-415c-b7cf-1f96dc2f841f', symbol: 'g', name: 'Gram' },
  'gm': { id: '32d0b812-34cc-415c-b7cf-1f96dc2f841f', symbol: 'g', name: 'Gram' },
  'gram': { id: '32d0b812-34cc-415c-b7cf-1f96dc2f841f', symbol: 'g', name: 'Gram' },
  'kg': { id: 'fc6f287c-0b3c-458e-8d4f-4679d0059c32', symbol: 'kg', name: 'Kilogram' },
  'ml': { id: '4d3b2515-c26d-4c05-ab72-13ff6c6d0938', symbol: 'ml', name: 'Millilitre' },
  'l': { id: '24f2e09f-23d1-4919-a6c3-7a3d11fae4ef', symbol: 'L', name: 'Litre' },
  'litre': { id: '24f2e09f-23d1-4919-a6c3-7a3d11fae4ef', symbol: 'L', name: 'Litre' },
  'pcs': { id: '9137e686-0e75-4a6b-a261-891b1e4e9774', symbol: 'pcs', name: 'Piece' },
  'pack': { id: '5cb5e824-4974-40f9-82ec-6edaa9ad32aa', symbol: 'pack', name: 'Pack' },
  'bottle': { id: '6aece001-9ce7-4325-b1ff-5b4f9405a97a', symbol: 'bottle', name: 'Bottle' }
};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parsePrice(val) {
  if (!val) return 0;
  const cleaned = val.replace(/[₹,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseQuantity(qtyStr) {
  if (!qtyStr) return { value: 1, unit: 'pcs', label: '1 pcs' };
  const str = qtyStr.trim();
  const match = str.match(/^([\d\.]+)\s*([a-zA-Z]+)$/);
  if (match) {
    return {
      value: parseFloat(match[1]),
      unit: match[2].toLowerCase(),
      label: str
    };
  }
  return { value: 1, unit: 'pack', label: str };
}

async function runMigration() {
  console.log('--- STARTING CATALOG DATA MIGRATION ---');

  const dir = 'd:/Labeeb/ANGADI/cateloge/new';
  const rawFiles = [
    'supernova_foods_products_with_sno.csv',
    'gemini-code-1789017323470.txt',
    'gemini-code-1789017345838.txt',
    'milma_all_products_catalog.csv',
    'elanadu_milk_full_product_catalog.csv',
    'elite_foods_cake_full_product_catalog.csv'
  ];

  const masterMap = new Map();

  rawFiles.forEach(file => {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) return;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return;
    const header = parseCSVLine(lines[0]).map(h => h.toLowerCase());

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      const p = {};
      header.forEach((h, idx) => p[h] = row[idx] || '');

      const originalName = p['product name'] || p['master_product'] || '';
      if (!originalName) continue;

      const rawCat = (p['category'] || '').toLowerCase();
      const desc = p['description'] || '';
      const mrp = parsePrice(p['original price (mrp)'] || p['price_mrp']);
      const sellPrice = parsePrice(p['selling price'] || p['selling_price']) || mrp;
      const img = p['image url'] || p['image_url'] || '';
      const rawQty = p['quantity'] || p['variants'] || '';

      let targetCat = 'Spices & Masalas';
      const nameLower = originalName.toLowerCase();

      if (rawCat === 'masala' || rawCat === 'spices' || rawCat === 'seeds' || rawCat === 'straight spices' || rawCat === 'blended masalas' || rawCat.includes('spice')) {
        targetCat = 'Spices & Masalas';
      } else if (rawCat === 'pickles' || nameLower.includes('pickle')) {
        targetCat = 'Spices & Masalas';
      } else if (nameLower.includes('ghee')) {
        targetCat = 'Oils & Ghee';
      } else if (rawCat.includes('ice cream') || nameLower.includes('ice cream')) {
        targetCat = 'Desserts & Ice Creams';
      } else if (rawCat.includes('sweet') || nameLower.includes('payasam') || nameLower.includes('gulab jamun') || nameLower.includes('halwa') || nameLower.includes('peda') || nameLower.includes('burfi') || nameLower.includes('pradhaman') || nameLower.includes('mysore pak') || nameLower.includes('rasagulla')) {
        targetCat = 'Desserts & Ice Creams';
      } else if (rawCat.includes('milk') || rawCat.includes('curd') || rawCat.includes('butter') || nameLower.includes('milk') || nameLower.includes('curd') || nameLower.includes('butter') || nameLower.includes('sambharam') || nameLower.includes('kattimoru') || nameLower.includes('cheese') || nameLower.includes('cream')) {
        if (nameLower.includes('cattle feed') || nameLower.includes('mineral mixture')) {
          continue;
        }
        targetCat = 'Dairy';
      } else if (rawCat.includes('cake') || rawCat.includes('cup cake') || rawCat.includes('bar cake') || rawCat.includes('plum cake') || rawCat.includes('speciality cake') || nameLower.includes('cake')) {
        targetCat = 'Bakery';
      } else if (nameLower.includes('biscuit') || nameLower.includes('cookie')) {
        targetCat = 'Biscuits & Cookies';
      } else if (rawCat.includes('flour') || rawCat.includes('breakfast') || rawCat.includes('ready to cook') || rawCat.includes('rice powder') || nameLower.includes('puttu') || nameLower.includes('pathiri') || nameLower.includes('palappam') || nameLower.includes('idiyappam') || nameLower.includes('rava') || nameLower.includes('dosa') || nameLower.includes('rice flour') || nameLower.includes('bhaji mix') || nameLower.includes('dhokla mix') || nameLower.includes('upma mix')) {
        targetCat = 'Rice, Atta & Flours';
      } else if (nameLower.includes('lassi') || rawCat.includes('beverage') || nameLower.includes('shake') || nameLower.includes('drink')) {
        targetCat = 'Beverages';
      } else {
        targetCat = 'Spices & Masalas';
      }

      let qtyList = [rawQty];
      let mrpList = [mrp];
      let sellList = [sellPrice];

      if (rawQty.startsWith('[') && rawQty.endsWith(']')) {
        qtyList = rawQty.slice(1, -1).split(',').map(s => s.trim());
        const mrpRaw = p['original price (mrp)'] || '';
        const sellRaw = p['selling price'] || '';
        mrpList = mrpRaw.startsWith('[') ? mrpRaw.slice(1, -1).split(',').map(s => parsePrice(s)) : [mrp];
        sellList = sellRaw.startsWith('[') ? sellRaw.slice(1, -1).split(',').map(s => parsePrice(s)) : [sellPrice];
      }

      const canonicalName = originalName.trim();
      const key = `${targetCat}:::${canonicalName}`;

      if (!masterMap.has(key)) {
        masterMap.set(key, {
          name: canonicalName,
          category: targetCat,
          categoryId: CAT_IDS[targetCat],
          description: desc,
          default_image: img,
          variants: []
        });
      }

      const itemObj = masterMap.get(key);
      if (!itemObj.default_image && img) {
        itemObj.default_image = img;
      }

      for (let qIdx = 0; qIdx < qtyList.length; qIdx++) {
        const q = parseQuantity(qtyList[qIdx]);
        const vMrp = mrpList[qIdx] || mrpList[0] || 0;
        const vPrice = sellList[qIdx] || sellList[0] || vMrp;
        const unitInfo = UNIT_MAP[q.unit] || UNIT_MAP['pack'];

        if (!itemObj.variants.some(v => v.label === q.label)) {
          itemObj.variants.push({
            label: q.label,
            value: q.value,
            unitId: unitInfo.id,
            unitSymbol: unitInfo.symbol,
            price: vPrice,
            mrp: vMrp
          });
        }
      }
    }
  });

  console.log(`Prepared ${masterMap.size} consolidated master products across categories.`);

  // 1. Delete existing items in Spices & Masalas
  console.log('\nStep 1: Deleting existing 53 generic items in Spices & Masalas...');
  const { data: existingSpices, error: getErr } = await supabase
    .from('demo_items')
    .select('id')
    .eq('category_id', CAT_IDS['Spices & Masalas']);

  if (getErr) throw getErr;

  if (existingSpices && existingSpices.length > 0) {
    const spiceIds = existingSpices.map(i => i.id);
    console.log(`Deleting ${spiceIds.length} existing spice templates and linked data...`);
    await supabase.from('demo_variants').delete().in('demo_item_id', spiceIds);
    await supabase.from('demo_sell_config').delete().in('demo_item_id', spiceIds);
    await supabase.from('demo_item_translations').delete().in('demo_item_id', spiceIds);
    const { error: delErr } = await supabase.from('demo_items').delete().in('id', spiceIds);
    if (delErr) throw delErr;
    console.log('✓ Old spices successfully deleted.');
  }

  // 2. Insert new products
  console.log('\nStep 2: Inserting 250 master products, translations, configs, and variants...');
  let count = 0;
  let spiceCount = 0;
  let otherCount = 0;

  for (const [key, prod] of masterMap.entries()) {
    count++;
    const defaultVar = prod.variants[0] || { value: 1, unitId: UNIT_MAP['pack'].id, price: 0, mrp: 0, label: '1 pack' };
    const baseUnitId = defaultVar.unitId || UNIT_MAP['pack'].id;
    const mlName = getMalayalamName(prod.name);

    // Insert demo item
    const { data: insertedItem, error: itemErr } = await supabase
      .from('demo_items')
      .insert({
        name: prod.name,
        category_id: prod.categoryId,
        unit_id: baseUnitId,
        sell_mode: 'Fixed',
        default_image: prod.default_image || null,
        code: `ANG-${prod.category.slice(0, 3).toUpperCase()}-${String(count).padStart(4, '0')}`,
        display_order: count
      })
      .select()
      .single();

    if (itemErr) {
      console.error(`Error inserting ${prod.name}:`, itemErr);
      continue;
    }

    const itemId = insertedItem.id;

    // Insert Malayalam Translation
    await supabase.from('demo_item_translations').insert({
      demo_item_id: itemId,
      language_code: 'ml',
      name: mlName
    });

    // Insert Sell Config
    const refPrice = defaultVar.price || defaultVar.mrp || 10;
    const refCeiling = defaultVar.mrp ? defaultVar.mrp * 1.15 : refPrice * 1.15;
    await supabase.from('demo_sell_config').insert({
      demo_item_id: itemId,
      sell_mode: 'Fixed',
      base_unit_id: baseUnitId,
      price_per_base_unit: refPrice,
      allow_custom_quantity: false,
      max_price_increase_percent: 15.00,
      max_price_limit: Math.ceil(refCeiling)
    });

    // Insert Variants
    const variantsPayload = prod.variants.map((v, vIdx) => ({
      demo_item_id: itemId,
      variant_type: 'Fixed',
      label: v.label,
      unit_id: v.unitId,
      value: v.value,
      price: v.price || v.mrp || 0,
      is_default: vIdx === 0,
      is_active: true,
      display_order: vIdx + 1
    }));

    if (variantsPayload.length > 0) {
      await supabase.from('demo_variants').insert(variantsPayload);
    }

    if (prod.category === 'Spices & Masalas') {
      spiceCount++;
    } else {
      otherCount++;
    }

    if (count % 25 === 0 || count === masterMap.size) {
      console.log(`Progress: ${count}/${masterMap.size} master products imported...`);
    }
  }

  console.log(`\n✓ MIGRATION COMPLETE!`);
  console.log(`- New Spices & Masalas imported: ${spiceCount}`);
  console.log(`- Other category products imported: ${otherCount}`);
  console.log(`- Total master templates in this batch: ${count}`);
}

runMigration().catch(console.error);
