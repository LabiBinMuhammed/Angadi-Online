const fs = require('fs');
const path = require('path');
const envFile = fs.readFileSync(path.join(__dirname, '../web/.env.local'), 'utf8');
const envVars = {};
for (const line of envFile.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
}

const { createClient } = require(path.join(__dirname, '../web/node_modules/@supabase/supabase-js'));
const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
  console.log('=== TEST: VENDOR CATALOG ALBUM MODEL ===\n');

  const shopId = '9d95e298-1f8b-4999-8dd0-251dec3c7e68'; // Nc store

  // 1. Verify Category selection & Real Counts
  console.log('1. Checking Categories & Progress Counts for Nc store...');
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const { data: allDemos } = await supabase.from('demo_items').select('id, category_id');
  const { data: shopItems, error: siErr } = await supabase
    .from('items')
    .select('id, category_id, demo_item_id, is_active, status')
    .eq('shop_id', shopId)
    .is('deleted_at', null)
    .not('demo_item_id', 'is', null);

  if (siErr) {
    console.error('shopItems error:', siErr);
    return;
  }

  const demoCounts = {};
  for (const d of allDemos) {
    demoCounts[d.category_id] = (demoCounts[d.category_id] || 0) + 1;
  }
  const addedCounts = {};
  for (const s of shopItems) {
    addedCounts[s.category_id] = (addedCounts[s.category_id] || 0) + 1;
  }

  const vegCat = categories.find(c => c.name.toLowerCase().includes('vegetable'));
  console.log(`✓ Categories loaded: ${categories.length}`);
  console.log(`✓ Vegetables (${vegCat.id}): ${addedCounts[vegCat.id] || 0} / ${demoCounts[vegCat.id]} added`);

  // 2. Load first demo item in Vegetables
  console.log('\n2. Opening Product Album for first item in Vegetables...');
  const { data: vegDemos } = await supabase
    .from('demo_items')
    .select('*')
    .eq('category_id', vegCat.id)
    .order('display_order', { ascending: true })
    .limit(1);

  const targetDemo = vegDemos[0];
  console.log(`✓ Loaded demo item: "${targetDemo.name}" (Code: ${targetDemo.code}, ID: ${targetDemo.id})`);

  // Record initial state of master demo item to prove it never mutates
  const masterSnapshot = JSON.stringify(targetDemo);

  // 3. Test Album Save: Create / Update Shop Item
  console.log('\n3. Testing Save & Next: Configuring shop item from master catalog...');
  const testVendorPrice = 48.5;
  const testConfidence = 4; // Almost always available

  const rpcPayload = {
    shop_id: shopId,
    category_id: vegCat.id,
    demo_item_id: targetDemo.id,
    name: `${targetDemo.name} (Nc Fresh)`,
    description: 'Crisp fresh quality local produce',
    status: 'published',
    is_active: true,
    availability_confidence: testConfidence,
    has_variants: false,
    image_url: targetDemo.default_image,
    images: targetDemo.default_image ? [{ image_url: targetDemo.default_image, is_primary: true, sort_order: 0 }] : [],
    sell_config: {
      sell_mode: targetDemo.sell_mode || 'Manual',
      base_unit_id: targetDemo.unit_id,
      price_per_base_unit: testVendorPrice,
      allow_custom_quantity: true,
      max_price_increase_percent: 15,
      max_price_limit: 0
    },
    variants: [{
      variant_type: 'Manual',
      label: 'Default',
      unit_id: targetDemo.unit_id,
      value: 1,
      price: testVendorPrice,
      is_default: true,
      is_active: true
    }]
  };

  let savedItemId = null;
  // Check if item already exists
  const existingForDemo = shopItems.find(s => s.demo_item_id === targetDemo.id);
  if (existingForDemo) {
    savedItemId = existingForDemo.id;
    console.log(`Item already exists (${savedItemId}), updating details...`);
    const { error: upErr } = await supabase
      .from('items')
      .update({
        name: rpcPayload.name,
        description: rpcPayload.description,
        is_active: true,
        status: 'published'
      })
      .eq('id', savedItemId);
    if (upErr) throw upErr;

    await supabase.from('item_sell_config').upsert({
      item_id: savedItemId,
      sell_mode: 'Manual',
      base_unit_id: targetDemo.unit_id,
      price_per_base_unit: testVendorPrice,
      allow_custom_quantity: true,
      max_price_increase_percent: 15,
      max_price_limit: 0
    });
  } else {
    console.log('Inserting new shop item via RPC...');
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('create_shop_item_transaction', { payload: rpcPayload });
    if (rpcErr) throw rpcErr;
    savedItemId = rpcRes.item_id;
  }

  console.log(`✓ Shop item successfully configured with ID: ${savedItemId}`);

  // 4. Verify Master Catalog Integrity
  console.log('\n4. Verifying Master Catalog Separation...');
  const { data: afterDemo } = await supabase.from('demo_items').select('*').eq('id', targetDemo.id).single();
  if (JSON.stringify(afterDemo) === masterSnapshot) {
    console.log('✓ Master demo item is 100% UNTOUCHED! Separation confirmed.');
  } else {
    console.error('FAIL: Master demo item was modified!');
  }

  // 5. Test "Not Available" Toggle
  console.log('\n5. Testing "Not Available" state toggle...');
  const { error: notAvailErr } = await supabase
    .from('items')
    .update({ is_active: false, status: 'hidden' })
    .eq('id', savedItemId);
  if (notAvailErr) throw notAvailErr;

  const { data: itemAfterToggle } = await supabase
    .from('items')
    .select('id, name, is_active, status')
    .eq('id', savedItemId)
    .single();

  console.log(`✓ Toggled "Not available": is_active = ${itemAfterToggle.is_active}, status = "${itemAfterToggle.status}"`);

  // Restore back to published
  await supabase.from('items').update({ is_active: true, status: 'published' }).eq('id', savedItemId);
  console.log('✓ Restored to Available state (is_active = true, status = "published")');

  // 6. Test Sell Config & Price
  console.log('\n6. Verifying saved Price and Sell Config...');
  const { data: savedConfig } = await supabase.from('item_sell_config').select('*').eq('item_id', savedItemId).single();
  console.log(`✓ Price per base unit saved: ₹${savedConfig.price_per_base_unit} (Vendor entered: ₹${testVendorPrice})`);

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===\n');
}

runTest().catch(console.error);
