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

async function inspectFruits() {
  const { data: cat } = await supabase.from('categories').select('id').eq('name', 'Fresh Fruits').single();
  const { data: items } = await supabase.from('demo_items').select('id, name, unit_id, sell_mode').eq('category_id', cat.id);
  console.log(`Fresh Fruits demo items: ${items ? items.length : 0}`);
  if (items && items.length > 0) {
    console.log('Sample 10 items:', items.slice(0, 10));
  }
}

inspectFruits();
