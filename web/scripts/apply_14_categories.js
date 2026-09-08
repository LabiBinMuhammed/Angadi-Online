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

const APPROVED_CATEGORIES = [
  { name: 'Fresh Vegetables', description: 'Leafy, root, and exotic farm-fresh vegetables', display_order: 1, unit_groups: ['Weight'] },
  { name: 'Fresh Fruits', description: 'Tropical, imported, and organic seasonal fresh fruits', display_order: 2, unit_groups: ['Weight'] },
  { name: 'Rice, Atta & Flours', description: 'Staple grains, wheat flours, rice, and breakfast oats', display_order: 3, unit_groups: ['Weight', 'Count'] },
  { name: 'Dals, Pulses & Beans', description: 'Whole and split lentils, chickpeas, rajma, and beans', display_order: 4, unit_groups: ['Weight', 'Count'] },
  { name: 'Dairy', description: 'Fresh milk, curd, paneer, butter milk, and cheeses', display_order: 5, unit_groups: ['Volume', 'Count', 'Weight'] },
  { name: 'Oils & Ghee', description: 'Cooking edible oils, pure cow ghee, and table butter', display_order: 6, unit_groups: ['Volume', 'Count', 'Weight'] },
  { name: 'Spices & Masalas', description: 'Ground spice powders, whole spices, and curry blends', display_order: 7, unit_groups: ['Weight', 'Count'] },
  { name: 'Bakery', description: 'Fresh breads, buns, slice cakes, brownies, and rusks', display_order: 8, unit_groups: ['Count', 'Weight'] },
  { name: 'Biscuits & Cookies', description: 'Tea biscuits, cookies, cream sandwiches, and crackers', display_order: 9, unit_groups: ['Count', 'Weight'] },
  { name: 'Dry Fruits & Cereals', description: 'Premium nuts, edible seeds, granola, and breakfast cereals', display_order: 10, unit_groups: ['Weight', 'Count'] },
  { name: 'Beverages', description: 'Black tea, instant coffee, fruit juices, and soft drinks', display_order: 11, unit_groups: ['Volume', 'Count'] },
  { name: 'Desserts & Ice Creams', description: 'Ice cream tubs, kulfi, cones, payasam mixes, and sweets', display_order: 12, unit_groups: ['Volume', 'Count', 'Weight'] },
  { name: 'Meat & Fish', description: 'Fresh poultry, mutton, seafood, and farm eggs', display_order: 13, unit_groups: ['Weight', 'Count'] },
  { name: 'Household & Stationery', description: 'Daily household essentials, cleaning products, and stationery', display_order: 14, unit_groups: ['Count', 'Weight'] }
];

async function run() {
  console.log('--- Applying 14 Approved Categories to Supabase ---');

  // 1. Fetch unit groups
  const { data: groups, error: gErr } = await supabase.from('unit_groups').select('id, name');
  if (gErr) throw gErr;
  const groupMap = {};
  groups.forEach(g => { groupMap[g.name] = g.id; });
  console.log('Unit Groups Map:', groupMap);

  // 2. Fetch existing categories
  const { data: existingCats, error: cErr } = await supabase.from('categories').select('*');
  if (cErr) throw cErr;

  const existingMap = {};
  existingCats.forEach(c => { existingMap[c.name.toLowerCase().trim()] = c; });

  const catIdMap = {};

  for (const cat of APPROVED_CATEGORIES) {
    const key = cat.name.toLowerCase().trim();
    let catId;
    if (existingMap[key]) {
      // Update existing
      const existing = existingMap[key];
      catId = existing.id;
      const { error: updErr } = await supabase.from('categories').update({
        name: cat.name,
        description: cat.description,
        display_order: cat.display_order,
        is_active: true
      }).eq('id', catId);

      if (updErr) console.error(`Error updating ${cat.name}:`, updErr.message);
      else console.log(`✓ Updated category: ${cat.name} (${catId})`);
    } else {
      // Insert new
      const { data: inserted, error: insErr } = await supabase.from('categories').insert({
        name: cat.name,
        description: cat.description,
        display_order: cat.display_order,
        is_active: true
      }).select().single();

      if (insErr) {
        console.error(`Error inserting ${cat.name}:`, insErr.message);
      } else {
        catId = inserted.id;
        console.log(`+ Created category: ${cat.name} (${catId})`);
      }
    }

    if (catId) {
      catIdMap[cat.name] = catId;

      // Bind category_unit_groups
      for (const grpName of cat.unit_groups) {
        const grpId = groupMap[grpName];
        if (grpId) {
          const { data: existingBind } = await supabase.from('category_unit_groups')
            .select('*')
            .eq('category_id', catId)
            .eq('unit_group_id', grpId);
          if (!existingBind || existingBind.length === 0) {
            const { error: bindErr } = await supabase.from('category_unit_groups').insert({
              category_id: catId,
              unit_group_id: grpId
            });
            if (bindErr) console.error(`Error binding ${cat.name} to ${grpName}:`, bindErr.message);
            else console.log(`  Bound ${cat.name} to unit group ${grpName}`);
          }
        }
      }
    }
  }

  // Deactivate legacy categories that are not in the 14 approved categories
  const approvedNames = APPROVED_CATEGORIES.map(c => c.name.toLowerCase().trim());
  for (const c of existingCats) {
    if (!approvedNames.includes(c.name.toLowerCase().trim())) {
      console.log(`Deactivating legacy category: ${c.name} (${c.id})`);
      await supabase.from('categories').update({ is_active: false }).eq('id', c.id);
    }
  }

  // Verify final active categories
  const { data: finalCats, error: finalErr } = await supabase.from('categories').select('id, name, display_order, is_active').order('display_order');
  if (finalErr) console.error('Final query error:', finalErr);
  console.log('\nFinal Active Categories in Supabase:');
  finalCats.filter(c => c.is_active).forEach(c => {
    console.log(`  [#${c.display_order}] ${c.name} (ID: ${c.id})`);
  });

  console.log('\nCategory migration completed successfully!');
}

run().catch(console.error);
