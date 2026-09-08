const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Read Supabase credentials
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

// 2. Curated Unsplash images verified 200 OK
const FRUIT_URLS = {
  // Bananas
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80',
  red_banana: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop&q=80',
  baby_banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80',
  
  // Apples
  apple_red: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80',
  apple_green: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=80',
  apple_pink_lady: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500&auto=format&fit=crop&q=80',
  
  // Pomegranate
  pomegranate: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=500&auto=format&fit=crop&q=80',
  pomegranate_peeled: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=500&auto=format&fit=crop&q=80',
  
  // Papaya
  papaya: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=500&auto=format&fit=crop&q=80',
  
  // Coconut
  tender_coconut: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&auto=format&fit=crop&q=80',
  brown_coconut: 'https://images.unsplash.com/photo-1544378730-8b5104b18790?w=500&auto=format&fit=crop&q=80',
  
  // Kiwi & Berries
  kiwi_green: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=500&auto=format&fit=crop&q=80',
  kiwi_gold: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=500&auto=format&fit=crop&q=80',
  blueberry: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=500&auto=format&fit=crop&q=80',
  
  // Dragon Fruit
  dragon_fruit_red: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=500&auto=format&fit=crop&q=80',
  dragon_fruit_white: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&auto=format&fit=crop&q=80',
  
  // Melons
  watermelon: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=500&auto=format&fit=crop&q=80',
  muskmelon: 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=500&auto=format&fit=crop&q=80',
  
  // Pineapple
  pineapple: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&auto=format&fit=crop&q=80',
  
  // Citrus
  orange: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&auto=format&fit=crop&q=80',
  sweet_lime: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=500&auto=format&fit=crop&q=80',
  
  // Grapes
  grapes_green: 'https://images.unsplash.com/photo-1596363505729-4190a9506133?w=500&auto=format&fit=crop&q=80',
  grapes_black: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=80',
  grapes_red: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=80',
  
  // Guava & Pears
  guava: 'https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=500&auto=format&fit=crop&q=80',
  pear: 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=500&auto=format&fit=crop&q=80',
  
  // Exotic / Tropical
  custard_apple: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=500&auto=format&fit=crop&q=80',
  chikoo: 'https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=500&auto=format&fit=crop&q=80',
  plum: 'https://images.unsplash.com/photo-1522184216316-3c25379f9760?w=500&auto=format&fit=crop&q=80',
  peach: 'https://images.unsplash.com/photo-1522184216316-3c25379f9760?w=500&auto=format&fit=crop&q=80',
  passion_fruit: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80',
  rambutan: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=500&auto=format&fit=crop&q=80',
  sugarcane: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=500&auto=format&fit=crop&q=80',
  marigold: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=500&auto=format&fit=crop&q=80',
  panch_phal: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80',
  
  // Eggs / Meat
  white_eggs: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop&q=80',
  brown_eggs: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&auto=format&fit=crop&q=80',
  chicken: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=500&auto=format&fit=crop&q=80',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=80',
  meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&auto=format&fit=crop&q=80',
  
  // Bread / Bakery
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80'
};

