const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require(path.join(__dirname, '../web/node_modules/@supabase/supabase-js'));

const envText = fs.readFileSync(path.join(__dirname, '../web/.env.local'), 'utf8');
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

const CATEGORY_ID = 'f2429c0e-d038-4557-8aa1-969af9a4f99a'; // Cooking Essentials
const CATEGORY_NAME = 'Cooking Essentials';

const UNITS = {
  ml: '4d3b2515-c26d-4c05-ab72-13ff6c6d0938',
  L: '24f2e09f-23d1-4919-a6c3-7a3d11fae4ef',
  g: '32d0b812-34cc-415c-b7cf-1f96dc2f841f',
  kg: 'fc6f287c-0b3c-458e-8d4f-4679d0059c32',
  pack: '5cb5e824-4974-40f9-82ec-6edaa9ad32aa',
  bottle: '6aece001-9ce7-4325-b1ff-5b4f9405a97a',
  pcs: '9137e686-0e75-4a6b-a261-891b1e4e9774'
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

const PRODUCTS = [
  // 1. RKG Cow Ghee Tin
  {
    code: 'ANG-OIL-0170',
    brand: 'RKG',
    name: 'RKG Agmark Pure Cow Ghee (Tin)',
    mlName: 'ആർ.കെ.ജി അഗ്മാർക്ക് പശുവിൻ നെയ്യ് (ടിൻ)',
    rawImageUrl: 'https://rkgghee-in.b-cdn.net/wp-content/uploads/2025/07/RKG-Tin.webp',
    baseUnitId: UNITS.ml,
    basePrice: 40,
    storageSlug: 'rkg_agmark_cow_ghee_tin',
    variants: [
      { label: '50 ml', unit_id: UNITS.ml, value: 50, price: 40, is_default: false, display_order: 1 },
      { label: '100 ml', unit_id: UNITS.ml, value: 100, price: 78, is_default: false, display_order: 2 },
      { label: '200 ml', unit_id: UNITS.ml, value: 200, price: 155, is_default: false, display_order: 3 },
      { label: '500 ml', unit_id: UNITS.ml, value: 500, price: 380, is_default: true, display_order: 4 },
      { label: '1 L', unit_id: UNITS.L, value: 1, price: 745, is_default: false, display_order: 5 },
      { label: '2 L', unit_id: UNITS.L, value: 2, price: 1480, is_default: false, display_order: 6 },
      { label: '5 L', unit_id: UNITS.L, value: 5, price: 3650, is_default: false, display_order: 7 },
      { label: '10 L', unit_id: UNITS.L, value: 10, price: 7250, is_default: false, display_order: 8 },
      { label: '15 L', unit_id: UNITS.L, value: 15, price: 10800, is_default: false, display_order: 9 },
      { label: '15 kg', unit_id: UNITS.kg, value: 15, price: 11900, is_default: false, display_order: 10 }
    ]
  },
  // 2. RKG Cow Ghee Jar
  {
    code: 'ANG-OIL-0171',
    brand: 'RKG',
    name: 'RKG Agmark Pure Cow Ghee (Jar)',
    mlName: 'ആർ.കെ.ജി അഗ്മാർക്ക് പശുവിൻ നെയ്യ് (ജാർ)',
    rawImageUrl: 'https://rkgghee-in.b-cdn.net/wp-content/uploads/2025/07/cow_ghee_jar.webp',
    baseUnitId: UNITS.ml,
    basePrice: 42,
    storageSlug: 'rkg_agmark_cow_ghee_jar',
    variants: [
      { label: '50 ml', unit_id: UNITS.ml, value: 50, price: 42, is_default: false, display_order: 1 },
      { label: '100 ml', unit_id: UNITS.ml, value: 100, price: 80, is_default: false, display_order: 2 },
      { label: '200 ml', unit_id: UNITS.ml, value: 200, price: 158, is_default: false, display_order: 3 },
      { label: '500 ml', unit_id: UNITS.ml, value: 500, price: 385, is_default: true, display_order: 4 },
      { label: '1 L', unit_id: UNITS.L, value: 1, price: 750, is_default: false, display_order: 5 },
      { label: '2 L', unit_id: UNITS.L, value: 2, price: 1490, is_default: false, display_order: 6 }
    ]
  },
  // 3. RKG Cow Ghee Pouch
  {
    code: 'ANG-OIL-0172',
    brand: 'RKG',
    name: 'RKG Agmark Pure Cow Ghee (Pouch)',
    mlName: 'ആർ.കെ.ജി അഗ്മാർക്ക് പശുവിൻ നെയ്യ് (പൗച്ച്)',
    rawImageUrl: 'https://rkgghee-in.b-cdn.net/wp-content/uploads/2025/07/cow_ghee_pouch-1-712x1024.webp',
    baseUnitId: UNITS.ml,
    basePrice: 38,
    storageSlug: 'rkg_agmark_cow_ghee_pouch',
    variants: [
      { label: '50 ml', unit_id: UNITS.ml, value: 50, price: 38, is_default: false, display_order: 1 },
      { label: '100 ml', unit_id: UNITS.ml, value: 100, price: 75, is_default: false, display_order: 2 },
      { label: '200 ml', unit_id: UNITS.ml, value: 200, price: 150, is_default: false, display_order: 3 },
      { label: '500 ml', unit_id: UNITS.ml, value: 500, price: 370, is_default: true, display_order: 4 },
      { label: '1 L', unit_id: UNITS.L, value: 1, price: 730, is_default: false, display_order: 5 }
    ]
  },
  // 4. RKG Cow Ghee Can
  {
    code: 'ANG-OIL-0173',
    brand: 'RKG',
    name: 'RKG Agmark Pure Cow Ghee (Can)',
    mlName: 'ആർ.കെ.ജി അഗ്മാർക്ക് പശുവിൻ നെയ്യ് (കാൻ)',
    rawImageUrl: 'https://rkgghee-in.b-cdn.net/wp-content/uploads/2025/07/cow_ghee_can.webp',
    baseUnitId: UNITS.L,
    basePrice: 3600,
    storageSlug: 'rkg_agmark_cow_ghee_can',
    variants: [
      { label: '5 L', unit_id: UNITS.L, value: 5, price: 3600, is_default: true, display_order: 1 },
      { label: '10 L', unit_id: UNITS.L, value: 10, price: 7150, is_default: false, display_order: 2 },
      { label: '15 L', unit_id: UNITS.L, value: 15, price: 10650, is_default: false, display_order: 3 }
    ]
  },
  // 5. RKG Cow Ghee Sachet
  {
    code: 'ANG-OIL-0174',
    brand: 'RKG',
    name: 'RKG Agmark Pure Cow Ghee (Sachet)',
    mlName: 'ആർ.കെ.ജി അഗ്മാർക്ക് പശുവിൻ നെയ്യ് സാഷെ',
    rawImageUrl: 'https://rkgghee-in.b-cdn.net/wp-content/uploads/2025/07/cow_ghee_sachet-1.webp',
    baseUnitId: UNITS.pack,
    basePrice: 5,
    storageSlug: 'rkg_agmark_cow_ghee_sachet',
    variants: [
      { label: '₹5 Sachet (6 ml)', unit_id: UNITS.pack, value: 1, price: 5, is_default: false, display_order: 1 },
      { label: '₹10 Sachet (12 ml)', unit_id: UNITS.pack, value: 1, price: 10, is_default: true, display_order: 2 },
      { label: '₹20 Sachet (25 ml)', unit_id: UNITS.pack, value: 1, price: 20, is_default: false, display_order: 3 }
    ]
  },
  // 6. RKG Buffalo Ghee Tin
  {
    code: 'ANG-OIL-0175',
    brand: 'RKG',
    name: 'RKG Pure Buffalo Ghee (Tin)',
    mlName: 'ആർ.കെ.ജി പ്യുവർ എരുമ നെയ്യ് (ടിൻ)',
    rawImageUrl: 'https://rkgghee-in.b-cdn.net/wp-content/uploads/2025/07/buffalo_ghee_tin-793x1024.webp',
    baseUnitId: UNITS.L,
    basePrice: 11000,
    storageSlug: 'rkg_buffalo_ghee_tin',
    variants: [
      { label: '15 L', unit_id: UNITS.L, value: 15, price: 11000, is_default: true, display_order: 1 },
      { label: '15 kg', unit_id: UNITS.kg, value: 15, price: 12100, is_default: false, display_order: 2 }
    ]
  },
  // 7. RKG Buffalo Ghee Jar
  {
    code: 'ANG-OIL-0176',
    brand: 'RKG',
    name: 'RKG Pure Buffalo Ghee (Jar)',
    mlName: 'ആർ.കെ.ജി പ്യുവർ എരുമ നെയ്യ് (ജാർ)',
    rawImageUrl: 'https://rkgghee-in.b-cdn.net/wp-content/uploads/2025/07/buffalo_ghee_jar-793x1024.webp',
    baseUnitId: UNITS.ml,
    basePrice: 160,
    storageSlug: 'rkg_buffalo_ghee_jar',
    variants: [
      { label: '200 ml', unit_id: UNITS.ml, value: 200, price: 160, is_default: false, display_order: 1 },
      { label: '500 ml', unit_id: UNITS.ml, value: 500, price: 390, is_default: true, display_order: 2 },
      { label: '1 L', unit_id: UNITS.L, value: 1, price: 760, is_default: false, display_order: 3 }
    ]
  },
  // 8. RKG Buffalo Ghee Sachet
  {
    code: 'ANG-OIL-0177',
    brand: 'RKG',
    name: 'RKG Pure Buffalo Ghee (Sachet)',
    mlName: 'ആർ.കെ.ജി പ്യുവർ എരുമ നെയ്യ് സാഷെ',
    rawImageUrl: 'https://rkgghee-in.b-cdn.net/wp-content/uploads/2025/07/buffalo_ghee_sachet-1.webp',
    baseUnitId: UNITS.pack,
    basePrice: 10,
    storageSlug: 'rkg_buffalo_ghee_sachet',
    variants: [
      { label: '₹10 Sachet (12 ml)', unit_id: UNITS.pack, value: 1, price: 10, is_default: true, display_order: 1 },
      { label: '₹20 Sachet (25 ml)', unit_id: UNITS.pack, value: 1, price: 20, is_default: false, display_order: 2 }
    ]
  },
  // 9. RKG Roasted Cow Ghee Jar
  {
    code: 'ANG-OIL-0178',
    brand: 'RKG',
    name: 'RKG Special Roasted Cow Ghee (Jar)',
    mlName: 'ആർ.കെ.ജി റോസ്റ്റഡ് പശുവിൻ നെയ്യ് (ജാർ)',
    rawImageUrl: 'https://rkgghee-in.b-cdn.net/wp-content/uploads/2025/07/rosted_cow_jhee-1.webp',
    baseUnitId: UNITS.ml,
    basePrice: 170,
    storageSlug: 'rkg_roasted_cow_ghee_jar',
    variants: [
      { label: '200 ml', unit_id: UNITS.ml, value: 200, price: 170, is_default: false, display_order: 1 },
      { label: '500 ml', unit_id: UNITS.ml, value: 500, price: 410, is_default: true, display_order: 2 }
    ]
  },
  // 10. RKG Thelivu Ghee Tin
  {
    code: 'ANG-OIL-0179',
    brand: 'RKG',
    name: 'RKG Thelivu Ghee (Tin)',
    mlName: 'ആർ.കെ.ജി തെളിവ് നെയ്യ് (ടിൻ)',
    rawImageUrl: 'https://rkgghee-in.b-cdn.net/wp-content/uploads/2025/07/thelivu_ghee-1-793x1024.webp',
    baseUnitId: UNITS.L,
    basePrice: 3800,
    storageSlug: 'rkg_thelivu_ghee_tin',
    variants: [
      { label: '5 L', unit_id: UNITS.L, value: 5, price: 3800, is_default: true, display_order: 1 },
      { label: '15 L', unit_id: UNITS.L, value: 15, price: 11200, is_default: false, display_order: 2 },
      { label: '15 kg', unit_id: UNITS.kg, value: 15, price: 12300, is_default: false, display_order: 3 }
    ]
  },
  // 11. Dalda Vanaspati Ghee (Updating ANG-OIL-0011 and adding full verified details)
  {
    code: 'ANG-OIL-0011',
    brand: 'Dalda',
    name: 'Dalda Vanaspati Ghee (1L Pack / Pouch)',
    mlName: 'ഡാൽഡ വനസ്പതി നെയ്യ് (1 ലിറ്റർ പൗച്ച്)',
    rawImageUrl: 'https://m.media-amazon.com/images/I/71IxVOvkgJL._SL1500_.jpg',
    baseUnitId: UNITS.L,
    basePrice: 171,
    storageSlug: 'dalda_vanaspati_ghee_1l',
    variants: [
      { label: '200 ml', unit_id: UNITS.ml, value: 200, price: 38, is_default: false, display_order: 1 },
      { label: '500 ml', unit_id: UNITS.ml, value: 500, price: 88, is_default: false, display_order: 2 },
      { label: '1 L', unit_id: UNITS.L, value: 1, price: 171, is_default: true, display_order: 3 },
      { label: '5 L', unit_id: UNITS.L, value: 5, price: 850, is_default: false, display_order: 4 },
      { label: '15 L Tin', unit_id: UNITS.L, value: 15, price: 2450, is_default: false, display_order: 5 }
    ]
  }
];

async function run() {
  console.log('=== STARTING RKG GHEE & DALDA TEMPLATES IMPORT ===');
  const importedList = [];

  for (const item of PRODUCTS) {
    console.log(`\nProcessing [${item.code}] ${item.name}...`);
    try {
      // 1. Download image
      console.log(`  -> Downloading image from: ${item.rawImageUrl}`);
      const { buffer, contentType } = await downloadImage(item.rawImageUrl);

      // 2. Upload to Supabase Storage
      const ext = contentType.includes('webp') ? 'webp' : (contentType.includes('png') ? 'png' : 'jpg');
      const storagePath = `demos/demo_${item.storageSlug}_${Date.now()}.${ext}`;
      console.log(`  -> Uploading to Storage path: ${storagePath} (${buffer.length} bytes, ${contentType})`);
      const publicUrl = await uploadToStorage(storagePath, buffer, contentType);
      if (!publicUrl) throw new Error('Storage upload failed');
      console.log(`  -> CDN URL: ${publicUrl}`);

      // 3. Upsert demo_items
      let itemId;
      const { data: existing } = await supabase
        .from('demo_items')
        .select('id')
        .eq('code', item.code)
        .maybeSingle();

      if (existing) {
        console.log(`  -> Updating existing item ${existing.id}...`);
        itemId = existing.id;
        const { error: upErr } = await supabase
          .from('demo_items')
          .update({
            name: item.name,
            category_id: CATEGORY_ID,
            unit_id: item.baseUnitId,
            sell_mode: 'Fixed',
            default_image: publicUrl
          })
          .eq('id', itemId);
        if (upErr) throw upErr;

        // Clean old relations to rebuild cleanly
        await supabase.from('demo_item_translations').delete().eq('demo_item_id', itemId);
        await supabase.from('demo_sell_config').delete().eq('demo_item_id', itemId);
        await supabase.from('demo_variants').delete().eq('demo_item_id', itemId);
      } else {
        console.log(`  -> Inserting new item...`);
        const { data: inserted, error: insErr } = await supabase
          .from('demo_items')
          .insert({
            code: item.code,
            name: item.name,
            category_id: CATEGORY_ID,
            unit_id: item.baseUnitId,
            sell_mode: 'Fixed',
            default_image: publicUrl
          })
          .select('id')
          .single();
        if (insErr) throw insErr;
        itemId = inserted.id;
      }

      // 4. Insert Malayalam Translation
      const { error: mlErr } = await supabase
        .from('demo_item_translations')
        .insert({
          demo_item_id: itemId,
          language_code: 'ml',
          name: item.mlName
        });
      if (mlErr) console.warn('  -> Translation insert error:', mlErr.message);

      // 5. Insert Sell Config
      const ceiling = Math.ceil(item.basePrice * 1.15);
      const { error: scErr } = await supabase
        .from('demo_sell_config')
        .insert({
          demo_item_id: itemId,
          sell_mode: 'Fixed',
          base_unit_id: item.baseUnitId,
          price_per_base_unit: item.basePrice,
          allow_custom_quantity: false,
          max_price_increase_percent: 15.00,
          max_price_limit: ceiling
        });
      if (scErr) console.warn('  -> Sell config insert error:', scErr.message);

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
      const { error: varErr } = await supabase
        .from('demo_variants')
        .insert(variantsPayload);
      if (varErr) console.warn('  -> Variants insert error:', varErr.message);

      importedList.push({
        brand: item.brand,
        code: item.code,
        name: item.name,
        category: CATEGORY_NAME,
        mlName: item.mlName,
        basePrice: item.basePrice,
        variantsCount: item.variants.length,
        imageUrl: publicUrl
      });
      console.log(`  -> Successfully imported ${item.name} (${item.variants.length} variants)`);
    } catch (err) {
      console.error(`  -> Failed importing ${item.name}:`, err.message);
    }
  }

  // 7. Write CSV Catalog
  const csvHeader = 'Brand,Code,Name,Category,Malayalam Name,Base Price,Variants Count,Image URL\n';
  const csvRows = importedList.map(it =>
    `"${it.brand}","${it.code}","${it.name.replace(/"/g, '""')}","${it.category}","${it.mlName.replace(/"/g, '""')}","${it.basePrice}","${it.variantsCount}","${it.imageUrl}"`
  ).join('\n');
  const csvPath = path.join(__dirname, '../cateloge/new/angadi_kerala_rkg_dalda_ghee_catalog.csv');
  fs.writeFileSync(csvPath, csvHeader + csvRows, 'utf8');
  console.log(`\nExported Catalog CSV (${importedList.length} items) to: ${csvPath}`);

  console.log('\n=== IMPORT COMPLETE ===');
}

run();
