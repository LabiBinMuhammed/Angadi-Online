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

const OIL_CAT = 'f2429c0e-d038-4557-8aa1-969af9a4f99a';
const SPICE_CAT = '629d2052-6c3c-4102-95c5-6db8a85706f8';

async function verifyDb() {
  console.log('=== DATABASE INTEGRITY VERIFICATION ===\n');

  // 1. Check Counts
  const { data: oilItems } = await supabase.from('demo_items').select('*').eq('category_id', OIL_CAT).order('display_order');
  const { data: spiceItems } = await supabase.from('demo_items').select('*').eq('category_id', SPICE_CAT).order('display_order');

  console.log(`Oils & Ghee items count in DB: ${oilItems.length}`);
  console.log(`Spices & Masalas items count in DB: ${spiceItems.length}`);

  if (oilItems.length !== 48 || spiceItems.length !== 121) {
    console.error('Count mismatch in demo_items!');
    process.exit(1);
  }

  const allItemIds = [...oilItems.map(i => i.id), ...spiceItems.map(i => i.id)];

  // 2. Check Sell Configs
  const { data: configs } = await supabase.from('demo_sell_config').select('*').in('demo_item_id', allItemIds);
  console.log(`Sell Configs count in DB: ${configs.length} (expected ${allItemIds.length})`);
  if (configs.length !== allItemIds.length) {
    console.error('Sell config count mismatch!');
    process.exit(1);
  }

  // 3. Check Variants
  const { data: variants } = await supabase.from('demo_variants').select('*').in('demo_item_id', allItemIds);
  console.log(`Variants count in DB: ${variants.length} (expected 387)`);
  if (variants.length !== 387) {
    console.error('Variants count mismatch!');
    process.exit(1);
  }

  // 4. Verify FK references and null checks
  const { data: units } = await supabase.from('units').select('id, name');
  const unitMap = new Set(units.map(u => u.id));

  for (const item of [...oilItems, ...spiceItems]) {
    if (!unitMap.has(item.unit_id)) {
      console.error(`Invalid unit_id in item ${item.name}: ${item.unit_id}`);
      process.exit(1);
    }
  }

  for (const v of variants) {
    if (!unitMap.has(v.unit_id)) {
      console.error(`Invalid unit_id in variant ${v.label}: ${v.unit_id}`);
      process.exit(1);
    }
  }

  // 5. Check duplicate names or codes
  const seenNames = new Set();
  const seenCodes = new Set();
  for (const item of [...oilItems, ...spiceItems]) {
    const norm = item.name.toLowerCase().trim();
    if (seenNames.has(norm)) {
      console.error(`Duplicate name in DB: ${item.name}`);
      process.exit(1);
    }
    seenNames.add(norm);

    if (seenCodes.has(item.code)) {
      console.error(`Duplicate code in DB: ${item.code}`);
      process.exit(1);
    }
    seenCodes.add(item.code);
  }

  // 6. Test Key Search Queries
  const testTerms = ['coconut', 'ghee', 'sesame', 'turmeric', 'kashmiri', 'sambar', 'chicken masala', 'kudampuli', 'pepper', 'chukku'];
  console.log('\n--- TESTING SEARCH QUERIES ---');
  for (const term of testTerms) {
    const matches = [...oilItems, ...spiceItems].filter(i => i.name.toLowerCase().includes(term));
    console.log(`Query "${term}": ${matches.length} matches (sample: ${matches.slice(0, 3).map(m => m.name).join(', ')})`);
    if (matches.length === 0) {
      console.warn(`Warning: No match found for "${term}"!`);
    }
  }

  console.log('\n[ALL CHECKS PASSED] Database integrity verified 100%!');
}

verifyDb();
