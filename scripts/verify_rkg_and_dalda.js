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

function checkUrl(url) {
  return new Promise(resolve => {
    try {
      const u = new URL(url);
      https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }, res => {
        resolve(res.statusCode);
      }).on('error', () => resolve(0));
    } catch (e) {
      resolve(0);
    }
  });
}

async function verify() {
  console.log('=== VERIFYING RKG & DALDA TEMPLATES IN SUPABASE ===');

  const targetCodes = [
    'ANG-OIL-0011',
    'ANG-OIL-0170',
    'ANG-OIL-0171',
    'ANG-OIL-0172',
    'ANG-OIL-0173',
    'ANG-OIL-0174',
    'ANG-OIL-0175',
    'ANG-OIL-0176',
    'ANG-OIL-0177',
    'ANG-OIL-0178',
    'ANG-OIL-0179'
  ];

  const { data: items, error } = await supabase
    .from('demo_items')
    .select(`
      id,
      code,
      name,
      category_id,
      unit_id,
      default_image,
      demo_item_translations(name),
      demo_sell_config(price_per_base_unit, max_price_limit),
      demo_variants(label, price, is_default, display_order)
    `)
    .in('code', targetCodes)
    .order('code', { ascending: true });

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Found ${items.length} items to verify:\n`);

  for (const it of items) {
    const ml = it.demo_item_translations && it.demo_item_translations[0] ? it.demo_item_translations[0].name : 'N/A';
    const sc = it.demo_sell_config ? it.demo_sell_config : null;
    const variants = it.demo_variants || [];
    variants.sort((a, b) => a.display_order - b.display_order);

    const httpStatus = it.default_image ? await checkUrl(it.default_image) : 0;

    console.log(`[${it.code}] ${it.name}`);
    console.log(`  Malayalam: ${ml}`);
    console.log(`  Image: [HTTP ${httpStatus}] ${it.default_image}`);
    console.log(`  Base Price: ₹${sc ? sc.price_per_base_unit : 'N/A'}, Max Limit: ₹${sc ? sc.max_price_limit : 'N/A'}`);
    console.log(`  Variants (${variants.length}): ${variants.map(v => `${v.label} (₹${v.price}${v.is_default ? ' *def*' : ''})`).join(' | ')}`);
    console.log('');
  }

  // Check total demo items
  const { count: totalItems } = await supabase
    .from('demo_items')
    .select('*', { count: 'exact', head: true });
  console.log(`Total Master Demo Items in Database: ${totalItems}`);
}

verify().catch(console.error);
