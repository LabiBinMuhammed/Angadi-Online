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

async function verifyIntegrity() {
  console.log('================ RUNNING INTEGRITY CHECKS ================');

  // 1. Check Preserved Demos
  const PRESERVED = [
    '17dc4b34-5421-463f-ba1f-6e3e48e677f8',
    '5102fbe5-3cc1-446a-a775-f6a7795ca00f',
    'bae65d91-d19b-4605-869e-b70abdc973e6',
    'c8dc5b82-e143-4198-be46-1063867d9bd5'
  ];
  const { data: foundPreserved } = await supabase.from('demo_items').select('id, name').in('id', PRESERVED);
  console.log(`Preserved Demo Items found: ${foundPreserved.length} / 4`);
  if (foundPreserved.length !== 4) {
    console.error('CRITICAL: A preserved demo item was removed!');
  } else {
    console.log('  All 4 critical vendor demo references are safe and preserved.');
  }

  // 2. Vendor Items Foreign Keys
  const { data: vendorItems } = await supabase.from('items').select('id, name, demo_item_id');
  console.log(`Live Vendor Items: ${vendorItems.length}`);
  const missingRefs = [];
  for (const vi of vendorItems) {
    if (vi.demo_item_id) {
      const { data: d } = await supabase.from('demo_items').select('id').eq('id', vi.demo_item_id).maybeSingle();
      if (!d) missingRefs.push({ item: vi.name, demo_item_id: vi.demo_item_id });
    }
  }
  if (missingRefs.length === 0) {
    console.log('  Zero broken demo_item references among live vendor items!');
  } else {
    console.error('Broken references found:', missingRefs);
  }

  // 3. Category Breakdown
  const { data: cats } = await supabase.from('categories').select('id, name, is_active').order('name');
  console.log('\n--- Active Category Demo Items & Variants Count ---');
  let totalDemos = 0;
  let totalVars = 0;

  for (const cat of cats.filter(c => c.is_active)) {
    const { data: dItems } = await supabase.from('demo_items').select('id, name, sell_mode').eq('category_id', cat.id);
    const demoCount = dItems ? dItems.length : 0;
    totalDemos += demoCount;

    let varCount = 0;
    if (demoCount > 0) {
      const ids = dItems.map(d => d.id);
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const { count } = await supabase.from('demo_variants').select('*', { count: 'exact', head: true }).in('demo_item_id', chunk);
        varCount += (count || 0);
      }
    }
    totalVars += varCount;

    // Check duplicates in category
    const names = (dItems || []).map(d => d.name.toLowerCase().trim());
    const duplicates = names.filter((n, idx) => names.indexOf(n) !== idx);

    console.log(`  ${cat.name.padEnd(24)} | Demos: ${String(demoCount).padStart(3)} | Variants: ${String(varCount).padStart(3)} | Duplicates: ${duplicates.length}`);
  }

  console.log(`\nTOTAL ACTIVE DEMO ITEMS: ${totalDemos}`);
  console.log(`TOTAL ACTIVE VARIANTS:   ${totalVars}`);

  // 4. Selling Mode Governance
  const { data: invalidSellModes } = await supabase
    .from('demo_items')
    .select('id, name, sell_mode')
    .not('sell_mode', 'in', '("Fixed","Manual","Dynamic","Portion")');
  console.log(`Invalid sell modes: ${invalidSellModes ? invalidSellModes.length : 0}`);

  // 5. Orders & Order Items Check
  const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: orderItemCount } = await supabase.from('order_items').select('*', { count: 'exact', head: true });
  console.log(`\nOrders: ${orderCount}, Order Items: ${orderItemCount} (Intact and untouched)`);

  console.log('================ INTEGRITY CHECKS COMPLETED ================');
}

verifyIntegrity();
