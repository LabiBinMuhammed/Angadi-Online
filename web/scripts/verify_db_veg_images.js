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

async function verifyDatabaseImages() {
  const { data: cats } = await supabase.from('categories').select('id, name').eq('name', 'Fresh Vegetables');
  const catId = cats[0].id;
  
  const { data: items } = await supabase
    .from('demo_items')
    .select('id, name, default_image')
    .eq('category_id', catId)
    .order('name');
    
  console.log(`Total veg items in DB: ${items.length}`);
  
  // Group by default_image
  const imageCounts = {};
  items.forEach(it => {
    imageCounts[it.default_image] = (imageCounts[it.default_image] || 0) + 1;
  });
  
  console.log(`Distinct image URLs used across 147 vegetables: ${Object.keys(imageCounts).length}`);
  
  console.log('\n--- 25 Sample Products & Their Images ---');
  items.slice(0, 25).forEach((it, idx) => {
    console.log(`${idx + 1}. [${it.name}] -> ${it.default_image}`);
  });
}

verifyDatabaseImages();
