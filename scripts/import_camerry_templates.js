const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require(path.join(__dirname, '../web/node_modules/@supabase/supabase-js'));

// Load environment variables
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

const CAT_ID_ICE_CREAM = '48a2b255-5f70-49de-b383-c5cf877f9d3e'; // Desserts & Ice Creams

const UNIT_IDS = {
  ml: '4d3b2515-c26d-4c05-ab72-13ff6c6d0938',
  l: '24f2e09f-23d1-4919-a6c3-7a3d11fae4ef',
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        },
        timeout: 15000
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let redirect = res.headers.location;
          if (!redirect.startsWith('http')) redirect = new URL(redirect, url).toString();
          return downloadImage(redirect).then(resolve).catch(reject);
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
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Malayalam Translation Dictionary
const mlTerms = {
  'camerry': 'കാമറി',
  'ice cream': 'ഐസ് ക്രീം',
  'tub': 'ടബ്ബ്',
  'cone': 'കോൺ',
  'bar': 'ബാർ',
  'fruiticle': 'ഫ്രൂട്ടിക്കിൾ',
  'pop': 'പോപ്പ്',
  'milkies': 'മിൽക്കീസ്',
  'sipie': 'സിപ്പി',
  'speciality': 'സ്പെഷ്യാലിറ്റി',
  'specialities': 'സ്പെഷ്യാലിറ്റി',
  'red velvet': 'റെഡ് വെൽവെറ്റ്',
  'pista': 'പിസ്ത',
  'pistachio': 'പിസ്ത',
  'butterscotch': 'ബട്ടർസ്കോച്ച്',
  'butter scotch': 'ബട്ടർസ്കോച്ച്',
  'jackfruit': 'ചക്ക (ജാക്ക്ഫ്രൂട്ട്)',
  'kiwi': 'കിവി',
  'chikoo': 'ചിക്കു (സപ്പോട്ട)',
  'fig and honey': 'ഫിഗ് & ഹണി (അത്തിപ്പഴവും തേനും)',
  'fig': 'ഫിഗ്',
  'honey': 'ഹണി',
  'kulfi': 'കുൾഫി',
  'kulfi pistachio': 'കുൾഫി പിസ്ത',
  'passion fruit': 'പാഷൻ ഫ്രൂട്ട്',
  'orange': 'ഓറഞ്ച്',
  'blackcurrant': 'ബ്ലാക്ക് കറന്റ്',
  'caramel latte': 'കാരമൽ ലാറ്റെ',
  'caramel': 'കാരമൽ',
  'latte': 'ലാറ്റെ',
  'kesar badam pista': 'കേസർ ബദാം പിസ്ത',
  'kesar': 'കേസർ',
  'badam': 'ബദാം',
  'pineapple': 'പൈനാപ്പിൾ',
  'datte': 'ഈന്തപ്പഴം (ഡേറ്റ്സ്)',
  'dates': 'ഈന്തപ്പഴം (ഡേറ്റ്സ്)',
  'vanilla': 'വാനില',
  'spanish delight': 'സ്പാനിഷ് ഡിലൈറ്റ്',
  'tender coconut': 'ഇളനീർ (ടെൻഡർ കോക്കനട്ട്)',
  'strawberry': 'സ്ട്രോബെറി',
  'mango': 'മാംഗോ (മാമ്പഴം)',
  'blueberry': 'ബ്ലൂബെറി',
  'sitaphal': 'ആത്തച്ചക്ക (സീതാഫൽ)',
  'chocolate': 'ചോക്ലേറ്റ്',
  'cookies n cream': 'കുക്കീസ് & ക്രീം',
  'cotton candy': 'കോട്ടൺ കാൻഡി',
  'bon bon': 'ബോൺ ബോൺ',
  'lemon pie': 'ലെമൺ പൈ',
  'lemon': 'ലെമൺ',
  'pie': 'പൈ',
  'tiramisu': 'തിരമിസു',
  'strawberry cheese cake': 'സ്ട്രോബെറി ചീസ് കേക്ക്',
  'cheese cake': 'ചീസ് കേക്ക്',
  'mango bar': 'മാംഗോ ബാർ',
  'choco bar': 'ചോക്കോ ബാർ',
  'funfi kulfi': 'ഫൺഫി കുൾഫി',
  'crunchies chocolate': 'ക്രഞ്ചീസ് ചോക്ലേറ്റ്',
  'berries n crunchies': 'ബെറീസ് & ക്രഞ്ചീസ്',
  'mango melody': 'മാംഗോ മെലഡി',
  'melody': 'മെലഡി',
  'tropical twist': 'ട്രോപ്പിക്കൽ ട്വിസ്റ്റ്',
  'twist': 'ട്വിസ്റ്റ്',
  'berry lime': 'ബെറി ലൈം',
  'lime': 'ലൈം',
  'sipie mango': 'സിപ്പി മാംഗോ',
  'sipie pineapple': 'സിപ്പി പൈനാപ്പിൾ',
  'sipie pista': 'സിപ്പി പിസ്ത',
  'sipie chocolate': 'സിപ്പി ചോക്ലേറ്റ്',
  'sipie strawberry': 'സിപ്പി സ്ട്രോബെറി',
  'siesta': 'സിയസ്റ്റ',
  'puttu': 'പുട്ട് ഐസ് ക്രീം',
  'dream cake': 'ഡ്രീം കേക്ക്',
  'fruity bonanza': 'ഫ്രൂട്ടി ബൊനാൻസ',
  'dilse red velvet': 'ദിൽസെ റെഡ് വെൽവെറ്റ്',
  'dilse butterscotch chocolate': 'ദിൽസെ ബട്ടർസ്കോച്ച് ചോക്ലേറ്റ്',
  'dilse': 'ദിൽസെ'
};

