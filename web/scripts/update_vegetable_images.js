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
const IMAGES = {
  sweet_corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=80',
  baby_corn: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=500&auto=format&fit=crop&q=80',
  amla: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500&auto=format&fit=crop&q=80',
  taro_root: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=500&auto=format&fit=crop&q=80',
  yam: 'https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=500&auto=format&fit=crop&q=80',
  beetroot: 'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?w=500&auto=format&fit=crop&q=80',
  carrot: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=500&auto=format&fit=crop&q=80',
  radish: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=500&auto=format&fit=crop&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
  red_potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
  sweet_potato: 'https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=500&auto=format&fit=crop&q=80',
  ginger: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80',
  lotus_stem: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=500&auto=format&fit=crop&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80',
  spring_onion: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
  garlic: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80',
  leek: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=80',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
  cherry_tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
  green_chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&auto=format&fit=crop&q=80',
  green_capsicum: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&auto=format&fit=crop&q=80',
  red_capsicum: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=500&auto=format&fit=crop&q=80',
  yellow_capsicum: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
  cucumber: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=500&auto=format&fit=crop&q=80',
  brinjal: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=500&auto=format&fit=crop&q=80',
  cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500&auto=format&fit=crop&q=80',
  cabbage: 'https://images.unsplash.com/photo-1551893478-d726eaf0442c?w=500&auto=format&fit=crop&q=80',
  red_cabbage: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=500&auto=format&fit=crop&q=80',
  broccoli: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&auto=format&fit=crop&q=80',
  okra: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=500&auto=format&fit=crop&q=80',
  gourd: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  pumpkin: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
  beans: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  green_peas: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=500&auto=format&fit=crop&q=80',
  mushroom: 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=500&auto=format&fit=crop&q=80',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=80',
  coriander: 'https://images.unsplash.com/photo-1588879460618-9249e7d947d1?w=500&auto=format&fit=crop&q=80',
  mint: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=500&auto=format&fit=crop&q=80',
  curry_leaves: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80',
  basil: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=500&auto=format&fit=crop&q=80',
  lettuce: 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=500&auto=format&fit=crop&q=80',
  kale: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=500&auto=format&fit=crop&q=80',
  celery: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=80',
  leafy_general: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  asparagus: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&auto=format&fit=crop&q=80',
  lemon: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=500&auto=format&fit=crop&q=80',
  avocado: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop&q=80',
  raw_banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80',
  raw_mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80',
  raw_papaya: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=500&auto=format&fit=crop&q=80',
  flower_yellow: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
  flower_lotus: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=500&auto=format&fit=crop&q=80',
  flower_jasmine: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=500&auto=format&fit=crop&q=80',
  flower_rose: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&auto=format&fit=crop&q=80',
  plant_leaves: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=500&auto=format&fit=crop&q=80',
  sprouts: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop&q=80',
  mix_veg: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80'
};

