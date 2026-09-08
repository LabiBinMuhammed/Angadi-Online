const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
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

const FALLBACK_IMAGES = {
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500',
  curd: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500',
  yogurt: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500',
  butter: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500',
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500',
  cheese: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500',
  ghee: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500',
  oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500',
  icecream: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500',
  tea: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500',
  coffee: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
  juice: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500',
  drink: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500',
  chicken: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500',
  mutton: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500',
  egg: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500',
  vegetable: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500',
  fruit: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500',
  rice: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
  atta: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
  flour: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
  dal: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
  pulse: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
  bean: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
  nut: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  cereal: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  spice: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500',
  masala: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500',
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
  cake: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
  biscuit: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500',
  cookie: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500',
  cleaning: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500',
  soap: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500',
  stationery: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500'
};

const CATEGORY_DEFAULT_IMAGE = {
  'Fresh Vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500',
  'Fresh Fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500',
  'Rice, Atta & Flours': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
  'Dals, Pulses & Beans': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=600&q=80',
  'Dairy': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500',
  'Oils & Ghee': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500',
  'Spices & Masalas': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500',
  'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
  'Biscuits & Cookies': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500',
  'Dry Fruits & Cereals': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  'Beverages': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500',
  'Desserts & Ice Creams': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500',
  'Meat & Fish': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500',
  'Household & Stationery': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500'
};

function resolveImage(rawUrl, catName, productName) {
  if (rawUrl && rawUrl.includes('images.unsplash.com')) {
    return rawUrl;
  }
  const searchStr = `${catName} ${productName}`.toLowerCase();
  for (const [kw, img] of Object.entries(FALLBACK_IMAGES)) {
    if (searchStr.includes(kw)) {
      return img;
    }
  }
  return CATEGORY_DEFAULT_IMAGE[catName] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500';
}

function parseQuantityAndUnit(rawQty, catName, unitMap) {
  const q = (rawQty || '').trim();
  const numMatch = q.match(/([\d.]+)/);
  const value = numMatch ? parseFloat(numMatch[1]) : 1;

  const lower = q.toLowerCase();
  let symbol = 'pack';

  if (lower.includes('kg') || lower.includes('kilo')) {
    symbol = 'kg';
  } else if (lower.includes('g') && !lower.includes('kg') && !lower.includes('bag')) {
    symbol = 'g';
  } else if (lower.includes('ml') || lower.includes('nl')) {
    symbol = 'ml';
  } else if (lower.includes('litre') || lower.includes('ltr') || lower.includes('l')) {
    symbol = 'L';
  } else if (lower.includes('pc') || lower.includes('piece')) {
    symbol = 'pcs';
  } else if (lower.includes('doz')) {
    symbol = 'doz';
  } else if (lower.includes('bottle')) {
    symbol = 'bottle';
  } else {
    // Default by category
    if (catName === 'Fresh Vegetables' || catName === 'Fresh Fruits') {
      symbol = 'kg';
    } else if (catName === 'Beverages' || catName === 'Dairy') {
      symbol = 'ml';
    } else {
      symbol = 'pack';
    }
  }

  const unit = unitMap[symbol] || unitMap['pack'] || unitMap['pcs'];
  return {
    value,
    symbol,
    unitId: unit ? unit.id : null
  };
}

