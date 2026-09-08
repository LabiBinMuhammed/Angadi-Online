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

function translateSubName(name) {
  let res = name;

  // Specific coconut overrides
  if (res.includes('Tender Coconut') && res.includes('(Nariyal)')) {
    return res.replace('(Nariyal)', '(Karikku / Elaneer)');
  }
  if (res.includes('Brown Coconut') && res.includes('(Nariyal)')) {
    return res.replace('(Nariyal)', '(Thenga)');
  }

  const TRANSLATIONS = [
    // Vegetables
    { pattern: /\(Pyaz\)/gi, replace: '(Savadha)' },
    { pattern: /\(Aloo\)/gi, replace: '(Urulakkizhangu)' },
    { pattern: /\(Tamatar\)/gi, replace: '(Thakkali)' },
    { pattern: /\(Hari Mirch\)/gi, replace: '(Pachamulaku)' },
    { pattern: /\(Dhaniya Patta\)/gi, replace: '(Malli Ila)' },
    { pattern: /\(Dhaniya\)/gi, replace: '(Malli)' },
    { pattern: /\(Dhania\)/gi, replace: '(Malli)' },
    { pattern: /\(Lehsun\)/gi, replace: '(Veluthulli)' },
    { pattern: /\(Adrak\)/gi, replace: '(Inji)' },
    { pattern: /\(Bhindi\)/gi, replace: '(Vendakka)' },
    { pattern: /\(Patta Gobhi\)/gi, replace: '(Muttakose)' },
    { pattern: /\(Phool Gobhi\)/gi, replace: '(Cauliflower)' },
    { pattern: /\(Shimla Mirch\)/gi, replace: '(Capsicum)' },
    { pattern: /\(Gajar\)/gi, replace: '(Carrot)' },
    { pattern: /\(Mooli\)/gi, replace: '(Mullangi)' },
    { pattern: /\(Chukandar\)/gi, replace: '(Beetroot)' },
    { pattern: /\(Palak\)/gi, replace: '(Palak Cheera)' },
    { pattern: /\(Fenugreek Leaves\)/gi, replace: '(Uluva Ila)' },
    { pattern: /\(Kadi Patta\)/gi, replace: '(Kariveppila)' },
    { pattern: /\(Pudina\)/gi, replace: '(Puthina)' },
    { pattern: /\(Matar\)/gi, replace: '(Pachapattani)' },
    { pattern: /\(Lauki\)/gi, replace: '(Churakka)' },
    { pattern: /\(Karela\)/gi, replace: '(Pavakka)' },
    { pattern: /\(Torai\)/gi, replace: '(Peechinga)' },
    { pattern: /\(Nenua\)/gi, replace: '(Peechinga)' },
    { pattern: /\(Petha\)/gi, replace: '(Kumbalanga)' },
    { pattern: /\(Kaddu\)/gi, replace: '(Mathanga)' },
    { pattern: /\(Kundru\)/gi, replace: '(Kovakka)' },
    { pattern: /\(Big Baingan\)/gi, replace: '(Vazhuthananga)' },
    { pattern: /\(Baingan\)/gi, replace: '(Vazhuthananga)' },
    { pattern: /\(Kheera\)/gi, replace: '(Vellarikka)' },
    { pattern: /\(Taro Root\)/gi, replace: '(Chembu)' },
    { pattern: /\(Arbi\)/gi, replace: '(Chembu)' },
    { pattern: /\(Arvi\)/gi, replace: '(Chembu)' },
    { pattern: /\(Shakarkandi\)/gi, replace: '(Madhurakkizhangu)' },
    { pattern: /\(Jimikand\)/gi, replace: '(Chena)' },
    { pattern: /\(Kacha Kela\)/gi, replace: '(Pacha Kaya)' },
    { pattern: /\(Kacha Papita\)/gi, replace: '(Pacha Omakka)' },
    { pattern: /\(Kacha Aam\)/gi, replace: '(Pacha Manga)' },
    { pattern: /\(Indian Gooseberry\)/gi, replace: '(Nellikka)' },
    { pattern: /\(Moringa\)/gi, replace: '(Muringakkol)' },
    { pattern: /\(Sahjan\)/gi, replace: '(Muringakkol)' },
    { pattern: /\(Hari Pyaz\)/gi, replace: '(Ullithandu)' },
    { pattern: /\(Amaranth\)/gi, replace: '(Cheera)' },
    { pattern: /\(Malabar Spinach\)/gi, replace: '(Valli Cheera)' },
    { pattern: /\(Kela Patta\)/gi, replace: '(Vazhayila)' },
    { pattern: /\(Lotus Stem\)/gi, replace: '(Thamara Valayam)' },
    { pattern: /\(Gawar Phali\)/gi, replace: '(Kothavara)' },

    // Fruits
    { pattern: /\(Anaar\)/gi, replace: '(Mathalam)' },
    { pattern: /\(Papita\)/gi, replace: '(Omakka)' },
    { pattern: /\(Kharbuja\)/gi, replace: '(Shamam)' },
    { pattern: /\(Amrud\)/gi, replace: '(Perakka)' },
    { pattern: /\(Sitaphal\)/gi, replace: '(Aatha Chakka)' },
    { pattern: /\(Chikoo\)/gi, replace: '(Chikku)' },
    { pattern: /\(Ananas\)/gi, replace: '(Kaithachakka)' },

    // Flowers & Pooja
    { pattern: /\(Kamal\)/gi, replace: '(Thaamara)' },
    { pattern: /\(Mogra\)/gi, replace: '(Mulla)' },
    { pattern: /\(Genda\)/gi, replace: '(Chendumalli)' },
    { pattern: /\(Paan Patta\)/gi, replace: '(Vettila)' },
    { pattern: /\(Dhurbah\)/gi, replace: '(Karuka Pullu)' },
    { pattern: /\(Aam Patta\)/gi, replace: '(Mavila)' },
    { pattern: /\(Bel Patta\)/gi, replace: '(Koovalam Ila)' },

    // Groceries, Spices, Dals
    { pattern: /\(Haldi\)/gi, replace: '(Manjal)' },
    { pattern: /\(Tikhalal\)/gi, replace: '(Eri Mulaku)' },
    { pattern: /\(Jeera\)/gi, replace: '(Jeerakam)' },
    { pattern: /\(Rai\)/gi, replace: '(Kaduku)' },
    { pattern: /\(Elaichi\)/gi, replace: '(Elakkaya)' },
    { pattern: /\(Laung\)/gi, replace: '(Gramboo)' },
    { pattern: /\(Dalchini\)/gi, replace: '(Karuvapatta)' },
    { pattern: /\(Sonth\)/gi, replace: '(Chukku)' },
    { pattern: /\(Compounded Asafoetida\)/gi, replace: '(Kaayam)' },
    { pattern: /\(Black Chickpeas\)/gi, replace: '(Kadala)' },
    { pattern: /\(Safed Vatana\)/gi, replace: '(Vella Pattani)' },
    { pattern: /\(Hara Vatana\)/gi, replace: '(Pacha Pattani)' },
    { pattern: /\(Black Eyed Peas\)/gi, replace: '(Vanpayar)' },
    { pattern: /\(Kulthi Dal\)/gi, replace: '(Muthira)' },
    { pattern: /\(Murmura\)/gi, replace: '(Pori)' },
    { pattern: /\(Sago\)/gi, replace: '(Chowari)' },
    { pattern: /\(Sevai\)/gi, replace: '(Semiya)' },
    { pattern: /\(Daliya\)/gi, replace: '(Nurukku Gothambu)' },
    { pattern: /\(Green Gram\)/gi, replace: '(Cherupayar)' },
    { pattern: /\(Kali Dal\)/gi, replace: '(Karutha Uzhunnu)' },
  ];

  for (const { pattern, replace } of TRANSLATIONS) {
    if (pattern.test(res)) {
      res = res.replace(pattern, replace);
    }
  }

  return res;
}

async function testTransform() {
  const { data: vegItems } = await supabase.from('demo_items').select('id, name').ilike('name', '%(%');
  console.log('--- PREVIEW OF TRANSLATED NAMES ---');
  let changedCount = 0;
  vegItems.forEach(i => {
    const updated = translateSubName(i.name);
    if (updated !== i.name) {
      changedCount++;
      console.log(`${i.name}  ===>  ${updated}`);
    }
  });
  console.log(`\nTotal items transformed: ${changedCount} of ${vegItems.length}`);
}

testTransform();
