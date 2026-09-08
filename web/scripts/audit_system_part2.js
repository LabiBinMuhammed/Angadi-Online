const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    if (k) env[k] = v;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runPart2() {
  // 1. Live vendor items
  const { data: items, error: itemErr } = await supabase.from('items').select('*');
  console.log(`Live vendor items: ${items ? items.length : 0}`);
  if (items && items.length > 0) {
    console.log('Sample item:', items[0]);
  }

  // 2. item_sell_configs
  const { data: configs, error: cfgErr } = await supabase.from('item_sell_configs').select('*');
  console.log(`item_sell_configs: ${configs ? configs.length : 0}`);
  if (configs && configs.length > 0) {
    console.log('Sample item_sell_config:', configs[0]);
  }

  // 3. item_variants
  const { data: variants, error: varErr } = await supabase.from('item_variants').select('*');
  console.log(`item_variants: ${variants ? variants.length : 0}`);
  if (variants && variants.length > 0) {
    console.log('Sample item_variant:', variants[0]);
  }

  // 4. demo_item_translations
  const { data: dit, error: ditErr } = await supabase.from('demo_item_translations').select('*').limit(5);
  console.log(`demo_item_translations sample:`, ditErr ? ditErr.message : dit);

  // 5. category_translations
  const { data: ct, error: ctErr } = await supabase.from('category_translations').select('*').limit(5);
  console.log(`category_translations sample:`, ctErr ? ctErr.message : ct);

  // 6. Orders
  const { data: orders } = await supabase.from('orders').select('*').limit(2);
  console.log(`Orders sample:`, orders);

  // 7. Order items
  const { data: orderItems } = await supabase.from('order_items').select('*').limit(2);
  console.log(`Order items sample:`, orderItems);
}

runPart2();