async function run() {
  console.log('=== Ingesting Master Catalog (1,590 Products) into Supabase ===\n');

  // 1. Fetch Categories
  const { data: categories, error: cErr } = await supabase.from('categories').select('id, name').eq('is_active', true);
  if (cErr) throw cErr;
  const catMap = {};
  categories.forEach(c => { catMap[c.name.toLowerCase().trim()] = c.id; });
  console.log(`Loaded ${categories.length} active categories from Supabase.`);

  // 2. Fetch Units
  const { data: units, error: uErr } = await supabase.from('units').select('id, name, symbol');
  if (uErr) throw uErr;
  const unitMap = {};
  units.forEach(u => { unitMap[u.symbol] = u; });
  console.log(`Loaded ${units.length} units from Supabase.`);

  // 3. Read all 11 catalog files
  const files = [
    'd:/Labeeb/ANGADI/cateloge/01/1.1.csv',
    'd:/Labeeb/ANGADI/cateloge/01/1.2.csv',
    'd:/Labeeb/ANGADI/cateloge/01/1.3.csv',
    'd:/Labeeb/ANGADI/cateloge/01/1.4.csv',
    'd:/Labeeb/ANGADI/cateloge/01/1.5.csv',
    'd:/Labeeb/ANGADI/cateloge/01/1.6.csv',
    'd:/Labeeb/ANGADI/cateloge/01/1.7.csv',
    'd:/Labeeb/ANGADI/cateloge/01/1.8.csv',
    'd:/Labeeb/ANGADI/cateloge/02/2.1.csv',
    'd:/Labeeb/ANGADI/cateloge/02/2.2.csv',
    'd:/Labeeb/ANGADI/cateloge/02/2.3.csv'
  ];

  const parsedItems = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const header = parseCSVLine(lines[0]);
    const hasBrand = header.includes('Brand');

    lines.slice(1).forEach((line, lineIdx) => {
      const cols = parseCSVLine(line);
      const rawCat = cols[1];
      const catId = catMap[rawCat.toLowerCase().trim()];
      if (!catId) {
        console.warn(`Category not found: "${rawCat}" in file ${filePath} line ${lineIdx + 2}`);
        return;
      }

      let rawName = cols[2];
      let brand = hasBrand ? cols[3] : '';
      let desc = hasBrand ? cols[4] : cols[3];
      let rawQty = hasBrand ? cols[5] : cols[4];
      let rawMrp = hasBrand ? cols[6] : cols[5];
      let rawSp = hasBrand ? cols[7] : cols[6];
      let rawImg = cols[cols.length - 1];

      // If 1.1.csv (no Brand column), infer brand from product name
      if (!hasBrand && rawName.includes('Elanadu')) {
        brand = 'Elanadu';
      }

      // Format Product Name to include Brand cleanly if appropriate
      let displayName = rawName.trim();
      if (brand && !displayName.toLowerCase().includes(brand.toLowerCase())) {
        displayName = `${brand.trim()} ${displayName}`;
      }

      // Quantity & Unit
      const { value: qtyVal, symbol: qtySym, unitId } = parseQuantityAndUnit(rawQty, rawCat, unitMap);

      // Prices
      const cleanMrp = parseFloat(String(rawMrp || '0').replace(/[₹,\s]/g, '')) || 0;
      const cleanSp = parseFloat(String(rawSp || '0').replace(/[₹,\s]/g, '')) || cleanMrp;
      const finalPrice = cleanSp > 0 ? cleanSp : (cleanMrp > 0 ? cleanMrp : 10);

      // Selling Mode
      let sellMode = 'Fixed';
      if (rawCat === 'Fresh Vegetables' || rawCat === 'Fresh Fruits') {
        if (qtySym === 'kg' || qtySym === 'g') {
          sellMode = 'Manual';
        } else {
          sellMode = 'Fixed';
        }
      } else if (rawCat === 'Meat & Fish') {
        sellMode = 'Manual';
      }

      // Resolved live image
      const resolvedImg = resolveImage(rawImg, rawCat, displayName);

      parsedItems.push({
        category_id: catId,
        category_name: rawCat,
        name: displayName,
        brand: brand.trim() || null,
        description: desc ? desc.trim() : null,
        quantity_str: rawQty,
        qty_value: qtyVal,
        qty_symbol: qtySym,
        unit_id: unitId,
        sell_mode: sellMode,
        price: finalPrice,
        mrp: cleanMrp,
        image_url: resolvedImg,
        code: brand.trim() || null
      });
    });
  }

  console.log(`Successfully parsed ${parsedItems.length} items from CSV files.`);

  // 4. Batch Ingest into Supabase
  const BATCH_SIZE = 50;
  let insertedCount = 0;

  for (let i = 0; i < parsedItems.length; i += BATCH_SIZE) {
    const batch = parsedItems.slice(i, i + BATCH_SIZE);

    // Prepare demo_items records with unique SKU codes
    const demoItemsPayload = batch.map((item, idx) => {
      const globalIndex = i + idx + 1;
      const catPrefix = item.category_name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
      const uniqueCode = `ANG-${catPrefix}-${String(globalIndex).padStart(4, '0')}`;

      return {
        category_id: item.category_id,
        name: item.name,
        unit_id: item.unit_id,
        sell_mode: item.sell_mode,
        default_image: item.image_url,
        display_order: globalIndex,
        code: uniqueCode
      };
    });

    const { data: insertedDemos, error: insErr } = await supabase
      .from('demo_items')
      .insert(demoItemsPayload)
      .select('id, name, sell_mode, unit_id');

    if (insErr) {
      console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, insErr.message);
      continue;
    }

    // Now insert demo_sell_config and demo_variants for each inserted item
    const sellConfigsPayload = [];
    const variantsPayload = [];

    insertedDemos.forEach((d, idx) => {
      const sourceItem = batch[idx];
      const demoId = d.id;

      // Sell Config
      sellConfigsPayload.push({
        demo_item_id: demoId,
        sell_mode: d.sell_mode,
        base_unit_id: d.unit_id,
        price_per_base_unit: sourceItem.price,
        allow_custom_quantity: d.sell_mode === 'Manual',
        max_price_increase_percent: 15,
        max_price_limit: 0
      });

      // Default Variant
      const label = sourceItem.quantity_str || `${sourceItem.qty_value}${sourceItem.qty_symbol}`;
      variantsPayload.push({
        demo_item_id: demoId,
        variant_type: d.sell_mode,
        label: label,
        unit_id: d.unit_id,
        value: sourceItem.qty_value,
        price: sourceItem.price,
        is_default: true,
        is_active: true,
        display_order: 1
      });

      // For Manual items (weight-based), also add 250g, 500g, 1kg standard presets if base unit is kg
      if (d.sell_mode === 'Manual' && sourceItem.qty_symbol === 'kg') {
        const kgPrice = sourceItem.price;
        const gUnit = unitMap['g'];
        if (gUnit) {
          variantsPayload.push({
            demo_item_id: demoId,
            variant_type: 'Manual',
            label: '250g',
            unit_id: gUnit.id,
            value: 250,
            price: Math.round(kgPrice * 0.25 * 100) / 100,
            is_default: false,
            is_active: true,
            display_order: 2
          });
          variantsPayload.push({
            demo_item_id: demoId,
            variant_type: 'Manual',
            label: '500g',
            unit_id: gUnit.id,
            value: 500,
            price: Math.round(kgPrice * 0.50 * 100) / 100,
            is_default: false,
            is_active: true,
            display_order: 3
          });
        }
      }
    });

    if (sellConfigsPayload.length > 0) {
      const { error: cfgErr } = await supabase.from('demo_sell_config').insert(sellConfigsPayload);
      if (cfgErr) console.error('Error inserting demo_sell_config batch:', cfgErr.message);
    }

    if (variantsPayload.length > 0) {
      const { error: varErr } = await supabase.from('demo_variants').insert(variantsPayload);
      if (varErr) console.error('Error inserting demo_variants batch:', varErr.message);
    }

    insertedCount += insertedDemos.length;
    process.stdout.write(`\rIngested ${insertedCount} / ${parsedItems.length} items...`);
  }

  console.log(`\n\n✓ Ingestion complete! Successfully inserted ${insertedCount} items into demo_items.`);

  // 5. Validation Check
  const { count: finalDemosCount } = await supabase.from('demo_items').select('*', { count: 'exact', head: true });
  const { count: finalConfigsCount } = await supabase.from('demo_sell_config').select('*', { count: 'exact', head: true });
  const { count: finalVariantsCount } = await supabase.from('demo_variants').select('*', { count: 'exact', head: true });

  console.log('\n=== DATABASE STATE AFTER INGESTION ===');
  console.log(`demo_items count:       ${finalDemosCount}`);
  console.log(`demo_sell_config count: ${finalConfigsCount}`);
  console.log(`demo_variants count:    ${finalVariantsCount}`);
}

run().catch(console.error);
