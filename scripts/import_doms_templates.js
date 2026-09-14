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

const FALLBACK_DOMS_IMAGES = {
  'doms-compass': 'https://domsindia.com/wp-content/uploads/2025/04/1.webp',
  'doms-mathematical-set': 'https://domsindia.com/wp-content/uploads/2025/10/DOMS-Product-photo-2-scaled.webp',
  'doms-scales-15-cms': 'https://domsindia.com/wp-content/uploads/2025/04/49-scaled.webp',
  'doms-scales-20-cms': 'https://domsindia.com/wp-content/uploads/2025/04/92-scaled.webp',
  'doms-scales-30-cms': 'https://domsindia.com/wp-content/uploads/2025/04/52-scaled.webp'
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

function cleanDomsTitle(title, catName, slug, brand, seenTitles) {
  let t = title
    .replace(/&#8211;/g, '-')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // Brand prefix
  if (brand === 'DOMS Amariz') {
    if (!t.toLowerCase().startsWith('doms amariz')) {
      t = t.toLowerCase().startsWith('amariz') ? `DOMS ${t}` : `DOMS Amariz ${t}`;
    }
  } else {
    if (!t.toLowerCase().startsWith('doms')) {
      t = `DOMS ${t}`;
    }
  }

  // Handle repeated titles by inspecting slug
  if (seenTitles.has(t)) {
    const count = (seenTitles.get(t) || 1) + 1;
    seenTitles.set(t, count);

    // Extract helpful token from slug
    const slugParts = slug.split('-');
    const last = slugParts[slugParts.length - 1];
    if (/^\d+$/.test(last)) {
      t = `${t} (Edition ${last})`;
    } else if (slug.includes('modern-trade')) {
      t = `${t} (Modern Trade Pack)`;
    } else if (slug.includes('pack')) {
      t = `${t} (Pack)`;
    } else {
      t = `${t} (Series ${count})`;
    }
  } else {
    seenTitles.set(t, 1);
  }

  return t;
}

function getDomsPricing(catName, cleanName, explicitPrice) {
  if (explicitPrice && explicitPrice > 0) {
    const basePrice = Math.round(explicitPrice);
    const variants = [
      { label: '1 Standard Pack', value: 1, unit_id: UNIT_IDS.pack, price: basePrice, is_default: true, display_order: 1 }
    ];
    return { basePrice, baseUnitId: UNIT_IDS.pack, variants };
  }

  const n = cleanName.toLowerCase();
  const variants = [];
  let baseUnitId = UNIT_IDS.pcs;
  let basePrice = 10;

  if (catName.includes('Pens') || catName.includes('Writing')) {
    let singlePrice = 10;
    let packPrice = 50;
    if (n.includes('inxjet') || n.includes('roller')) {
      singlePrice = 25;
      packPrice = 120;
    } else if (n.includes('gel')) {
      singlePrice = 15;
      packPrice = 70;
    }
    basePrice = singlePrice;
    baseUnitId = UNIT_IDS.pcs;
    variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: packPrice, is_default: true, display_order: 1 });
    variants.push({ label: '1 Pen', value: 1, unit_id: UNIT_IDS.pcs, price: singlePrice, is_default: false, display_order: 2 });
  } else if (catName.includes('Pencils')) {
    if (n.includes('eraser')) {
      basePrice = 5;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: 25, is_default: true, display_order: 1 });
      variants.push({ label: 'Box of 20', value: 20, unit_id: UNIT_IDS.pack, price: 95, is_default: false, display_order: 2 });
      variants.push({ label: '1 Pc', value: 1, unit_id: UNIT_IDS.pcs, price: 5, is_default: false, display_order: 3 });
    } else if (n.includes('sharpener')) {
      basePrice = 5;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: 25, is_default: true, display_order: 1 });
      variants.push({ label: 'Box of 20', value: 20, unit_id: UNIT_IDS.pack, price: 95, is_default: false, display_order: 2 });
      variants.push({ label: '1 Pc', value: 1, unit_id: UNIT_IDS.pcs, price: 5, is_default: false, display_order: 3 });
    } else {
      let boxPrice = 60;
      let singlePrice = 6;
      if (n.includes('groove') || n.includes('neon') || n.includes('fusion')) {
        boxPrice = 70;
        singlePrice = 7;
      }
      basePrice = singlePrice;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: 'Box of 10', value: 10, unit_id: UNIT_IDS.pack, price: boxPrice, is_default: true, display_order: 1 });
      variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: Math.round(boxPrice * 0.52), is_default: false, display_order: 2 });
      variants.push({ label: '1 Pc', value: 1, unit_id: UNIT_IDS.pcs, price: singlePrice, is_default: false, display_order: 3 });
    }
  } else if (catName.includes('Paper') || catName.includes('Notebook')) {
    let singlePrice = 55;
    let pack6Price = 310;
    if (n.includes('drawing') || n.includes('scrap')) {
      singlePrice = 45;
      pack6Price = 250;
    } else if (n.includes('graph') || n.includes('practical')) {
      singlePrice = 50;
      pack6Price = 280;
    }
    basePrice = singlePrice;
    baseUnitId = UNIT_IDS.pcs;
    variants.push({ label: '1 Book', value: 1, unit_id: UNIT_IDS.pcs, price: singlePrice, is_default: true, display_order: 1 });
    variants.push({ label: 'Pack of 6 Books', value: 6, unit_id: UNIT_IDS.pack, price: pack6Price, is_default: false, display_order: 2 });
  } else if (catName.includes('Mathematical')) {
    if (n.includes('scale 30') || n.includes('30 cms')) {
      basePrice = 20;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: '30 cm Scale (1 Pc)', value: 1, unit_id: UNIT_IDS.pcs, price: 20, is_default: true, display_order: 1 });
    } else if (n.includes('scale')) {
      basePrice = 10;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: '15 cm Scale (1 Pc)', value: 1, unit_id: UNIT_IDS.pcs, price: 10, is_default: true, display_order: 1 });
      variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: 45, is_default: false, display_order: 2 });
    } else if (n.includes('compass') || n.includes('protractor')) {
      basePrice = 35;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: '1 Pc', value: 1, unit_id: UNIT_IDS.pcs, price: 35, is_default: true, display_order: 1 });
    } else {
      basePrice = 95;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: '1 Geometry Box', value: 1, unit_id: UNIT_IDS.pcs, price: 95, is_default: true, display_order: 1 });
    }
  } else if (catName.includes('Markers') || catName.includes('Highlighters')) {
    basePrice = 25;
    baseUnitId = UNIT_IDS.pcs;
    variants.push({ label: '1 Marker / Highlighter', value: 1, unit_id: UNIT_IDS.pcs, price: 25, is_default: true, display_order: 1 });
    variants.push({ label: 'Pack of 4 / 5', value: 5, unit_id: UNIT_IDS.pack, price: 110, is_default: false, display_order: 2 });
  } else if (catName.includes('Gifting') || catName.includes('Kits')) {
    let kitPrice = 149;
    if (n.includes('smart') || n.includes('all the best')) kitPrice = 99;
    else if (n.includes('art strokes') || n.includes('carnival')) kitPrice = 199;
    else if (n.includes('champions') || n.includes('super')) kitPrice = 299;
    basePrice = kitPrice;
    baseUnitId = UNIT_IDS.pack;
    variants.push({ label: '1 Complete Kit', value: 1, unit_id: UNIT_IDS.pack, price: kitPrice, is_default: true, display_order: 1 });
  } else if (catName.includes('Drawing') || catName.includes('Colouring')) {
    let artPrice = 45;
    if (n.includes('brush pens')) artPrice = 150;
    else if (n.includes('oil pastels')) artPrice = 65;
    else if (n.includes('poster colour')) artPrice = 120;
    else if (n.includes('water colour')) artPrice = 75;
    else if (n.includes('plastic crayons') || n.includes('wax crayons')) artPrice = 40;
    basePrice = artPrice;
    baseUnitId = UNIT_IDS.pack;
    variants.push({ label: '1 Set / Pack', value: 1, unit_id: UNIT_IDS.pack, price: artPrice, is_default: true, display_order: 1 });
  } else if (catName.includes('Crafts') || catName.includes('Hobbyist')) {
    let craftPrice = 50;
    if (n.includes('modelling dough') || n.includes('clay')) craftPrice = 65;
    else if (n.includes('glue stick')) craftPrice = 30;
    basePrice = craftPrice;
    baseUnitId = UNIT_IDS.pcs;
    variants.push({ label: '1 Unit', value: 1, unit_id: UNIT_IDS.pcs, price: craftPrice, is_default: true, display_order: 1 });
  } else if (catName.includes('Fine Art')) {
    basePrice = 250;
    baseUnitId = UNIT_IDS.pack;
    variants.push({ label: '1 Premium Art Unit', value: 1, unit_id: UNIT_IDS.pack, price: 250, is_default: true, display_order: 1 });
  }

  return { basePrice, baseUnitId, variants };
}

