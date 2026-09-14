const fs = require('fs');
const path = require('path');
const {
  supabase,
  downloadImage,
  processSkeiProduct,
  processVestaProduct
} = require('./icecream_processor');

async function run() {
  console.log('================================================================');
  console.log('IMPORTING SKEI & VESTA ICE CREAM PRODUCTS AS DEMO TEMPLATES');
  console.log('================================================================');

  const rawData = JSON.parse(fs.readFileSync('scripts/icecream_products_audited.json', 'utf8'));
  const skeiRaw = rawData.skei;
  const vestaRaw = rawData.vesta;

  console.log(`Loaded ${skeiRaw.length} Skei products and ${vestaRaw.length} Vesta products.`);

  // Starting code number after existing ANG-DES-0191
  const START_CODE = 201;

  // Process all products
  const allProducts = [];
  skeiRaw.forEach((p, idx) => {
    allProducts.push(processSkeiProduct(p, idx, START_CODE));
  });

  const vestaStartCode = START_CODE + skeiRaw.length;
  vestaRaw.forEach((p, idx) => {
    allProducts.push(processVestaProduct(p, idx, vestaStartCode));
  });

  console.log(`Total processed products to import: ${allProducts.length}`);

  // Image upload cache to prevent re-uploading duplicate URLs
  const imageUrlMap = new Map();

  let successCount = 0;
  let failCount = 0;

  const csvRows = [
    ['Product Name', 'Category', 'Code', 'Malayalam Name', 'Variants', 'Selling Price', 'Original Price (MRP)', 'Image URL']
  ];

  for (let i = 0; i < allProducts.length; i++) {
    const prod = allProducts[i];
    const progress = `[${i + 1}/${allProducts.length}]`;
    console.log(`\n${progress} Processing ${prod.name} (${prod.code})...`);

    // 1. Download and Upload Image to Supabase Storage
    let finalImageUrl = prod.imageUrl;
    try {
      if (imageUrlMap.has(prod.imageUrl)) {
        finalImageUrl = imageUrlMap.get(prod.imageUrl);
        console.log(`  -> Using cached CDN image: ${finalImageUrl}`);
      } else {
        const urlObj = new URL(prod.imageUrl);
        const ext = path.extname(urlObj.pathname) || '.jpg';
        const rawBasename = path.basename(urlObj.pathname, ext);
        const cleanBasename = rawBasename.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        const folder = prod.brand.toLowerCase();
        const storagePath = `${folder}/${cleanBasename}${ext}`;

        console.log(`  -> Downloading image from ${prod.imageUrl}...`);
        const { buffer, contentType } = await downloadImage(prod.imageUrl);

        console.log(`  -> Uploading to Supabase Storage: item-images/${storagePath} (${(buffer.length / 1024).toFixed(1)} KB)...`);
        const { error: upErr } = await supabase.storage
          .from('item-images')
          .upload(storagePath, buffer, {
            upsert: true,
            contentType: contentType
          });

        if (upErr) {
          console.error(`  -> Storage upload warning: ${upErr.message}. Using direct URL.`);
        } else {
          const { data: pubData } = supabase.storage.from('item-images').getPublicUrl(storagePath);
          finalImageUrl = pubData.publicUrl;
          imageUrlMap.set(prod.imageUrl, finalImageUrl);
          console.log(`  -> Uploaded successfully: ${finalImageUrl}`);
        }
      }
    } catch (imgErr) {
      console.error(`  -> Image processing error: ${imgErr.message}`);
    }

    // 2. Insert into Supabase demo_items
    try {
      // Check if item with this code or name already exists
      const { data: existing } = await supabase
        .from('demo_items')
        .select('id')
        .or(`code.eq.${prod.code},name.eq."${prod.name.replace(/"/g, '')}"`)
        .maybeSingle();

      let itemId;

      if (existing) {
        console.log(`  -> Item already exists (ID: ${existing.id}), updating...`);
        itemId = existing.id;
        await supabase
          .from('demo_items')
          .update({
            name: prod.name,
            category_id: prod.categoryId,
            unit_id: prod.baseUnitId,
            sell_mode: 'Fixed',
            default_image: finalImageUrl,
            code: prod.code,
            display_order: parseInt(prod.code.split('-')[2])
          })
          .eq('id', itemId);

        // Delete old linked records to refresh cleanly
        await supabase.from('demo_variants').delete().eq('demo_item_id', itemId);
        await supabase.from('demo_sell_config').delete().eq('demo_item_id', itemId);
        await supabase.from('demo_item_translations').delete().eq('demo_item_id', itemId);
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('demo_items')
          .insert({
            name: prod.name,
            category_id: prod.categoryId,
            unit_id: prod.baseUnitId,
            sell_mode: 'Fixed',
            default_image: finalImageUrl,
            code: prod.code,
            display_order: parseInt(prod.code.split('-')[2])
          })
          .select('id')
          .single();

        if (insertErr) throw insertErr;
        itemId = inserted.id;
        console.log(`  -> Inserted demo_item (ID: ${itemId})`);
      }

      // 3. Insert Malayalam Translation
      await supabase.from('demo_item_translations').insert({
        demo_item_id: itemId,
        language_code: 'ml',
        name: prod.mlName
      });
      console.log(`  -> Malayalam: "${prod.mlName}"`);

      // 4. Insert Sell Config
      const ceiling = Math.ceil(prod.basePrice * 1.15);
      await supabase.from('demo_sell_config').insert({
        demo_item_id: itemId,
        sell_mode: 'Fixed',
        base_unit_id: prod.baseUnitId,
        price_per_base_unit: prod.basePrice,
        allow_custom_quantity: false,
        max_price_increase_percent: 15.00,
        max_price_limit: ceiling
      });

      // 5. Insert Variants
      const variantsPayload = prod.variants.map((v, vIdx) => ({
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
      console.log(`  -> Inserted ${variantsPayload.length} variant(s): ${prod.variants.map(v => `${v.label} (₹${v.price})`).join(', ')}`);

      // Add to CSV
      const variantLabels = prod.variants.map(v => v.label).join('; ');
      const variantPrices = prod.variants.map(v => `₹${v.price}`).join('; ');
      csvRows.push([
        `"${prod.name.replace(/"/g, '""')}"`,
        `"Desserts & Ice Creams"`,
        `"${prod.code}"`,
        `"${prod.mlName.replace(/"/g, '""')}"`,
        `"${variantLabels}"`,
        `"${variantPrices}"`,
        `"${variantPrices}"`,
        `"${finalImageUrl}"`
      ]);

      successCount++;
    } catch (dbErr) {
      console.error(`  -> Database error for ${prod.name}:`, dbErr.message);
      failCount++;
    }
  }

  // Write CSV Catalog
  const csvContent = csvRows.map(r => r.join(',')).join('\n');
  const csvPath = 'cateloge/new/angadi_kerala_skei_and_vesta_icecream_catalog.csv';
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`\n✓ Saved CSV master catalog to ${csvPath}`);

  console.log('\n================================================================');
  console.log(`IMPORT FINISHED: ${successCount} succeeded, ${failCount} failed.`);
  console.log('================================================================');
}

run().catch(console.error);
