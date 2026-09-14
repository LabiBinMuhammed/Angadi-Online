const fs = require('fs');
const path = require('path');
const {
  supabase,
  downloadImage,
  CAT_IDS,
  UNIT_IDS,
  getEliteMalayalam
} = require('./elite_processor');

async function run() {
  console.log('================================================================');
  console.log('IMPORTING ELITE FOODS PRODUCTS AS DEMO TEMPLATES ACROSS CATEGORIES');
  console.log('================================================================');

  const products = JSON.parse(fs.readFileSync('scripts/elite_products.json', 'utf8'));
  console.log(`Loaded ${products.length} Elite products across 9 ranges.`);

  let bakeryCounter = 251;
  let biscuitCounter = 23;
  let riceCounter = 1278;
  let dryCounter = 13;
  let dessertCounter = 379;
  let beverageCounter = 1273;

  const imageUrlMap = new Map();
  let successCount = 0;
  let failCount = 0;

  const csvRows = [
    ['Product Name', 'Category', 'Code', 'Malayalam Name', 'Variants', 'Selling Price', 'Original Price (MRP)', 'Image URL']
  ];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const nLower = p.rawName.toLowerCase();
    const page = p.pageName;

    let categoryId = CAT_IDS.Bakery;
    let categoryName = 'Bakery';
    let code = '';
    let variants = [];
    let baseUnitId = UNIT_IDS.g;
    let basePrice = 50;

    // Category and variant assignment based on page and product type
    if (page === 'Cake') {
      categoryId = CAT_IDS.Bakery;
      categoryName = 'Bakery';
      code = `ANG-BAK-${String(bakeryCounter++).padStart(4, '0')}`;
      if (nLower.includes('cup')) {
        variants.push({ label: '60 g', value: 60, unit_id: UNIT_IDS.g, price: 20, is_default: true, display_order: 1 });
        basePrice = 20;
      } else if (nLower.includes('plum')) {
        variants.push({ label: '330 g', value: 330, unit_id: UNIT_IDS.g, price: 120, is_default: true, display_order: 1 });
        variants.push({ label: '800 g', value: 800, unit_id: UNIT_IDS.g, price: 260, is_default: false, display_order: 2 });
        basePrice = 120;
      } else {
        variants.push({ label: '140 g', value: 140, unit_id: UNIT_IDS.g, price: 45, is_default: true, display_order: 1 });
        variants.push({ label: '200 g', value: 200, unit_id: UNIT_IDS.g, price: 60, is_default: false, display_order: 2 });
        basePrice = 45;
      }
    } else if (page === 'Bread & Bun') {
      categoryId = CAT_IDS.Bakery;
      categoryName = 'Bakery';
      code = `ANG-BAK-${String(bakeryCounter++).padStart(4, '0')}`;
      if (nLower.includes('bun') || nLower.includes('burger')) {
        variants.push({ label: '150 g', value: 150, unit_id: UNIT_IDS.g, price: 30, is_default: true, display_order: 1 });
        basePrice = 30;
      } else {
        variants.push({ label: '400 g', value: 400, unit_id: UNIT_IDS.g, price: 45, is_default: true, display_order: 1 });
        basePrice = 45;
      }
    } else if (page === 'More Health Range') {
      if (nLower.includes('bread')) {
        categoryId = CAT_IDS.Bakery;
        categoryName = 'Bakery';
        code = `ANG-BAK-${String(bakeryCounter++).padStart(4, '0')}`;
        variants.push({ label: '400 g', value: 400, unit_id: UNIT_IDS.g, price: 55, is_default: true, display_order: 1 });
        basePrice = 55;
      } else {
        categoryId = CAT_IDS.DryGoodsCereals;
        categoryName = 'Dry Goods & Cereals';
        code = `ANG-DRY-${String(dryCounter++).padStart(4, '0')}`;
        variants.push({ label: '500 g', value: 500, unit_id: UNIT_IDS.g, price: 85, is_default: true, display_order: 1 });
        variants.push({ label: '1 kg', value: 1, unit_id: UNIT_IDS.kg, price: 160, is_default: false, display_order: 2 });
        basePrice = 85;
      }
    } else if (page === 'Baking Rusk') {
      categoryId = CAT_IDS.BiscuitsCookies;
      categoryName = 'Biscuits & Cookies';
      code = `ANG-BIS-${String(biscuitCounter++).padStart(4, '0')}`;
      variants.push({ label: '182 g', value: 182, unit_id: UNIT_IDS.g, price: 40, is_default: true, display_order: 1 });
      variants.push({ label: '300 g', value: 300, unit_id: UNIT_IDS.g, price: 65, is_default: false, display_order: 2 });
      basePrice = 40;
    } else if (page === 'Snacks') {
      categoryId = CAT_IDS.BiscuitsCookies;
      categoryName = 'Biscuits & Cookies';
      code = `ANG-BIS-${String(biscuitCounter++).padStart(4, '0')}`;
      variants.push({ label: '75 g', value: 75, unit_id: UNIT_IDS.g, price: 35, is_default: true, display_order: 1 });
      variants.push({ label: '150 g', value: 150, unit_id: UNIT_IDS.g, price: 65, is_default: false, display_order: 2 });
      basePrice = 35;
    } else if (page === 'Wheat Range') {
      categoryId = CAT_IDS.RiceAttaFlours;
      categoryName = 'Rice, Atta, Flours & Mixes';
      code = `ANG-RIC-${String(riceCounter++).padStart(4, '0')}`;
      if (nLower.includes('atta')) {
        variants.push({ label: '1 kg', value: 1, unit_id: UNIT_IDS.kg, price: 60, is_default: true, display_order: 1 });
        variants.push({ label: '5 kg', value: 5, unit_id: UNIT_IDS.kg, price: 280, is_default: false, display_order: 2 });
        baseUnitId = UNIT_IDS.kg;
        basePrice = 60;
      } else if (nLower.includes('vermicelli')) {
        variants.push({ label: '200 g', value: 200, unit_id: UNIT_IDS.g, price: 22, is_default: true, display_order: 1 });
        variants.push({ label: '500 g', value: 500, unit_id: UNIT_IDS.g, price: 48, is_default: false, display_order: 2 });
        basePrice = 22;
      } else {
        variants.push({ label: '500 g', value: 500, unit_id: UNIT_IDS.g, price: 38, is_default: true, display_order: 1 });
        variants.push({ label: '1 kg', value: 1, unit_id: UNIT_IDS.kg, price: 70, is_default: false, display_order: 2 });
        basePrice = 38;
      }
    } else if (page === 'Rice Range' || page === 'Flour') {
      categoryId = CAT_IDS.RiceAttaFlours;
      categoryName = 'Rice, Atta, Flours & Mixes';
      code = `ANG-RIC-${String(riceCounter++).padStart(4, '0')}`;
      variants.push({ label: '500 g', value: 500, unit_id: UNIT_IDS.g, price: 45, is_default: true, display_order: 1 });
      variants.push({ label: '1 kg', value: 1, unit_id: UNIT_IDS.kg, price: 85, is_default: false, display_order: 2 });
      basePrice = 45;
    } else if (page === 'Instant Mix') {
      if (nLower.includes('kappi') || nLower.includes('coffee')) {
        categoryId = CAT_IDS.Beverages;
        categoryName = 'Beverages';
        code = `ANG-BEV-${String(beverageCounter++).padStart(4, '0')}`;
        variants.push({ label: '100 g', value: 100, unit_id: UNIT_IDS.g, price: 45, is_default: true, display_order: 1 });
        variants.push({ label: '200 g', value: 200, unit_id: UNIT_IDS.g, price: 85, is_default: false, display_order: 2 });
        basePrice = 45;
      } else if (nLower.includes('payasam') || nLower.includes('palada')) {
        categoryId = CAT_IDS.DessertsIceCream;
        categoryName = 'Desserts & Ice Creams';
        code = `ANG-DES-${String(dessertCounter++).padStart(4, '0')}`;
        variants.push({ label: '200 g', value: 200, unit_id: UNIT_IDS.g, price: 55, is_default: true, display_order: 1 });
        variants.push({ label: '300 g', value: 300, unit_id: UNIT_IDS.g, price: 75, is_default: false, display_order: 2 });
        basePrice = 55;
      } else {
        categoryId = CAT_IDS.RiceAttaFlours;
        categoryName = 'Rice, Atta, Flours & Mixes';
        code = `ANG-RIC-${String(riceCounter++).padStart(4, '0')}`;
        variants.push({ label: '200 g', value: 200, unit_id: UNIT_IDS.g, price: 35, is_default: true, display_order: 1 });
        variants.push({ label: '500 g', value: 500, unit_id: UNIT_IDS.g, price: 70, is_default: false, display_order: 2 });
        basePrice = 35;
      }
    }

    const prodName = p.fullName;
    const progress = `[${i + 1}/${products.length}]`;
    console.log(`\n${progress} Processing ${prodName} (${code}) -> Category: ${categoryName}`);

    // 1. Download and Upload Image to Supabase Storage
    let finalImageUrl = p.imageUrl;
    try {
      if (imageUrlMap.has(p.imageUrl)) {
        finalImageUrl = imageUrlMap.get(p.imageUrl);
        console.log(`  -> Using cached CDN image: ${finalImageUrl}`);
      } else {
        const urlObj = new URL(encodeURI(p.imageUrl));
        const ext = path.extname(urlObj.pathname) || '.png';
        const rawBasename = path.basename(urlObj.pathname, ext);
        const cleanBasename = `${page.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${rawBasename.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
        const storagePath = `elite/${cleanBasename}${ext}`;

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
      console.error(`  -> Image download error: ${imgErr.message}`);
    }

    // 2. Insert into Supabase demo_items
    try {
      const mlName = getEliteMalayalam(prodName);

      const { data: existing } = await supabase
        .from('demo_items')
        .select('id')
        .or(`code.eq.${code},name.eq."${prodName.replace(/"/g, '')}"`)
        .maybeSingle();

      let itemId;
      const orderNum = parseInt(code.split('-')[2], 10);

      if (existing) {
        console.log(`  -> Updating existing item ID: ${existing.id}`);
        itemId = existing.id;
        await supabase
          .from('demo_items')
          .update({
            name: prodName,
            category_id: categoryId,
            unit_id: baseUnitId,
            sell_mode: 'Fixed',
            default_image: finalImageUrl,
            code: code,
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
            name: prodName,
            category_id: categoryId,
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
        console.log(`  -> Inserted demo_item ID: ${itemId}`);
      }

      // 3. Insert Malayalam Translation
      await supabase.from('demo_item_translations').insert({
        demo_item_id: itemId,
        language_code: 'ml',
        name: mlName
      });
      console.log(`  -> Malayalam: "${mlName}"`);

      // 4. Insert Sell Config
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

      // 5. Insert Variants
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
      console.log(`  -> Inserted ${variantsPayload.length} variant(s): ${variants.map(v => `${v.label} (₹${v.price})`).join(', ')}`);

      // Add to CSV
      const vLabels = variants.map(v => v.label).join('; ');
      const vPrices = variants.map(v => `₹${v.price}`).join('; ');
      csvRows.push([
        `"${prodName.replace(/"/g, '""')}"`,
        `"${categoryName}"`,
        `"${code}"`,
        `"${mlName.replace(/"/g, '""')}"`,
        `"${vLabels}"`,
        `"${vPrices}"`,
        `"${vPrices}"`,
        `"${finalImageUrl}"`
      ]);

      successCount++;
    } catch (dbErr) {
      console.error(`  -> Database error: ${dbErr.message}`);
      failCount++;
    }
  }

  // Write CSV
  const csvContent = csvRows.map(r => r.join(',')).join('\n');
  const csvPath = 'cateloge/new/angadi_kerala_elite_foods_catalog.csv';
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`\n✓ Saved CSV master catalog to ${csvPath}`);

  console.log('\n================================================================');
  console.log(`IMPORT FINISHED: ${successCount} succeeded, ${failCount} failed.`);
  console.log('================================================================');
}

run().catch(console.error);
