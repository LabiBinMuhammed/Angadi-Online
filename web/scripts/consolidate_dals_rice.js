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

const PRESERVED_DEMO_IDS = new Set([
  '17dc4b34-5421-463f-ba1f-6e3e48e677f8',
  '5102fbe5-3cc1-446a-a775-f6a7795ca00f',
  'bae65d91-d19b-4605-869e-b70abdc973e6',
  'c8dc5b82-e143-4198-be46-1063867d9bd5'
]);

async function consolidate() {
  const { data: cats } = await supabase.from('categories').select('id, name').in('name', ['Dals, Pulses & Beans', 'Rice, Atta & Flours']);

  for (const cat of cats) {
    const { data: items } = await supabase.from('demo_items').select('*').eq('category_id', cat.id);
    const groups = {};
    items.forEach(i => {
      const lower = i.name.toLowerCase().trim();
      if (!groups[lower]) groups[lower] = [];
      groups[lower].push(i);
    });

    let mergedCount = 0;
    for (const [name, list] of Object.entries(groups)) {
      if (list.length > 1) {
        // Find if any is preserved
        let primary = list.find(x => PRESERVED_DEMO_IDS.has(x.id)) || list[0];
        const secondary = list.filter(x => x.id !== primary.id);

        for (const sec of secondary) {
          // Check if vendor items reference sec.id
          const { data: vendorRefs } = await supabase.from('items').select('id').eq('demo_item_id', sec.id);
          if (vendorRefs && vendorRefs.length > 0) {
            // Re-point vendor items to primary
            await supabase.from('items').update({ demo_item_id: primary.id }).eq('demo_item_id', sec.id);
          }

          // Move any variants of sec to primary
          await supabase.from('demo_variants').update({ demo_item_id: primary.id }).eq('demo_item_id', sec.id);

          // Delete sec sell config and demo_item
          await supabase.from('demo_sell_config').delete().eq('demo_item_id', sec.id);
          await supabase.from('demo_items').delete().eq('id', sec.id);
          mergedCount++;
        }
      }
    }
    console.log(`Consolidated category "${cat.name}": removed ${mergedCount} duplicate master items.`);
  }
}

consolidate();
