const fs = require('fs');
const path = require('path');
const { createClient } = require('d:/Labeeb/ANGADI/web/node_modules/@supabase/supabase-js');

// Load environment variables
const envContent = fs.readFileSync('d:/Labeeb/ANGADI/web/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = match[2] ? match[2].trim().replace(/^['"]|['"]$/g, '') : '';
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runRestructure() {
  console.log('--- STARTING CATEGORY RESTRUCTURING ---');

  // 1. Rename categories in-place
  console.log('\nStep 1: Renaming categories in-place...');
  
  const renames = [
    {
      id: 'f2429c0e-d038-4557-8aa1-969af9a4f99a',
      name: 'Cooking Essentials',
      description: 'Cooking edible oils, pure cow ghee, coconut oil, and culinary essentials'
    },
    {
      id: 'a57fb3c9-db6b-41ae-afd5-864a14134afe',
      name: 'Rice, Atta, Flours & Mixes',
      description: 'Staple grains, wheat flours, rice, breakfast mixes, and ready-to-cook batters'
    },
    {
      id: '5d5ce5cf-70e6-45da-8040-3c897a4dc14f',
      name: 'Dry Goods & Cereals',
      description: 'Premium nuts, dry fruits, edible seeds, granola, and breakfast cereals'
    }
  ];

  for (const r of renames) {
    const { data, error } = await supabase
      .from('categories')
      .update({ name: r.name, description: r.description, updated_at: new Date().toISOString() })
      .eq('id', r.id)
      .select();

    if (error) {
      console.error(`Error updating category ${r.id}:`, error);
      throw error;
    }
    console.log(`✓ Updated category ${r.id} -> "${r.name}"`);
  }

  // 2. Upsert Category Translations (Malayalam) for all 14 categories
  console.log('\nStep 2: Upserting Malayalam category translations...');
  const catTranslations = [
    { id: '004d3f4e-3e8c-4000-a9fe-5d3166da93fd', ml: 'പച്ചക്കറികൾ' },
    { id: '5b739fb4-cd2b-42e7-a94c-3f5fcdde1624', ml: 'പഴങ്ങൾ' },
    { id: 'a57fb3c9-db6b-41ae-afd5-864a14134afe', ml: 'അരി, ആട്ട, പൊടികൾ & മിക്സുകൾ' },
    { id: 'e2898efb-19d4-4f3e-9bf8-803fb7d8ac8e', ml: 'പരിപ്പുകൾ & പയറുവർഗ്ഗങ്ങൾ' },
    { id: 'f75a228d-4a1b-418f-ba0f-0fe75383fada', ml: 'പാൽ ഉൽപ്പന്നങ്ങൾ' },
    { id: 'f2429c0e-d038-4557-8aa1-969af9a4f99a', ml: 'പാചക അവശ്യവസ്തുക്കൾ' },
    { id: '629d2052-6c3c-4102-95c5-6db8a85706f8', ml: 'മസാലകൾ & സുഗന്ധവ്യഞ്ജനങ്ങൾ' },
    { id: '456d611f-a322-48ce-a6d8-287b225afde4', ml: 'ബേക്കറി' },
    { id: '00f4fa99-45e1-4001-b541-8a094d62adaa', ml: 'ബിസ്ക്കറ്റുകൾ & കുക്കികൾ' },
    { id: '5d5ce5cf-70e6-45da-8040-3c897a4dc14f', ml: 'ഡ്രൈ ഫ്രൂട്ട്സ് & ധാന്യങ്ങൾ' },
    { id: 'cc30f6b9-532d-48ad-8c1c-7e2542e62454', ml: 'പാനീയങ്ങൾ' },
    { id: '48a2b255-5f70-49de-b383-c5cf877f9d3e', ml: 'മധുരപലഹാരങ്ങൾ & ഐസ്ക്രീം' },
    { id: '898ecc4a-ed07-440d-82f4-92de7b722a4e', ml: 'ഇറച്ചി & മീൻ' },
    { id: 'a6f202ca-5423-4457-9c87-a53d8bc554fa', ml: 'വീട്ടുപകരണങ്ങൾ & സ്റ്റേഷനറി' }
  ];

  for (const ct of catTranslations) {
    // Check if existing translation exists
    const { data: existing } = await supabase
      .from('category_translations')
      .select('id')
      .eq('category_id', ct.id)
      .eq('language_code', 'ml')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('category_translations')
        .update({ name: ct.ml, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('category_translations')
        .insert({
          category_id: ct.id,
          language_code: 'ml',
          name: ct.ml
        });
    }
    console.log(`✓ Translation set for ${ct.id} -> ${ct.ml}`);
  }

  // 3. Reclassify specific items
  console.log('\nStep 3: Reclassifying misplaced items...');
  const reclassifications = [
    {
      name: 'Elanadu Crunchy Ghee Biscuits',
      targetCatId: '00f4fa99-45e1-4001-b541-8a094d62adaa', // Biscuits & Cookies
      targetCatName: 'Biscuits & Cookies'
    },
    {
      name: 'Elanadu Fresh Malai Paneer Block',
      targetCatId: 'f75a228d-4a1b-418f-ba0f-0fe75383fada', // Dairy
      targetCatName: 'Dairy'
    },
    {
      name: 'Elanadu Fresh Dairy Khoya / Mawa',
      targetCatId: 'f75a228d-4a1b-418f-ba0f-0fe75383fada', // Dairy
      targetCatName: 'Dairy'
    },
    {
      name: 'Elanadu Instant Sip Up (Ice Lolly Pack)',
      targetCatId: '48a2b255-5f70-49de-b383-c5cf877f9d3e', // Desserts & Ice Creams
      targetCatName: 'Desserts & Ice Creams'
    }
  ];

  for (const rc of reclassifications) {
    const { data, error } = await supabase
      .from('demo_items')
      .update({ category_id: rc.targetCatId })
      .ilike('name', `%${rc.name}%`)
      .select('id, name');

    if (error) {
      console.error(`Error reclassifying ${rc.name}:`, error);
    } else if (data && data.length > 0) {
      console.log(`✓ Reclassified "${data[0].name}" -> ${rc.targetCatName}`);
    } else {
      console.log(`Item not found for reclassification: ${rc.name}`);
    }
  }

  // 4. Verify category count and check for duplicates
  console.log('\nStep 4: Checking category integrity...');
  const { data: finalCats, error: finalCatErr } = await supabase
    .from('categories')
    .select('id, name, display_order')
    .order('display_order');

  if (finalCatErr) throw finalCatErr;

  console.log(`Total Categories in DB: ${finalCats.length} (Expected: 14)`);
  const names = finalCats.map(c => c.name);
  const dupes = names.filter((item, index) => names.indexOf(item) !== index);
  if (dupes.length > 0) {
    console.error('WARNING: Duplicate category names detected:', dupes);
  } else {
    console.log('✓ Zero duplicate category names found.');
  }

  console.log('\nFinal Categories List:');
  finalCats.forEach(c => {
    console.log(`[${c.display_order}] ${c.name} (${c.id})`);
  });

  console.log('\n--- CATEGORY RESTRUCTURING COMPLETED SUCCESSFULLY ---');
}

runRestructure().catch(console.error);