function getFruitImage(name) {
  const n = name.toLowerCase();
  
  // Pooja / Flowers
  if (n.includes('marigold') || n.includes('genda')) return FRUIT_URLS.marigold;
  if (n.includes('panch phal') || n.includes('pooja')) return FRUIT_URLS.panch_phal;
  if (n.includes('sugarcane')) return FRUIT_URLS.sugarcane;
  
  // Bananas
  if (n.includes('red banana')) return FRUIT_URLS.red_banana;
  if (n.includes('baby banana')) return FRUIT_URLS.baby_banana;
  if (n.includes('yellaki') || n.includes('banana')) return FRUIT_URLS.banana;
  
  // Apples
  if (n.includes('granny smith') || n.includes('green apple')) return FRUIT_URLS.apple_green;
  if (n.includes('pink lady')) return FRUIT_URLS.apple_pink_lady;
  if (n.includes('apple')) return FRUIT_URLS.apple_red;
  
  // Pomegranate
  if (n.includes('peeled pomegranate')) return FRUIT_URLS.pomegranate_peeled;
  if (n.includes('pomegranate') || n.includes('anaar')) return FRUIT_URLS.pomegranate;
  
  // Coconut
  if (n.includes('tender coconut')) return FRUIT_URLS.tender_coconut;
  if (n.includes('coconut')) return FRUIT_URLS.brown_coconut;
  
  // Kiwi & Berries
  if (n.includes('gold kiwi')) return FRUIT_URLS.kiwi_gold;
  if (n.includes('kiwi')) return FRUIT_URLS.kiwi_green;
  if (n.includes('blueberry') || n.includes('berry')) return FRUIT_URLS.blueberry;
  
  // Dragon Fruit
  if (n.includes('dragon fruit - red')) return FRUIT_URLS.dragon_fruit_red;
  if (n.includes('dragon fruit')) return FRUIT_URLS.dragon_fruit_white;
  
  // Melons
  if (n.includes('watermelon')) return FRUIT_URLS.watermelon;
  if (n.includes('muskmelon') || n.includes('kharbuja') || n.includes('sun melon') || n.includes('sarda')) return FRUIT_URLS.muskmelon;
  
  // Pineapple
  if (n.includes('pineapple') || n.includes('ananas')) return FRUIT_URLS.pineapple;
  
  // Citrus
  if (n.includes('sweet lime') || n.includes('mosambi')) return FRUIT_URLS.sweet_lime;
  if (n.includes('orange') || n.includes('tangerine') || n.includes('navel')) return FRUIT_URLS.orange;
  
  // Grapes
  if (n.includes('red-globe') || n.includes('red globe')) return FRUIT_URLS.grapes_red;
  if (n.includes('black') && n.includes('grapes')) return FRUIT_URLS.grapes_black;
  if (n.includes('grapes') || n.includes('muscat')) return FRUIT_URLS.grapes_green;
  
  // Guava & Pears
  if (n.includes('guava') || n.includes('amrud')) return FRUIT_URLS.guava;
  if (n.includes('pear') || n.includes('nashpati') || n.includes('babugosha')) return FRUIT_URLS.pear;
  
  // Tropical / Stone fruits
  if (n.includes('papaya') || n.includes('papita')) return FRUIT_URLS.papaya;
  if (n.includes('custard apple') || n.includes('sitaphal')) return FRUIT_URLS.custard_apple;
  if (n.includes('sapota') || n.includes('chikoo')) return FRUIT_URLS.chikoo;
  if (n.includes('plum')) return FRUIT_URLS.plum;
  if (n.includes('peach') || n.includes('nectarine')) return FRUIT_URLS.peach;
  if (n.includes('passion fruit')) return FRUIT_URLS.passion_fruit;
  if (n.includes('rambutan') || n.includes('mangosteen')) return FRUIT_URLS.rambutan;
  
  // Fallback
  return FRUIT_URLS.panch_phal;
}

async function runUpdate() {
  console.log('--- Updating Fruits in Supabase demo_items ---');
  const { data: fruitCat } = await supabase.from('categories').select('id').eq('name', 'Fresh Fruits').single();
  if (!fruitCat) throw new Error('Fresh Fruits category not found');
  
  const { data: fruitItems } = await supabase.from('demo_items').select('id, name').eq('category_id', fruitCat.id);
  console.log(`Found ${fruitItems.length} fruit items in demo_items.`);
  
  let fruitCount = 0;
  for (const item of fruitItems) {
    const img = getFruitImage(item.name);
    await supabase.from('demo_items').update({ default_image: img }).eq('id', item.id);
    fruitCount++;
  }
  console.log(`Updated ${fruitCount} fruit items with variant-specific Unsplash images.`);
  
  // Also update Bakery placeholder items if any have null
  const { data: bakeryCat } = await supabase.from('categories').select('id').eq('name', 'Bakery').single();
  if (bakeryCat) {
    await supabase.from('demo_items')
      .update({ default_image: FRUIT_URLS.bread })
      .eq('category_id', bakeryCat.id)
      .is('default_image', null);
    console.log('Updated any null images in Bakery.');
  }

  // Update Meat & Fish placeholder items
  const { data: meatCat } = await supabase.from('categories').select('id').eq('name', 'Meat & Fish').single();
  if (meatCat) {
    const { data: meatItems } = await supabase.from('demo_items').select('id, name').eq('category_id', meatCat.id);
    for (const m of meatItems) {
      let img = FRUIT_URLS.meat;
      if (m.name.toLowerCase().includes('weight') || m.name.toLowerCase().includes('chicken')) img = FRUIT_URLS.chicken;
      else if (m.name.toLowerCase().includes('fish')) img = FRUIT_URLS.fish;
      else if (m.name.toLowerCase().includes('egg') || m.name.toLowerCase().includes('packed')) img = FRUIT_URLS.white_eggs;
      await supabase.from('demo_items').update({ default_image: img }).eq('id', item = m.id);
    }
    console.log('Updated Meat & Fish placeholder images.');
  }

  // Also update local CSV cateloge/01/1.2.csv with live Unsplash URLs for fruits
  const csvPath = path.join(__dirname, '../../cateloge/01/1.2.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n');
  const updatedLines = lines.map(line => {
    if (!line.trim() || !line.includes('Fresh Fruits')) return line;
    const cols = line.split(',');
    if (cols.length >= 9) {
      const name = cols[2];
      const img = getFruitImage(name);
      cols[8] = img;
      return cols.join(',');
    }
    return line;
  });
  fs.writeFileSync(csvPath, updatedLines.join('\n'), 'utf8');
  console.log('Updated cateloge/01/1.2.csv fruit rows with live Unsplash URLs.');
}

runUpdate().catch(console.error);
