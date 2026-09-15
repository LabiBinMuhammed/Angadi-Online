const fs = require('fs');

const pages = [
  { name: 'Edible Oils', file: 'scripts/patanjali_edible_oils_raw.html', category: 'Cooking Essentials', codePrefix: 'ANG-OIL-' },
  { name: 'Ghee', file: 'scripts/patanjali_ghee_raw.html', category: 'Cooking Essentials', codePrefix: 'ANG-OIL-' },
  { name: 'Beverages', file: 'scripts/patanjali_beverages_raw.html', category: 'Beverages', codePrefix: 'ANG-BEV-' },
  { name: 'Rice & Pulses', file: 'scripts/patanjali_rice_pulses_raw.html', category: 'Rice, Atta, Flours & Mixes', codePrefix: 'ANG-RIC-' },
  { name: 'Herbal & Health', file: 'scripts/patanjali_herbal_raw.html', category: 'Personal Care & Hygiene', codePrefix: 'ANG-PER-' },
  { name: 'Dry Fruits', file: 'scripts/patanjali_dry_fruits_raw.html', category: 'Dry Goods & Cereals', codePrefix: 'ANG-DRY-' },
  { name: 'Honey', file: 'scripts/patanjali_honey_raw.html', category: 'Cooking Essentials', codePrefix: 'ANG-OIL-' },
  { name: 'Staples & Atta', file: 'scripts/patanjali_staples_raw.html', category: 'Rice, Atta, Flours & Mixes', codePrefix: 'ANG-RIC-' },
  { name: 'Roasted Diet & Namkeen', file: 'scripts/patanjali_namkeen_raw.html', category: 'Biscuits & Cookies', codePrefix: 'ANG-BIS-' }
];

const results = [];

pages.forEach(p => {
  if (!fs.existsSync(p.file)) return;
  const content = fs.readFileSync(p.file, 'utf8');

  // Look for product blocks. In WordPress/Elementor, items often have an image and title
  // Let's find sections with img and title
  const regex = /<img[^>]+(?:src|data-src)=[\"\']([^\"\']+\.(?:png|jpg|jpeg|webp))[\"\'][^>]*>.*?<(?:h[2-5]|strong|h4)[^>]*>(.*?)<\/(?:h[2-5]|strong|h4)>/gis;
  let m;
  let count = 0;
  while ((m = regex.exec(content)) !== null) {
    const img = m[1];
    const rawTitle = m[2].replace(/<[^>]+>/g, '').trim();
    if (rawTitle.length > 2 && !rawTitle.includes('Quick links') && !rawTitle.includes('Campaign') && !img.includes('logo') && !img.includes('banner')) {
      results.push({
        brand: 'Patanjali',
        name: rawTitle.startsWith('Patanjali') ? rawTitle : `Patanjali ${rawTitle}`,
        image: img,
        category: p.category,
        pageName: p.name,
        codePrefix: p.codePrefix
      });
      count++;
    }
  }
  console.log(`${p.name}: found ${count} products via img+title regex`);
});

console.log(`Total Patanjali products extracted: ${results.length}`);
fs.writeFileSync('scripts/patanjali_extracted.json', JSON.stringify(results, null, 2));
