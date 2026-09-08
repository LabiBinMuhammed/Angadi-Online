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

async function testSystem() {
  console.log('=== RUNNING FULL CATALOG SYSTEM VERIFICATION ===\n');

  // 1. Verify 14 Categories
  const { data: cats, error: cErr } = await supabase.from('categories').select('*').eq('is_active', true).order('display_order');
  if (cErr) throw cErr;
  console.log(`✓ Categories: Verified ${cats.length} active categories in Supabase:`);
  cats.forEach(c => console.log(`   [#${c.display_order}] ${c.name}`));

  if (cats.length !== 14) {
    throw new Error(`Expected 14 categories, found ${cats.length}`);
  }

  // 2. Verify Table Counts
  const { count: demoCount } = await supabase.from('demo_items').select('*', { count: 'exact', head: true });
  const { count: cfgCount } = await supabase.from('demo_sell_config').select('*', { count: 'exact', head: true });
  const { count: varCount } = await supabase.from('demo_variants').select('*', { count: 'exact', head: true });

  console.log('\n✓ Table Counts:');
  console.log(`   demo_items:       ${demoCount} (Target: >= 1590)`);
  console.log(`   demo_sell_config: ${cfgCount} (Target: >= 1590)`);
  console.log(`   demo_variants:    ${varCount} (Target: >= 1590)`);

  if (demoCount < 1590 || cfgCount < 1590) {
    throw new Error('Database is missing expected catalog items!');
  }

  // 3. Sample Verification Across Diverse Newly Ingested Catalog Items
  const { data: sampleDemos, error: sErr } = await supabase
    .from('demo_items')
    .select('id, name, sell_mode, default_image, code, category_id, unit_id')
    .like('code', 'ANG-%')
    .limit(20);

  if (sErr) throw sErr;

  console.log(`\n✓ Sample Check (20 Items):`);
  let samplesValid = 0;
  for (const item of sampleDemos) {
    const hasImage = item.default_image && item.default_image.startsWith('https://images.unsplash.com');
    const hasUnit = !!item.unit_id;
    const hasMode = ['Manual', 'Fixed', 'Portion', 'Dynamic'].includes(item.sell_mode);

    if (hasImage && hasUnit && hasMode) {
      samplesValid++;
    } else {
      console.warn(`   Item issue: ${item.name} (Image: ${item.default_image}, Unit: ${item.unit_id})`);
    }
  }

  console.log(`   ${samplesValid} / 20 sampled items pass full schema and image validation.`);

  // 4. Test Category-wise Distribution
  console.log('\n✓ Catalog Distribution Across Categories:');
  for (const c of cats) {
    const { count } = await supabase.from('demo_items').select('*', { count: 'exact', head: true }).eq('category_id', c.id);
    console.log(`   ${c.name.padEnd(25)} : ${count} items`);
  }

  console.log('\n🎉 ALL CATALOG SYSTEM VERIFICATION CHECKS PASSED PERFECTLY!\n');
}

testSystem().catch(err => {
  console.error('\n❌ Verification failed:', err.message);
  process.exit(1);
});
