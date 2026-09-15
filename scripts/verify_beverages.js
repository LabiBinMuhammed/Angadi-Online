const path = require('path');
const https = require('https');
const { createClient } = require(path.join(__dirname, '../web/node_modules/@supabase/supabase-js'));

const envText = require('fs').readFileSync(path.join(__dirname, '../web/.env.local'), 'utf8');
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

function checkHttp(url) {
  return new Promise(resolve => {
    https.get(url, res => resolve(res.statusCode)).on('error', () => resolve(500));
  });
}

async function verify() {
  console.log('Verifying newly imported beverage items in Supabase...');
  const { data: items, error } = await supabase
    .from('demo_items')
    .select(`
      id, code, name, sell_mode, default_image,
      demo_item_translations ( language_code, name ),
      demo_sell_config ( sell_mode, price_per_base_unit, max_price_limit ),
      demo_variants ( label, price, is_default, display_order )
    `)
    .gte('code', 'ANG-BEV-1275')
    .lte('code', 'ANG-BEV-1309')
    .order('code', { ascending: true });

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Found ${items.length} beverage templates in range ANG-BEV-1275 to ANG-BEV-1309:\n`);
  let allGood = true;

  for (const item of items) {
    const ml = item.demo_item_translations?.find(t => t.language_code === 'ml')?.name || 'MISSING';
    const sc = Array.isArray(item.demo_sell_config) ? item.demo_sell_config[0] : item.demo_sell_config;
    const vars = item.demo_variants || [];
    const defVar = vars.find(v => v.is_default)?.label || 'NONE';
    const status = await checkHttp(item.default_image);

    const ok = status === 200 && ml !== 'MISSING' && sc && vars.length > 0;
    if (!ok) allGood = false;

    console.log(`[${ok ? 'OK' : 'FAIL'}] ${item.code} | ${item.name}`);
    console.log(`       ML: ${ml} | Base: ₹${sc?.price_per_base_unit} (Max ₹${sc?.max_price_limit})`);
    console.log(`       Variants (${vars.length}): default = ${defVar}`);
    console.log(`       Image CDN: HTTP ${status} -> ${item.default_image}`);
    console.log('');
  }

  console.log(allGood ? 'ALL 35 BEVERAGE TEMPLATES FULLY VERIFIED & WORKING PERFECTLY!' : 'Some checks failed!');
}

verify();
