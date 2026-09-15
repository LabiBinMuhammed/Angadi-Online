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

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
  if (str.includes(',') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function fetchAllDemoItems() {
  console.log('Fetching all categories, units, and translations...');
  const { data: categories } = await supabase.from('categories').select('id, name');
  const catMap = {};
  (categories || []).forEach(c => catMap[c.id] = c.name);

  const { data: units } = await supabase.from('units').select('id, name, symbol');
  const unitMap = {};
  (units || []).forEach(u => unitMap[u.id] = u.symbol || u.name);

  console.log('Fetching all demo_items with pagination...');
  let allItems = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data: chunk, error } = await supabase
      .from('demo_items')
      .select(`
        id,
        code,
        name,
        category_id,
        unit_id,
        sell_mode,
        default_image,
        display_order,
        demo_item_translations ( language_code, name ),
        demo_sell_config ( sell_mode, price_per_base_unit, max_price_limit ),
        demo_variants ( label, price, is_default, display_order )
      `)
      .order('code', { ascending: true, nullsFirst: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Fetch error at range', from, error);
      break;
    }
    if (!chunk || chunk.length === 0) break;
    allItems = allItems.concat(chunk);
    console.log(`  Fetched ${allItems.length} items so far...`);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Total items retrieved: ${allItems.length}`);

  // Build CSV rows
  const headers = [
    'S.No.',
    'Product Code',
    'Product Name',
    'Malayalam Name',
    'Category',
    'Base Unit',
    'Sell Mode',
    'Base Unit Price (INR)',
    'Max Price Ceiling (INR)',
    'Default Variant',
    'All Variants (Pack - Price)',
    'Image CDN URL'
  ];

  const rows = [headers];

  allItems.forEach((item, index) => {
    const code = item.code || '';
    const name = item.name || '';
    const mlName = item.demo_item_translations?.find(t => t.language_code === 'ml')?.name || '';
    const catName = catMap[item.category_id] || 'Uncategorized';
    const baseUnit = unitMap[item.unit_id] || '';
    const sellMode = item.sell_mode || 'Fixed';

    const sc = Array.isArray(item.demo_sell_config) ? item.demo_sell_config[0] : item.demo_sell_config;
    const basePrice = sc?.price_per_base_unit != null ? Number(sc.price_per_base_unit).toFixed(2) : '';
    const maxPrice = sc?.max_price_limit != null ? Number(sc.max_price_limit).toFixed(2) : '';

    const variants = (item.demo_variants || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const defVarObj = variants.find(v => v.is_default) || variants[0];
    const defaultVariant = defVarObj ? `${defVarObj.label} (₹${defVarObj.price})` : '';

    const allVariantsStr = variants.map(v => `${v.label}: ₹${v.price}`).join(' | ');
    const imgUrl = item.default_image || '';

    rows.push([
      index + 1,
      code,
      name,
      mlName,
      catName,
      baseUnit,
      sellMode,
      basePrice,
      maxPrice,
      defaultVariant,
      allVariantsStr,
      imgUrl
    ]);
  });

  const csvContent = rows.map(r => r.map(escapeCsv).join(',')).join('\n');
  const targetPath = path.join(__dirname, '../cateloge/angadi_master_catalog_all_in_one.csv');
  fs.writeFileSync(targetPath, csvContent, 'utf8');
  console.log(`\nSuccessfully created ALL-IN-ONE catalog CSV at: ${targetPath}`);
  console.log(`Total rows written: ${rows.length - 1} products`);
}

fetchAllDemoItems();
