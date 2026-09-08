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

const IMAGES = {
  // Bell peppers & chillies
  yellow_bell_pepper: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&auto=format&fit=crop&q=80',
  red_bell_pepper: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=500&auto=format&fit=crop&q=80',
  green_capsicum: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&auto=format&fit=crop&q=80',
  green_chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&auto=format&fit=crop&q=80',
  
  // Allium family
  onion_red: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80',
  spring_onion: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=80',
  garlic: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80',
  leek: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=80',
  
  // Tomatoes
  tomato_desi: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
  tomato_cherry: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
  
  // Potatoes & Roots
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
  potato_red: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=500&auto=format&fit=crop&q=80',
  sweet_potato: 'https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=500&auto=format&fit=crop&q=80',
  yam: 'https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=500&auto=format&fit=crop&q=80',
  carrot: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=500&auto=format&fit=crop&q=80',
  radish: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=500&auto=format&fit=crop&q=80',
  beetroot: 'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?w=500&auto=format&fit=crop&q=80',
  ginger: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80',
  amla: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500&auto=format&fit=crop&q=80',
  lotus_stem: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=500&auto=format&fit=crop&q=80',
  
  // Gourds & Cucurbits
  cucumber: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=500&auto=format&fit=crop&q=80',
  pumpkin: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
  bottle_gourd: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  bitter_gourd: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  ridge_gourd: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  sponge_gourd: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  snake_gourd: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  ash_gourd: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  ivy_gourd: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  pointed_gourd: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  tinda: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  
  // Pods & Beans
  lady_finger: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=500&auto=format&fit=crop&q=80',
  green_peas: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=500&auto=format&fit=crop&q=80',
  french_beans: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  drumstick: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  
  // Cruciferous
  cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500&auto=format&fit=crop&q=80',
  cabbage: 'https://images.unsplash.com/photo-1551893478-d726eaf0442c?w=500&auto=format&fit=crop&q=80',
  cabbage_red: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=500&auto=format&fit=crop&q=80',
  broccoli: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&auto=format&fit=crop&q=80',
  brussels_sprouts: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  
  // Mushrooms
  mushroom_button: 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=500&auto=format&fit=crop&q=80',
  
  // Eggplants
  brinjal: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=500&auto=format&fit=crop&q=80',
  
  // Herbs & Leafy Greens
  curry_leaves: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=500&auto=format&fit=crop&q=80',
  coriander: 'https://images.unsplash.com/photo-1588879460618-9249e7d947d1?w=500&auto=format&fit=crop&q=80',
  mint: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=500&auto=format&fit=crop&q=80',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=80',
  fenugreek: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=80',
  lettuce: 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=500&auto=format&fit=crop&q=80',
  basil: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=500&auto=format&fit=crop&q=80',
  lemongrass: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  rosemary: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop&q=80',
  
  // Plantain / Raw Banana
  raw_banana: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop&q=80',
  banana_flower: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop&q=80',
  banana_stem: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop&q=80',
  banana_leaf: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=500&auto=format&fit=crop&q=80',
  
  // Cut veggies & Stir fry
  cut_mix_veg: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
  
  // Corn
  sweet_corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=80',
  baby_corn: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=500&auto=format&fit=crop&q=80',
  
  // Flowers
  marigold_yellow: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=500&auto=format&fit=crop&q=80',
  jasmine_white: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=500&auto=format&fit=crop&q=80',
  rose_petals: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&auto=format&fit=crop&q=80',
  lotus_flower: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=500&auto=format&fit=crop&q=80',
  pooja_flowers: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
  
  // Sprouts & Avocado
  sprouts: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop&q=80',
  avocado: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop&q=80'
};

