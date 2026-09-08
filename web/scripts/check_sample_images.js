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

async function checkSampleImages() {
  const { data: cats } = await supabase.from('categories').select('*').eq('is_active', true).order('display_order');
  const { data: items } = await supabase.from('demo_items').select('id, category_id, name, default_image');
  
  for (const cat of cats) {
    const catItems = items.filter(i => i.category_id === cat.id);
    console.log(`\n=== Category: ${cat.name} (${catItems.length} items) ===`);
    const uniqueImages = new Set(catItems.map(i => i.default_image).filter(Boolean));
    console.log(`Unique image URLs: ${uniqueImages.size} across ${catItems.length} items`);
    const sample = catItems.slice(0, 5);
    sample.forEach(s => {
      console.log(`  - ${s.name}: ${s.default_image}`);
    });
  }
}

checkSampleImages();
