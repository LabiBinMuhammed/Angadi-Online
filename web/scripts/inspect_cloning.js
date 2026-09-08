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

async function inspectCloning() {
  const { data: fks, error: fkErr } = await supabase.rpc('exec_sql', {
    sql: `SELECT conname, confdeltype FROM pg_constraint WHERE conrelid = 'items'::regclass;`
  });
  console.log('FKs:', fks, 'Error:', fkErr);
}

inspectCloning();
