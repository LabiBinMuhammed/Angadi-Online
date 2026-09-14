const { execSync } = require('child_process');
const fs = require('fs');

const html = execSync('curl.exe -s -L -A "Mozilla/5.0" "https://cuteesoap.com/products.php"').toString();
console.log('Cutee HTML length:', html.length);

// Find all product names and images
// Look for headings and images
const imgRegex = /<img[^>]+src="([^">]*images\/[^">]+\.(?:png|jpg|jpeg|webp))"[^>]*alt="([^">]*)"/gi;
let m;
const products = [];
const seen = new Set();

while ((m = imgRegex.exec(html)) !== null) {
  let img = m[1];
  let alt = m[2].trim();
  if (!alt || alt.toLowerCase().includes('logo') || alt.toLowerCase().includes('banner')) continue;
  if (seen.has(alt.toLowerCase())) continue;
  seen.add(alt.toLowerCase());

  let fullImg = img.startsWith('http') ? img : `https://cuteesoap.com/${img.replace(/^\//, '')}`;
  let title = alt;
  if (!title.toLowerCase().startsWith('cutee')) {
    title = `Cutee ${title}`;
  }

  products.push({
    brand: 'Cutee',
    name: title,
    category: 'Bathing Soaps',
    imageUrl: fullImg,
    basePrice: 38,
    variants: [
      { label: 'Pack of 4 (4 x 100 g)', price: 140, is_default: true },
      { label: 'Single Bar (100 g)', price: 38, is_default: false },
      { label: 'Twin Pack (8 x 100 g)', price: 270, is_default: false }
    ]
  });
}

console.log(`Extracted ${products.length} Cutee products:`);
products.forEach(p => console.log(`- ${p.name} -> ${p.imageUrl}`));
fs.writeFileSync('scripts/cutee_products.json', JSON.stringify(products, null, 2), 'utf8');
