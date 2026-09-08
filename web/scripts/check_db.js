const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n');
const envMap = {};
env.forEach(l => { const [k, ...v] = l.split('='); if (k && v.length) envMap[k.trim()] = v.join('=').trim(); });

const supabase = createClient(envMap.NEXT_PUBLIC_SUPABASE_URL, envMap.SUPABASE_SERVICE_ROLE_KEY);

async function inspectUnits() {
  const { data: groups } = await supabase.from('unit_groups').select('*');
  console.log('Unit Groups:', groups);
  const { data: units } = await supabase.from('units').select('*');
  console.log('Units:', units.map(u => `${u.name} (${u.symbol}) [group: ${u.unit_group_id}]`));
}
inspectUnits();
