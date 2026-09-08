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

async function run() {
  const { data: cats } = await supabase.from('categories').select('*').order('display_order');
  console.log('--- ALL CATEGORIES ---');
  cats.forEach(c => {
    console.log(`id: ${c.id}, name: "${c.name}", is_active: ${c.is_active}, display_order: ${c.display_order}`);
  });
}

run();
