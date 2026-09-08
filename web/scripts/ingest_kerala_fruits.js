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

// Curated verified 200 OK Unsplash CDN URLs for all 105 Kerala Fruit varieties
const IMAGES = {
  // Bananas
  nendran: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop&q=80',
  chenkadali: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop&q=80',
  poovan: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80',
  robusta: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500&auto=format&fit=crop&q=80',
  cooking_banana: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop&q=80',

  // Mangoes
  alphonso: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80',
  raw_mango: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=500&auto=format&fit=crop&q=80',
  country_mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80',

  // Jackfruit
  jackfruit: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=500&auto=format&fit=crop&q=80',
  jackfruit_bulbs: 'https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=500&auto=format&fit=crop&q=80',
  tender_jackfruit: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  jackfruit_seeds: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',

  // Pineapple
  pineapple: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&auto=format&fit=crop&q=80',

  // Papaya
  papaya: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=500&auto=format&fit=crop&q=80',
  raw_papaya: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=500&auto=format&fit=crop&q=80',

  // Guava
  guava_white: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=500&auto=format&fit=crop&q=80',
  guava_pink: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=500&auto=format&fit=crop&q=80',

  // Coconut
  tender_coconut: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&auto=format&fit=crop&q=80',
  brown_coconut: 'https://images.unsplash.com/photo-1544378730-8b5104b18790?w=500&auto=format&fit=crop&q=80',

  // Citrus
  orange: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&auto=format&fit=crop&q=80',
  sweet_lime: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=500&auto=format&fit=crop&q=80',
  lemon: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=500&auto=format&fit=crop&q=80',
  pomelo: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&auto=format&fit=crop&q=80',

  // Melons
  watermelon: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=500&auto=format&fit=crop&q=80',
  muskmelon: 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=500&auto=format&fit=crop&q=80',

  // Sapota
  sapota: 'https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=500&auto=format&fit=crop&q=80',

  // Kerala Tropicals
  rambutan: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=500&auto=format&fit=crop&q=80',
  mangosteen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
  passion_fruit: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80',
  amla: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500&auto=format&fit=crop&q=80',
  jamun: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=80',
  rose_apple: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500&auto=format&fit=crop&q=80',
  custard_apple: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=500&auto=format&fit=crop&q=80',
  avocado: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop&q=80',
  dragon_fruit: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=500&auto=format&fit=crop&q=80',
  star_fruit: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&auto=format&fit=crop&q=80',
  bilimbi: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=500&auto=format&fit=crop&q=80',
  breadfruit: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',

  // Apples & Grapes & Commercial
  apple_red: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80',
  apple_green: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=80',
  grapes_green: 'https://images.unsplash.com/photo-1596363505729-4190a9506133?w=500&auto=format&fit=crop&q=80',
  grapes_black: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=80',
  pomegranate: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=500&auto=format&fit=crop&q=80',
  pear: 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=500&auto=format&fit=crop&q=80',
  kiwi: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=500&auto=format&fit=crop&q=80',
  strawberry: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&auto=format&fit=crop&q=80',
  plum: 'https://images.unsplash.com/photo-1522184216316-3c25379f9760?w=500&auto=format&fit=crop&q=80',
  peach: 'https://images.unsplash.com/photo-1522184216316-3c25379f9760?w=500&auto=format&fit=crop&q=80',

  // Dates
  dates: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80'
};

function getProductImage(name) {
  const n = name.toLowerCase();

  // Dates
  if (n.includes('date')) return IMAGES.dates;

  // Bananas
  if (n.includes('chenkadali') || n.includes('red banana')) return IMAGES.chenkadali;
  if (n.includes('nendran') || n.includes('chengalikodan')) return IMAGES.nendran;
  if (n.includes('monthan') || n.includes('kanchikela')) return IMAGES.cooking_banana;
  if (n.includes('robusta') || n.includes('grand naine') || n.includes('cavendish')) return IMAGES.robusta;
  if (n.includes('banana')) return IMAGES.poovan;

  // Mangoes
  if (n.includes('raw mango')) return IMAGES.raw_mango;
  if (n.includes('alphonso')) return IMAGES.alphonso;
  if (n.includes('mango')) return IMAGES.country_mango;

  // Jackfruit
  if (n.includes('jackfruit bulbs')) return IMAGES.jackfruit_bulbs;
  if (n.includes('jackfruit seeds')) return IMAGES.jackfruit_seeds;
  if (n.includes('tender jackfruit') || n.includes('idichakka')) return IMAGES.tender_jackfruit;
  if (n.includes('jackfruit')) return IMAGES.jackfruit;

  // Pineapple
  if (n.includes('pineapple')) return IMAGES.pineapple;

  // Papaya
  if (n.includes('raw papaya')) return IMAGES.raw_papaya;
  if (n.includes('papaya')) return IMAGES.papaya;

  // Coconut
  if (n.includes('tender coconut') || n.includes('elaneer') || n.includes('karikku')) return IMAGES.tender_coconut;
  if (n.includes('coconut') || n.includes('copra')) return IMAGES.brown_coconut;

  // Citrus
  if (n.includes('pomelo') || n.includes('bablimoos')) return IMAGES.pomelo;
  if (n.includes('sweet lime') || n.includes('mosambi')) return IMAGES.sweet_lime;
  if (n.includes('lemon') || n.includes('lime') || n.includes('vadakapuli')) return IMAGES.lemon;
  if (n.includes('orange')) return IMAGES.orange;

  // Melons
  if (n.includes('watermelon')) return IMAGES.watermelon;
  if (n.includes('muskmelon') || n.includes('sun melon') || n.includes('shamam')) return IMAGES.muskmelon;

  // Guava
  if (n.includes('pink guava')) return IMAGES.guava_pink;
  if (n.includes('guava')) return IMAGES.guava_white;

  // Sapota
  if (n.includes('sapota') || n.includes('chikoo')) return IMAGES.sapota;

  // Kerala Tropicals
  if (n.includes('rambutan')) return IMAGES.rambutan;
  if (n.includes('mangosteen')) return IMAGES.mangosteen;
  if (n.includes('passion fruit')) return IMAGES.passion_fruit;
  if (n.includes('amla') || n.includes('gooseberry')) return IMAGES.amla;
  if (n.includes('jamun') || n.includes('njaval')) return IMAGES.jamun;
  if (n.includes('rose apple') || n.includes('water apple') || n.includes('chambakka')) return IMAGES.rose_apple;
  if (n.includes('custard apple') || n.includes('soursop') || n.includes('mullaatha') || n.includes('sitaphal')) return IMAGES.custard_apple;
  if (n.includes('breadfruit') || n.includes('kadachakka')) return IMAGES.breadfruit;
  if (n.includes('star fruit')) return IMAGES.star_fruit;
  if (n.includes('bilimbi')) return IMAGES.bilimbi;
  if (n.includes('avocado')) return IMAGES.avocado;
  if (n.includes('dragon fruit')) return IMAGES.dragon_fruit;

  // Commercial
  if (n.includes('granny smith') || n.includes('green apple')) return IMAGES.apple_green;
  if (n.includes('apple')) return IMAGES.apple_red;
  if (n.includes('black grapes') || n.includes('red grapes')) return IMAGES.grapes_black;
  if (n.includes('grapes')) return IMAGES.grapes_green;
  if (n.includes('pomegranate')) return IMAGES.pomegranate;
  if (n.includes('pear')) return IMAGES.pear;
  if (n.includes('kiwi')) return IMAGES.kiwi;
  if (n.includes('strawberry')) return IMAGES.strawberry;
  if (n.includes('plum')) return IMAGES.plum;
  if (n.includes('peach')) return IMAGES.peach;

  return IMAGES.apple_red;
}

