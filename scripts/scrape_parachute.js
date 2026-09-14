const { execSync } = require('child_process');
const fs = require('fs');

const html = execSync('curl.exe -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9" "https://www.parachuteadvansed.com/hair-oil"').toString();

console.log('Parachute HTML length:', html.length);

// Search for product items: title, image, link
// Parachute product card pattern
const itemRegex = /<div[^>]*class="[^"]*(?:product-card|item|col)[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^">]+)"[^>]*alt="([^">]*)"[\s\S]*?<\/div>/gi;

// Also look for products with 'hair oil' in text or alt
const imgAltRegex = /<img[^>]+src="([^">]+\.(?:png|jpg|jpeg|webp))"[^>]+alt="([^">]*hair\s*oil[^">]*)"/gi;

let m;
const products = [];
const seen = new Set();

while ((m = imgAltRegex.exec(html)) !== null) {
  let img = m[1];
  let title = m[2].trim();
  if (seen.has(title.toLowerCase())) continue;
  seen.add(title.toLowerCase());

  if (!img.startsWith('http')) {
    img = img.startsWith('/') ? `https://www.parachuteadvansed.com${img}` : `https://www.parachuteadvansed.com/${img}`;
  }

  products.push({
    brand: 'Parachute Advansed',
    name: title,
    category: 'Hair Care & Hair Oil',
    imageUrl: img
  });
}

// Fallback search if few found: look for all product images in /images/ or /products/
if (products.length < 5) {
  const allProdsRegex = /<h[2-4][^>]*>([\s\S]*?Hair\s*Oil[\s\S]*?)<\/h[2-4]>/gi;
  while ((m = allProdsRegex.exec(html)) !== null) {
    const t = m[1].replace(/<[^>]+>/g, '').trim();
    if (!seen.has(t.toLowerCase()) && t.length < 80) {
      seen.add(t.toLowerCase());
      console.log('Found product heading:', t);
    }
  }
}

console.log(`Extracted ${products.length} Parachute products:`);
products.forEach(p => console.log(`- ${p.name} -> ${p.imageUrl}`));
fs.writeFileSync('scripts/parachute_products.json', JSON.stringify(products, null, 2), 'utf8');