async function run() {
  console.log('================================================================');
  console.log('IMPORTING DOMS & AMARIZ STATIONERY PRODUCTS AS DEMO TEMPLATES');
  console.log('================================================================');

  const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'doms_raw_products.json'), 'utf8'));
  console.log(`Loaded ${products.length} DOMS & Amariz products.`);

  const imageUrlMap = new Map();
  const seenTitles = new Map();
  const importedList = [];
  let itemCounter = 301;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const cleanProdName = cleanDomsTitle(p.title, p.categoryName, p.slug, p.brand, seenTitles);
    const code = `ANG-STA-${String(itemCounter++).padStart(4, '0')}`;
    const progress = `[${i + 1}/${products.length}]`;

    // Check image URL (or fallback)
    let rawImageUrl = p.imageUrl || FALLBACK_DOMS_IMAGES[p.slug];

    let finalImageUrl = rawImageUrl;
    try {
      if (rawImageUrl) {
        if (imageUrlMap.has(rawImageUrl)) {
          finalImageUrl = imageUrlMap.get(rawImageUrl);
        } else {
          const urlObj = new URL(encodeURI(rawImageUrl));
          const ext = path.extname(urlObj.pathname) || '.png';
          const cleanCat = p.categorySlug.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const cleanSlug = p.slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const storagePath = `doms/${cleanCat}_${cleanSlug}${ext}`;

          const { buffer, contentType } = await downloadImage(encodeURI(rawImageUrl));

          const { error: upErr } = await supabase.storage
            .from('item-images')
            .upload(storagePath, buffer, {
              upsert: true,
              contentType: contentType
            });

          if (upErr) {
            console.error(`  -> Upload warning on ${p.slug}: ${upErr.message}`);
          } else {
            const { data: pubData } = supabase.storage.from('item-images').getPublicUrl(storagePath);
            finalImageUrl = pubData.publicUrl;
            imageUrlMap.set(rawImageUrl, finalImageUrl);
          }
        }
      }
    } catch (imgErr) {
      console.error(`  -> Image error on ${p.slug}: ${imgErr.message}`);
    }

    // Pricing & Malayalam
    const { basePrice, baseUnitId, variants } = getDomsPricing(p.categoryName, cleanProdName, p.price);
    const mlName = getStationeryMalayalam(cleanProdName);
    const orderNum = parseInt(code.split('-')[2], 10);

    // Upsert into Supabase demo_items by CODE
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

      // Insert Malayalam translation
      await supabase.from('demo_item_translations').insert({
        demo_item_id: itemId,
        language_code: 'ml',
        name: mlName
      });

      // Insert sell config
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

      // Insert variants
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

      if ((i + 1) % 25 === 0 || i === products.length - 1) {
        console.log(`${progress} Imported ${cleanProdName} (${code}) [${mlName}] - Base: ₹${basePrice}`);
      }
    } catch (dbErr) {
      console.error(`  -> DB error on ${cleanProdName}:`, dbErr.message);
    }
  }

  // Export CSV
  const csvHeader = 'Code,Name,Category,Malayalam Name,Base Price,Variants Count,Image URL\n';
  const csvRows = importedList.map(item =>
    `"${item.code}","${item.name}","${item.category}","${item.mlName}","${item.basePrice}","${item.variantsCount}","${item.imageUrl}"`
  ).join('\n');

  const csvPath = path.join(__dirname, '../cateloge/new/angadi_kerala_doms_stationery_catalog.csv');
  fs.writeFileSync(csvPath, csvHeader + csvRows, 'utf8');
  console.log(`\nExported complete DOMS catalog CSV to: ${csvPath}`);
  console.log(`Successfully processed all ${importedList.length} DOMS & Amariz templates into database!`);
}

run();
