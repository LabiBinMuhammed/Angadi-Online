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

async function checkOldUnits() {
  const oilCatId = 'f2429c0e-d038-4557-8aa1-969af9a4f99a';
  const spiceCatId = '629d2052-6c3c-4102-95c5-6db8a85706f8';

  const { data: oils } = await supabase.from('demo_items').select('sell_mode, unit_id').eq('category_id', oilCatId);
  const { data: spices } = await supabase.from('demo_items').select('sell_mode, unit_id').eq('category_id', spiceCatId);

  const countUnits = (arr) => {
    const counts = {};
    arr.forEach(i => {
      const k = `${i.sell_mode}_${i.unit_id}`;
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  };

  console.log('Old oil demo item units:', countUnits(oils || []));
  console.log('Old spice demo item units:', countUnits(spices || []));
}

checkOldUnits();
