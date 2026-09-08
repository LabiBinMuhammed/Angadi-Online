const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
  L: '24f2e09f-23d1-4919-a6c3-7a3d11fae4ef',
  ml: '4d3b2515-c26d-4c05-ab72-13ff6c6d0938',
  pack: '5cb5e824-4974-40f9-82ec-6edaa9ad32aa',
  bottle: '6aece001-9ce7-4325-b1ff-5b4f9405a97a'
};

const CATEGORIES = {
  oil: {
    id: 'f2429c0e-d038-4557-8aa1-969af9a4f99a',
    prefix: 'OIL',
    dataFile: 'scripts/oils_ghee_data.json',
    defaultBaseUnitManual: UNITS.L,
    defaultBaseUnitFixed: UNITS.L
  },
  spice: {
    id: '629d2052-6c3c-4102-95c5-6db8a85706f8',
    prefix: 'SPC',
    dataFile: 'scripts/spices_masalas_data.json',
    defaultBaseUnitManual: UNITS.kg,
    defaultBaseUnitFixed: UNITS.g
  }
};

function parseVariant(label) {
  const clean = label.trim();
  let unit_id = UNITS.pack;
  let value = 1;

  const mlMatch = clean.match(/^([\d.]+)\s*ml$/i);
  const lMatch = clean.match(/^([\d.]+)\s*l$/i);
  const kgMatch = clean.match(/^([\d.]+)\s*kg$/i);
  const gMatch = clean.match(/^([\d.]+)\s*g$/i);

  if (mlMatch) {
    value = parseFloat(mlMatch[1]);
    unit_id = UNITS.ml;
  } else if (lMatch) {
    value = parseFloat(lMatch[1]);
    unit_id = UNITS.L;
  } else if (kgMatch) {
    value = parseFloat(kgMatch[1]);
    unit_id = UNITS.kg;
  } else if (gMatch) {
    value = parseFloat(gMatch[1]);
    unit_id = UNITS.g;
  }

  return { label: clean, value, unit_id };
}

async function ingest() {
  console.log('--- STARTING OILS & GHEE + SPICES & MASALAS INGESTION ---');

  for (const [catKey, catConf] of Object.entries(CATEGORIES)) {
    console.log(`\nProcessing category: ${catKey} (${catConf.id})`);

    // 1. Fetch old demo items
    const { data: oldItems, error: fetchErr } = await supabase
      .from('demo_items')
      .select('id, name')
      .eq('category_id', catConf.id);

    if (fetchErr) {
      console.error('Error fetching old items:', fetchErr);
      process.exit(1);
    }

    const oldIds = (oldItems || []).map(i => i.id);
    console.log(`Found ${oldIds.length} existing demo items in category.`);

    // 2. Safety check: ensure no shop items reference these demo items
    if (oldIds.length > 0) {
      const { data: refItems } = await supabase
        .from('items')
        .select('id, name')
        .in('demo_item_id', oldIds);

      if (refItems && refItems.length > 0) {
        console.error(`ABORTING: ${refItems.length} vendor items are referencing these demo items:`, refItems);
        process.exit(1);
      }

      // 3. Delete old variants and sell configs
      console.log(`Cleaning old demo_variants and demo_sell_config for ${oldIds.length} items...`);
      const { error: dvDelErr } = await supabase.from('demo_variants').delete().in('demo_item_id', oldIds);
      if (dvDelErr) console.error('Error deleting old variants:', dvDelErr);

      const { error: scDelErr } = await supabase.from('demo_sell_config').delete().in('demo_item_id', oldIds);
      if (scDelErr) console.error('Error deleting old sell config:', scDelErr);

      const { error: diDelErr } = await supabase.from('demo_items').delete().in('id', oldIds);
      if (diDelErr) {
        console.error('Error deleting old demo items:', diDelErr);
        process.exit(1);
      }
      console.log('Old records safely removed.');
    }

    // 4. Load curated data
    const rawData = JSON.parse(fs.readFileSync(catConf.dataFile, 'utf8'));
    console.log(`Loaded ${rawData.length} curated master items from ${catConf.dataFile}.`);

    const demoItemsToInsert = [];
    const sellConfigsToInsert = [];
    const variantsToInsert = [];

    rawData.forEach((item, index) => {
      const itemId = crypto.randomUUID();
      const code = `${catConf.prefix}-${String(index + 1).padStart(3, '0')}`;
      const isManual = item.sell_mode === 'Manual';
      const baseUnit = isManual ? catConf.defaultBaseUnitManual : catConf.defaultBaseUnitFixed;

      demoItemsToInsert.push({
        id: itemId,
        category_id: catConf.id,
        name: item.name,
        unit_id: baseUnit,
        sell_mode: item.sell_mode,
        default_image: item.default_image || null,
        display_order: index + 1,
        code: code
      });

      sellConfigsToInsert.push({
        id: crypto.randomUUID(),
        demo_item_id: itemId,
        sell_mode: item.sell_mode,
        base_unit_id: baseUnit,
        price_per_base_unit: 0,
        allow_custom_quantity: isManual
      });

      if (item.variants && item.variants.length > 0) {
        item.variants.forEach((vStr, vIdx) => {
          const parsed = parseVariant(vStr);
          variantsToInsert.push({
            id: crypto.randomUUID(),
            demo_item_id: itemId,
            variant_type: 'Fixed',
            label: parsed.label,
            unit_id: parsed.unit_id,
            value: parsed.value,
            price: 0,
            is_default: vIdx === 0 || parsed.label === '1 L' || parsed.label === '500 ml' || parsed.label === '250 g' || parsed.label === '500 g',
            is_active: true,
            display_order: vIdx + 1
          });
        });
      }
    });

    // 5. Batch insert demo_items
    console.log(`Inserting ${demoItemsToInsert.length} demo_items...`);
    const { error: insItemErr } = await supabase.from('demo_items').insert(demoItemsToInsert);
    if (insItemErr) {
      console.error('Error inserting demo_items:', insItemErr);
      process.exit(1);
    }

    // 6. Batch insert demo_sell_config
    console.log(`Inserting ${sellConfigsToInsert.length} demo_sell_config records...`);
    const { error: insCfgErr } = await supabase.from('demo_sell_config').insert(sellConfigsToInsert);
    if (insCfgErr) {
      console.error('Error inserting demo_sell_config:', insCfgErr);
      process.exit(1);
    }

    // 7. Batch insert demo_variants
    console.log(`Inserting ${variantsToInsert.length} demo_variants...`);
    // Insert in chunks of 100 to avoid payload limits
    for (let i = 0; i < variantsToInsert.length; i += 100) {
      const chunk = variantsToInsert.slice(i, i + 100);
      const { error: insVarErr } = await supabase.from('demo_variants').insert(chunk);
      if (insVarErr) {
        console.error('Error inserting demo_variants chunk:', insVarErr);
        process.exit(1);
      }
    }

    console.log(`Successfully ingested ${catKey}: ${demoItemsToInsert.length} items, ${sellConfigsToInsert.length} configs, ${variantsToInsert.length} variants.`);
  }

  console.log('\n--- INGESTION COMPLETE ---');
}

ingest();