function getMalayalamName(name) {
  let cleaned = name.replace(/[()\/]/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = cleaned.toLowerCase();

  // Direct match if available
  for (const [k, v] of Object.entries(mlTerms)) {
    if (lower === k) return v;
  }

  // Word/phrase translation
  const words = cleaned.split(' ');
  const result = [];
  for (let i = 0; i < words.length; i++) {
    if (i + 2 < words.length) {
      const triplet = `${words[i]} ${words[i+1]} ${words[i+2]}`.toLowerCase();
      if (mlTerms[triplet]) {
        result.push(mlTerms[triplet]);
        i += 2;
        continue;
      }
    }
    if (i + 1 < words.length) {
      const pair = `${words[i]} ${words[i+1]}`.toLowerCase();
      if (mlTerms[pair]) {
        result.push(mlTerms[pair]);
        i++;
        continue;
      }
    }
    const single = words[i].toLowerCase();
    if (mlTerms[single]) {
      result.push(mlTerms[single]);
    } else {
      result.push(words[i]);
    }
  }
  return result.join(' ');
}

async function run() {
  console.log('================================================================');
  console.log('IMPORTING CAMERRY ICE CREAM PRODUCTS AS DEMO TEMPLATES');
  console.log('================================================================');

  const products = JSON.parse(fs.readFileSync('scripts/camerry_products.json', 'utf8'));
  console.log(`Loaded ${products.length} Camerry products.`);

  const START_CODE = 316; // Follows Skei & Vesta
  const imageUrlMap = new Map();
  let successCount = 0;
  let failCount = 0;

  const csvRows = [
    ['Product Name', 'Category', 'Code', 'Malayalam Name', 'Variants', 'Selling Price', 'Original Price (MRP)', 'Image URL']
  ];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const code = `ANG-DES-${String(START_CODE + i).padStart(4, '0')}`;
    const progress = `[${i + 1}/${products.length}]`;
    console.log(`\n${progress} Processing ${p.fullName} (${code})...`);

    // Clean up spelling if any (e.g. Srawberry Cheese Cake -> Strawberry Cheesecake)
    let prodName = p.fullName.replace('Srawberry', 'Strawberry');

    // Determine variants, base unit, prices
    let variants = [];
    let baseUnitId = UNIT_IDS.ml;
    let basePrice = 40;

    if (p.type === 'Tub') {
      variants.push({ label: '500 ml', value: 500, unit_id: UNIT_IDS.ml, price: 140, is_default: true, display_order: 1 });
      variants.push({ label: '1 L', value: 1, unit_id: UNIT_IDS.l, price: 250, is_default: false, display_order: 2 });
      basePrice = 140;
    } else if (p.type === 'Cone') {
      variants.push({ label: '120 ml', value: 120, unit_id: UNIT_IDS.ml, price: 45, is_default: true, display_order: 1 });
      basePrice = 45;
    } else if (p.type === 'Bar') {
      variants.push({ label: '70 ml', value: 70, unit_id: UNIT_IDS.ml, price: 35, is_default: true, display_order: 1 });
      basePrice = 35;
    } else if (p.type === 'Fruiticle / Pop') {
      variants.push({ label: '60 ml', value: 60, unit_id: UNIT_IDS.ml, price: 25, is_default: true, display_order: 1 });
      basePrice = 25;
    } else if (p.type === 'Milkies / Bar') {
      variants.push({ label: '65 ml', value: 65, unit_id: UNIT_IDS.ml, price: 30, is_default: true, display_order: 1 });
      basePrice = 30;
    } else if (p.type === 'Sipie') {
      variants.push({ label: '50 ml', value: 50, unit_id: UNIT_IDS.ml, price: 15, is_default: true, display_order: 1 });
      variants.push({ label: '5 pcs Pack', value: 5, unit_id: UNIT_IDS.pack, price: 65, is_default: false, display_order: 2 });
      basePrice = 15;
    } else if (p.type === 'Speciality') {
      let specPrice = 75;
      if (prodName.toLowerCase().includes('puttu')) specPrice = 90; // Premium Puttu Ice Cream
      if (prodName.toLowerCase().includes('dream cake')) specPrice = 85;
      variants.push({ label: '1 pc (150 ml)', value: 150, unit_id: UNIT_IDS.ml, price: specPrice, is_default: true, display_order: 1 });
      basePrice = specPrice;
    } else {
      variants.push({ label: '1 pc', value: 1, unit_id: UNIT_IDS.pcs, price: 40, is_default: true, display_order: 1 });
      basePrice = 40;
    }

    // 1. Download and Upload Image to Supabase Storage
    let finalImageUrl = p.imageUrl;
    try {
      if (imageUrlMap.has(p.imageUrl)) {
        finalImageUrl = imageUrlMap.get(p.imageUrl);
        console.log(`  -> Using cached CDN image: ${finalImageUrl}`);
      } else {
        const urlObj = new URL(p.imageUrl);
        const ext = path.extname(urlObj.pathname) || '.png';
        const rawBasename = path.basename(urlObj.pathname, ext);
        const cleanBasename = `${p.type.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${rawBasename.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
        const storagePath = `camerry/${cleanBasename}${ext}`;

        console.log(`  -> Downloading image from ${p.imageUrl}...`);
        const { buffer, contentType } = await downloadImage(p.imageUrl);

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
      const mlName = getMalayalamName(prodName);

      const { data: existing } = await supabase
        .from('demo_items')
        .select('id')
        .or(`code.eq.${code},name.eq."${prodName.replace(/"/g, '')}"`)
        .maybeSingle();

      let itemId;
      if (existing) {
        console.log(`  -> Updating existing item ID: ${existing.id}`);
        itemId = existing.id;
        await supabase
          .from('demo_items')
          .update({
            name: prodName,
            category_id: CAT_ID_ICE_CREAM,
            unit_id: baseUnitId,
            sell_mode: 'Fixed',
            default_image: finalImageUrl,
            code: code,
            display_order: START_CODE + i
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
            category_id: CAT_ID_ICE_CREAM,
            unit_id: baseUnitId,
            sell_mode: 'Fixed',
            default_image: finalImageUrl,
            code: code,
            display_order: START_CODE + i
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

      // Add to CSV rows
      const vLabels = variants.map(v => v.label).join('; ');
      const vPrices = variants.map(v => `₹${v.price}`).join('; ');
      csvRows.push([
        `"${prodName.replace(/"/g, '""')}"`,
        `"Desserts & Ice Creams"`,
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
  const csvPath = 'cateloge/new/angadi_kerala_camerry_icecream_catalog.csv';
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`\n✓ Saved CSV master catalog to ${csvPath}`);

  console.log('\n================================================================');
  console.log(`IMPORT FINISHED: ${successCount} succeeded, ${failCount} failed.`);
  console.log('================================================================');
}

run().catch(console.error);
