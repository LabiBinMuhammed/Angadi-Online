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

async function check() {
  const { data: cats, error: err1 } = await supabase.from('categories').select('*').order('id');
  if (err1) {
    console.error('Error fetching categories:', err1);
    return;
  }
  const { data: items, error: err2 } = await supabase
    .from('demo_items')
    .select('id, name, category_id, default_image')
    .range(0, 4999);
  if (err2) {
    console.error('Error fetching items:', err2);
    return;
  }
  
  console.log('Total categories:', cats.length);
  console.log('Total demo_items:', items.length);
  console.log('----------------------------------------------------');
  
  for (const c of cats) {
    const cItems = items.filter(i => i.category_id === c.id);
    const withUnsplash = cItems.filter(i => i.default_image && i.default_image.includes('unsplash')).length;
    const withGrofers = cItems.filter(i => i.default_image && i.default_image.includes('grofers')).length;
    const other = cItems.length - withUnsplash - withGrofers;
    console.log(`${c.name.padEnd(25)} (ID ${String(c.id).padStart(2)}): Total: ${String(cItems.length).padStart(3)} | Unsplash: ${String(withUnsplash).padStart(3)} | Grofers: ${String(withGrofers).padStart(3)} | Other: ${other}`);
  }

  console.log('\n--- Items without Unsplash images ---');
  const nonUnsplash = items.filter(i => !i.default_image || !i.default_image.includes('unsplash'));
  for (const item of nonUnsplash) {
    const cat = cats.find(c => c.id === item.category_id);
    console.log(`[${cat ? cat.name : 'Unknown'}] ${item.name} -> ${item.default_image}`);
  }
}

check();
