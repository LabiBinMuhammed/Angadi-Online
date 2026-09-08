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

async function inspectDalsRiceDups() {
  const { data: cats } = await supabase.from('categories').select('id, name').in('name', ['Dals, Pulses & Beans', 'Rice, Atta & Flours']);

  for (const cat of cats) {
    const { data: items } = await supabase.from('demo_items').select('id, name').eq('category_id', cat.id);
    const names = {};
    items.forEach(i => {
      const lower = i.name.toLowerCase().trim();
      if (!names[lower]) names[lower] = [];
      names[lower].push(i.id);
    });

    const dups = Object.entries(names).filter(([k, v]) => v.length > 1);
    console.log(`\nCategory: "${cat.name}" has ${dups.length} duplicate names:`);
    dups.slice(0, 10).forEach(([k, v]) => console.log(`  "${k}": ${v.length} entries`));
  }
}

inspectDalsRiceDups();
