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

async function inspectSchema() {
  const { data: sampleItem } = await supabase.from('items').select('*').limit(1);
  console.log('items table columns:', sampleItem ? Object.keys(sampleItem[0]) : 'no items');
  if (sampleItem) console.log('Sample item:', sampleItem[0]);

  const { data: sampleConfig } = await supabase.from('item_sell_config').select('*').limit(1);
  console.log('item_sell_config columns:', sampleConfig && sampleConfig.length > 0 ? Object.keys(sampleConfig[0]) : 'empty');
  if (sampleConfig && sampleConfig.length > 0) console.log('Sample item_sell_config:', sampleConfig[0]);

  const { data: sampleVariants } = await supabase.from('item_variants').select('*').limit(1);
  console.log('item_variants columns:', sampleVariants && sampleVariants.length > 0 ? Object.keys(sampleVariants[0]) : 'empty');
  if (sampleVariants && sampleVariants.length > 0) console.log('Sample item_variants:', sampleVariants[0]);

  const { data: sampleImages } = await supabase.from('item_images').select('*').limit(1);
  console.log('item_images columns:', sampleImages && sampleImages.length > 0 ? Object.keys(sampleImages[0]) : 'empty');

  // Check demo_items link on items
  // Does items table have demo_item_id?
}

inspectSchema();
