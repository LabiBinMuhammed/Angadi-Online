const { execSync } = require('child_process');
const fs = require('fs');

const raw = execSync('curl.exe -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9" "https://blinkit.com/s/?q=cinthol"').toString();

console.log('Blinkit response length:', raw.length);

// In Blinkit HTML, data is often in window.__PRELOADED_STATE__ or json scripts
let products = [];

// Try finding product objects in JSON
const productMatches = raw.match(/"name":\s*"([^"]*Cinthol[^"]*)"/gi);
console.log('Product matches by name:', productMatches?.length);

// Let's write a script to search for products and extract title, unit, price, and image
const regex = /"product_id":\s*(\d+)[\s\S]*?"name":\s*"([^"]*)"[\s\S]*?"unit":\s*"([^"]*)"[\s\S]*?"price":\s*(\d+)[\s\S]*?"image_url":\s*"([^"]*)"/gi;

let m;
const seen = new Set();
while ((m = regex.exec(raw)) !== null) {
  const id = m[1];
  const name = m[2];
  const unit = m[3];
  const price = parseInt(m[4], 10);
  const img = m[5];

  if (seen.has(name)) continue;
  seen.add(name);

  products.push({
    brand: 'Cinthol',
    name,
    unit,
    price,
    imageUrl: img
  });
}

console.log(`Extracted ${products.length} Cinthol products via regex.`);
if (products.length === 0) {
  // Try inspecting where Cinthol products are located
  const idx = raw.indexOf('"title":');
  console.log('Snippet around title:', raw.slice(idx, idx + 500));
} else {
  products.forEach(p => console.log(`- ${p.name} (${p.unit}) -> ₹${p.price} [${p.imageUrl}]`));
  fs.writeFileSync('scripts/cinthol_products.json', JSON.stringify(products, null, 2), 'utf8');
}
