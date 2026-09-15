const fs = require('fs');
const path = require('path');
const https = require('https');
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

const CATEGORY_ID = 'cc30f6b9-532d-48ad-8c1c-7e2542e62454'; // Beverages
const CATEGORY_NAME = 'Beverages';

const UNITS = {
  g: '32d0b812-34cc-415c-b7cf-1f96dc2f841f',
  kg: 'fc6f287c-0b3c-458e-8d4f-4679d0059c32',
  pack: '5cb5e824-4974-40f9-82ec-6edaa9ad32aa'
};

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 25000
    }, res => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/webp' }));
    }).on('error', reject);
  });
}

async function uploadToStorage(storagePath, buffer, contentType) {
  const { error } = await supabase.storage
    .from('item-images')
    .upload(storagePath, buffer, { upsert: true, contentType });
  if (error) {
    console.error('Storage error:', error.message);
    return null;
  }
  const { data } = supabase.storage.from('item-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

async function run() {
  console.log('=== IMPORTING TATA TEA KANNAN DEVAN CLASSIC TEA ===');

  const rawImgUrl = 'https://services.kpnfresh.com/media/v1/products/images/0645dfb1-e99e-43de-a0bb-558519355971/tata-tea-classic-kannan-devan-tea.webp?c_type=C1';
  const { buffer, contentType } = await downloadImage(rawImgUrl);
  const storagePath = `demos/tata_tea/tata_tea_classic_kannan_devan_${Date.now()}.webp`;
  const publicUrl = await uploadToStorage(storagePath, buffer, contentType);
  console.log('CDN URL:', publicUrl);

  const code = 'ANG-BEV-1274';
  const name = 'Tata Tea Classic Kannan Devan Tea';
  const mlName = 'ടാറ്റാ ടീ കണ്ണൻ ദേവൻ ക്ലാസിക് ചായപ്പൊടി';

  let itemId;
  const { data: existing } = await supabase
    .from('demo_items')
    .select('id')
    .eq('code', code)
    .maybeSingle();

  if (existing) {
    itemId = existing.id;
    await supabase.from('demo_items').update({
      name,
      category_id: CATEGORY_ID,
      unit_id: UNITS.g,
      sell_mode: 'Fixed',
      default_image: publicUrl
    }).eq('id', itemId);

    await supabase.from('demo_item_translations').delete().eq('demo_item_id', itemId);
    await supabase.from('demo_sell_config').delete().eq('demo_item_id', itemId);
    await supabase.from('demo_variants').delete().eq('demo_item_id', itemId);
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from('demo_items')
      .insert({
        code,
        name,
        category_id: CATEGORY_ID,
        unit_id: UNITS.g,
        sell_mode: 'Fixed',
        default_image: publicUrl
      })
      .select('id')
      .single();
    if (insErr) throw insErr;
    itemId = inserted.id;
  }

  // Malayalam translation
  await supabase.from('demo_item_translations').insert({
    demo_item_id: itemId,
    language_code: 'ml',
    name: mlName
  });

  // Sell config
  await supabase.from('demo_sell_config').insert({
    demo_item_id: itemId,
    sell_mode: 'Fixed',
    base_unit_id: UNITS.g,
    price_per_base_unit: 38,
    allow_custom_quantity: false,
    max_price_increase_percent: 15.00,
    max_price_limit: 44
  });

  // Variants
  const variants = [
    { label: '100 g Pouch', unit_id: UNITS.g, value: 100, price: 38, is_default: false, display_order: 1 },
    { label: '250 g Pouch', unit_id: UNITS.g, value: 250, price: 91, is_default: true, display_order: 2 },
    { label: '500 g Pouch', unit_id: UNITS.g, value: 500, price: 180, is_default: false, display_order: 3 },
    { label: '1 kg Pouch', unit_id: UNITS.kg, value: 1, price: 355, is_default: false, display_order: 4 }
  ];

  await supabase.from('demo_variants').insert(variants.map(v => ({
    demo_item_id: itemId,
    variant_type: 'Fixed',
    label: v.label,
    unit_id: v.unit_id,
    value: v.value,
    price: v.price,
    is_default: v.is_default,
    is_active: true,
    display_order: v.display_order
  })));

  console.log(`Successfully imported [${code}] ${name} (${variants.length} variants)!`);
}

run().catch(console.error);
