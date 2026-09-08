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

async function inspectArchitecture() {
  // 1. Check categories
  const { data: cats } = await supabase.from('categories').select('*').order('display_order');
  console.log('--- ALL CATEGORIES ---');
  cats.forEach(c => console.log(`${c.id} | ${c.name}`));

  const oilCat = cats.find(c => /oil|ghee/i.test(c.name));
  const spiceCat = cats.find(c => /spice|masala/i.test(c.name));

  console.log('\nOils & Ghee category ID:', oilCat ? oilCat.id : 'NOT FOUND');
  console.log('Spices & Masalas category ID:', spiceCat ? spiceCat.id : 'NOT FOUND');

  // 2. Check units
  const { data: units } = await supabase.from('units').select('id, name, symbol, unit_group_id, base_multiplier');
  console.log('\n--- ALL UNITS ---');
  units.forEach(u => console.log(`${u.id} | ${u.name} (${u.symbol}) | group: ${u.unit_group_id} | mult: ${u.base_multiplier}`));

  // 3. Check demo_items columns and sample
  const { data: vegSample } = await supabase
    .from('demo_items')
    .select('*')
    .limit(2);
  console.log('\n--- DEMO_ITEMS COLUMNS ---');
  if (vegSample && vegSample[0]) {
    console.log(Object.keys(vegSample[0]));
    console.log('Sample item:', vegSample[0]);
  }

  // 4. Check demo_sell_config columns and sample
  const { data: configSample } = await supabase
    .from('demo_sell_config')
    .select('*')
    .limit(2);
  console.log('\n--- DEMO_SELL_CONFIG COLUMNS ---');
  if (configSample && configSample[0]) {
    console.log(Object.keys(configSample[0]));
    console.log('Sample config:', configSample[0]);
  }

  // 5. Check demo_variants columns and sample
  const { data: varSample, error: vErr } = await supabase
    .from('demo_variants')
    .select('*')
    .limit(5);
  console.log('\n--- DEMO_VARIANTS ---');
  if (vErr) {
    console.log('demo_variants error:', vErr.message);
  } else {
    console.log(`Found ${varSample.length} demo variants`);
    if (varSample.length > 0) {
      console.log('Columns:', Object.keys(varSample[0]));
      console.log('Sample variant:', varSample[0]);
    }
  }

  // 6. Check existing demo_items under Oils & Ghee and Spices & Masalas
  if (oilCat) {
    const { data: oilItems } = await supabase.from('demo_items').select('id, name, sell_mode, unit_id').eq('category_id', oilCat.id);
    console.log(`\nCurrent Oils & Ghee items count: ${oilItems ? oilItems.length : 0}`);
    console.log('First 5:', oilItems ? oilItems.slice(0, 5) : []);
  }

  if (spiceCat) {
    const { data: spiceItems } = await supabase.from('demo_items').select('id, name, sell_mode, unit_id').eq('category_id', spiceCat.id);
    console.log(`\nCurrent Spices & Masalas items count: ${spiceItems ? spiceItems.length : 0}`);
    console.log('First 5:', spiceItems ? spiceItems.slice(0, 5) : []);
  }
}

inspectArchitecture();
