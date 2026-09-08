const https = require('https');

const testUrls = [
  'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500', // corn
  'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500', // spinach
  'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?w=500', // beetroot
  'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=500', // brinjal
  'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500', // broccoli
  'https://images.unsplash.com/photo-1551893478-d726eaf0442c?w=500', // cabbage
  'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500', // capsicum
  'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=500', // carrot
  'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500', // cauliflower
  'https://images.unsplash.com/photo-1546470427-227c7369a9b7?w=500', // cherry tomato
  'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500', // chilli
  'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=500', // cucumber
  'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500', // garlic
  'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=500', // peas
  'https://images.unsplash.com/photo-1533082879615-3273a5bad886?w=500', // lemon
  'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=500', // mint
  'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=500', // mushroom
  'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500', // onion
  'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500', // potato
  'https://images.unsplash.com/photo-1506917728037-b6fb01c450a1?w=500', // pumpkin
  'https://images.unsplash.com/photo-1592417817098-8f3d6ef23d9a?w=500', // radish
  'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=500', // sweet potato
  'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500', // tomato
  'https://images.unsplash.com/photo-1563252722-64350170a4a8?w=500', // zucchini
  'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500', // avocado
  'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=500'  // kale/lettuce
];

async function checkUrl(u) {
  return new Promise(resolve => {
    https.get(u, res => {
      resolve({ url: u, status: res.statusCode, type: res.headers['content-type'] });
    }).on('error', err => resolve({ url: u, error: err.message }));
  });
}

async function run() {
  console.log('Testing Unsplash URLs...');
  for (const u of testUrls) {
    const res = await checkUrl(u);
    console.log(`[${res.status}] ${res.type} -> ${u}`);
  }
}
run();
