const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require(path.join(__dirname, '../web/node_modules/@supabase/supabase-js'));
const { getMalayalamTranslation } = require('./stationery_ml_helper');

const envText = fs.readFileSync('web/.env.local', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CATEGORY_IDS = {
  stationery: 'a6f202ca-5423-4457-9c87-a53d8bc554fa', // Household & Stationery
  personalCare: '27994d63-334d-4e67-933f-0a8cf62d799f' // Personal Care & Hygiene
};

const UNIT_IDS = {
  pcs: '9137e686-0e75-4a6b-a261-891b1e4e9774',
  pack: '5cb5e824-4974-40f9-82ec-6edaa9ad32aa',
  bottle: '6aece001-9ce7-4325-b1ff-5b4f9405a97a'
};

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      const req = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        },
        timeout: 25000
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let loc = res.headers.location;
          if (!loc.startsWith('http')) loc = new URL(loc, url).toString();
          return downloadImage(loc).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          let cType = res.headers['content-type'] || 'image/jpeg';
          if (!cType || cType.includes('text')) {
            if (url.toLowerCase().endsWith('.png')) cType = 'image/png';
            else if (url.toLowerCase().endsWith('.webp')) cType = 'image/webp';
            else cType = 'image/jpeg';
          }
          resolve({ buffer: buf, contentType: cType });
        });
      });
      req.on('error', reject);
      req.setTimeout(25000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    } catch (e) {
      reject(e);
    }
  });
}

function cleanSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

