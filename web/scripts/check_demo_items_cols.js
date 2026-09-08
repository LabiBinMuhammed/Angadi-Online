const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n');
const envMap = {};
env.forEach(l => { const [k, ...v] = l.split('='); if (k && v.length) envMap[k.trim()] = v.join('=').trim(); });

const supabase = createClient(envMap.NEXT_PUBLIC_SUPABASE_URL, envMap.SUPABASE_SERVICE_ROLE_KEY);

async function inspectDemoCols() {
  const { data: sample, error } = await supabase.from('demo_items').select('*').limit(1);
  if (error) console.error(error);
  else if (sample.length > 0) {
    console.log('Columns in demo_items:', Object.keys(sample[0]));
    console.log('Sample demo_item:', sample[0]);
  }
}
inspectDemoCols();
