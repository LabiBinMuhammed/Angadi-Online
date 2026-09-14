const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
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
  return new Promise(resolve => {
    try {
      const u = new URL(url);
      const client = u.protocol === 'https:' ? https : http;
      client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }, res => {
        resolve(res.statusCode);
      }).on('error', () => resolve(0));
    } catch (e) {
      resolve(0);
    }
  });
}

async function run() {
  console.log('=== VERIFYING EXPANDED CATALOG IN SUPABASE ===');

  // 1. Total counts
  const { count: totalItems } = await supabase
    .from('demo_items')
    .select('*', { count: 'exact', head: true });

  const { count: totalSta } = await supabase
    .from('demo_items')
    .select('*', { count: 'exact', head: true })
    .like('code', 'ANG-STA-%');

  const { count: totalPer } = await supabase
    .from('demo_items')
    .select('*', { count: 'exact', head: true })
    .like('code', 'ANG-PER-%');

  console.log(`Total Master Demo Items: ${totalItems}`);
  console.log(`Total Stationery Items: ${totalSta}`);
  console.log(`Total Personal Care Items: ${totalPer}`);

  // 2. Fetch all new items
  const { data: newSta } = await supabase
    .from('demo_items')
    .select('id, code, name, default_image, demo_item_translations(name), demo_variants(label, price)')
    .gte('code', 'ANG-STA-1001')
    .lte('code', 'ANG-STA-1109')
    .order('code', { ascending: true });

  const { data: newPer } = await supabase
    .from('demo_items')
    .select('id, code, name, default_image, demo_item_translations(name), demo_variants(label, price)')
    .gte('code', 'ANG-PER-0001')
    .lte('code', 'ANG-PER-0125')
    .order('code', { ascending: true });

  console.log(`\nNew Stationery fetched: ${newSta.length}`);
  console.log(`New Personal Care fetched: ${newPer.length}`);

  // Image storage audit
  const allNew = [...newSta, ...newPer];
  const storageHosted = allNew.filter(it => it.default_image && it.default_image.includes('supabase.co/storage')).length;
  const nonStorage = allNew.length - storageHosted;
  console.log(`\nImage Storage Audit:`);
  console.log(`  - Supabase Storage Hosted: ${storageHosted} / ${allNew.length}`);
  console.log(`  - Non-storage fallbacks: ${nonStorage}`);

  // Spot-check samples across brands
  const samples = [
    newSta.find(s => s.code === 'ANG-STA-1001'), // Papergrid
    newSta.find(s => s.code === 'ANG-STA-1025'), // Camlin
    newPer.find(s => s.code === 'ANG-PER-0001'), // Parachute
    newPer.find(s => s.code === 'ANG-PER-0011'), // Cinthol
    newPer.find(s => s.code === 'ANG-PER-0021'), // Santoor
    newPer.find(s => s.code === 'ANG-PER-0042'), // Vivel
    newPer.find(s => s.code === 'ANG-PER-0052'), // Cutee
    newPer.find(s => s.code === 'ANG-PER-0067'), // Lux
    newPer.find(s => s.code === 'ANG-PER-0075'), // Pears
    newPer.find(s => s.code === 'ANG-PER-0082'), // Himalaya
  ].filter(Boolean);

  console.log('\n--- Spot Check Samples ---');
  for (const s of samples) {
    const ml = s.demo_item_translations[0]?.name || 'N/A';
    const vars = s.demo_variants.map(v => `${v.label}: ₹${v.price}`).join(' | ');
    const code = await checkUrl(s.default_image);
    console.log(`[${s.code}] ${s.name}`);
    console.log(`  ML: ${ml}`);
    console.log(`  Image: ${s.default_image} (HTTP ${code})`);
    console.log(`  Variants: ${vars}\n`);
  }
}

run();
