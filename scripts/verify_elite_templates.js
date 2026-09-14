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
  console.log('--- VERIFYING ELITE FOODS DEMO TEMPLATES ACROSS CATEGORIES ---');

  const { data: eliteItems } = await supabase
    .from('demo_items')
    .select('id, name, code, category_id, default_image, demo_variants(*), demo_item_translations(*)')
    .ilike('name', 'Elite%');

  console.log(`Found ${eliteItems.length} Elite demo items in database.`);

  const { data: cats } = await supabase.from('categories').select('id, name');
  const catMap = new Map(cats.map(c => [c.id, c.name]));

  const byCat = {};
  eliteItems.forEach(it => {
    const cName = catMap.get(it.category_id) || 'Unknown';
    byCat[cName] = (byCat[cName] || 0) + 1;
  });

  console.log('\nElite items distribution across categories:');
  console.table(byCat);

  console.log('\nChecking random samples of uploaded Supabase Storage images:');
  const sampleIndices = [0, 15, 45, 75, 95, 115, eliteItems.length - 1];
  for (const idx of sampleIndices) {
    const item = eliteItems[idx];
    if (!item) continue;
    const res = await checkUrl(item.default_image);
    console.log(` - ${item.name} (${item.code}) [Category: ${catMap.get(item.category_id)}]:`);
    console.log(`   Image: ${item.default_image}`);
    console.log(`   HTTP Status: ${res.status}, Type: ${res.contentType}`);
    console.log(`   Malayalam: ${item.demo_item_translations[0]?.name}`);
    console.log(`   Variants: ${item.demo_variants.map(v => `${v.label} (₹${v.price})`).join(', ')}`);
  }

  const { count: totalItems } = await supabase
    .from('demo_items')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal demo items in database: ${totalItems}`);
  console.log('✓ ELITE FOODS VERIFICATION COMPLETED!');
}

verify().catch(console.error);
