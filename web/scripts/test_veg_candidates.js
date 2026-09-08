const https = require('https');

const CANDIDATES = {
  // Yellow Bell Pepper
  yellow_bell_pepper: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=500&auto=format&fit=crop&q=80', // check if yellow or red
  yellow_capsicum: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&auto=format&fit=crop&q=80',
  yellow_pepper: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=500&auto=format&fit=crop&q=80',
  
  // Spring Onion
  spring_onion: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=500&auto=format&fit=crop&q=80',
  scallions: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=80',
  green_onion: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=80',
  spring_onion_real: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  
  // Curry Leaves
  curry_leaves: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=500&auto=format&fit=crop&q=80',
  curry_leaves2: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500&auto=format&fit=crop&q=80',
  
  // Brussels Sprouts
  brussels_sprouts: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  brussels: 'https://images.unsplash.com/photo-1438118901604-70354f463775?w=500&auto=format&fit=crop&q=80',
  
  // Lemongrass
  lemongrass: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
  lemongrass2: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  
  // Herbs: Rosemary & Thyme
  rosemary: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop&q=80',
  herbs: 'https://images.unsplash.com/photo-1509358211563-08035a092822?w=500&auto=format&fit=crop&q=80',
  
  // Raw banana / plantain
  raw_banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80',
  plantain: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop&q=80',
  
  // Flowers
  marigold_yellow: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=500&auto=format&fit=crop&q=80',
  jasmine: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=500&auto=format&fit=crop&q=80',
  rose: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&auto=format&fit=crop&q=80',
  lotus: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=500&auto=format&fit=crop&q=80',
  
  // Cut Mix Veg / Sambhar Mix
  cut_veg_mix: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  stir_fry: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
};

async function test() {
  for (const [key, url] of Object.entries(CANDIDATES)) {
    try {
      const res = await new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (resp) => {
          resolve({ status: resp.statusCode, type: resp.headers['content-type'] });
        }).on('error', reject);
      });
      console.log(`${key.padEnd(20)}: ${res.status} (${res.type})`);
    } catch (e) {
      console.log(`${key.padEnd(20)}: ERROR (${e.message})`);
    }
  }
}

test();
