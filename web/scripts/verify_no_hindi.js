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

const hindiPatterns = [
  'Pyaz', 'Aloo', 'Tamatar', 'Hari Mirch', 'Dhaniya', 'Lehsun', 'Adrak',
  'Bhindi', 'Patta Gobhi', 'Phool Gobhi', 'Shimla Mirch', 'Gajar', 'Mooli',
  'Chukandar', 'Palak', 'Lauki', 'Karela', 'Torai', 'Nenua', 'Petha', 'Kaddu',
  'Kundru', 'Baingan', 'Kheera', 'Shakarkandi', 'Jimikand', 'Kacha Kela',
  'Kacha Papita', 'Kacha Aam', 'Anaar', 'Papita', 'Nariyal', 'Kharbuja', 'Amrud',
  'Sitaphal', 'Chikoo', 'Kamal', 'Mogra', 'Genda'
];

async function checkDb() {
  const { data: items } = await supabase.from('demo_items').select('id, name');
  let hindiFound = 0;
  items.forEach(i => {
    hindiPatterns.forEach(p => {
      if (i.name.includes(`(${p})`)) {
        console.log(`Found DB (${p}): ${i.name}`);
        hindiFound++;
      }
    });
  });
  console.log(`Database check complete. Found ${hindiFound} items with old Hindi names.`);

  console.log('\n--- Sample of Updated Manglish/Malayalam Product Names ---');
  const sample = items.filter(i => i.name.includes('(')).slice(0, 15);
  sample.forEach(s => console.log(`   * ${s.name}`));
}

checkDb();
