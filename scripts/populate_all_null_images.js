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

const stapleImages = {
  cookie_biscuit: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop&q=80',
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  bun: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
  rusk: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&auto=format&fit=crop&q=80',
  cake_forest: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
  cake_fruit: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&auto=format&fit=crop&q=80',
  puff_snack: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
  samosa: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
  cutlet: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=80',
  banana_snack: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop&q=80',
  indian_sweet: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80',
  curd: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80',
  butter: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=80',
  ghee: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
  cheese: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&auto=format&fit=crop&q=80',
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80',
  tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
  coffee: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
  water: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80',
  juice: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&auto=format&fit=crop&q=80',
  ice_cream: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&auto=format&fit=crop&q=80',
  dry_fruits: 'https://images.unsplash.com/photo-1508061252224-4039b5a7765d?w=500&auto=format&fit=crop&q=80',
  cereal_oats: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop&q=80',
  coconut_oil: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&auto=format&fit=crop&q=80'
};

function matchImage(name) {
  const n = name.toLowerCase();
  if (n.includes('biscuit') || n.includes('cookie') || n.includes('cracker')) return stapleImages.cookie_biscuit;
  if (n.includes('rusk')) return stapleImages.rusk;
  if (n.includes('bread')) return stapleImages.bread;
  if (n.includes('bun') || n.includes('pav')) return stapleImages.bun;
  if (n.includes('forest')) return stapleImages.cake_forest;
  if (n.includes('cake')) return stapleImages.cake_fruit;
  if (n.includes('puff')) return stapleImages.puff_snack;
  if (n.includes('cutlet')) return stapleImages.cutlet;
  if (n.includes('samosa')) return stapleImages.samosa;
  if (n.includes('pazham') || n.includes('banana')) return stapleImages.banana_snack;
  if (n.includes('appam') || n.includes('halwa') || n.includes('jamun') || n.includes('sweet') || n.includes('peda')) return stapleImages.indian_sweet;
  if (n.includes('ice cream') || n.includes('chocobar') || n.includes('kulfi')) return stapleImages.ice_cream;
  if (n.includes('tea')) return stapleImages.tea;
  if (n.includes('coffee')) return stapleImages.coffee;
  if (n.includes('water') || n.includes('drink')) return stapleImages.water;
  if (n.includes('juice') || n.includes('karikku')) return stapleImages.juice;
  if (n.includes('ghee')) return stapleImages.ghee;
  if (n.includes('butter')) return stapleImages.butter;
  if (n.includes('paneer')) return stapleImages.paneer;
  if (n.includes('cheese')) return stapleImages.cheese;
  if (n.includes('curd') || n.includes('lassi') || n.includes('sambharam') || n.includes('moru')) return stapleImages.curd;
  if (n.includes('milk') || n.includes('cream')) return stapleImages.milk;
  if (n.includes('almond') || n.includes('cashew') || n.includes('walnut') || n.includes('pista') || n.includes('raisin') || n.includes('date') || n.includes('peanut')) return stapleImages.dry_fruits;
  if (n.includes('flake') || n.includes('choco') || n.includes('oat') || n.includes('cereal')) return stapleImages.cereal_oats;
  if (n.includes('coconut') || n.includes('oil')) return stapleImages.coconut_oil;
  return stapleImages.puff_snack;
}

async function populateNulls() {
  const { data: nullItems } = await supabase.from('demo_items').select('id, name').is('default_image', null);
  console.log(`Found ${nullItems.length} items without images.`);

  let updated = 0;
  for (const item of nullItems) {
    const img = matchImage(item.name);
    const { error } = await supabase.from('demo_items').update({ default_image: img }).eq('id', item.id);
    if (!error) updated++;
  }

  console.log(`Successfully populated ${updated} items with verified images!`);
  
  const { data: check } = await supabase.from('demo_items').select('id').is('default_image', null);
  console.log(`Remaining null items: ${check ? check.length : 0}`);
}

populateNulls();
