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

async function inspectDB() {
  console.log('--- Categories ---');
  const { data: cats, error: cErr } = await supabase
    .from('categories')
    .select('*')
    .order('display_order');
  if (cErr) console.error('Categories error:', cErr);
  else {
    cats.forEach(c => console.log(`${c.id} | ${c.name} | parent: ${c.parent_id || 'root'} | active: ${c.is_active}`));
  }

  console.log('\n--- Unit Groups ---');
  const { data: uGroups, error: ugErr } = await supabase.from('unit_groups').select('*');
  if (ugErr) console.error('Unit groups error:', ugErr);
  else console.log('Unit groups:', uGroups);

  console.log('\n--- Units ---');
  const { data: units, error: uErr } = await supabase.from('units').select('*');
  if (uErr) console.error('Units error:', uErr);
  else console.log('Units:', units);

  console.log('\n--- Category Unit Groups ---');
  const { data: catUnits, error: cuErr } = await supabase.from('category_unit_groups').select('*');
  if (cuErr) console.error('Cat unit groups error:', cuErr);
  else {
    catUnits.forEach(cu => console.log(`Category ${cu.category_id} -> UnitGroup ${cu.unit_group_id}`));
  }

  const oilCat = cats ? cats.find(c => /oil|ghee/i.test(c.name)) : null;
  const spiceCat = cats ? cats.find(c => /spice|masala/i.test(c.name)) : null;

  if (oilCat) {
    console.log(`\n--- Existing items under ${oilCat.name} (${oilCat.id}) ---`);
    const { data: oilItems } = await supabase
      .from('demo_items')
      .select('id, name, unit_id, sell_mode')
      .eq('category_id', oilCat.id);
    console.log(`Total count: ${oilItems ? oilItems.length : 0}`);
    if (oilItems && oilItems.length > 0) {
      console.log('Sample items:', oilItems.slice(0, 8));
    }
  }

  if (spiceCat) {
    console.log(`\n--- Existing items under ${spiceCat.name} (${spiceCat.id}) ---`);
    const { data: spiceItems } = await supabase
      .from('demo_items')
      .select('id, name, unit_id, sell_mode')
      .eq('category_id', spiceCat.id);
    console.log(`Total count: ${spiceItems ? spiceItems.length : 0}`);
    if (spiceItems && spiceItems.length > 0) {
      console.log('Sample items:', spiceItems.slice(0, 8));
    }
  }

  console.log('\n--- Checking vendor items or shop items referencing demo_items ---');
  const { data: vendorItems, error: viErr } = await supabase.from('vendor_items').select('id, demo_item_id, name').limit(10);
  if (viErr) console.log('vendor_items error:', viErr.message);
  else console.log(`Sample vendor items (${vendorItems ? vendorItems.length : 0}):`, vendorItems);
}

inspectDB();
