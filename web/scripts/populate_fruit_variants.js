const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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

const UNITS = {
  kg: 'fc6f287c-0b3c-458e-8d4f-4679d0059c32',
  g: '32d0b812-34cc-415c-b7cf-1f96dc2f841f',
  pcs: '9137e686-0e75-4a6b-a261-891b1e4e9774'
};

async function addFruitVariants() {
  const { data: cat } = await supabase.from('categories').select('id').eq('name', 'Fresh Fruits').single();
  const { data: items } = await supabase.from('demo_items').select('id, name, unit_id, sell_mode').eq('category_id', cat.id);

  console.log(`Checking ${items.length} Fresh Fruits items for variants...`);
  const variantsToInsert = [];

  for (const item of items) {
    const { count } = await supabase.from('demo_variants').select('*', { count: 'exact', head: true }).eq('demo_item_id', item.id);
    if ((count || 0) === 0) {
      if (item.unit_id === UNITS.kg) {
        variantsToInsert.push({
          id: uuidv4(),
          demo_item_id: item.id,
          variant_type: item.sell_mode || 'Manual',
          label: '500g',
          unit_id: UNITS.g,
          value: 500,
          price: 0,
          is_default: false,
          is_active: true,
          display_order: 1
        });
        variantsToInsert.push({
          id: uuidv4(),
          demo_item_id: item.id,
          variant_type: item.sell_mode || 'Manual',
          label: '1kg',
          unit_id: UNITS.kg,
          value: 1,
          price: 0,
          is_default: true,
          is_active: true,
          display_order: 2
        });
      } else {
        variantsToInsert.push({
          id: uuidv4(),
          demo_item_id: item.id,
          variant_type: item.sell_mode || 'Fixed',
          label: '1 pc',
          unit_id: UNITS.pcs,
          value: 1,
          price: 0,
          is_default: true,
          is_active: true,
          display_order: 1
        });
      }
    }
  }

  console.log(`Found ${variantsToInsert.length} variants to insert for Fresh Fruits...`);
  for (let i = 0; i < variantsToInsert.length; i += 100) {
    const chunk = variantsToInsert.slice(i, i + 100);
    const { error } = await supabase.from('demo_variants').insert(chunk);
    if (error) console.error('Error inserting fruit variants chunk:', error.message);
  }
  console.log('Done inserting Fresh Fruits variants!');
}

addFruitVariants();
