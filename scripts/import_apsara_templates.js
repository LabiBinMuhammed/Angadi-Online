const fs = require('fs');
const path = require('path');
const {
  supabase,
  STATIONERY_CATEGORY_ID,
  UNIT_IDS,
  downloadImage,
  getApsaraMalayalam
} = require('./apsara_processor');

function cleanTitle(rawTitle, categoryName, slug, imgUrl) {
  let t = rawTitle
    .replace(/&#8211;/g, '-')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!t.toLowerCase().startsWith('apsara')) {
    t = `Apsara ${t}`;
  }

  // Handle distinct edition kits
  if (slug === 'marvel-avengers-kit-4' || (imgUrl && imgUrl.includes('avengers-199'))) {
    return 'Apsara Marvel Avengers Kit (₹199 Edition)';
  }
  if (slug === 'marvel-avengers-kit-3' || (imgUrl && imgUrl.includes('avengers-99'))) {
    return 'Apsara Marvel Avengers Kit (₹99 Edition)';
  }
  if (slug === 'marvel-avengers-kit-2' || (imgUrl && imgUrl.includes('Avengers-50'))) {
    return 'Apsara Marvel Avengers Kit (₹50 Edition)';
  }
  if (slug === 'marvel-avengers-kit-1' || (imgUrl && imgUrl.includes('Avengers-30'))) {
    return 'Apsara Marvel Avengers Kit (₹30 Edition)';
  }
  if (slug === 'disney-princess-kit-1' || (imgUrl && imgUrl.includes('disney-199'))) {
    return 'Apsara Disney Princess Kit (₹199 Edition)';
  }
  if (slug === 'disney-princess-kit-2' || (imgUrl && imgUrl.includes('disney-99'))) {
    return 'Apsara Disney Princess Kit (₹99 Edition)';
  }
  if (slug === 'disney-princess-kit-3' || (imgUrl && imgUrl.includes('disney-50'))) {
    return 'Apsara Disney Princess Kit (₹50 Edition)';
  }
  if (slug === 'marvel-spider-man-kit-3' || (imgUrl && imgUrl.includes('Spider-Man-3'))) {
    return 'Apsara Marvel Spider-Man Kit (₹199 Edition)';
  }
  if (slug === 'marvel-spider-man-kit-2' || (imgUrl && imgUrl.includes('Spider-Man-2'))) {
    return 'Apsara Marvel Spider-Man Kit (₹99 Edition)';
  }
  if (slug === 'marvel-spider-man-kit-1' || (imgUrl && imgUrl.includes('Spider-Man-1'))) {
    return 'Apsara Marvel Spider-Man Kit (₹50 Edition)';
  }
  if (categoryName === 'Art Material' && t.includes('Colour Pencils')) {
    return 'Apsara Colour Pencils (Art & Sketch Edition)';
  }
  if (categoryName === 'Art Material' && t.includes('Bi-colour Pencils')) {
    return 'Apsara Bi-colour Pencils (Art Edition)';
  }

  const lower = t.toLowerCase();
  if (categoryName === 'Pencils' && !lower.includes('pencil')) {
    t = `${t} Pencil`;
  } else if (categoryName === 'Erasers' && !lower.includes('eraser')) {
    t = `${t} Eraser`;
  } else if (categoryName === 'Sharpeners' && !lower.includes('sharpener')) {
    t = `${t} Sharpener`;
  } else if (categoryName === 'Pens' && !lower.includes('pen')) {
    t = `${t} Pen`;
  } else if (categoryName === 'Chalks' && !lower.includes('chalk')) {
    t = `${t} Chalk`;
  } else if (categoryName === 'Stationery Kits' && !lower.includes('kit') && !lower.includes('bag') && !lower.includes('pack') && !lower.includes('set')) {
    t = `${t} Kit`;
  }

  return t;
}

