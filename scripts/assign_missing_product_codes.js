const path = require('path');
const fs = require('fs');
const { createClient } = require(path.join(__dirname, '../web/node_modules/@supabase/supabase-js'));

const envText = fs.readFileSync(path.join(__dirname, '../web/.env.local'), 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function assignCodes() {
  console.log('Fetching categories...');
  const { data: categories } = await supabase.from('categories').select('id, name');
  const catMap = {};
  categories.forEach(c => catMap[c.id] = c.name);

  const { data: uncoded, error } = await supabase
    .from('demo_items')
    .select('id, name, category_id, display_order')
    .or('code.is.null,code.eq.')
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching uncoded items:', error);
    return;
  }

  console.log(`Found ${uncoded.length} items without product code.`);

  // Group by category
  const groups = {};
  uncoded.forEach(item => {
    const cName = catMap[item.category_id] || 'Unknown';
    if (!groups[cName]) groups[cName] = [];
    groups[cName].push(item);
  });

  // Category configs
  const catConfigs = {
    'Household & Stationery': { prefix: 'ANG-STA', startNum: 1103 },
    'Fresh Fruits': { prefix: 'ANG-FRU', startNum: 1 },
    'Meat & Fish': { prefix: 'ANG-MEA', startNum: 1 }
  };

  let totalUpdated = 0;

  for (const [catName, items] of Object.entries(groups)) {
    const config = catConfigs[catName];
    if (!config) {
      console.warn(`No code configuration found for category: ${catName}`);
      continue;
    }

    console.log(`\nAssigning codes for ${catName} (${items.length} items, starting at ${config.prefix}-${String(config.startNum).padStart(4, '0')})...`);
    let curNum = config.startNum;

    for (const item of items) {
      const code = `${config.prefix}-${String(curNum).padStart(4, '0')}`;
      const { error: updErr } = await supabase
        .from('demo_items')
        .update({ code })
        .eq('id', item.id);

      if (updErr) {
        console.error(`  Failed to update [${item.name}]:`, updErr.message);
      } else {
        console.log(`  Assigned ${code} -> ${item.name}`);
        curNum++;
        totalUpdated++;
      }
    }
  }

  console.log(`\nSuccessfully assigned product codes to all ${totalUpdated} items!`);
}

assignCodes();
