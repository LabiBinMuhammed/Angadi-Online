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

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
  if (str.includes(',') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportAllCatalogs() {
  console.log('Exporting all master catalogs to CSV...');
  const catDir = path.join(__dirname, '..', '..', 'cateloge');
  if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  const { data: units } = await supabase.from('units').select('id, name, symbol');
  const unitMap = {};
  units.forEach(u => unitMap[u.id] = u.symbol || u.name);

  for (const cat of categories) {
    const { data: items } = await supabase
      .from('demo_items')
      .select('id, name, unit_id, sell_mode, default_image')
      .eq('category_id', cat.id)
      .order('name');

    if (!items || items.length === 0) continue;

    const rows = [
      ['S.No.', 'Category', 'Product Name', 'Description', 'Quantity', 'Original Price (MRP)', 'Selling Price', 'Image URL']
    ];

    let sNo = 1;
    for (const item of items) {
      const { data: variants } = await supabase
        .from('demo_variants')
        .select('label, unit_id, value, price')
        .eq('demo_item_id', item.id)
        .order('display_order');

      let qty = '1 kg';
      if (variants && variants.length > 0) {
        qty = variants.map(v => v.label).join(' / ');
      } else if (item.unit_id && unitMap[item.unit_id]) {
        qty = `1 ${unitMap[item.unit_id]}`;
      }

      let desc = `${item.name} for everyday cooking, dining, and household needs.`
      try {
        const { findCatalogProduct } = require('../lib/catalog/brandRegistry');
        const reg = findCatalogProduct(item.name);
        if (reg && reg.description) desc = reg.description;
      } catch (e) {}
      const img = item.default_image || '';

      rows.push([
        sNo++,
        cat.name,
        item.name,
        desc,
        qty,
        '',
        '',
        img
      ]);
    }

    const csvContent = rows.map(r => r.map(escapeCsv).join(',')).join('\n');
    const safeName = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const outFileName = `angadi_kerala_${safeName}_master_catalog.csv`;
    const outPath = path.join(catDir, outFileName);
    fs.writeFileSync(outPath, csvContent, 'utf8');
    console.log(`Saved: ${outFileName} (${rows.length - 1} products)`);
  }

  console.log('\nAll master catalog CSVs exported successfully!');
}

exportAllCatalogs();
