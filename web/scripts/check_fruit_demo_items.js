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

async function checkFruits() {
  const { data: cat } = await supabase.from('categories').select('id').eq('name', 'Fresh Fruits').single();
  const { data: items, error } = await supabase
    .from('demo_items')
    .select('id, name, display_order, default_image')
    .eq('category_id', cat.id)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`--- Fresh Fruits in demo_items (${items.length} items) ---`);
  items.slice(0, 20).forEach(i => {
    console.log(`${String(i.display_order).padStart(3)}. ${i.name.padEnd(32)} -> ${i.default_image ? 'OK' : 'MISSING'}`);
  });
  console.log(`... and ${items.length - 20} more items.`);
}

checkFruits();