function getStationeryPricingAndVariants(catName, cleanName, packSize) {
  const n = cleanName.toLowerCase();
  const variants = [];
  let baseUnitId = UNIT_IDS.pcs;
  let basePrice = 10;

  if (n.includes('₹199 edition')) {
    basePrice = 199;
    baseUnitId = UNIT_IDS.pack;
    variants.push({ label: '1 Complete Kit', value: 1, unit_id: UNIT_IDS.pack, price: 199, is_default: true, display_order: 1 });
    return { basePrice, baseUnitId, variants };
  }
  if (n.includes('₹99 edition')) {
    basePrice = 99;
    baseUnitId = UNIT_IDS.pack;
    variants.push({ label: '1 Complete Kit', value: 1, unit_id: UNIT_IDS.pack, price: 99, is_default: true, display_order: 1 });
    return { basePrice, baseUnitId, variants };
  }
  if (n.includes('₹50 edition')) {
    basePrice = 50;
    baseUnitId = UNIT_IDS.pack;
    variants.push({ label: '1 Mini Kit', value: 1, unit_id: UNIT_IDS.pack, price: 50, is_default: true, display_order: 1 });
    return { basePrice, baseUnitId, variants };
  }
  if (n.includes('₹30 edition')) {
    basePrice = 30;
    baseUnitId = UNIT_IDS.pack;
    variants.push({ label: '1 Mini Pack', value: 1, unit_id: UNIT_IDS.pack, price: 30, is_default: true, display_order: 1 });
    return { basePrice, baseUnitId, variants };
  }

  if (catName === 'Pencils') {
    if (n.includes('mechanical')) {
      basePrice = 30;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: '1 Pc', value: 1, unit_id: UNIT_IDS.pcs, price: 30, is_default: true, display_order: 1 });
      variants.push({ label: 'Pack of 2', value: 2, unit_id: UNIT_IDS.pack, price: 58, is_default: false, display_order: 2 });
    } else {
      let boxPrice = 60;
      let singlePrice = 6;
      if (n.includes('matt magic') || n.includes('platinum') || n.includes('disney') || n.includes('marvel')) {
        boxPrice = 70;
        singlePrice = 7;
      } else if (n.includes('colour') || n.includes('color')) {
        boxPrice = 85;
        singlePrice = 9;
      } else if (n.includes('charcoal') || n.includes('drawing')) {
        boxPrice = 90;
        singlePrice = 10;
      }
      basePrice = singlePrice;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: 'Box of 10', value: 10, unit_id: UNIT_IDS.pack, price: boxPrice, is_default: true, display_order: 1 });
      variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: Math.round(boxPrice * 0.52), is_default: false, display_order: 2 });
      variants.push({ label: '1 Pc', value: 1, unit_id: UNIT_IDS.pcs, price: singlePrice, is_default: false, display_order: 3 });
    }
  } else if (catName === 'Erasers') {
    let singlePrice = 5;
    let pack5Price = 25;
    let boxPrice = 95;
    if (n.includes('mechano')) {
      singlePrice = 10;
      pack5Price = 48;
      boxPrice = 180;
    }
    basePrice = singlePrice;
    baseUnitId = UNIT_IDS.pcs;
    variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: pack5Price, is_default: true, display_order: 1 });
    variants.push({ label: 'Box of 20', value: 20, unit_id: UNIT_IDS.pack, price: boxPrice, is_default: false, display_order: 2 });
    variants.push({ label: '1 Pc', value: 1, unit_id: UNIT_IDS.pcs, price: singlePrice, is_default: false, display_order: 3 });
  } else if (catName === 'Scales & Rulers') {
    if (n.includes('geometry') || n.includes('mathematical')) {
      basePrice = 95;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: '1 Geometry Box', value: 1, unit_id: UNIT_IDS.pcs, price: 95, is_default: true, display_order: 1 });
    } else if (n.includes('30') || n.includes('30cm')) {
      basePrice = 25;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: '30 cm Scale (1 Pc)', value: 1, unit_id: UNIT_IDS.pcs, price: 25, is_default: true, display_order: 1 });
      variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: 115, is_default: false, display_order: 2 });
    } else {
      basePrice = 10;
      baseUnitId = UNIT_IDS.pcs;
      variants.push({ label: '15 cm Scale (1 Pc)', value: 1, unit_id: UNIT_IDS.pcs, price: 10, is_default: true, display_order: 1 });
      variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: 45, is_default: false, display_order: 2 });
      variants.push({ label: 'Box of 20', value: 20, unit_id: UNIT_IDS.pack, price: 175, is_default: false, display_order: 3 });
    }
  } else if (catName === 'Sharpeners') {
    let singlePrice = 5;
    let packPrice = 25;
    let boxPrice = 95;
    if (n.includes('tidy up') || n.includes('spaceball')) {
      singlePrice = 10;
      packPrice = 48;
      boxPrice = 180;
    }
    basePrice = singlePrice;
    baseUnitId = UNIT_IDS.pcs;
    variants.push({ label: 'Pack of 5', value: 5, unit_id: UNIT_IDS.pack, price: packPrice, is_default: true, display_order: 1 });
    variants.push({ label: 'Box of 20', value: 20, unit_id: UNIT_IDS.pack, price: boxPrice, is_default: false, display_order: 2 });
    variants.push({ label: '1 Pc', value: 1, unit_id: UNIT_IDS.pcs, price: singlePrice, is_default: false, display_order: 3 });
  } else if (catName === 'Pens') {
    basePrice = 10;
    baseUnitId = UNIT_IDS.pcs;
    variants.push({ label: 'Pack of 5 Pens', value: 5, unit_id: UNIT_IDS.pack, price: 50, is_default: true, display_order: 1 });
    variants.push({ label: '1 Pen', value: 1, unit_id: UNIT_IDS.pcs, price: 10, is_default: false, display_order: 2 });
  } else if (catName === 'Notebooks') {
    let singleBookPrice = 55;
    let pack6Price = 310;
    if (n.includes('drawing') || n.includes('scrap')) {
      singleBookPrice = 45;
      pack6Price = 250;
    } else if (n.includes('graph') || n.includes('practical')) {
      singleBookPrice = 50;
      pack6Price = 280;
    }
    basePrice = singleBookPrice;
    baseUnitId = UNIT_IDS.pcs;
    variants.push({ label: '1 Book', value: 1, unit_id: UNIT_IDS.pcs, price: singleBookPrice, is_default: true, display_order: 1 });
    variants.push({ label: 'Pack of 6 Books', value: 6, unit_id: UNIT_IDS.pack, price: pack6Price, is_default: false, display_order: 2 });
  } else if (catName === 'Chalks') {
    basePrice = 45;
    baseUnitId = UNIT_IDS.pack;
    variants.push({ label: 'Box of 50 Chalks', value: 50, unit_id: UNIT_IDS.pack, price: 45, is_default: true, display_order: 1 });
    variants.push({ label: 'Box of 100 Chalks', value: 100, unit_id: UNIT_IDS.pack, price: 85, is_default: false, display_order: 2 });
  } else if (catName === 'Art Material') {
    let artPrice = 45;
    if (n.includes('crayons') || n.includes('crayon')) {
      artPrice = n.includes('jumbo') ? 60 : 35;
    } else if (n.includes('oil pastels') || n.includes('oil pastel')) {
      artPrice = 55;
    } else if (n.includes('poster colour') || n.includes('poster colours')) {
      artPrice = 120;
    } else if (n.includes('water colour') || n.includes('water colours')) {
      artPrice = 75;
    } else if (n.includes('brush pen') || n.includes('brush pens')) {
      artPrice = 150;
    } else if (n.includes('sketch pen') || n.includes('sketch pens')) {
      artPrice = 40;
    } else if (n.includes('brush') || n.includes('painting brush')) {
      artPrice = 55;
    } else if (n.includes('clay') || n.includes('dough')) {
      artPrice = 65;
    }
    basePrice = artPrice;
    baseUnitId = UNIT_IDS.pack;
    variants.push({ label: '1 Pack / Set', value: 1, unit_id: UNIT_IDS.pack, price: artPrice, is_default: true, display_order: 1 });
  } else if (catName === 'Stationery Kits') {
    let kitPrice = 149;
    if (n.includes('scholar') || n.includes('ace')) kitPrice = 99;
    else if (n.includes('art explorer') || n.includes('champion')) kitPrice = 179;
    else if (n.includes('celebration') || n.includes('bag')) kitPrice = 249;
    else if (n.includes('diy') || n.includes('craft')) kitPrice = 199;
    basePrice = kitPrice;
    baseUnitId = UNIT_IDS.pack;
    variants.push({ label: '1 Kit', value: 1, unit_id: UNIT_IDS.pack, price: kitPrice, is_default: true, display_order: 1 });
  }

  return { basePrice, baseUnitId, variants };
}

