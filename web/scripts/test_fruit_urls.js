const https = require('https');

const FRUIT_IMAGES = {
  // Bananas
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80',
  red_banana: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&auto=format&fit=crop&q=80',
  baby_banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80',
  
  // Apples
  apple_red: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80',
  apple_green: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=80',
  apple_gala: 'https://images.unsplash.com/photo-1579613832125-5d34a13ffe0a?w=500&auto=format&fit=crop&q=80',
  apple_pink_lady: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500&auto=format&fit=crop&q=80',
  
  // Pomegranate
  pomegranate: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80',
  pomegranate_peeled: 'https://images.unsplash.com/photo-1541344999736-83eca872f242?w=500&auto=format&fit=crop&q=80',
  
  // Papaya
  papaya: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=500&auto=format&fit=crop&q=80',
  
  // Coconut
  tender_coconut: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&auto=format&fit=crop&q=80',
  brown_coconut: 'https://images.unsplash.com/photo-1544378730-8b5104b18790?w=500&auto=format&fit=crop&q=80',
  
  // Kiwi & Berries
  kiwi_green: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=500&auto=format&fit=crop&q=80',
  kiwi_gold: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=500&auto=format&fit=crop&q=80',
  blueberry: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=500&auto=format&fit=crop&q=80',
  
  // Dragon fruit
  dragon_fruit_red: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=500&auto=format&fit=crop&q=80',
  dragon_fruit_white: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&auto=format&fit=crop&q=80',
  
  // Melons
  watermelon: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80', // placeholder check
  watermelon_real: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=500&auto=format&fit=crop&q=80',
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
  
  // Stone fruits & tropical
  custard_apple: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=500&auto=format&fit=crop&q=80',
  chikoo: 'https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=500&auto=format&fit=crop&q=80',
  plum: 'https://images.unsplash.com/photo-1522184216316-3c25379f9760?w=500&auto=format&fit=crop&q=80',
  peach: 'https://images.unsplash.com/photo-1522184216316-3c25379f9760?w=500&auto=format&fit=crop&q=80',
  passion_fruit: 'https://images.unsplash.com/photo-1534856966150-c83244b78fed?w=500&auto=format&fit=crop&q=80',
  rambutan: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=500&auto=format&fit=crop&q=80',
  sugarcane: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=500&auto=format&fit=crop&q=80',
  marigold: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=500&auto=format&fit=crop&q=80',
  panch_phal: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80'
};

async function testAll() {
  for (const [key, url] of Object.entries(FRUIT_IMAGES)) {
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

testAll();
