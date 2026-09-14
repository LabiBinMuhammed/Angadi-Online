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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        },
        timeout: 20000
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
      req.setTimeout(20000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    } catch (e) {
      reject(e);
    }
  });
}

function cleanNatarajTitle(title, catName) {
  let t = title
    .replace(/&#8211;/g, '-')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!t.toLowerCase().startsWith('nataraj')) {
    t = `Nataraj ${t}`;
  }

  const lower = t.toLowerCase();
  if (catName === 'Pencils' && !lower.includes('pencil') && !lower.includes('lead')) {
    t = `${t} Pencil`;
  } else if (catName === 'Erasers' && !lower.includes('eraser')) {
    t = `${t} Eraser`;
  } else if (catName === 'Sharpeners' && !lower.includes('sharpener')) {
    t = `${t} Sharpener`;
  } else if (catName === 'Scales & Rulers' && !lower.includes('scale') && !lower.includes('ruler')) {
    t = `${t} Scale`;
  } else if (catName === 'Pens' && !lower.includes('pen')) {
    t = `${t} Pen`;
  } else if (catName === 'Stationery Kits' && !lower.includes('kit')) {
    t = `${t} Kit`;
  }

  return t;
}

function getNatarajPricing(catName, cleanName) {
  const n = cleanName.toLowerCase();
  const variants = [];
  let baseUnitId = UNIT_IDS.pcs;
  let basePrice = 10;

  if (catName === 'Pencils') {
    if (n.includes('mechanical')) {
      basePrice = 25;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: '1 Pc', value: 1, unit_id: UNIT_IDS.pcs, price: 25, is_default: true, display_order: 1 });
      variants.push({ label: 'Pack of 2', value: 2, unit_id: UNIT_IDS.pack, price: 48, is_default: false, display_order: 2 });
    } else {
      let boxPrice = 50;
      let singlePrice = 5;
      if (n.includes('colour') || n.includes('color')) {
        boxPrice = 75;
        singlePrice = 8;
      } else if (n.includes('fluro') || n.includes('bold')) {
        boxPrice = 60;
        singlePrice = 6;
      }
      basePrice = singlePrice;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: 'Box of 10', value: 10, unit_id: UNIT_IDS.pack, price: boxPrice, is_default: true, display_order: 1 });
      variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: Math.round(boxPrice * 0.52), is_default: false, display_order: 2 });
      variants.push({ label: '1 Pc', value: 1, unit_id: UNIT_IDS.pcs, price: singlePrice, is_default: false, display_order: 3 });
    }
  } else if (catName === 'Erasers') {
    let singlePrice = 5;
    let packPrice = 20;
    let boxPrice = 80;
    basePrice = singlePrice;
    baseUnitId = UNIT_IDS.pcs;
    variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: packPrice, is_default: true, display_order: 1 });
    variants.push({ label: 'Box of 20', value: 20, unit_id: UNIT_IDS.pack, price: boxPrice, is_default: false, display_order: 2 });
    variants.push({ label: '1 Pc', value: 1, unit_id: UNIT_IDS.pcs, price: singlePrice, is_default: false, display_order: 3 });
  } else if (catName === 'Sharpeners') {
    let singlePrice = 5;
    let packPrice = 25;
    let boxPrice = 90;
    basePrice = singlePrice;
    baseUnitId = UNIT_IDS.pcs;
    variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: packPrice, is_default: true, display_order: 1 });
    variants.push({ label: 'Box of 20', value: 20, unit_id: UNIT_IDS.pack, price: boxPrice, is_default: false, display_order: 2 });
    variants.push({ label: '1 Pc', value: 1, unit_id: UNIT_IDS.pcs, price: singlePrice, is_default: false, display_order: 3 });
  } else if (catName === 'Scales & Rulers') {
    if (n.includes('30') || n.includes('30cm')) {
      basePrice = 20;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: '30 cm Scale (1 Pc)', value: 1, unit_id: UNIT_IDS.pcs, price: 20, is_default: true, display_order: 1 });
      variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: 95, is_default: false, display_order: 2 });
    } else {
      basePrice = 10;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: '15 cm Scale (1 Pc)', value: 1, unit_id: UNIT_IDS.pcs, price: 10, is_default: true, display_order: 1 });
      variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: 45, is_default: false, display_order: 2 });
    }
  } else if (catName === 'Pens') {
    basePrice = 10;
    baseUnitId = UNIT_IDS.pcs;
    variants.push({ label: 'Pack of 5 Pens', value: 5, unit_id: UNIT_IDS.pack, price: 48, is_default: true, display_order: 1 });
    variants.push({ label: '1 Pen', value: 1, unit_id: UNIT_IDS.pcs, price: 10, is_default: false, display_order: 2 });
  } else if (catName === 'Stationery Kits') {
    basePrice = 99;
    baseUnitId = UNIT_IDS.pack;
    variants.push({ label: '1 Complete Kit', value: 1, unit_id: UNIT_IDS.pack, price: 99, is_default: true, display_order: 1 });
  } else if (catName === 'Cutters & Scissors') {
    basePrice = 30;
    baseUnitId = UNIT_IDS.pcs;
    variants.push({ label: '1 Pc', value: 1, unit_id: UNIT_IDS.pcs, price: 30, is_default: true, display_order: 1 });
  } else if (catName === 'Measuring & Geometry') {
    basePrice = 95;
    baseUnitId = UNIT_IDS.pcs;
    variants.push({ label: '1 Geometry Box', value: 1, unit_id: UNIT_IDS.pcs, price: 95, is_default: true, display_order: 1 });
  }

  return { basePrice, baseUnitId, variants };
}