function getCustomMalayalam(cleanProdName, categoryName) {
  let ml = getApsaraMalayalam(cleanProdName, categoryName);
  // Add edition translations
  ml = ml.replace(/₹199 edition/gi, '(₹199 എഡിഷൻ)')
         .replace(/₹99 edition/gi, '(₹99 എഡിഷൻ)')
         .replace(/₹50 edition/gi, '(₹50 എഡിഷൻ)')
         .replace(/₹30 edition/gi, '(₹30 എഡിഷൻ)')
         .replace(/art & sketch edition/gi, '(ആർട്ട് & സ്കെച്ച്)')
         .replace(/art edition/gi, '(ആർട്ട് എഡിഷൻ)');
  return ml;
}

async function run() {
  console.log('================================================================');
  console.log('IMPORTING ALL 121 APSARA STATIONERY PRODUCTS WITH PRECISE EDITIONS');
  console.log('================================================================');

  const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'apsara_enriched_products.json'), 'utf8'));
  console.log(`Loaded ${products.length} Apsara enriched products.`);

  const imageUrlMap = new Map();
  const importedList = [];
  let itemCounter = 1;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const cleanProdName = cleanTitle(p.title, p.categoryName, p.slug, p.imageUrl);
    const code = `ANG-STA-${String(itemCounter++).padStart(4, '0')}`;
    const progress = `[${i + 1}/${products.length}]`;

    console.log(`\n${progress} Processing ${cleanProdName} (${code}) [${p.categoryName}]`);

    // 1. Image URL (Already uploaded or upload if needed)
    let finalImageUrl = p.imageUrl;
    try {
      if (imageUrlMap.has(p.imageUrl)) {
        finalImageUrl = imageUrlMap.get(p.imageUrl);
        console.log(`  -> Using cached CDN image: ${finalImageUrl}`);
      } else {
        const urlObj = new URL(encodeURI(p.imageUrl));
        const ext = path.extname(urlObj.pathname) || '.png';
        const cleanCat = p.categorySlug.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const cleanSlug = p.slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const storagePath = `apsara/${cleanCat}_${cleanSlug}${ext}`;

        const { data: pubData } = supabase.storage.from('item-images').getPublicUrl(storagePath);
        finalImageUrl = pubData.publicUrl;
        imageUrlMap.set(p.imageUrl, finalImageUrl);
        console.log(`  -> Supabase CDN image: ${finalImageUrl}`);
      }
    } catch (imgErr) {
      console.error(`  -> Image processing error: ${imgErr.message}`);
    }

    // 2. Determine Pricing, Units and Variants
    const { basePrice, baseUnitId, variants } = getStationeryPricingAndVariants(p.categoryName, cleanProdName, p.packSize);
    const mlName = getCustomMalayalam(cleanProdName, p.categoryName);
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

  // 7. Export CSV
  const csvHeader = 'Code,Name,Category,Malayalam Name,Base Price,Variants Count,Image URL\n';
  const csvRows = importedList.map(item =>
    `"${item.code}","${item.name}","${item.category}","${item.mlName}","${item.basePrice}","${item.variantsCount}","${item.imageUrl}"`
  ).join('\n');

  const csvPath = path.join(__dirname, '../cateloge/new/angadi_kerala_apsara_stationery_catalog.csv');
  fs.writeFileSync(csvPath, csvHeader + csvRows, 'utf8');
  console.log(`\nExported complete Apsara catalog CSV to: ${csvPath}`);
  console.log(`Successfully processed all ${importedList.length} Apsara templates into database!`);
}

run();
