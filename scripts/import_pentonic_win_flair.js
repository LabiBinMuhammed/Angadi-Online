const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require(path.join(__dirname, '../web/node_modules/@supabase/supabase-js'));
const { getStationeryMalayalam } = require('./stationery_ml_helper');

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

const STATIONERY_CATEGORY_ID = 'a6f202ca-5423-4457-9c87-a53d8bc554fa';
const UNIT_IDS = {
  pcs: '9137e686-0e75-4a6b-a261-891b1e4e9774',
  pack: '5cb5e824-4974-40f9-82ec-6edaa9ad32aa'
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
          let cType = res.headers['content-type'] || 'image/png';
          if (!cType || cType.includes('text')) {
            if (url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg')) cType = 'image/jpeg';
            else if (url.toLowerCase().endsWith('.webp')) cType = 'image/webp';
            else cType = 'image/png';
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
    console.error(`  -> Upload error on ${storagePath}:`, error.message);
    return null;
  }
  const { data } = supabase.storage.from('item-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

// 1. Prepare Pentonic Products (16 items)
function preparePentonic() {
  const raw = JSON.parse(fs.readFileSync('scripts/pentonic_products.json', 'utf8'));
  return raw.map((item, idx) => {
    const code = `ANG-STA-${String(751 + idx).padStart(4, '0')}`;
    let title = item.title.trim();
    if (!title.toLowerCase().startsWith('pentonic')) {
      title = `Pentonic ${title}`;
    }

    const basePrice = item.price || 10;
    const variants = [
      { label: '1 Pen', value: 1, unit_id: UNIT_IDS.pcs, price: basePrice, is_default: true, display_order: 1 },
      { label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: basePrice * 5, is_default: false, display_order: 2 },
      { label: 'Pack of 10 Box', value: 10, unit_id: UNIT_IDS.pack, price: Math.round(basePrice * 9.5), is_default: false, display_order: 3 }
    ];

    const slug = cleanSlug(title);
    return {
      brand: 'Pentonic',
      code,
      name: title,
      category: item.cat || 'Ball Pens',
      imageUrl: item.img,
      storageSubdir: 'pentonic',
      storageFilename: `${slug}.png`,
      basePrice,
      baseUnitId: UNIT_IDS.pcs,
      variants,
      displayOrder: 751 + idx
    };
  });
}

// 2. Prepare Win & Totem Products (43 items)
function prepareWinPens() {
  const raw = JSON.parse(fs.readFileSync('scripts/winpens_raw_products.json', 'utf8'));
  return raw.map((item, idx) => {
    const code = `ANG-STA-${String(771 + idx).padStart(4, '0')}`;
    let title = item.title.trim();
    const brand = item.brand === 'Totem' ? 'Totem' : 'Win';

    if (!title.toLowerCase().startsWith(brand.toLowerCase())) {
      title = `${brand} ${title}`;
    }
    const lower = title.toLowerCase();
    if (!lower.includes('pen') && !lower.includes('pencil')) {
      title = `${title} ${item.category === 'Gel Pens' ? 'Gel Pen' : 'Ball Pen'}`;
    }

    const isGel = item.category === 'Gel Pens' || lower.includes('gel');
    const basePrice = isGel ? 15 : 10;
    const variants = [
      { label: '1 Pen', value: 1, unit_id: UNIT_IDS.pcs, price: basePrice, is_default: true, display_order: 1 },
      { label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: isGel ? 70 : 48, is_default: false, display_order: 2 },
      { label: 'Pack of 10 Box', value: 10, unit_id: UNIT_IDS.pack, price: isGel ? 135 : 90, is_default: false, display_order: 3 }
    ];

    const ext = path.extname(new URL(item.imageUrl).pathname) || '.jpg';
    const slug = cleanSlug(title);
    return {
      brand: brand,
      code,
      name: title,
      category: item.category || (isGel ? 'Gel Pens' : 'Ball Pens'),
      imageUrl: item.imageUrl,
      storageSubdir: 'winpens',
      storageFilename: `${slug}${ext}`,
      basePrice,
      baseUnitId: UNIT_IDS.pcs,
      variants,
      displayOrder: 771 + idx
    };
  });
}

// 3. Prepare Flair Products (173 items)
function prepareFlair() {
  const raw = JSON.parse(fs.readFileSync('scripts/flair_raw_products.json', 'utf8'));
  return raw.map((item, idx) => {
    const code = `ANG-STA-${String(821 + idx).padStart(4, '0')}`;
    let title = item.title.trim();
    if (!title.toLowerCase().startsWith('flair')) {
      title = `Flair ${title}`;
    }

    const catSlug = item.categorySlug;
    const catName = item.categoryName;
    const lower = title.toLowerCase();

    // Suffix specific to category if needed
    if (catSlug === 'metal-pens' && !lower.includes('pen')) {
      title = `${title} Metal Executive Pen`;
    } else if (catSlug === 'ball-pens' && !lower.includes('pen')) {
      title = `${title} Ball Pen`;
    } else if (catSlug === 'gel-pens' && !lower.includes('pen')) {
      title = `${title} Gel Pen`;
    } else if (catSlug === 'fountain-pens' && !lower.includes('pen')) {
      title = `${title} Fountain Pen`;
    } else if (catSlug === 'platinum-series' && !lower.includes('pen')) {
      title = `${title} Platinum Luxury Pen`;
    } else if (catSlug === 'Writing-Kits' && !lower.includes('kit') && !lower.includes('set')) {
      title = `${title} Writing Kit`;
    } else if (catSlug === 'gift-sets' && !lower.includes('set') && !lower.includes('box')) {
      title = `${title} Pen Gift Set`;
    } else if (catSlug === 'packaging' && !lower.includes('refill') && !lower.includes('pack')) {
      title = `${title} Refill Pack`;
    }

    // Pricing & Variants according to category
    let basePrice = 15;
    let baseUnitId = UNIT_IDS.pcs;
    let variants = [];

    if (catSlug === 'platinum-series') {
      basePrice = 350;
      baseUnitId = UNIT_IDS.pcs;
      variants = [
        { label: '1 Pen (Presentation Case)', value: 1, unit_id: UNIT_IDS.pcs, price: 350, is_default: true, display_order: 1 },
        { label: 'Twin Pack Set', value: 2, unit_id: UNIT_IDS.pack, price: 650, is_default: false, display_order: 2 }
      ];
    } else if (catSlug === 'metal-pens') {
      basePrice = 140;
      baseUnitId = UNIT_IDS.pcs;
      variants = [
        { label: '1 Pen (Gift Box)', value: 1, unit_id: UNIT_IDS.pcs, price: 140, is_default: true, display_order: 1 },
        { label: 'Twin Pack', value: 2, unit_id: UNIT_IDS.pack, price: 260, is_default: false, display_order: 2 }
      ];
    } else if (catSlug === 'fountain-pens') {
      basePrice = 50;
      baseUnitId = UNIT_IDS.pcs;
      variants = [
        { label: '1 Pen with 2 Cartridges', value: 1, unit_id: UNIT_IDS.pcs, price: 50, is_default: true, display_order: 1 },
        { label: 'Pack of 2 Pens', value: 2, unit_id: UNIT_IDS.pack, price: 95, is_default: false, display_order: 2 }
      ];
    } else if (catSlug === 'Writing-Kits') {
      basePrice = 99;
      baseUnitId = UNIT_IDS.pcs;
      variants = [
        { label: '1 Kit', value: 1, unit_id: UNIT_IDS.pcs, price: 99, is_default: true, display_order: 1 },
        { label: 'Pack of 2 Kits', value: 2, unit_id: UNIT_IDS.pack, price: 189, is_default: false, display_order: 2 }
      ];
    } else if (catSlug === 'gift-sets') {
      basePrice = 180;
      baseUnitId = UNIT_IDS.pcs;
      variants = [
        { label: '1 Gift Set Box', value: 1, unit_id: UNIT_IDS.pcs, price: 180, is_default: true, display_order: 1 },
        { label: 'Pack of 2 Sets', value: 2, unit_id: UNIT_IDS.pack, price: 340, is_default: false, display_order: 2 }
      ];
    } else if (catSlug === 'packaging') {
      basePrice = 25;
      baseUnitId = UNIT_IDS.pack;
      variants = [
        { label: 'Pack of 5 Refills', value: 5, unit_id: UNIT_IDS.pack, price: 25, is_default: true, display_order: 1 },
        { label: 'Pack of 10 Refills', value: 10, unit_id: UNIT_IDS.pack, price: 48, is_default: false, display_order: 2 }
      ];
    } else if (catSlug === 'gel-pens') {
      basePrice = 15;
      baseUnitId = UNIT_IDS.pcs;
      variants = [
        { label: '1 Pen', value: 1, unit_id: UNIT_IDS.pcs, price: 15, is_default: true, display_order: 1 },
        { label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: 75, is_default: false, display_order: 2 },
        { label: 'Pack of 10 Box', value: 10, unit_id: UNIT_IDS.pack, price: 140, is_default: false, display_order: 3 }
      ];
    } else {
      // ball-pens
      const isWritoMeter = lower.includes('writo');
      basePrice = isWritoMeter ? 25 : 10;
      baseUnitId = UNIT_IDS.pcs;
      variants = isWritoMeter
        ? [
            { label: '1 Pen', value: 1, unit_id: UNIT_IDS.pcs, price: 25, is_default: true, display_order: 1 },
            { label: 'Pack of 3', value: 3, unit_id: UNIT_IDS.pack, price: 70, is_default: false, display_order: 2 },
            { label: 'Pack of 5 Box', value: 5, unit_id: UNIT_IDS.pack, price: 115, is_default: false, display_order: 3 }
          ]
        : [
            { label: '1 Pen', value: 1, unit_id: UNIT_IDS.pcs, price: 10, is_default: true, display_order: 1 },
            { label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: 50, is_default: false, display_order: 2 },
            { label: 'Pack of 10 Box', value: 10, unit_id: UNIT_IDS.pack, price: 95, is_default: false, display_order: 3 }
          ];
    }

    const ext = path.extname(new URL(item.imageUrl).pathname) || '.webp';
    const slug = cleanSlug(title);
    return {
      brand: 'Flair',
      code,
      name: title,
      category: catName,
      imageUrl: item.imageUrl,
      storageSubdir: 'flair',
      storageFilename: `${cleanSlug(catSlug)}_${slug}${ext}`,
      basePrice,
      baseUnitId,
      variants,
      displayOrder: 821 + idx
    };
  });
}

async function run() {
  console.log('=== STARTING UNIFIED PENS IMPORTER (Pentonic + Win/Totem + Flair) ===');
  const pentonicItems = preparePentonic();
  const winItems = prepareWinPens();
  const flairItems = prepareFlair();

  const allItems = [...pentonicItems, ...winItems, ...flairItems];
  console.log(`Total pens to import: ${allItems.length}`);
  console.log(`  - Pentonic: ${pentonicItems.length}`);
  console.log(`  - Win/Totem: ${winItems.length}`);
  console.log(`  - Flair: ${flairItems.length}`);

  const imageUrlMap = new Map();
  const importedList = [];

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const progress = `[${i + 1}/${allItems.length}]`;
    console.log(`\n${progress} Processing ${item.name} (${item.code}) [${item.category}]`);

    // 1. Download and Upload Image to Supabase Storage
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
          console.log(`  -> Successfully uploaded: ${finalImageUrl}`);
        }
      }
    } catch (imgErr) {
      console.error(`  -> Image upload failed for ${item.name}: ${imgErr.message}`);
    }

    // 2. Generate Malayalam Translation
    const mlName = getStationeryMalayalam(item.name);

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
            category_id: STATIONERY_CATEGORY_ID,
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
            category_id: STATIONERY_CATEGORY_ID,
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

      importedList.push({
        brand: item.brand,
        code: item.code,
        name: item.name,
        category: item.category,
        mlName,
        basePrice: item.basePrice,
        variantsCount: item.variants.length,
        imageUrl: finalImageUrl
      });
      console.log(`  -> Saved ${item.name} [${mlName}] - Base: ₹${item.basePrice}, Variants: ${item.variants.length}`);
    } catch (dbErr) {
      console.error(`  -> Database error for ${item.name}:`, dbErr.message);
    }
  }

  // 7. Write Consolidated CSV Catalog
  const csvHeader = 'Brand,Code,Name,Category,Malayalam Name,Base Price,Variants Count,Image URL\n';
  const csvRows = importedList.map(it =>
    `"${it.brand}","${it.code}","${it.name.replace(/"/g, '""')}","${it.category}","${it.mlName.replace(/"/g, '""')}","${it.basePrice}","${it.variantsCount}","${it.imageUrl}"`
  ).join('\n');

  const csvPath = path.join(__dirname, '../cateloge/new/angadi_kerala_pentonic_win_flair_catalog.csv');
  fs.writeFileSync(csvPath, csvHeader + csvRows, 'utf8');
  console.log(`\nExported complete catalog CSV to: ${csvPath}`);
  console.log(`Successfully processed all ${importedList.length} pen templates into database!`);
}

run();