async function uploadToStorage(storagePath, buffer, contentType) {
  const { error } = await supabase.storage
    .from('item-images')
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: contentType
    });

  if (error) {
    console.error(`  -> Storage upload error (${storagePath}):`, error.message);
    return null;
  }
  const { data } = supabase.storage.from('item-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

// 1. Prepare Stationery Items (Papergrid & Kokuyo Camlin)
function getStationeryItems() {
  const items = [];
  let staOrder = 1001;

  // Papergrid (13 items)
  if (fs.existsSync('scripts/papergrid_products.json')) {
    const rawPg = JSON.parse(fs.readFileSync('scripts/papergrid_products.json', 'utf8'));
    rawPg.forEach(p => {
      const code = `ANG-STA-${String(staOrder).padStart(4, '0')}`;
      const slug = cleanSlug(p.name);
      items.push({
        brand: 'Papergrid',
        code,
        name: p.name,
        categoryName: p.category,
        categoryId: CATEGORY_IDS.stationery,
        imageUrl: p.imageUrl,
        storageSubdir: 'papergrid',
        storageFilename: `${slug}.jpg`,
        basePrice: p.basePrice || 200,
        baseUnitId: UNIT_IDS.pcs,
        variants: (p.variants || []).map((v, i) => ({
          label: v.label,
          price: v.price,
          unit_id: UNIT_IDS.pack,
          value: i + 1,
          is_default: v.is_default,
          display_order: i + 1
        })),
        displayOrder: staOrder++
      });
    });
  }

  // Kokuyo Camlin (89 items)
  if (fs.existsSync('scripts/camlin_products.json')) {
    const rawCamlin = JSON.parse(fs.readFileSync('scripts/camlin_products.json', 'utf8'));
    rawCamlin.forEach(p => {
      const code = `ANG-STA-${String(staOrder).padStart(4, '0')}`;
      let title = p.name.trim();
      if (!title.toLowerCase().startsWith('camlin')) {
        title = `Camlin ${title}`;
      }
      const slug = cleanSlug(title);
      const ext = path.extname(new URL(p.imageUrl).pathname) || '.jpg';

      let basePrice = 10;
      let variants = [];
      const lower = title.toLowerCase();

      if (p.category.includes('Pencil')) {
        basePrice = 8;
        variants = [
          { label: 'Box of 10 Pencils', price: 75, unit_id: UNIT_IDS.pack, value: 10, is_default: true, display_order: 1 },
          { label: 'Pack of 5 Pencils', price: 40, unit_id: UNIT_IDS.pack, value: 5, is_default: false, display_order: 2 },
          { label: '1 Pencil', price: 8, unit_id: UNIT_IDS.pcs, value: 1, is_default: false, display_order: 3 }
        ];
      } else if (p.category.includes('Geometry')) {
        basePrice = 95;
        variants = [
          { label: '1 Geometry Box', price: 95, unit_id: UNIT_IDS.pcs, value: 1, is_default: true, display_order: 1 },
          { label: 'Pack of 2 Sets', price: 180, unit_id: UNIT_IDS.pack, value: 2, is_default: false, display_order: 2 }
        ];
      } else if (p.category.includes('Notebook')) {
        basePrice = 45;
        variants = [
          { label: 'Single Book (172 pgs)', price: 45, unit_id: UNIT_IDS.pcs, value: 1, is_default: true, display_order: 1 },
          { label: 'Pack of 6 Books', price: 250, unit_id: UNIT_IDS.pack, value: 6, is_default: false, display_order: 2 }
        ];
      } else if (p.category.includes('Ink') || lower.includes('ink')) {
        basePrice = 30;
        variants = [
          { label: '1 Bottle (15 ml / 60 ml)', price: 30, unit_id: UNIT_IDS.bottle, value: 1, is_default: true, display_order: 1 },
          { label: 'Pack of 2 Bottles', price: 55, unit_id: UNIT_IDS.pack, value: 2, is_default: false, display_order: 2 }
        ];
      } else {
        basePrice = 50;
        variants = [
          { label: '1 Pen with 2 Cartridges', price: 50, unit_id: UNIT_IDS.pcs, value: 1, is_default: true, display_order: 1 },
          { label: 'Pack of 2 Pens', price: 95, unit_id: UNIT_IDS.pack, value: 2, is_default: false, display_order: 2 }
        ];
      }

      items.push({
        brand: 'Camlin',
        code,
        name: title,
        categoryName: p.category,
        categoryId: CATEGORY_IDS.stationery,
        imageUrl: p.imageUrl,
        storageSubdir: 'camlin',
        storageFilename: `${slug}${ext}`,
        basePrice,
        baseUnitId: UNIT_IDS.pcs,
        variants,
        displayOrder: staOrder++
      });
    });
  }

  return items;
}

// 2. Prepare Personal Care Items (Parachute, Cinthol, Santoor, Vivel, Cutee, Lux, Pears, Himalaya)
function getPersonalCareItems() {
  const items = [];
  let perOrder = 1;

  const brands = [
    { file: 'scripts/parachute_products.json', brand: 'Parachute Advansed', subdir: 'parachute' },
    { file: 'scripts/cinthol_products.json', brand: 'Cinthol', subdir: 'cinthol' },
    { file: 'scripts/santoor_products.json', brand: 'Santoor', subdir: 'santoor' },
    { file: 'scripts/vivel_products.json', brand: 'Vivel', subdir: 'vivel' },
    { file: 'scripts/cutee_products.json', brand: 'Cutee', subdir: 'cutee' },
    { file: 'scripts/lux_products.json', brand: 'Lux', subdir: 'lux' },
    { file: 'scripts/pears_products.json', brand: 'Pears', subdir: 'pears' },
    { file: 'scripts/himalaya_products.json', brand: 'Himalaya', subdir: 'himalaya' }
  ];

  brands.forEach(b => {
    if (!fs.existsSync(b.file)) return;
    const raw = JSON.parse(fs.readFileSync(b.file, 'utf8'));
    raw.forEach(p => {
      const code = `ANG-PER-${String(perOrder).padStart(4, '0')}`;
      let title = p.name.trim();
      if (!title.toLowerCase().startsWith(b.brand.toLowerCase())) {
        title = `${b.brand} ${title}`;
      }
      const slug = cleanSlug(title);
      const ext = path.extname(new URL(p.imageUrl).pathname) || '.jpg';

      let baseUnitId = UNIT_IDS.pcs;
      if (p.unit === 'bottle' || title.toLowerCase().includes('oil') || title.toLowerCase().includes('wash') || title.toLowerCase().includes('lotion')) {
        baseUnitId = UNIT_IDS.bottle;
      } else if (title.toLowerCase().includes('pack')) {
        baseUnitId = UNIT_IDS.pack;
      }

      const variants = (p.variants || [
        { label: 'Standard Pack', price: p.basePrice || 50, is_default: true }
      ]).map((v, i) => ({
        label: v.label,
        price: v.price,
        unit_id: baseUnitId,
        value: i + 1,
        is_default: v.is_default,
        display_order: i + 1
      }));

      items.push({
        brand: b.brand,
        code,
        name: title,
        categoryName: p.category || 'Personal Care & Hygiene',
        categoryId: CATEGORY_IDS.personalCare,
        imageUrl: p.imageUrl,
        storageSubdir: b.subdir,
        storageFilename: `${slug}${ext}`,
        basePrice: p.basePrice || variants[0].price,
        baseUnitId,
        variants,
        displayOrder: perOrder++
      });
    });
  });

  return items;
}

async function run() {
  console.log('=== STARTING MASTER IMPORT: STATIONERY & PERSONAL CARE EXPANSION ===');

  const stationeryItems = getStationeryItems();
  const personalCareItems = getPersonalCareItems();
  const allItems = [...stationeryItems, ...personalCareItems];

  console.log(`Total Products to Import: ${allItems.length}`);
  console.log(`  - Stationery (Papergrid + Kokuyo Camlin): ${stationeryItems.length}`);
  console.log(`  - Personal Care (Parachute, Cinthol, Santoor, Vivel, Cutee, Lux, Pears, Himalaya): ${personalCareItems.length}`);

  const imageUrlMap = new Map();
  const importedStationery = [];
  const importedPersonalCare = [];

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const progress = `[${i + 1}/${allItems.length}]`;
    console.log(`\n${progress} Processing ${item.name} (${item.code}) [${item.categoryName}]`);

    // 1. Download & Upload Image to Supabase Storage CDN
    let finalImageUrl = item.imageUrl;
    try {
      if (imageUrlMap.has(item.imageUrl)) {
        finalImageUrl = imageUrlMap.get(item.imageUrl);
        console.log(`  -> Using cached CDN URL: ${finalImageUrl}`);
      } else if (item.imageUrl) {
        const storagePath = `${item.storageSubdir}/${item.storageFilename}`;
        console.log(`  -> Downloading: ${item.imageUrl}...`);
        const { buffer, contentType } = await downloadImage(encodeURI(item.imageUrl));

        console.log(`  -> Uploading to Supabase Storage: item-images/${storagePath} (${(buffer.length / 1024).toFixed(1)} KB)...`);
        const uploadedUrl = await uploadToStorage(storagePath, buffer, contentType);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
          imageUrlMap.set(item.imageUrl, finalImageUrl);
          console.log(`  -> Uploaded successfully: ${finalImageUrl}`);
        }
      }
    } catch (imgErr) {
      console.error(`  -> Image processing warning for ${item.name}: ${imgErr.message}`);
    }

    // 2. Generate Malayalam Translation
    const mlName = getMalayalamTranslation(item.name);

    // 3. Upsert into demo_items
    try {
      const { data: existing } = await supabase
        .from('demo_items')
        .select('id')
        .eq('code', item.code)
        .maybeSingle();

      let itemId;
      if (existing) {
        itemId = existing.id;
        await supabase
          .from('demo_items')
          .update({
            name: item.name,
            category_id: item.categoryId,
            unit_id: item.baseUnitId,
            sell_mode: 'Fixed',
            default_image: finalImageUrl,
            display_order: item.displayOrder
          })
          .eq('id', itemId);

        await supabase.from('demo_variants').delete().eq('demo_item_id', itemId);
        await supabase.from('demo_sell_config').delete().eq('demo_item_id', itemId);
        await supabase.from('demo_item_translations').delete().eq('demo_item_id', itemId);
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('demo_items')
          .insert({
            name: item.name,
            category_id: item.categoryId,
            unit_id: item.baseUnitId,
            sell_mode: 'Fixed',
            default_image: finalImageUrl,
            code: item.code,
            display_order: item.displayOrder
          })
          .select('id')
          .single();

        if (insErr) throw insErr;
        itemId = inserted.id;
      }

      // 4. Insert Malayalam Translation
      await supabase.from('demo_item_translations').insert({
        demo_item_id: itemId,
        language_code: 'ml',
        name: mlName
      });

      // 5. Insert Sell Config
      const ceiling = Math.ceil(item.basePrice * 1.15);
      await supabase.from('demo_sell_config').insert({
        demo_item_id: itemId,
        sell_mode: 'Fixed',
        base_unit_id: item.baseUnitId,
        price_per_base_unit: item.basePrice,
        allow_custom_quantity: false,
        max_price_increase_percent: 15.00,
        max_price_limit: ceiling
      });

      // 6. Insert Variants
      const variantsPayload = item.variants.map(v => ({
        demo_item_id: itemId,
        variant_type: 'Fixed',
        label: v.label,
        unit_id: v.unit_id,
        value: v.value,
        price: v.price,
        is_default: v.is_default,
        is_active: true,
        display_order: v.display_order
      }));
      await supabase.from('demo_variants').insert(variantsPayload);

      const record = {
        brand: item.brand,
        code: item.code,
        name: item.name,
        category: item.categoryName,
        mlName,
        basePrice: item.basePrice,
        variantsCount: item.variants.length,
        imageUrl: finalImageUrl
      };

      if (item.categoryId === CATEGORY_IDS.stationery) {
        importedStationery.push(record);
      } else {
        importedPersonalCare.push(record);
      }

      console.log(`  -> Saved ${item.name} [${mlName}] - Base: ₹${item.basePrice}, Variants: ${item.variants.length}`);
    } catch (dbErr) {
      console.error(`  -> Database error for ${item.name}:`, dbErr.message);
    }
  }

  // 7. Write Consolidated Catalog CSVs
  const csvHeader = 'Brand,Code,Name,Category,Malayalam Name,Base Price,Variants Count,Image URL\n';

  // Stationery CSV
  const staRows = importedStationery.map(it =>
    `"${it.brand}","${it.code}","${it.name.replace(/"/g, '""')}","${it.category}","${it.mlName.replace(/"/g, '""')}","${it.basePrice}","${it.variantsCount}","${it.imageUrl}"`
  ).join('\n');
  const staCsvPath = path.join(__dirname, '../cateloge/new/angadi_kerala_stationery_expansion_catalog.csv');
  fs.writeFileSync(staCsvPath, csvHeader + staRows, 'utf8');
  console.log(`\nExported Stationery CSV (${importedStationery.length} items) to: ${staCsvPath}`);

  // Personal Care CSV
  const perRows = importedPersonalCare.map(it =>
    `"${it.brand}","${it.code}","${it.name.replace(/"/g, '""')}","${it.category}","${it.mlName.replace(/"/g, '""')}","${it.basePrice}","${it.variantsCount}","${it.imageUrl}"`
  ).join('\n');
  const perCsvPath = path.join(__dirname, '../cateloge/new/angadi_kerala_personal_care_catalog.csv');
  fs.writeFileSync(perCsvPath, csvHeader + perRows, 'utf8');
  console.log(`Exported Personal Care CSV (${importedPersonalCare.length} items) to: ${perCsvPath}`);

  console.log(`\nSuccessfully imported all ${importedStationery.length + importedPersonalCare.length} product templates!`);
}

run();
