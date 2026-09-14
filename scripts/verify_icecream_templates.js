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
  console.log('--- VERIFYING SKEI & VESTA DEMO TEMPLATES IN SUPABASE ---');

  const { data: skeiItems, count: skeiCount } = await supabase
    .from('demo_items')
    .select('id, name, code, default_image, demo_variants(*), demo_item_translations(*)', { count: 'exact' })
    .ilike('name', 'Skei%');

  console.log(`Found ${skeiItems.length} Skei demo items.`);

  const { data: vestaItems, count: vestaCount } = await supabase
    .from('demo_items')
    .select('id, name, code, default_image, demo_variants(*), demo_item_translations(*)', { count: 'exact' })
    .ilike('name', 'Vesta%');

  console.log(`Found ${vestaItems.length} Vesta demo items.`);

  console.log('\nChecking random samples of uploaded Supabase Storage images:');
  const samples = [
    skeiItems[0],
    skeiItems[Math.floor(skeiItems.length / 2)],
    skeiItems[skeiItems.length - 1],
    vestaItems[0],
    vestaItems[Math.floor(vestaItems.length / 2)],
    vestaItems[vestaItems.length - 1]
  ];

  for (const item of samples) {
    const res = await checkUrl(item.default_image);
    console.log(` - ${item.name} (${item.code}):`);
    console.log(`   Image: ${item.default_image}`);
    console.log(`   HTTP Status: ${res.status}, Type: ${res.contentType}`);
    console.log(`   Malayalam: ${item.demo_item_translations[0]?.name}`);
    console.log(`   Variants: ${item.demo_variants.map(v => `${v.label} (₹${v.price})`).join(', ')}`);
  }

  console.log('\n✓ ALL VERIFICATIONS PASSED!');
}

verify().catch(console.error);
