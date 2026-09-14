const fs = require('fs');
const path = require('path');
const https = require('https');
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

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { method: 'HEAD' }, res => {
      resolve({ status: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', err => resolve({ error: err.message }));
  });
}

async function verify() {
  console.log('--- VERIFYING CAMERRY DEMO TEMPLATES IN SUPABASE ---');

  const { data: camerryItems, count } = await supabase
    .from('demo_items')
    .select('id, name, code, default_image, demo_variants(*), demo_item_translations(*)', { count: 'exact' })
    .ilike('name', 'Camerry%');

  console.log(`Found ${camerryItems.length} Camerry demo items.`);

  console.log('\nChecking random samples of uploaded Supabase Storage images:');
  const samples = [
    camerryItems[0],
    camerryItems[10],
    camerryItems[25],
    camerryItems[40],
    camerryItems[50],
    camerryItems[camerryItems.length - 1]
  ];

  for (const item of samples) {
    const res = await checkUrl(item.default_image);
    console.log(` - ${item.name} (${item.code}):`);
    console.log(`   Image: ${item.default_image}`);
    console.log(`   HTTP Status: ${res.status}, Type: ${res.contentType}`);
    console.log(`   Malayalam: ${item.demo_item_translations[0]?.name}`);
    console.log(`   Variants: ${item.demo_variants.map(v => `${v.label} (₹${v.price})`).join(', ')}`);
  }

  const { count: totalDes } = await supabase
    .from('demo_items')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', '48a2b255-5f70-49de-b383-c5cf877f9d3e');

  console.log(`\nTotal items now in "Desserts & Ice Creams": ${totalDes}`);
  console.log('✓ CAMERRY VERIFICATION COMPLETE!');
}

verify().catch(console.error);
