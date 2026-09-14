const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require(path.join(__dirname, '../web/node_modules/@supabase/supabase-js'));

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

function checkUrlStatus(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      const req = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }, res => {
        resolve({ status: res.statusCode });
      });
      req.on('error', (e) => resolve({ status: 0, error: e.message }));
      req.setTimeout(10000, () => { req.destroy(); resolve({ status: 408 }); });
    } catch (e) {
      resolve({ status: 0, error: e.message });
    }
  });
}

async function run() {
  console.log('=== VERIFYING IMPORTED PENS IN SUPABASE ===');

  // 1. Check count of stationery demo_items
  const { count: totalDemoItems } = await supabase
    .from('demo_items')
    .select('*', { count: 'exact', head: true });

  const { count: stationeryCount } = await supabase
    .from('demo_items')
    .select('*', { count: 'exact', head: true })
    .like('code', 'ANG-STA-%');

  console.log(`Total Master Demo Items in Database: ${totalDemoItems}`);
  console.log(`Total Stationery Demo Items: ${stationeryCount}`);

  // 2. Fetch the newly imported pens (ANG-STA-0751 through ANG-STA-0993)
  const { data: newPens, error } = await supabase
    .from('demo_items')
    .select(`
      id,
      code,
      name,
      default_image,
      demo_item_translations ( language_code, name ),
      demo_variants ( id, label, price, is_default ),
      demo_sell_config ( sell_mode, price_per_base_unit )
    `)
    .gte('code', 'ANG-STA-0751')
    .lte('code', 'ANG-STA-0993')
    .order('code', { ascending: true });

  if (error) {
    console.error('Error fetching new pens:', error);
    return;
  }

  console.log(`Retrieved ${newPens.length} newly imported pen items.`);

  let externalImgCount = 0;
  let supabaseStorageImgCount = 0;
  let missingVariantsCount = 0;
  let missingTranslationCount = 0;

  const sampleUrlsToCheck = [];

  for (const p of newPens) {
    if (p.default_image && p.default_image.includes('supabase.co/storage/v1/object/public/item-images')) {
      supabaseStorageImgCount++;
    } else {
      externalImgCount++;
    }

    if (!p.demo_variants || p.demo_variants.length === 0) {
      missingVariantsCount++;
    }

    if (!p.demo_item_translations || p.demo_item_translations.length === 0) {
      missingTranslationCount++;
    }
  }

  console.log(`\nImage Storage Breakdown:`);
  console.log(`  - Supabase Storage Hosted: ${supabaseStorageImgCount} / ${newPens.length}`);
  console.log(`  - Non-Storage (fallback): ${externalImgCount}`);
  console.log(`  - Items with missing variants: ${missingVariantsCount}`);
  console.log(`  - Items with missing Malayalam translations: ${missingTranslationCount}`);

  // Sample items across brands
  const samples = [
    newPens.find(p => p.code === 'ANG-STA-0751'), // Pentonic
    newPens.find(p => p.code === 'ANG-STA-0771'), // Win
    newPens.find(p => p.code === 'ANG-STA-0810'), // Totem
    newPens.find(p => p.code === 'ANG-STA-0821'), // Flair Metal
    newPens.find(p => p.code === 'ANG-STA-0870'), // Flair Ball
    newPens.find(p => p.code === 'ANG-STA-0925'), // Flair Fountain
    newPens.find(p => p.code === 'ANG-STA-0960'), // Flair Platinum Luxury
    newPens.find(p => p.code === 'ANG-STA-0975'), // Flair Writing Kit
    newPens.find(p => p.code === 'ANG-STA-0985'), // Flair Packaging
  ].filter(Boolean);

  console.log('\n--- Sample Items Verification ---');
  for (const s of samples) {
    const ml = s.demo_item_translations.find(t => t.language_code === 'ml')?.name || 'N/A';
    const varSummary = s.demo_variants.map(v => `${v.label}: ₹${v.price}`).join(' | ');
    const imgCheck = await checkUrlStatus(s.default_image);
    console.log(`[${s.code}] ${s.name}`);
    console.log(`  ML: ${ml}`);
    console.log(`  Image: ${s.default_image} (HTTP ${imgCheck.status})`);
    console.log(`  Variants: ${varSummary}\n`);
  }

  // Report any items where default_image is external (fallback due to 404)
  const failedUploads = newPens.filter(p => !p.default_image.includes('supabase.co/storage'));
  if (failedUploads.length > 0) {
    console.log(`\nItems with non-uploaded images (${failedUploads.length}):`);
    failedUploads.slice(0, 10).forEach(f => console.log(`  ${f.code}: ${f.name} -> ${f.default_image}`));
  }
}

run();
