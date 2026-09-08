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

async function checkForeignKeys() {
  const oilCatId = 'f2429c0e-d038-4557-8aa1-969af9a4f99a';
  const spiceCatId = '629d2052-6c3c-4102-95c5-6db8a85706f8';

  const { data: oilDemoItems } = await supabase.from('demo_items').select('id').eq('category_id', oilCatId);
  const { data: spiceDemoItems } = await supabase.from('demo_items').select('id').eq('category_id', spiceCatId);
  const oilIds = (oilDemoItems || []).map(i => i.id);
  const spiceIds = (spiceDemoItems || []).map(i => i.id);

  console.log('Oil demo item IDs count:', oilIds.length);
  console.log('Spice demo item IDs count:', spiceIds.length);

  const allIds = [...oilIds, ...spiceIds];

  const { data: referencedInItems } = await supabase
    .from('items')
    .select('id, name, demo_item_id')
    .in('demo_item_id', allIds);

  console.log('Referenced in items table:', referencedInItems ? referencedInItems.length : 0);
  if (referencedInItems && referencedInItems.length > 0) {
    console.log('Sample referenced items:', referencedInItems);
  }

  const { data: referencedInDemoVariants } = await supabase
    .from('demo_variants')
    .select('id, demo_item_id')
    .in('demo_item_id', allIds);
  console.log('Referenced in demo_variants:', referencedInDemoVariants ? referencedInDemoVariants.length : 0);

  const { data: referencedInSellConfig } = await supabase
    .from('demo_sell_config')
    .select('id, demo_item_id')
    .in('demo_item_id', allIds);
  console.log('Referenced in demo_sell_config:', referencedInSellConfig ? referencedInSellConfig.length : 0);
}

checkForeignKeys();
