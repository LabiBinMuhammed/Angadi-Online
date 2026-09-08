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

async function inspectRemainingCategories() {
  const targetCatNames = ['Dairy', 'Bakery', 'Biscuits & Cookies', 'Beverages', 'Dry Fruits & Cereals', 'Desserts & Ice Creams', 'Meat & Fish', 'Household & Stationery'];

  const { data: cats } = await supabase.from('categories').select('id, name').in('name', targetCatNames);
  for (const cat of (cats || [])) {
    const { data: items } = await supabase.from('demo_items').select('id, name, sell_mode, default_image').eq('category_id', cat.id);
    console.log(`\n=== Category: "${cat.name}" (${items?.length || 0} items) ===`);
    console.log('Sample 10 items:', items?.slice(0, 10).map(i => `"${i.name}" (${i.sell_mode})`));
  }
}

inspectRemainingCategories();