function getRefinedVegImage(name) {
  const n = name.toLowerCase();

  // 1. Peppers & Chillies (order matters: check yellow and red before generic capsicum)
  if (n.includes('yellow bell pepper') || n.includes('yellow pepper') || n.includes('yellow capsicum')) return IMAGES.yellow_bell_pepper;
  if (n.includes('red bell pepper') || n.includes('red capsicum')) return IMAGES.red_bell_pepper;
  if (n.includes('capsicum') || n.includes('shimla mirch')) return IMAGES.green_capsicum;
  if (n.includes('chilli') || n.includes('mirch')) return IMAGES.green_chilli;

  // 2. Allium (Spring Onion before regular onion!)
  if (n.includes('spring onion') || n.includes('hari pyaz') || n.includes('scallion')) return IMAGES.spring_onion;
  if (n.includes('garlic chives')) return IMAGES.spring_onion;
  if (n.includes('garlic') || n.includes('lehsun')) return IMAGES.garlic;
  if (n.includes('leek')) return IMAGES.leek;
  if (n.includes('onion') || n.includes('pyaz')) return IMAGES.onion_red;

  // 3. Potatoes (Red potato before regular!)
  if (n.includes('red potato')) return IMAGES.potato_red;
  if (n.includes('sweet potato') || n.includes('shakarkandi')) return IMAGES.sweet_potato;
  if (n.includes('potato') || n.includes('aloo')) return IMAGES.potato;

  // 4. Roots
  if (n.includes('beetroot') || n.includes('chukandar')) return IMAGES.beetroot;
  if (n.includes('carrot') || n.includes('gajar')) return IMAGES.carrot;
  if (n.includes('radish') || n.includes('mooli')) return IMAGES.radish;
  if (n.includes('yam') || n.includes('jimikand') || n.includes('suran')) return IMAGES.yam;
  if (n.includes('ginger') || n.includes('adrak')) return IMAGES.ginger;
  if (n.includes('amla')) return IMAGES.amla;
  if (n.includes('lotus stem') || n.includes('kamal kakdi')) return IMAGES.lotus_stem;

  // 5. Curry leaves (Curry leaves before ginger or other herbs!)
  if (n.includes('curry leaves') || n.includes('kadi patta')) return IMAGES.curry_leaves;
  if (n.includes('coriander') || n.includes('dhaniya')) return IMAGES.coriander;
  if (n.includes('mint') || n.includes('pudina')) return IMAGES.mint;

  // 6. Brassicas (Brussels sprouts first!)
  if (n.includes('brussels sprouts') || n.includes('brussels')) return IMAGES.brussels_sprouts;
  if (n.includes('broccoli')) return IMAGES.broccoli;
  if (n.includes('cauliflower') || n.includes('gobhi')) return IMAGES.cauliflower;
  if (n.includes('red cabbage')) return IMAGES.cabbage_red;
  if (n.includes('cabbage') || n.includes('bok choy')) return IMAGES.cabbage;

  // 7. Plantain / Banana parts
  if (n.includes('banana leaf') || n.includes('kela patta')) return IMAGES.banana_leaf;
  if (n.includes('banana flower')) return IMAGES.banana_flower;
  if (n.includes('banana stem')) return IMAGES.banana_stem;
  if (n.includes('raw banana') || n.includes('kacha kela')) return IMAGES.raw_banana;

  // 8. Tomatoes (CHECK BEFORE MATAR because 'tamatar' contains 'matar'!)
  if (n.includes('cherry tomato')) return IMAGES.tomato_cherry;
  if (n.includes('tomato') || n.includes('tamatar')) return IMAGES.tomato_desi;

  // 9. Pods & Beans
  if (n.includes('lady finger') || n.includes('bhindi') || n.includes('okra')) return IMAGES.lady_finger;
  if (n.includes('green peas') || (n.includes('matar') && !n.includes('tamatar')) || n.includes('snow peas')) return IMAGES.green_peas;
  if (n.includes('french beans') || n.includes('beans') || n.includes('gawar') || n.includes('cluster beans') || n.includes('broad beans')) return IMAGES.french_beans;
  if (n.includes('drumstick') || n.includes('sahjan') || n.includes('moringa')) return IMAGES.drumstick;

  // 9. Gourds
  if (n.includes('cucumber') || n.includes('kheera')) return IMAGES.cucumber;
  if (n.includes('pumpkin') || n.includes('kaddu')) return IMAGES.pumpkin;
  if (n.includes('bottle gourd') || n.includes('lauki') || n.includes('doodhi')) return IMAGES.bottle_gourd;
  if (n.includes('bitter gourd') || n.includes('karela')) return IMAGES.bitter_gourd;
  if (n.includes('ridge gourd') || n.includes('turai')) return IMAGES.ridge_gourd;
  if (n.includes('sponge gourd') || n.includes('nenua')) return IMAGES.sponge_gourd;
  if (n.includes('snake gourd') || n.includes('chichinda')) return IMAGES.snake_gourd;
  if (n.includes('ash gourd') || n.includes('petha')) return IMAGES.ash_gourd;
  if (n.includes('ivy gourd') || n.includes('kundru')) return IMAGES.ivy_gourd;
  if (n.includes('pointed gourd') || n.includes('parwal')) return IMAGES.pointed_gourd;
  if (n.includes('tinda')) return IMAGES.tinda;

  // 10. Corn
  if (n.includes('baby corn')) return IMAGES.baby_corn;
  if (n.includes('sweet corn') || n.includes('corn') || n.includes('bhutta')) return IMAGES.sweet_corn;

  // 11. Mushrooms
  if (n.includes('mushroom')) return IMAGES.mushroom_button;

  // 13. Eggplants
  if (n.includes('brinjal') || n.includes('baingan') || n.includes('eggplant')) return IMAGES.brinjal;

  // 14. Greens & Herbs
  if (n.includes('methi') || n.includes('fenugreek')) return IMAGES.fenugreek;
  if (n.includes('spinach') || n.includes('palak') || n.includes('bathua') || n.includes('saag') || n.includes('amaranth') || n.includes('gongura')) return IMAGES.spinach;
  if (n.includes('lettuce') || n.includes('kale') || n.includes('arugula') || n.includes('rocket') || n.includes('chard')) return IMAGES.lettuce;
  if (n.includes('basil') || n.includes('tulsi')) return IMAGES.basil;
  if (n.includes('lemongrass')) return IMAGES.lemongrass;
  if (n.includes('rosemary') || n.includes('thyme') || n.includes('celery') || n.includes('parsley')) return IMAGES.rosemary;

  // 15. Pre-cut mix
  if (n.includes('cut') || n.includes('sambhar') || n.includes('stir fry') || n.includes('mix veg')) return IMAGES.cut_mix_veg;

  // 16. Flowers & Pooja
  if (n.includes('marigold') || n.includes('genda')) return IMAGES.marigold_yellow;
  if (n.includes('jasmine') || n.includes('mogra')) return IMAGES.jasmine_white;
  if (n.includes('rose') || n.includes('gulab')) return IMAGES.rose_petals;
  if (n.includes('lotus') || n.includes('kamal')) return IMAGES.lotus_flower;
  if (n.includes('pooja') || n.includes('flower') || n.includes('seventhi') || n.includes('betel') || n.includes('paan') || n.includes('bel patta') || n.includes('durva') || n.includes('neem')) return IMAGES.pooja_flowers;

  // 17. Sprouts & Avocado
  if (n.includes('sprout') || n.includes('chana') || n.includes('moong')) return IMAGES.sprouts;
  if (n.includes('avocado')) return IMAGES.avocado;

  // Fallback
  return IMAGES.tomato_desi;
}

