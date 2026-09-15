const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
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

const CATEGORIES = {
  attaFlours: 'a57fb3c9-db6b-41ae-afd5-864a14134afe', // Rice, Atta, Flours & Mixes
  cookingEssentials: 'f2429c0e-d038-4557-8aa1-969af9a4f99a', // Cooking Essentials (Salt, Ghee, Oils)
  dalsPulses: 'e2898efb-19d4-4f3e-9bf8-803fb7d8ac8e', // Dals, Pulses & Beans
  bakery: '456d611f-a322-48ce-a6d8-287b225afde4', // Bakery / Ready to cook breads
  desserts: '48a2b255-5f70-49de-b383-c5cf877f9d3e' // Desserts & Sweets
};

const UNITS = {
  g: '32d0b812-34cc-415c-b7cf-1f96dc2f841f',
  kg: 'fc6f287c-0b3c-458e-8d4f-4679d0059c32',
  ml: '4d3b2515-c26d-4c05-ab72-13ff6c6d0938',
  L: '24f2e09f-23d1-4919-a6c3-7a3d11fae4ef',
  pack: '5cb5e824-4974-40f9-82ec-6edaa9ad32aa',
  pcs: '9137e686-0e75-4a6b-a261-891b1e4e9774'
};

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      const req = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        },
        timeout: 25000
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let loc = res.headers.location;
          if (!loc.startsWith('http')) loc = new URL(loc, url).toString();
          return downloadImage(loc).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          let cType = res.headers['content-type'] || 'image/webp';
          if (!cType || cType.includes('text')) {
            cType = 'image/webp';
          }
          resolve({ buffer: buf, contentType: cType });
        });
      });
      req.on('error', reject);
      req.setTimeout(25000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function uploadToStorage(storagePath, buffer, contentType) {
  const { error } = await supabase.storage
    .from('item-images')
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: contentType
    });

  if (error) {
    console.error(`  -> Storage upload error (${storagePath}):`, error.message);
    return null;
  }
  const { data } = supabase.storage.from('item-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

// 41 Aashirvaad Product Templates Definitions
const AASHIRVAAD_PRODUCTS = [
  // 1. Atta Range
  {
    name: 'Aashirvaad Select 100% Sharbati Atta',
    cleanSlug: 'aashirvaad_select_sharbati_atta',
    mlName: 'ആശീർവാദ് സെലക്ട് 100% ശർബതി ആട്ട',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/select-atta-thumbnail?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.kg,
    basePrice: 72,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 72, is_default: false, display_order: 1 },
      { label: '5 kg', unit_id: UNITS.kg, value: 5, price: 345, is_default: true, display_order: 2 },
      { label: '10 kg', unit_id: UNITS.kg, value: 10, price: 680, is_default: false, display_order: 3 }
    ]
  },
  {
    name: 'Aashirvaad Shudh Chakki Whole Wheat Atta',
    cleanSlug: 'aashirvaad_shudh_chakki_atta',
    mlName: 'ആശീർവാദ് ശുദ്ധ ചക്കി ഗോതമ്പ് ആട്ട',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Image-685-2x?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.kg,
    basePrice: 58,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 58, is_default: false, display_order: 1 },
      { label: '5 kg', unit_id: UNITS.kg, value: 5, price: 275, is_default: true, display_order: 2 },
      { label: '10 kg', unit_id: UNITS.kg, value: 10, price: 540, is_default: false, display_order: 3 }
    ]
  },
  {
    name: 'Aashirvaad Superior MP Whole Wheat Atta',
    cleanSlug: 'aashirvaad_superior_mp_atta',
    mlName: 'ആശീർവാദ് സുപ്പീരിയർ എം.പി ഗോതമ്പ് ആട്ട',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Superior-MP-1?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.kg,
    basePrice: 59,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 59, is_default: false, display_order: 1 },
      { label: '5 kg', unit_id: UNITS.kg, value: 5, price: 285, is_default: true, display_order: 2 },
      { label: '10 kg', unit_id: UNITS.kg, value: 10, price: 560, is_default: false, display_order: 3 }
    ]
  },
  {
    name: 'Aashirvaad MP Chakki Atta',
    cleanSlug: 'aashirvaad_mp_chakki_atta',
    mlName: 'ആശീർവാദ് എം.പി ചക്കി ആട്ട',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/MP Chakki Atta?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.kg,
    basePrice: 58,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 58, is_default: false, display_order: 1 },
      { label: '5 kg', unit_id: UNITS.kg, value: 5, price: 280, is_default: true, display_order: 2 },
      { label: '10 kg', unit_id: UNITS.kg, value: 10, price: 550, is_default: false, display_order: 3 }
    ]
  },
  {
    name: 'Aashirvaad Atta with Multigrains',
    cleanSlug: 'aashirvaad_multigrain_atta',
    mlName: 'ആശീർവാദ് മൾട്ടിഗ്രെയിൻ ആട്ട',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/dq?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.kg,
    basePrice: 75,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 75, is_default: false, display_order: 1 },
      { label: '5 kg', unit_id: UNITS.kg, value: 5, price: 360, is_default: true, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Sugar Release Control Atta',
    cleanSlug: 'aashirvaad_sugar_release_control_atta',
    mlName: 'ആശീർവാദ് ഷുഗർ റിലീസ് കൺട്രോൾ ആട്ട',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/sugar-release-control-atta?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.kg,
    basePrice: 85,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 85, is_default: false, display_order: 1 },
      { label: '5 kg', unit_id: UNITS.kg, value: 5, price: 410, is_default: true, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Fortified Chakki Atta',
    cleanSlug: 'aashirvaad_fortified_chakki_atta',
    mlName: 'ആശീർവാദ് ഫോർട്ടിഫൈഡ് ചക്കി ആട്ട',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Fortified FOP1?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.kg,
    basePrice: 62,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 62, is_default: false, display_order: 1 },
      { label: '5 kg', unit_id: UNITS.kg, value: 5, price: 295, is_default: true, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Gluten Free Flour',
    cleanSlug: 'aashirvaad_gluten_free_flour',
    mlName: 'ആശീർവാദ് ഗ്ലൂറ്റൻ ഫ്രീ ഫ്ലോർ',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/gluten-free-flour?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.g,
    basePrice: 120,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '500 g', unit_id: UNITS.g, value: 500, price: 120, is_default: true, display_order: 1 },
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 235, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Atta with Millets',
    cleanSlug: 'aashirvaad_atta_with_millets',
    mlName: 'ആശീർവാദ് മില്ലറ്റ്സ് ആട്ട',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Atta with millets?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.kg,
    basePrice: 78,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 78, is_default: true, display_order: 1 },
      { label: '5 kg', unit_id: UNITS.kg, value: 5, price: 375, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Ragi Flour',
    cleanSlug: 'aashirvaad_ragi_flour',
    mlName: 'ആശീർവാദ് റാഗി മാവ്',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Ragi flour?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.kg,
    basePrice: 65,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '500 g', unit_id: UNITS.g, value: 500, price: 35, is_default: false, display_order: 1 },
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 65, is_default: true, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Millets Batter Mix',
    cleanSlug: 'aashirvaad_millets_batter_mix',
    mlName: 'ആശീർവാദ് മില്ലറ്റ്സ് ബാറ്റർ മിക്സ്',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Batter mix?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.pack,
    basePrice: 35,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '80 g Pouch', unit_id: UNITS.pack, value: 1, price: 35, is_default: true, display_order: 1 },
      { label: 'Pack of 2 (80g x 2)', unit_id: UNITS.pack, value: 2, price: 68, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Pure Besan',
    cleanSlug: 'aashirvaad_pure_besan',
    mlName: 'ആശീർവാദ് കടലമാവ് (ബേസൻ)',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Besan 1kg?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.g,
    basePrice: 60,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '500 g', unit_id: UNITS.g, value: 500, price: 60, is_default: true, display_order: 1 },
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 115, is_default: false, display_order: 2 }
    ]
  },

  // 2. Vermicelli & Rava
  {
    name: 'Aashirvaad Vermicelli',
    cleanSlug: 'aashirvaad_vermicelli',
    mlName: 'ആശീർവാദ് സേമിയ (വെർമിസെല്ലി)',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Vermicelli?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.g,
    basePrice: 30,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '400 g', unit_id: UNITS.g, value: 400, price: 30, is_default: true, display_order: 1 },
      { label: '850 g', unit_id: UNITS.g, value: 850, price: 58, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Roasted Vermicelli',
    cleanSlug: 'aashirvaad_roasted_vermicelli',
    mlName: 'ആശീർവാദ് വറുത്ത സേമിയ',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/ROSTED VERMICELLI?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.g,
    basePrice: 35,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '400 g', unit_id: UNITS.g, value: 400, price: 35, is_default: true, display_order: 1 },
      { label: '850 g', unit_id: UNITS.g, value: 850, price: 68, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Bansi Rava',
    cleanSlug: 'aashirvaad_bansi_rava',
    mlName: 'ആശീർവാദ് ബൻസി റവ',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/BANSI-RAVA-copy?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.g,
    basePrice: 42,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '500 g', unit_id: UNITS.g, value: 500, price: 42, is_default: true, display_order: 1 },
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 80, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Double Roasted Suji Rava',
    cleanSlug: 'aashirvaad_double_roasted_suji_rava',
    mlName: 'ആശീർവാദ് ഡബിൾ റോസ്റ്റഡ് സൂജി റവ',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/SUJI--DOUBLE-ROSTED-flat-copy?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.g,
    basePrice: 45,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '500 g', unit_id: UNITS.g, value: 500, price: 45, is_default: true, display_order: 1 },
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 85, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Samba Broken Wheat',
    cleanSlug: 'aashirvaad_samba_broken_wheat',
    mlName: 'ആശീർവാദ് സാമ്പ നുറുക്ക് ഗോതമ്പ്',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/SAMBA-BROKEN-flat-copy?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.g,
    basePrice: 40,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '500 g', unit_id: UNITS.g, value: 500, price: 40, is_default: true, display_order: 1 },
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 78, is_default: false, display_order: 2 }
    ]
  },

  // 3. Instant Mixes & Instant Meals
  {
    name: 'Aashirvaad Instant Gulab Jamun Mix',
    cleanSlug: 'aashirvaad_instant_gulab_jamun_mix',
    mlName: 'ആശീർവാദ് ഗുലാബ് ജാമുൻ മിക്സ്',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Gulab Jamun Instant Mix?fmt=webp-alpha',
    categoryId: CATEGORIES.desserts,
    categoryName: 'Desserts & Ice Creams',
    baseUnitId: UNITS.g,
    basePrice: 75,
    codePrefix: 'ANG-DES-',
    variants: [
      { label: '175 g', unit_id: UNITS.g, value: 175, price: 75, is_default: true, display_order: 1 },
      { label: 'Buy 1 Get 1 (175g x 2)', unit_id: UNITS.pack, value: 2, price: 135, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Instant Rice Idli Mix',
    cleanSlug: 'aashirvaad_instant_rice_idli_mix',
    mlName: 'ആശീർവാദ് റൈസ് ഇഡ്ഡലി മിക്സ്',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Rice Idli Instant Mix?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.g,
    basePrice: 65,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '500 g', unit_id: UNITS.g, value: 500, price: 65, is_default: true, display_order: 1 },
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 125, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Instant Rava Idli Mix',
    cleanSlug: 'aashirvaad_instant_rava_idli_mix',
    mlName: 'ആശീർവാദ് റവ ഇഡ്ഡലി മിക്സ്',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Rava Idli Instant Mix?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.g,
    basePrice: 70,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '500 g', unit_id: UNITS.g, value: 500, price: 70, is_default: true, display_order: 1 },
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 135, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Instant Rice Dosa Mix',
    cleanSlug: 'aashirvaad_instant_rice_dosa_mix',
    mlName: 'ആശീർവാദ് റൈസ് ദോശ മിക്സ്',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/RICE-DOSA?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.g,
    basePrice: 70,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '500 g', unit_id: UNITS.g, value: 500, price: 70, is_default: true, display_order: 1 },
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 135, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Instant Veggie Upma',
    cleanSlug: 'aashirvaad_instant_veggie_upma',
    mlName: 'ആശീർവാദ് ഇൻസ്റ്റന്റ് വെജ്ജി ഉപ്പുമാവ്',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Instant Veggie Upma?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.pack,
    basePrice: 40,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '80 g Cup', unit_id: UNITS.pack, value: 1, price: 40, is_default: true, display_order: 1 },
      { label: 'Pack of 3 Cups', unit_id: UNITS.pack, value: 3, price: 115, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Instant Khatta Meetha Poha',
    cleanSlug: 'aashirvaad_instant_khatta_meetha_poha',
    mlName: 'ആശീർവാദ് ഇൻസ്റ്റന്റ് ഖട്ടാ മീഠാ അവൽ (പോഹ)',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Instant Khata meetha poha?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.pack,
    basePrice: 40,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '80 g Cup', unit_id: UNITS.pack, value: 1, price: 40, is_default: true, display_order: 1 },
      { label: 'Pack of 3 Cups', unit_id: UNITS.pack, value: 3, price: 115, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Instant Mini Idli Sambar',
    cleanSlug: 'aashirvaad_instant_mini_idli_sambar',
    mlName: 'ആശീർവാദ് ഇൻസ്റ്റന്റ് മിനി ഇഡ്ഡലി സാമ്പാർ',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Instant Mini Idli Sambar?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.pack,
    basePrice: 50,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '85 g Cup', unit_id: UNITS.pack, value: 1, price: 50, is_default: true, display_order: 1 },
      { label: 'Pack of 3 Cups', unit_id: UNITS.pack, value: 3, price: 145, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Instant Suji Halwa with Jaggery',
    cleanSlug: 'aashirvaad_instant_suji_halwa',
    mlName: 'ആശീർവാദ് ഇൻസ്റ്റന്റ് സൂജി ഹൽവ ശർക്കരയോടൊപ്പം',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Instant Suji Halwa with Jaggery?fmt=webp-alpha',
    categoryId: CATEGORIES.desserts,
    categoryName: 'Desserts & Ice Creams',
    baseUnitId: UNITS.pack,
    basePrice: 45,
    codePrefix: 'ANG-DES-',
    variants: [
      { label: '80 g Cup', unit_id: UNITS.pack, value: 1, price: 45, is_default: true, display_order: 1 },
      { label: 'Pack of 3 Cups', unit_id: UNITS.pack, value: 3, price: 130, is_default: false, display_order: 2 }
    ]
  },

  // 4. Salts
  {
    name: 'Aashirvaad Iodized Salt',
    cleanSlug: 'aashirvaad_iodized_salt',
    mlName: 'ആശീർവാദ് അയോഡൈസ്ഡ് ഉപ്പ്',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Iodized Salt 1kg?fmt=webp-alpha',
    categoryId: CATEGORIES.cookingEssentials,
    categoryName: 'Cooking Essentials',
    baseUnitId: UNITS.kg,
    basePrice: 28,
    codePrefix: 'ANG-OIL-',
    variants: [
      { label: '1 kg Pouch', unit_id: UNITS.kg, value: 1, price: 28, is_default: true, display_order: 1 },
      { label: 'Pack of 3 (1kg x 3)', unit_id: UNITS.pack, value: 3, price: 80, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Salt Active',
    cleanSlug: 'aashirvaad_salt_active',
    mlName: 'ആശീർവാദ് സാൾട്ട് ആക്ടീവ്',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/salt-active?fmt=webp-alpha',
    categoryId: CATEGORIES.cookingEssentials,
    categoryName: 'Cooking Essentials',
    baseUnitId: UNITS.kg,
    basePrice: 32,
    codePrefix: 'ANG-OIL-',
    variants: [
      { label: '1 kg Pouch', unit_id: UNITS.kg, value: 1, price: 32, is_default: true, display_order: 1 },
      { label: 'Pack of 2 (1kg x 2)', unit_id: UNITS.pack, value: 2, price: 62, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Himalayan Pink Salt',
    cleanSlug: 'aashirvaad_himalayan_pink_salt',
    mlName: 'ആശീർവാദ് ഹിമാലയൻ പിങ്ക് സാൾട്ട് (ഇന്തുപ്പ്)',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/himalayan-pink-salt?fmt=webp-alpha',
    categoryId: CATEGORIES.cookingEssentials,
    categoryName: 'Cooking Essentials',
    baseUnitId: UNITS.kg,
    basePrice: 95,
    codePrefix: 'ANG-OIL-',
    variants: [
      { label: '500 g Pouch', unit_id: UNITS.g, value: 500, price: 55, is_default: false, display_order: 1 },
      { label: '1 kg Pouch', unit_id: UNITS.kg, value: 1, price: 95, is_default: true, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Iodized Crystal Salt',
    cleanSlug: 'aashirvaad_iodized_crystal_salt',
    mlName: 'ആശീർവാദ് അയോഡൈസ്ഡ് തരി ഉപ്പ് (കല്ലുപ്പ്)',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Iodized-crystal-Salt?fmt=webp-alpha',
    categoryId: CATEGORIES.cookingEssentials,
    categoryName: 'Cooking Essentials',
    baseUnitId: UNITS.kg,
    basePrice: 24,
    codePrefix: 'ANG-OIL-',
    variants: [
      { label: '1 kg Pouch', unit_id: UNITS.kg, value: 1, price: 24, is_default: true, display_order: 1 },
      { label: 'Pack of 3 (1kg x 3)', unit_id: UNITS.pack, value: 3, price: 68, is_default: false, display_order: 2 }
    ]
  },

  // 5. Ghee
  {
    name: 'Aashirvaad Svasti Pure Cow Ghee',
    cleanSlug: 'aashirvaad_svasti_pure_cow_ghee',
    mlName: 'ആശീർവാദ് സ്വസ്തി പ്യുവർ പശുവിൻ നെയ്യ്',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/aashirvaad ghee?fmt=webp-alpha',
    categoryId: CATEGORIES.cookingEssentials,
    categoryName: 'Cooking Essentials',
    baseUnitId: UNITS.ml,
    basePrice: 85,
    codePrefix: 'ANG-OIL-',
    variants: [
      { label: '100 ml Jar', unit_id: UNITS.ml, value: 100, price: 85, is_default: false, display_order: 1 },
      { label: '200 ml Jar', unit_id: UNITS.ml, value: 200, price: 165, is_default: false, display_order: 2 },
      { label: '500 ml Jar', unit_id: UNITS.ml, value: 500, price: 395, is_default: true, display_order: 3 },
      { label: '1 L Tin/Jar', unit_id: UNITS.L, value: 1, price: 780, is_default: false, display_order: 4 }
    ]
  },

  // 6. Frozen & Ready to Cook Breads
  {
    name: 'Aashirvaad Garlic & Coriander Naan',
    cleanSlug: 'aashirvaad_garlic_coriander_naan',
    mlName: 'ആശീർവാദ് വെളുത്തുള്ളി മല്ലിയില നാൻ (ഫ്രോസൺ)',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Garlic _ Coriander Naan?fmt=webp-alpha',
    categoryId: CATEGORIES.bakery,
    categoryName: 'Bakery',
    baseUnitId: UNITS.pack,
    basePrice: 140,
    codePrefix: 'ANG-BAK-',
    variants: [
      { label: 'Pack of 5 Naans (400 g)', unit_id: UNITS.pack, value: 1, price: 140, is_default: true, display_order: 1 },
      { label: 'Twin Pack (5 x 2)', unit_id: UNITS.pack, value: 2, price: 270, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Malabar Paratha',
    cleanSlug: 'aashirvaad_malabar_paratha',
    mlName: 'ആശീർവാദ് മലബാർ പൊറോട്ട',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Malabar Paratha?fmt=webp-alpha',
    categoryId: CATEGORIES.bakery,
    categoryName: 'Bakery',
    baseUnitId: UNITS.pack,
    basePrice: 110,
    codePrefix: 'ANG-BAK-',
    variants: [
      { label: 'Pack of 5 Parathas (400 g)', unit_id: UNITS.pack, value: 1, price: 110, is_default: true, display_order: 1 },
      { label: 'Family Pack of 10 Parathas (800 g)', unit_id: UNITS.pack, value: 1, price: 210, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Aloo Paratha',
    cleanSlug: 'aashirvaad_aloo_paratha',
    mlName: 'ആശീർവാദ് ആലു പൊറോട്ട (ഫ്രോസൺ)',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvad Aloo Paratha?fmt=webp-alpha',
    categoryId: CATEGORIES.bakery,
    categoryName: 'Bakery',
    baseUnitId: UNITS.pack,
    basePrice: 135,
    codePrefix: 'ANG-BAK-',
    variants: [
      { label: 'Pack of 4 Parathas (400 g)', unit_id: UNITS.pack, value: 1, price: 135, is_default: true, display_order: 1 },
      { label: 'Twin Pack (4 x 2)', unit_id: UNITS.pack, value: 2, price: 260, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Paneer Paratha',
    cleanSlug: 'aashirvaad_paneer_paratha',
    mlName: 'ആശീർവാദ് പനീർ പൊറോട്ട (ഫ്രോസൺ)',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Paneer Paratha?fmt=webp-alpha',
    categoryId: CATEGORIES.bakery,
    categoryName: 'Bakery',
    baseUnitId: UNITS.pack,
    basePrice: 160,
    codePrefix: 'ANG-BAK-',
    variants: [
      { label: 'Pack of 4 Parathas (400 g)', unit_id: UNITS.pack, value: 1, price: 160, is_default: true, display_order: 1 },
      { label: 'Twin Pack (4 x 2)', unit_id: UNITS.pack, value: 2, price: 310, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Tandoori Naan',
    cleanSlug: 'aashirvaad_tandoori_naan',
    mlName: 'ആശീർവാദ് തന്തൂരി നാൻ (ഫ്രോസൺ)',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Tandoori Naan?fmt=webp-alpha',
    categoryId: CATEGORIES.bakery,
    categoryName: 'Bakery',
    baseUnitId: UNITS.pack,
    basePrice: 130,
    codePrefix: 'ANG-BAK-',
    variants: [
      { label: 'Pack of 5 Naans (400 g)', unit_id: UNITS.pack, value: 1, price: 130, is_default: true, display_order: 1 },
      { label: 'Twin Pack (5 x 2)', unit_id: UNITS.pack, value: 2, price: 250, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Ready To Cook Chapati',
    cleanSlug: 'aashirvaad_ready_to_cook_chapati',
    mlName: 'ആശീർവാദ് റെഡി ടു കുക്ക് ചപ്പാത്തി',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Ready to Cook Chapati?fmt=webp-alpha',
    categoryId: CATEGORIES.bakery,
    categoryName: 'Bakery',
    baseUnitId: UNITS.pack,
    basePrice: 90,
    codePrefix: 'ANG-BAK-',
    variants: [
      { label: 'Pack of 10 Chapatis (350 g)', unit_id: UNITS.pack, value: 1, price: 90, is_default: true, display_order: 1 },
      { label: 'Mega Pack of 20 Chapatis (700 g)', unit_id: UNITS.pack, value: 2, price: 175, is_default: false, display_order: 2 }
    ]
  },

  // 7. Organic Range (Atta & Dals)
  {
    name: 'Aashirvaad Organic Whole Wheat Atta',
    cleanSlug: 'aashirvaad_organic_whole_wheat_atta',
    mlName: 'ആശീർവാദ് ഓർഗാനിക് ഗോതമ്പ് ആട്ട',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Organic Whole Wheat Atta?fmt=webp-alpha',
    categoryId: CATEGORIES.attaFlours,
    categoryName: 'Rice, Atta, Flours & Mixes',
    baseUnitId: UNITS.kg,
    basePrice: 85,
    codePrefix: 'ANG-RIC-',
    variants: [
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 85, is_default: false, display_order: 1 },
      { label: '5 kg', unit_id: UNITS.kg, value: 5, price: 410, is_default: true, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Organic Chana Dal',
    cleanSlug: 'aashirvaad_organic_chana_dal',
    mlName: 'ആശീർവാദ് ഓർഗാനിക് കടലപ്പരിപ്പ് (ചനാ ദാൽ)',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Organic Chana Dal?fmt=webp-alpha',
    categoryId: CATEGORIES.dalsPulses,
    categoryName: 'Dals, Pulses & Beans',
    baseUnitId: UNITS.g,
    basePrice: 82,
    codePrefix: 'ANG-DAL-',
    variants: [
      { label: '500 g', unit_id: UNITS.g, value: 500, price: 82, is_default: true, display_order: 1 },
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 160, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Organic Tur Dal (Arhar Dal)',
    cleanSlug: 'aashirvaad_organic_tur_dal',
    mlName: 'ആശീർവാദ് ഓർഗാനിക് തുവരപ്പരിപ്പ് (തുവർ ദാൽ)',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Organic Tur_Arhar Dal?fmt=webp-alpha',
    categoryId: CATEGORIES.dalsPulses,
    categoryName: 'Dals, Pulses & Beans',
    baseUnitId: UNITS.g,
    basePrice: 110,
    codePrefix: 'ANG-DAL-',
    variants: [
      { label: '500 g', unit_id: UNITS.g, value: 500, price: 110, is_default: true, display_order: 1 },
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 215, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Organic Moong Dal',
    cleanSlug: 'aashirvaad_organic_moong_dal',
    mlName: 'ആശീർവാദ് ഓർഗാനിക് ചെറുപയർ പരിപ്പ് (മൂംഗ് ദാൽ)',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Organic Moong Dal_?fmt=webp-alpha',
    categoryId: CATEGORIES.dalsPulses,
    categoryName: 'Dals, Pulses & Beans',
    baseUnitId: UNITS.g,
    basePrice: 95,
    codePrefix: 'ANG-DAL-',
    variants: [
      { label: '500 g', unit_id: UNITS.g, value: 500, price: 95, is_default: true, display_order: 1 },
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 185, is_default: false, display_order: 2 }
    ]
  },
  {
    name: 'Aashirvaad Organic Urad Dal Split',
    cleanSlug: 'aashirvaad_organic_urad_dal_split',
    mlName: 'ആശീർവാദ് ഓർഗാനിക് ഉഴുന്നുപരിപ്പ് (ഉറദ് ദാൽ)',
    imageUrl: 'https://s7ap1.scene7.com/is/image/itcportalprod/Aashirvaad Organic Urad Dal Split?fmt=webp-alpha',
    categoryId: CATEGORIES.dalsPulses,
    categoryName: 'Dals, Pulses & Beans',
    baseUnitId: UNITS.g,
    basePrice: 98,
    codePrefix: 'ANG-DAL-',
    variants: [
      { label: '500 g', unit_id: UNITS.g, value: 500, price: 98, is_default: true, display_order: 1 },
      { label: '1 kg', unit_id: UNITS.kg, value: 1, price: 190, is_default: false, display_order: 2 }
    ]
  }
];

async function run() {
  console.log(`=== IMPORTING ${AASHIRVAAD_PRODUCTS.length} AASHIRVAAD PRODUCT TEMPLATES ===\n`);

  // Query latest codes by prefix to assign sequential codes
  const { data: allItems } = await supabase.from('demo_items').select('code');
  const codeCounters = {};
  allItems.forEach(it => {
    if (it.code) {
      const parts = it.code.split('-');
      if (parts.length >= 3) {
        const pre = `${parts[0]}-${parts[1]}-`;
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) {
          codeCounters[pre] = Math.max(codeCounters[pre] || 0, num);
        }
      }
    }
  });

  console.log('Starting sequence counters:', codeCounters);
  codeCounters['ANG-DES-'] = Math.max(codeCounters['ANG-DES-'] || 0, 381);
  codeCounters['ANG-RIC-'] = Math.max(codeCounters['ANG-RIC-'] || 0, 1328);
  codeCounters['ANG-OIL-'] = Math.max(codeCounters['ANG-OIL-'] || 0, 179);
  codeCounters['ANG-BAK-'] = Math.max(codeCounters['ANG-BAK-'] || 0, 327);
  codeCounters['ANG-DAL-'] = Math.max(codeCounters['ANG-DAL-'] || 0, 476);

  const importedRecords = [];

  for (const item of AASHIRVAAD_PRODUCTS) {
    try {
      // 1. Determine or assign item code
      let itemCode;
      const { data: existing } = await supabase
        .from('demo_items')
        .select('id, code')
        .ilike('name', item.name)
        .maybeSingle();

      if (existing && existing.code) {
        itemCode = existing.code;
        console.log(`\nReusing existing code [${itemCode}] for "${item.name}"`);
      } else {
        const nextNum = (codeCounters[item.codePrefix] || 100) + 1;
        codeCounters[item.codePrefix] = nextNum;
        itemCode = `${item.codePrefix}${String(nextNum).padStart(4, '0')}`;
        console.log(`\nAssigned new code [${itemCode}] for "${item.name}"`);
      }

      // 2. Download Image
      console.log(`  -> Downloading image from: ${item.imageUrl}`);
      const { buffer, contentType } = await downloadImage(item.imageUrl);

      // 3. Upload to Supabase Storage
      const ext = contentType.includes('png') ? 'png' : (contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'webp');
      const storagePath = `demos/aashirvaad/${item.cleanSlug}_${Date.now()}.${ext}`;
      const publicUrl = await uploadToStorage(storagePath, buffer, contentType);
      if (!publicUrl) throw new Error('Failed to upload image to Supabase Storage');
      console.log(`  -> CDN URL: ${publicUrl}`);

      // 4. Upsert demo_items
      let itemId;
      if (existing) {
        itemId = existing.id;
        const { error: upErr } = await supabase
          .from('demo_items')
          .update({
            name: item.name,
            category_id: item.categoryId,
            unit_id: item.baseUnitId,
            sell_mode: 'Fixed',
            default_image: publicUrl,
            code: itemCode
          })
          .eq('id', itemId);
        if (upErr) throw upErr;

        // Clear existing children for clean rebuild
        await supabase.from('demo_item_translations').delete().eq('demo_item_id', itemId);
        await supabase.from('demo_sell_config').delete().eq('demo_item_id', itemId);
        await supabase.from('demo_variants').delete().eq('demo_item_id', itemId);
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('demo_items')
          .insert({
            code: itemCode,
            name: item.name,
            category_id: item.categoryId,
            unit_id: item.baseUnitId,
            sell_mode: 'Fixed',
            default_image: publicUrl
          })
          .select('id')
          .single();
        if (insErr) throw insErr;
        itemId = inserted.id;
      }

      // 5. Insert Malayalam Translation
      await supabase.from('demo_item_translations').insert({
        demo_item_id: itemId,
        language_code: 'ml',
        name: item.mlName
      });

      // 6. Insert Sell Config
      const ceiling = Math.ceil(item.basePrice * 1.15);
      await supabase.from('demo_sell_config').insert({
        demo_item_id: itemId,
        sell_mode: 'Fixed',
        base_unit_id: item.baseUnitId,
        price_per_base_unit: item.basePrice,
        allow_custom_quantity: false,
        max_price_increase_percent: 15.00,
        max_price_limit: ceiling
      });

      // 7. Insert Variants
      const variantsPayload = item.variants.map(v => ({
        demo_item_id: itemId,
        variant_type: 'Fixed',
        label: v.label,
        unit_id: v.unit_id,
        value: v.value,
        price: v.price,
        is_default: v.is_default,
        is_active: true,
        display_order: v.display_order
      }));
      await supabase.from('demo_variants').insert(variantsPayload);

      console.log(`  -> Successfully saved ${item.name} (${item.variants.length} variants)`);

      importedRecords.push({
        brand: 'Aashirvaad',
        code: itemCode,
        name: item.name,
        category: item.categoryName,
        mlName: item.mlName,
        basePrice: item.basePrice,
        variantsCount: item.variants.length,
        imageUrl: publicUrl
      });
    } catch(err) {
      console.error(`  -> Failed importing ${item.name}:`, err.message);
    }
  }

  // 8. Write Catalog CSV
  const csvHeader = 'Brand,Code,Name,Category,Malayalam Name,Base Price,Variants Count,Image URL\n';
  const csvRows = importedRecords.map(it =>
    `"${it.brand}","${it.code}","${it.name.replace(/"/g, '""')}","${it.category}","${it.mlName.replace(/"/g, '""')}","${it.basePrice}","${it.variantsCount}","${it.imageUrl}"`
  ).join('\n');
  const csvPath = path.join(__dirname, '../cateloge/new/angadi_kerala_aashirvaad_catalog.csv');
  fs.writeFileSync(csvPath, csvHeader + csvRows, 'utf8');
  console.log(`\nExported Aashirvaad Catalog CSV (${importedRecords.length} items) to: ${csvPath}`);
  console.log('\n=== AASHIRVAAD IMPORT COMPLETE ===');
}

run();
