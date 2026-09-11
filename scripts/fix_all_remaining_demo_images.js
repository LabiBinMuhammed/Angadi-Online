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

// Curated high-res, CORS-enabled food images from Unsplash
const categoryImages = {
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80',
  ghee: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
  butter: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=80',
  curd: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80',
  buttermilk: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80',
  lassi: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80',
  cheese: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&auto=format&fit=crop&q=80',
  icecream_vanilla: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&auto=format&fit=crop&q=80',
  icecream_choco: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=80',
  icecream_strawberry: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=500&auto=format&fit=crop&q=80',
  icecream_bar: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=500&auto=format&fit=crop&q=80',
  sweets_peda: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',
  sweets_gulabjamun: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
  cake_plum: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=500&auto=format&fit=crop&q=80',
  cake_chocolate: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
  cake_fruit: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&auto=format&fit=crop&q=80',
  cake_marble: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
  cupcake: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=500&auto=format&fit=crop&q=80',
  brownie: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500&auto=format&fit=crop&q=80',
  cookies: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop&q=80',
  batter: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
  feed: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=500&auto=format&fit=crop&q=80'
};

function getImageForName(name) {
  const n = name.toLowerCase();
  if (n.includes('brownie')) return categoryImages.brownie;
  if (n.includes('cupcake') || n.includes('cup cake')) return categoryImages.cupcake;
  if (n.includes('marble')) return categoryImages.cake_marble;
  if (n.includes('plum')) return categoryImages.cake_plum;
  if (n.includes('chocolate') || n.includes('choco')) {
    if (n.includes('ice cream') || n.includes('bar') || n.includes('cone')) return categoryImages.icecream_choco;
    return categoryImages.cake_chocolate;
  }
  if (n.includes('strawberry')) {
    if (n.includes('ice cream')) return categoryImages.icecream_strawberry;
    return categoryImages.cake_fruit;
  }
  if (n.includes('ice cream') || n.includes('kulfi') || n.includes('cone') || n.includes('tub') || n.includes('bar') || n.includes('lolly') || n.includes('cassatta')) {
    return categoryImages.icecream_vanilla;
  }
  if (n.includes('cake') || n.includes('pudding')) return categoryImages.cake_fruit;
  if (n.includes('cookie') || n.includes('biscuit')) return categoryImages.cookies;
  if (n.includes('peda') || n.includes('burfi') || n.includes('halwa') || n.includes('pak') || n.includes('khoya') || n.includes('mawa')) return categoryImages.sweets_peda;
  if (n.includes('jamun') || n.includes('rasagulla')) return categoryImages.sweets_gulabjamun;
  if (n.includes('ghee')) return categoryImages.ghee;
  if (n.includes('butter') && !n.includes('scotch') && !n.includes('butterscotch')) return categoryImages.butter;
  if (n.includes('curd')) return categoryImages.curd;
  if (n.includes('sambharam') || n.includes('moru') || n.includes('buttermilk')) return categoryImages.buttermilk;
  if (n.includes('lassi')) return categoryImages.lassi;
  if (n.includes('paneer')) return categoryImages.paneer;
  if (n.includes('cheese')) return categoryImages.cheese;
  if (n.includes('batter')) return categoryImages.batter;
  if (n.includes('feed') || n.includes('pellet') || n.includes('mineral')) return categoryImages.feed;
  if (n.includes('milk') || n.includes('cream')) return categoryImages.milk;
  return categoryImages.cake_fruit;
}

async function fixAllRemaining() {
  const domains = ['milma.com', 'elanadumilk.com', 'elitefoods.co.in'];
  console.log('Fetching demo items with broken domains:', domains);

  let totalUpdated = 0;
  for (const domain of domains) {
    const { data: items, error } = await supabase
      .from('demo_items')
      .select('id, name, default_image')
      .ilike('default_image', `%${domain}%`);

    if (error) {
      console.error(`Error querying ${domain}:`, error);
      continue;
    }

    console.log(`Found ${items.length} items for ${domain}`);
    for (const item of items) {
      const newImg = getImageForName(item.name);
      const { error: updErr } = await supabase
        .from('demo_items')
        .update({ default_image: newImg })
        .eq('id', item.id);

      if (updErr) {
        console.error(`Error updating item ${item.name}:`, updErr.message);
      } else {
        totalUpdated++;
      }
    }
  }

  console.log(`Successfully updated ${totalUpdated} broken demo items with high-res, reliable images!`);

  // Final verification
  const { data: allItems } = await supabase.from('demo_items').select('id, default_image');
  const remainingBroken = allItems.filter(i => {
    if (!i.default_image) return false;
    return domains.concat(['eastern.in']).some(d => i.default_image.includes(d));
  });

  console.log(`Remaining broken domain items in demo_items: ${remainingBroken.length}`);
}

fixAllRemaining();
