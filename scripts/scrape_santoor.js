const { execSync } = require('child_process');
const fs = require('fs');

const categories = [
  { category: 'Bathing Soaps', url: 'https://www.santoorstayyoung.com/beauty-soap' },
  { category: 'Hand Wash', url: 'https://www.santoorstayyoung.com/hand-wash' },
  { category: 'Body Lotion', url: 'https://www.santoorstayyoung.com/body-lotion' },
  { category: 'Body Wash & Shower Gel', url: 'https://www.santoorstayyoung.com/body-wash' },
  { category: 'Talcs & Deodorants', url: 'https://www.santoorstayyoung.com/talcs' },
  { category: 'Talcs & Deodorants', url: 'https://www.santoorstayyoung.com/deodorants' },
  { category: 'Baby Care & Soaps', url: 'https://www.santoorstayyoung.com/baby-soap' }
];

const allSantoor = [];
const seen = new Set();

for (const cat of categories) {
  console.log(`Scraping Santoor: ${cat.category} from ${cat.url}...`);
  try {
    const html = execSync(`curl.exe -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "${cat.url}"`).toString();

    // Find all images with an alt tag that represents a Santoor product
    // Pattern: <img[^>]+src="([^">]*sites\/default\/files\/[^">]+)"[^>]*alt="([^">]*)"
    const imgRegex = /<img[^>]+src="([^">]*sites\/default\/files\/[^">]+\.(?:png|jpg|jpeg|webp))"[^>]*alt="([^">]*)"/gi;

    let m;
    let count = 0;
    while ((m = imgRegex.exec(html)) !== null) {
      const img = m[1].trim();
      let alt = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

      if (!alt || alt.toLowerCase().includes('logo') || alt.toLowerCase().includes('banner') || alt.toLowerCase().includes('brand')) continue;
      if (seen.has(alt.toLowerCase())) continue;
      seen.add(alt.toLowerCase());

      let title = alt;
      if (!title.toLowerCase().startsWith('santoor')) {
        title = `Santoor ${title}`;
      }

      // Pricing & Variants
      let basePrice = 40;
      let variants = [];
      const lower = title.toLowerCase();

      if (cat.category === 'Bathing Soaps') {
        basePrice = 38;
        variants = [
          { label: 'Pack of 4 (4 x 100 g)', price: 145, is_default: true },
          { label: 'Single Bar (100 g)', price: 38, is_default: false },
          { label: 'Twin Pack (8 x 100 g)', price: 280, is_default: false }
        ];
      } else if (cat.category === 'Hand Wash') {
        basePrice = 99;
        variants = [
          { label: '250 ml Pump Dispenser', price: 99, is_default: true },
          { label: '750 ml Refill Pouch', price: 135, is_default: false },
          { label: 'Twin Pack (250 ml x 2)', price: 185, is_default: false }
        ];
      } else if (cat.category === 'Body Lotion') {
        basePrice = 175;
        variants = [
          { label: '250 ml Bottle', price: 175, is_default: true },
          { label: '400 ml Pump Bottle', price: 280, is_default: false }
        ];
      } else if (cat.category === 'Body Wash & Shower Gel') {
        basePrice = 160;
        variants = [
          { label: '250 ml Bottle', price: 160, is_default: true },
          { label: 'Pack of 2 (250 ml x 2)', price: 300, is_default: false }
        ];
      } else if (cat.category === 'Baby Care & Soaps') {
        basePrice = 45;
        variants = [
          { label: 'Pack of 3 (3 x 75 g)', price: 130, is_default: true },
          { label: 'Single Bar (75 g)', price: 45, is_default: false }
        ];
      } else {
        // Talcs & Deodorants
        basePrice = lower.includes('deo') ? 199 : 120;
        variants = lower.includes('deo')
          ? [
              { label: '150 ml Can', price: 199, is_default: true },
              { label: 'Twin Pack (150 ml x 2)', price: 375, is_default: false }
            ]
          : [
              { label: '300 g Pack', price: 145, is_default: true },
              { label: '100 g Pack', price: 55, is_default: false }
            ];
      }

      allSantoor.push({
        brand: 'Santoor',
        name: title,
        category: cat.category,
        imageUrl: img,
        basePrice,
        variants
      });
      count++;
    }

    // Also check <h2 or <h3 if alt was empty
    const hRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
    while ((m = hRegex.exec(html)) !== null) {
      const hText = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (hText.toLowerCase().startsWith('santoor') && !seen.has(hText.toLowerCase()) && hText.length < 50) {
        seen.add(hText.toLowerCase());
        console.log(`  -> Found extra heading: ${hText}`);
      }
    }

    console.log(`  -> Found ${count} products in ${cat.category}`);
  } catch (err) {
    console.error(`  -> Error on ${cat.category}:`, err.message);
  }
}

console.log(`\nTotal Santoor products scraped: ${allSantoor.length}`);
allSantoor.forEach(p => console.log(`- [${p.category}] ${p.name} -> ${p.imageUrl}`));
fs.writeFileSync('scripts/santoor_products.json', JSON.stringify(allSantoor, null, 2), 'utf8');