async function run() {
  console.log('================================================================');
  console.log('IMPORTING NATARAJ STATIONERY PRODUCTS AS DEMO TEMPLATES');
  console.log('================================================================');

  const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'nataraj_raw_products.json'), 'utf8'));
  console.log(`Loaded ${products.length} Nataraj products.`);

  const imageUrlMap = new Map();
  const importedList = [];
  let itemCounter = 201;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const cleanProdName = cleanNatarajTitle(p.title, p.categoryName);
    const code = `ANG-STA-${String(itemCounter++).padStart(4, '0')}`;
    const progress = `[${i + 1}/${products.length}]`;

    console.log(`\n${progress} Processing ${cleanProdName} (${code}) [${p.categoryName}]`);

    // 1. Download and Upload Image to Supabase Storage
    let finalImageUrl = p.imageUrl;
    try {
      if (imageUrlMap.has(p.imageUrl)) {
        finalImageUrl = imageUrlMap.get(p.imageUrl);
        console.log(`  -> Using cached CDN image: ${finalImageUrl}`);
      } else if (p.imageUrl) {
        const urlObj = new URL(encodeURI(p.imageUrl));
        const ext = path.extname(urlObj.pathname) || '.png';
        const cleanCat = p.categorySlug.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const cleanSlug = p.slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const storagePath = `nataraj/${cleanCat}_${cleanSlug}${ext}`;

        console.log(`  -> Downloading image: ${p.imageUrl}...`);
        const { buffer, contentType } = await downloadImage(encodeURI(p.imageUrl));

        console.log(`  -> Uploading to Supabase Storage: item-images/${storagePath} (${(buffer.length / 1024).toFixed(1)} KB)...`);
        const { error: upErr } = await supabase.storage
          .from('item-images')
          .upload(storagePath, buffer, {
            upsert: true,
            contentType: contentType
          });

        if (upErr) {
          console.error(`  -> Storage upload warning: ${upErr.message}`);
        } else {
          const { data: pubData } = supabase.storage.from('item-images').getPublicUrl(storagePath);
          finalImageUrl = pubData.publicUrl;
          imageUrlMap.set(p.imageUrl, finalImageUrl);
          console.log(`  -> Uploaded successfully: ${finalImageUrl}`);
        }
      }
    } catch (imgErr) {
      console.error(`  -> Image processing error: ${imgErr.message}`);
    }

    // 2. Pricing, variants, Malayalam
    const { basePrice, baseUnitId, variants } = getNatarajPricing(p.categoryName, cleanProdName);
    const mlName = getStationeryMalayalam(cleanProdName);
    const orderNum = parseInt(code.split('-')[2], 10);

    // 3. Upsert Supabase demo_items by CODE
    try {
      const { data: existing } = await supabase
        .from('demo_items')
        .select('id')
        .eq('code', code)
        .maybeSingle();

      let itemId;
      if (existing) {
        itemId = existing.id;
        await supabase
          .from('demo_items')
          .update({
            name: cleanProdName,
            category_id: STATIONERY_CATEGORY_ID,
            unit_id: baseUnitId,
            sell_mode: 'Fixed',
            default_image: finalImageUrl,
            display_order: orderNum
          })
          .eq('id', itemId);

        await supabase.from('demo_variants').delete().eq('demo_item_id', itemId);
        await supabase.from('demo_sell_config').delete().eq('demo_item_id', itemId);
        await supabase.from('demo_item_translations').delete().eq('demo_item_id', itemId);
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('demo_items')
          .insert({
            name: cleanProdName,
            category_id: STATIONERY_CATEGORY_ID,
            unit_id: baseUnitId,
            sell_mode: 'Fixed',
            default_image: finalImageUrl,
            code: code,
            display_order: orderNum
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
      const ceiling = Math.ceil(basePrice * 1.15);
      await supabase.from('demo_sell_config').insert({
        demo_item_id: itemId,
        sell_mode: 'Fixed',
        base_unit_id: baseUnitId,
        price_per_base_unit: basePrice,
        allow_custom_quantity: false,
        max_price_increase_percent: 15.00,
        max_price_limit: ceiling
      });

      // 6. Insert Variants
      const variantsPayload = variants.map(v => ({
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
        code,
        name: cleanProdName,
        category: p.categoryName,
        mlName,
        basePrice,
        variantsCount: variants.length,
        imageUrl: finalImageUrl
      });
      console.log(`  -> Saved ${cleanProdName} [${mlName}] - Base: ₹${basePrice}, Variants: ${variants.length}`);
    } catch (dbErr) {
      console.error(`  -> Database error on ${cleanProdName}:`, dbErr.message);
    }
  }

  // 7. Export Nataraj catalog CSV
  const csvHeader = 'Code,Name,Category,Malayalam Name,Base Price,Variants Count,Image URL\n';
  const csvRows = importedList.map(item =>
    `"${item.code}","${item.name}","${item.category}","${item.mlName}","${item.basePrice}","${item.variantsCount}","${item.imageUrl}"`
  ).join('\n');

  const csvPath = path.join(__dirname, '../cateloge/new/angadi_kerala_nataraj_stationery_catalog.csv');
  fs.writeFileSync(csvPath, csvHeader + csvRows, 'utf8');
  console.log(`\nExported complete Nataraj catalog CSV to: ${csvPath}`);
  console.log(`Successfully processed all ${importedList.length} Nataraj templates into database!`);
}

run();