async function run() {
  console.log('--- Updating Fresh Vegetables with distinct, accurate images ---');
  const { data: vegCat } = await supabase.from('categories').select('id').eq('name', 'Fresh Vegetables').single();
  const { data: items } = await supabase.from('demo_items').select('id, name').eq('category_id', vegCat.id);
  
  console.log(`Found ${items.length} vegetable items.`);
  let updatedCount = 0;
  for (const item of items) {
    const newImg = getRefinedVegImage(item.name);
    await supabase.from('demo_items').update({ default_image: newImg }).eq('id', item.id);
    updatedCount++;
  }
  console.log(`Successfully updated ${updatedCount} vegetable items in Supabase demo_items.`);

  // Update CSV cateloge/01/1.2.csv
  const csvPath = path.join(__dirname, '../../cateloge/01/1.2.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n');
  const updatedLines = lines.map(line => {
    if (!line.trim() || !line.includes('Fresh Vegetables')) return line;
    const cols = line.split(',');
    if (cols.length >= 9) {
      const name = cols[2];
      const img = getRefinedVegImage(name);
      cols[8] = img;
      return cols.join(',');
    }
    return line;
  });
  fs.writeFileSync(csvPath, updatedLines.join('\n'), 'utf8');
  console.log('Successfully updated cateloge/01/1.2.csv with refined vegetable URLs.');
}

run().catch(console.error);
