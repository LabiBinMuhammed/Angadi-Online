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

async function runAudit() {
  console.log('================ AUDITING ANGADI DATABASE ================');

  // 1. Categories
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });
  console.log(`\n--- Categories (${categories ? categories.length : 0}) ---`);
  if (catErr) console.error('Cat err:', catErr);
  else {
    categories.forEach(c => console.log(`  ${c.id} | ${c.name} | active: ${c.is_active} | order: ${c.display_order}`));
  }

  // 2. Units
  const { data: units } = await supabase.from('units').select('*');
  console.log(`\n--- Units (${units ? units.length : 0}) ---`);
  units?.forEach(u => console.log(`  ${u.id} | ${u.name} (${u.symbol})`));

  // 3. Demo Items Count by Category
  const { data: demoItems } = await supabase.from('demo_items').select('id, category_id, name, sell_mode');
  console.log(`\n--- Demo Items Total: ${demoItems ? demoItems.length : 0} ---`);
  const catCount = {};
  demoItems?.forEach(d => {
    catCount[d.category_id] = (catCount[d.category_id] || 0) + 1;
  });
  categories?.forEach(c => {
    console.log(`  Category "${c.name}": ${catCount[c.id] || 0} demo items`);
  });

  // 4. Live Vendor Items
  const { data: items, error: itemErr } = await supabase.from('items').select('id, name, shop_id, category_id, demo_item_id, sell_mode');
  console.log(`\n--- Live Vendor Items Total: ${items ? items.length : 0} ---`);
  if (itemErr) console.error('Item err:', itemErr);
  else {
    console.log(`  Total vendor items: ${items.length}`);
    const demoRefs = items.filter(i => i.demo_item_id);
    console.log(`  Items referencing a demo_item_id: ${demoRefs.length}`);
  }

  // 5. Orders & Order Items
  const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: orderItemCount } = await supabase.from('order_items').select('*', { count: 'exact', head: true });
  console.log(`\n--- Orders & Historical Data ---`);
  console.log(`  Total orders: ${orderCount}`);
  console.log(`  Total order_items: ${orderItemCount}`);

  // 6. Check columns of demo_items and items
  const { data: sampleDemo } = await supabase.from('demo_items').select('*').limit(1);
  console.log(`\n--- demo_items columns: ---`);
  console.log(sampleDemo ? Object.keys(sampleDemo[0]) : 'None');

  const { data: sampleItem } = await supabase.from('items').select('*').limit(1);
  console.log(`\n--- items columns: ---`);
  console.log(sampleItem ? Object.keys(sampleItem[0]) : 'None');

  // 7. Check if brands table exists
  const { data: brands, error: brandErr } = await supabase.from('brands').select('*').limit(1);
  console.log(`\n--- brands table exists? ---`, brandErr ? `No (${brandErr.message})` : `Yes (${brands.length} rows)`);

  // 8. Check translations
  const { data: trans, error: transErr } = await supabase.from('translations').select('*').limit(5);
  console.log(`\n--- translations table ---`, transErr ? `No (${transErr.message})` : `Yes (${trans.length} sample rows)`);
  if (trans && trans.length > 0) {
    console.log('Sample translations:', trans);
  }
}

runAudit();