function resolveVegImage(name) {
  const n = (name || '').toLowerCase();

  // Flowers & Puja
  if (n.includes('lotus flower')) return IMAGES.flower_lotus;
  if (n.includes('jasmine') || n.includes('mogra')) return IMAGES.flower_jasmine;
  if (n.includes('rose petal')) return IMAGES.flower_rose;
  if (n.includes('marigold') || n.includes('seventhi') || n.includes('chrysanthemum') || n.includes('flower mix')) return IMAGES.flower_yellow;
  if (n.includes('banana leaf') || n.includes('kela patta') || n.includes('betel') || n.includes('paan') || n.includes('bilva') || n.includes('mango leaves') || n.includes('neem') || n.includes('durva')) {
    return IMAGES.plant_leaves;
  }

  // Brussels Sprouts
  if (n.includes('brussels')) return IMAGES.cabbage;

  // Sprouts
  if (n.includes('sprout') || n.includes('kala chana') || n.includes('moong')) return IMAGES.sprouts;

  // Cut Veg
  if (n.includes('mix veg') || n.includes('sambhar mix') || n.includes('stir fry')) return IMAGES.mix_veg;
  if (n.includes('pumpkin cubes') || n.includes('pumpkin') || n.includes('kaddu')) return IMAGES.pumpkin;
  if (n.includes('peeled matar')) return IMAGES.green_peas;
  if (n.includes('chopped bhindi')) return IMAGES.okra;
  if (n.includes('chopped lauki')) return IMAGES.gourd;

  // Corn
  if (n.includes('baby corn')) return IMAGES.baby_corn;
  if (n.includes('corn')) return IMAGES.sweet_corn;

  // Amla
  if (n.includes('amla') || n.includes('gooseberry')) return IMAGES.amla;

  // Asparagus
  if (n.includes('asparagus')) return IMAGES.asparagus;

  // Avocado
  if (n.includes('avocado')) return IMAGES.avocado;

  // Banana plant parts & raw fruits
  if (n.includes('banana flower')) return IMAGES.raw_banana;
  if (n.includes('banana stem')) return IMAGES.raw_banana;
  if (n.includes('raw banana') || n.includes('kacha kela')) return IMAGES.raw_banana;
  if (n.includes('raw mango') || n.includes('kacha aam')) return IMAGES.raw_mango;
  if (n.includes('raw papaya') || n.includes('kacha papita')) return IMAGES.raw_papaya;

  // Beetroot
  if (n.includes('beetroot') || n.includes('chukandar')) return IMAGES.beetroot;

  // Brinjal / Eggplant
  if (n.includes('brinjal') || n.includes('baingan') || n.includes('eggplant')) return IMAGES.brinjal;

  // Broccoli, Cabbage, Cauliflower
  if (n.includes('broccoli')) return IMAGES.broccoli;
  if (n.includes('cauliflower') || (n.includes('gobhi') && !n.includes('patta'))) return IMAGES.cauliflower;
  if (n.includes('red cabbage')) return IMAGES.red_cabbage;
  if (n.includes('cabbage') || n.includes('patta gobhi') || n.includes('bok choy') || n.includes('brussels')) return IMAGES.cabbage;

  // Carrots & Radish
  if (n.includes('carrot') || n.includes('gajar')) return IMAGES.carrot;
  if (n.includes('radish') || n.includes('mooli')) return IMAGES.radish;

  // Potatoes & Yams & Taro
  if (n.includes('red potato')) return IMAGES.red_potato;
  if (n.includes('purple sweet potato') || n.includes('sweet potato') || n.includes('shakarkandi')) return IMAGES.sweet_potato;
  if (n.includes('potato') || n.includes('aloo')) return IMAGES.potato;
  if (n.includes('taro') || n.includes('arvi')) return IMAGES.taro_root;
  if (n.includes('yam') || n.includes('jimikand')) return IMAGES.yam;
  if (n.includes('lotus stem') || n.includes('kamal kakdi')) return IMAGES.lotus_stem;

  // Mushrooms
  if (n.includes('mushroom') || n.includes('shiitake') || n.includes('enoki') || n.includes('portobello')) return IMAGES.mushroom;

  // Tomatoes
  if (n.includes('cherry tomato')) return IMAGES.cherry_tomato;
  if (n.includes('tomato') || n.includes('tamatar')) return IMAGES.tomato;

  // Chillies & Capsicum
  if (n.includes('red bell pepper') || n.includes('red capsicum')) return IMAGES.red_capsicum;
  if (n.includes('yellow bell pepper') || n.includes('yellow capsicum')) return IMAGES.yellow_capsicum;
  if (n.includes('capsicum') || n.includes('shimla mirch') || n.includes('bell pepper')) return IMAGES.green_capsicum;
  if (n.includes('chilli') || n.includes('mirch')) return IMAGES.green_chilli;

  // Cucumbers
  if (n.includes('cucumber') || n.includes('kheera')) return IMAGES.cucumber;

  // Garlic & Ginger & Onions
  if (n.includes('garlic chives')) return IMAGES.garlic;
  if (n.includes('garlic') || n.includes('lehsun')) return IMAGES.garlic;
  if (n.includes('ginger') || n.includes('adrak')) return IMAGES.ginger;
  if (n.includes('spring onion') || n.includes('hari pyaz')) return IMAGES.spring_onion;
  if (n.includes('onion') || n.includes('pyaz')) return IMAGES.onion;
  if (n.includes('leek')) return IMAGES.leek;

  // Lemon
  if (n.includes('lemon') || n.includes('nimbu')) return IMAGES.lemon;

  // Okra
  if (n.includes('lady finger') || n.includes('bhindi') || n.includes('okra')) return IMAGES.okra;

  // Beans & Peas
  if (n.includes('pea') || n.includes('matar')) return IMAGES.green_peas;
  if (n.includes('bean') || n.includes('phali') || n.includes('edamame')) return IMAGES.beans;
  if (n.includes('drumstick') || n.includes('moringa')) return IMAGES.beans;

  // Zucchini & Gourds
  if (n.includes('zucchini')) return IMAGES.gourd;
  if (n.includes('gourd') || n.includes('karela') || n.includes('lauki') || n.includes('torai') || n.includes('tinda') || n.includes('parwal') || n.includes('kundru') || n.includes('nenua') || n.includes('kachri') || n.includes('petha')) {
    return IMAGES.gourd;
  }

  // Herbs & Leafy greens
  if (n.includes('coriander') || n.includes('dhaniya')) return IMAGES.coriander;
  if (n.includes('mint') || n.includes('pudina')) return IMAGES.mint;
  if (n.includes('curry leaf') || n.includes('curry leaves') || n.includes('kadi patta')) return IMAGES.curry_leaves;
  if (n.includes('basil') || n.includes('tulsi')) return IMAGES.basil;
  if (n.includes('rosemary')) return IMAGES.leafy_general;
  if (n.includes('thyme')) return IMAGES.leafy_general;
  if (n.includes('lemongrass')) return IMAGES.curry_leaves;
  if (n.includes('celery') || n.includes('parsley')) return IMAGES.celery;
  if (n.includes('kale')) return IMAGES.kale;
  if (n.includes('lettuce') || n.includes('salad') || n.includes('arugula') || n.includes('rucola') || n.includes('rocket') || n.includes('chard')) return IMAGES.lettuce;
  if (n.includes('spinach') || n.includes('palak') || n.includes('saag') || n.includes('bathua') || n.includes('methi') || n.includes('gongura') || n.includes('amaranth')) return IMAGES.spinach;

  // Fallback
  return IMAGES.leafy_general;
}

