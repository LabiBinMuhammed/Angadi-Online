const fs = require('fs');
const path = require('path');
const { createClient } = require(path.join(__dirname, '../web/node_modules/@supabase/supabase-js'));

const envText = fs.readFileSync('web/.env.local', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: items } = await supabase
    .from('demo_items')
    .select('id, code, name, default_image')
    .ilike('code', 'ANG-STA-%')
    .order('code');

  console.log(`Total ANG-STA- items in DB: ${items ? items.length : 0}`);

  // Check how many have images, check duplicates or gaps
  const codes = items.map(i => i.code);
  console.log('Sample items in DB:');
  items.slice(0, 10).forEach(i => console.log(`  ${i.code}: ${i.name} -> ${i.default_image}`));

  // Check for any duplicate codes or missing images
  let nullImgs = items.filter(i => !i.default_image);
  console.log(`Items with missing image: ${nullImgs.length}`);
}

run();
