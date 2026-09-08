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

async function exportVegList() {
  const { data: cats, error: cErr } = await supabase.from('categories').select('id, name').eq('name', 'Fresh Vegetables');
  console.log('Cats:', cats, cErr);
  const cat = cats[0];
  const { data: items, error } = await supabase
    .from('demo_items')
    .select('id, name, default_image')
    .eq('category_id', cat.id)
    .order('name');
  if (error) {
    console.error('Error fetching demo_items:', error);
    return;
  }
  
  fs.writeFileSync(path.join(__dirname, 'veg_items.json'), JSON.stringify(items, null, 2));
  console.log(`Exported ${items.length} items to veg_items.json`);
}

exportVegList();
