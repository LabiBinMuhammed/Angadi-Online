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

async function inspectVariantsAndConfigs() {
  // Let's check demo_variants for oil items
  const oilCatId = 'f2429c0e-d038-4557-8aa1-969af9a4f99a';
  const { data: oilItems } = await supabase.from('demo_items').select('id, name, sell_mode, unit_id').eq('category_id', oilCatId).limit(5);

  for (const item of oilItems) {
    const { data: config } = await supabase.from('demo_sell_config').select('*').eq('demo_item_id', item.id);
    const { data: variants } = await supabase.from('demo_variants').select('*').eq('demo_item_id', item.id);
    console.log(`\nItem: ${item.name} (${item.sell_mode})`);
    console.log('Sell Config:', config);
    console.log('Variants:', variants);
  }

  // Let's also check a fruit or vegetable item for comparison
  const fruitCatId = '5b739fb4-cd2b-42e7-a94c-3f5fcdde1624';
  const { data: fruitItems } = await supabase.from('demo_items').select('id, name, sell_mode, unit_id').eq('category_id', fruitCatId).limit(3);
  for (const item of fruitItems) {
    const { data: config } = await supabase.from('demo_sell_config').select('*').eq('demo_item_id', item.id);
    const { data: variants } = await supabase.from('demo_variants').select('*').eq('demo_item_id', item.id);
    console.log(`\nFruit Item: ${item.name} (${item.sell_mode})`);
    console.log('Sell Config:', config);
    console.log('Variants count:', variants ? variants.length : 0);
  }
}

inspectVariantsAndConfigs();
