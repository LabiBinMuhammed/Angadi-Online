const fs = require('fs');
const path = require('path');
const { createClient } = require(path.join(__dirname, '..', 'web', 'node_modules', '@supabase', 'supabase-js'));

const envText = fs.readFileSync(path.join(__dirname, '..', 'web', '.env.local'), 'utf8');
let supabaseUrl = '', serviceKey = '';
envText.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, serviceKey);

const easternMap = {
  'Semiya Payasam Mix': 'semiya-payasam.jpg',
  'Palada Payasam Mix': 'palada-mix-2.jpg',
  'Bambino Roasted Vermicelli': 'roasted-vermicelli.jpg',
  'MTR Breakfast Vermicelli (Semiya)': 'vermicelli.jpg',
  'Sesame Oil / Gingelly Oil': 'sesame-oil-1.jpg',
  'Supernova Garam Masala': 'super-garam-masala-powder-1.jpg',
  'Supernova Cumin Powder': 'cumin-powder-2.jpg',
  'Supernova Black Pepper Powder': 'black-pepper-powder-3.jpg',
  'Supernova Fish Fry Masala': 'fish-fry-masala.jpg',
  'Supernova Nutmeg Pickle': 'nutmeg-pickle-1.jpg',
  'Supernova Chicken Masala': 'chickenmasala.jpg',
  'Supernova Coriander Powder': 'coriander-powder.jpg',
  'Supernova Garlic Pickle': 'garlic-pickle.jpg',
  'Supernova Mango Pickle': 'mango-pickle.jpg',
  'Supernova Gooseberry (Amla) Pickle': 'amla-pickle.jpg',
  'Supernova Tender Mango Pickle': 'tender-mango-pickle.jpg',
  'Supernova Fish Pickle': 'fish-pickle.jpg',
  'Supernova Mixed Vegetable Pickle': 'mixed-vegetable-pickle-1.jpg',
  'Supernova Meat Masala': 'meat-masala.jpg',
  'Supernova White Puttu Podi': 'puttu-podi.jpg',
  'Supernova Chemba Puttu Podi': 'chemba-puttu.jpg',
  'Supernova Rasam Powder': 'rasam-powder-3.jpg',
  'Supernova Mustard Seeds': 'mustard-seed.jpg',
  'Supernova Appam & Idiyappam Podi': 'idiyappam-podi.jpg',
  'Supernova Fenugreek Seeds': 'fenugreen-seed.jpg',
  'Supernova Fennel Seeds (Saunf)': 'fennel-seed.jpg',
  'Supernova Cumin Seeds (Jeera)': 'cumin-seed.jpg',
  'Supernova Pav Bhaji Masala': 'pav-bhaji-masala.jpg',
  'Supernova Easy Pathiri Podi': 'pathiri-podi.jpg',
  'Supernova Kasuri Methi': 'kasuri-methi.jpg',
  'Supernova Vegetable Masala': 'vegetable-masala.jpg',
  'Supernova Roasted Rice Powder': 'rice-powder.jpg',
  'Supernova Chicken Fry Masala': 'chicken-fry-masala.jpg'
};

async function fixImages() {
  console.log('1. Updating 33 Eastern/Supernova items to verified Supabase Storage URLs...');
  let updatedEastern = 0;
  for (const [name, file] of Object.entries(easternMap)) {
    const newUrl = `${supabaseUrl}/storage/v1/object/public/item-images/eastern/${file}`;
    const { error } = await supabase
      .from('demo_items')
      .update({ default_image: newUrl })
      .eq('name', name);
    if (error) {
      console.error('Error updating', name, error.message);
    } else {
      updatedEastern++;
    }
  }
  console.log(`Updated ${updatedEastern} / ${Object.keys(easternMap).length} Eastern items.`);

  console.log('\n2. Verifying remaining items with eastern.in domain...');
  const { data: remainingEastern } = await supabase
    .from('demo_items')
    .select('id, name, default_image')
    .ilike('default_image', '%eastern.in%');
  console.log(`Remaining eastern.in items: ${remainingEastern ? remainingEastern.length : 0}`);
}

fixImages();
