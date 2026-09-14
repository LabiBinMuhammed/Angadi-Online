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

function testUrl(url) {
  return new Promise(resolve => {
    https.get(url, res => {
      resolve({ status: res.statusCode, contentType: res.headers['content-type'], length: res.headers['content-length'] });
    }).on('error', err => resolve({ error: err.message }));
  });
}

async function run() {
  console.log('=== VERIFYING ALL STATIONERY TEMPLATES (APSARA, NATARAJ, DOMS, AMARIZ) ===');

  const { data: apsara } = await supabase.from('demo_items').select('code, name, default_image').ilike('code', 'ANG-STA-00%').order('code');
  const { data: apsaraMore } = await supabase.from('demo_items').select('code, name, default_image').ilike('code', 'ANG-STA-01%').order('code');
  const totalApsara = [...(apsara || []), ...(apsaraMore || [])];

  const { data: nataraj } = await supabase.from('demo_items').select('code, name, default_image').ilike('code', 'ANG-STA-02%').order('code');
  
  const { data: doms } = await supabase.from('demo_items').select('code, name, default_image').or('code.ilike.ANG-STA-03%,code.ilike.ANG-STA-04%,code.ilike.ANG-STA-05%,code.ilike.ANG-STA-06%,code.ilike.ANG-STA-07%').order('code');

  console.log(`Apsara templates: ${totalApsara.length} (Expected 121)`);
  console.log(`Nataraj templates: ${nataraj ? nataraj.length : 0} (Expected 54)`);
  console.log(`DOMS & Amariz templates: ${doms ? doms.length : 0} (Expected 446)`);
  const totalStationery = totalApsara.length + (nataraj ? nataraj.length : 0) + (doms ? doms.length : 0);
  console.log(`Total Stationery templates: ${totalStationery} (Expected 621)`);

  // Test CDN samples from each brand
  console.log('\n--- Testing Nataraj CDN Images ---');
  if (nataraj && nataraj.length > 0) {
    for (const item of [nataraj[0], nataraj[15], nataraj[30], nataraj[nataraj.length - 1]]) {
      const res = await testUrl(item.default_image);
      console.log(`  ${item.code}: [HTTP ${res.status}] ${res.contentType} -> ${item.name}`);
    }
  }

  console.log('\n--- Testing DOMS CDN Images ---');
  if (doms && doms.length > 0) {
    for (const item of [doms[0], doms[50], doms[150], doms[300], doms[doms.length - 1]]) {
      const res = await testUrl(item.default_image);
      console.log(`  ${item.code}: [HTTP ${res.status}] ${res.contentType} -> ${item.name}`);
    }
  }

  // System grand totals
  const { count: totalDemos } = await supabase.from('demo_items').select('*', { count: 'exact', head: true });
  const { count: transCount } = await supabase.from('demo_item_translations').select('*', { count: 'exact', head: true });
  const { count: variantCount } = await supabase.from('demo_variants').select('*', { count: 'exact', head: true });
  const { count: sellCount } = await supabase.from('demo_sell_config').select('*', { count: 'exact', head: true });

  console.log('\n=== SYSTEM GRAND TOTALS ===');
  console.log(`Total Demo Items in System: ${totalDemos}`);
  console.log(`Total Translations in System: ${transCount}`);
  console.log(`Total Variants in System: ${variantCount}`);
  console.log(`Total Sell Configs in System: ${sellCount}`);
}

run();
