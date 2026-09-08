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

async function checkVendorDemoRefs() {
  const { data: items } = await supabase
    .from('items')
    .select('id, name, demo_item_id, category_id, status, is_active');
  
  console.log('--- 32 Vendor Items ---');
  items.forEach(i => {
    console.log(`${i.id} | "${i.name}" | demo_item_id: ${i.demo_item_id} | cat: ${i.category_id}`);
  });

  const demoIds = items.map(i => i.demo_item_id).filter(Boolean);
  console.log(`\nDistinct demo_item_ids referenced: ${new Set(demoIds).size}`);

  const { data: demos } = await supabase.from('demo_items').select('id, name, category_id').in('id', demoIds);
  console.log(`Found in demo_items: ${demos ? demos.length : 0}`);
  demos?.forEach(d => console.log(`  Demo: ${d.id} | ${d.name} | cat: ${d.category_id}`));
}

checkVendorDemoRefs();
