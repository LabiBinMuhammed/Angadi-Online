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

async function checkDemoTables() {
  const { data: dsc } = await supabase.from('demo_sell_config').select('*').limit(2);
  console.log('demo_sell_config columns & sample:', dsc);

  const { data: dv } = await supabase.from('demo_variants').select('*').limit(2);
  console.log('demo_variants columns & sample:', dv);
}

checkDemoTables();