async function updateVegetableImages() {
  console.log('Fetching Fresh Vegetables category...');
  const { data: cats, error: cErr } = await supabase.from('categories').select('id, name').eq('name', 'Fresh Vegetables');
  if (cErr || !cats || cats.length === 0) {
    console.error('Error finding category:', cErr);
    return;
  }
  const catId = cats[0].id;

  console.log('Fetching items in demo_items for Fresh Vegetables...');
  const { data: items, error: iErr } = await supabase
    .from('demo_items')
    .select('id, name, default_image')
    .eq('category_id', catId);
    
  if (iErr || !items) {
    console.error('Error fetching items:', iErr);
    return;
  }
  
  console.log(`Found ${items.length} vegetable items. Updating images...`);
  
  let updatedCount = 0;
  for (const item of items) {
    const newImage = resolveVegImage(item.name);
    const { error: uErr } = await supabase
      .from('demo_items')
      .update({ default_image: newImage })
      .eq('id', item.id);
      
    if (uErr) {
      console.error(`Failed to update ${item.name}:`, uErr.message);
    } else {
      updatedCount++;
    }
  }
  
  console.log(`Successfully updated ${updatedCount} / ${items.length} items in Supabase demo_items!`);

  // Update cateloge/01/1.2.csv
  const csvPath = path.join(__dirname, '..', '..', 'cateloge', '01', '1.2.csv');
  if (fs.existsSync(csvPath)) {
    const raw = fs.readFileSync(csvPath, 'utf8');
    const lines = raw.split('\n');
    const updatedLines = lines.map(line => {
      const parts = line.split(',');
      if (parts.length >= 9 && parts[1] === 'Fresh Vegetables') {
        const prodName = parts[2];
        const newImg = resolveVegImage(prodName);
        parts[8] = newImg;
        return parts.join(',');
      }
      return line;
    });
    fs.writeFileSync(csvPath, updatedLines.join('\n'), 'utf8');
    console.log(`Successfully updated vegetable image URLs in cateloge/01/1.2.csv!`);
  }
}

updateVegetableImages();