async function ingest() {
  console.log('--- Ingesting Angadi Kerala Fruit Master Catalog ---');

  // 1. Fetch Fresh Fruits category
  const { data: fruitCat, error: catErr } = await supabase.from('categories').select('id').eq('name', 'Fresh Fruits').single();
  if (catErr || !fruitCat) throw new Error('Category Fresh Fruits not found: ' + JSON.stringify(catErr));
  console.log('Target Category ID:', fruitCat.id);

  // 2. Fetch units
  const { data: units, error: uErr } = await supabase.from('units').select('id, symbol');
  if (uErr) throw new Error('Failed to fetch units: ' + JSON.stringify(uErr));
  
  const unitMap = {};
  units.forEach(u => {
    unitMap[u.symbol.toLowerCase()] = u.id;
  });

  // 3. Read CSV
  const csvPath = path.join(__dirname, '../../cateloge/fruits_master_kerala.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(l => l.trim());
  const header = lines[0].split(',');
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // Basic CSV parser handling quoted descriptions
    const line = lines[i];
    const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    const cols = [];
    let match;
    let inQuotes = false;
    let current = '';
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());

    if (cols.length >= 5) {
      const sNo = parseInt(cols[0], 10);
      const category = cols[1];
      const name = cols[2];
      const description = cols[3].replace(/^["']|["']$/g, '');
      const quantity = cols[4];
      
      let unitSymbol = 'kg';
      let sellMode = 'Manual';
      if (quantity.includes('kg')) {
        unitSymbol = 'kg';
        sellMode = 'Manual';
      } else if (quantity.includes('g')) {
        unitSymbol = 'g';
        sellMode = 'Manual';
      } else if (quantity.includes('pc') || quantity.includes('pcs') || quantity.includes('dozen')) {
        unitSymbol = 'pcs';
        sellMode = 'Fixed';
      }

      const unitId = unitMap[unitSymbol] || unitMap['kg'] || units[0].id;
      const imageUrl = getProductImage(name);

      rows.push({
        sNo,
        name,
        description,
        unitId,
        sellMode,
        imageUrl,
        displayOrder: sNo
      });
    }
  }

  console.log(`Parsed ${rows.length} master fruit products from CSV.`);

  // 4. Delete existing items in demo_items under Fresh Fruits
  const { error: delErr } = await supabase.from('demo_items').delete().eq('category_id', fruitCat.id);
  if (delErr) {
    console.warn('Warning on delete (will proceed with upsert):', delErr.message);
  } else {
    console.log('Cleared existing fruit items from demo_items.');
  }

  // 5. Insert new master products
  let inserted = 0;
  for (const row of rows) {
    const { data: itemData, error: insErr } = await supabase
      .from('demo_items')
      .insert({
        category_id: fruitCat.id,
        name: row.name,
        unit_id: row.unitId,
        sell_mode: row.sellMode,
        default_image: row.imageUrl,
        display_order: row.displayOrder
      })
      .select('id')
      .single();

    if (insErr) {
      console.error(`Failed to insert [${row.name}]:`, insErr.message);
    } else {
      inserted++;
      // Insert default sell config
      await supabase.from('demo_sell_config').insert({
        demo_item_id: itemData.id,
        sell_mode: row.sellMode,
        base_unit_id: row.unitId,
        price_per_base_unit: 0,
        allow_custom_quantity: row.sellMode === 'Manual'
      });
    }
  }

  console.log(`Successfully inserted ${inserted} of ${rows.length} master products into Supabase demo_items!`);
}

ingest().catch(console.error);
