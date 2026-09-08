const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(l => {
  const p = l.split('=');
  if (p.length >= 2) env[p[0].trim()] = p.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectVeg() {
  const { data: vegCat } = await supabase.from('categories').select('id').eq('name', 'Fresh Vegetables').single();
  const { data: items } = await supabase.from('demo_items').select('id, name, default_image').eq('category_id', vegCat.id).order('name');
  
  console.log(`Total vegetables in demo_items: ${items.length}`);
  
  // Group by image
  const imgMap = {};
  items.forEach(item => {
    const img = item.default_image || 'NO_IMAGE';
    if (!imgMap[img]) imgMap[img] = [];
    imgMap[img].push(item.name);
  });
  
  console.log(`Total unique image URLs used: ${Object.keys(imgMap).length}`);
  console.log('--- Breakdown of Images and Products ---');
  for (const [img, names] of Object.entries(imgMap)) {
    console.log(`\nURL: ${img} (${names.length} products):`);
    names.forEach(n => console.log(`   * ${n}`));
  }
}

inspectVeg();
