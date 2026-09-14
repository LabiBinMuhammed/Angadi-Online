const https = require('https');
const fs = require('fs');

https.get('https://himalayawellness.in/products.json?limit=250', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const json = JSON.parse(body);
    const himalayaList = [];
    const seen = new Set();

    // Focus on personal care: Face wash, Soap, Lotion, Cream, Hair, Baby, Lip balm
    json.products.forEach(p => {
      let title = p.title.trim();
      const lower = title.toLowerCase();

      // Skip pharmaceutical tablets/capsules that aren't personal care / wellness
      if (lower.includes('capsule') || lower.includes('tablet') || lower.includes('syrup')) {
        if (!lower.includes('baby') && !lower.includes('skin')) return;
      }

      if (!title.toLowerCase().startsWith('himalaya')) {
        title = `Himalaya ${title}`;
      }

      if (seen.has(title.toLowerCase())) return;
      seen.add(title.toLowerCase());

      const mainImg = p.images[0]?.src;
      if (!mainImg) return;

      const baseVariant = p.variants[0];
      const basePrice = Math.round(parseFloat(baseVariant?.price) || 120);

      // Determine personal care subcategory
      let cat = 'Skin Care & Face Wash';
      if (lower.includes('soap')) cat = 'Bathing Soaps';
      else if (lower.includes('baby')) cat = 'Baby Care & Soaps';
      else if (lower.includes('hair') || lower.includes('shampoo')) cat = 'Hair Care & Hair Oil';
      else if (lower.includes('lotion') || lower.includes('cream')) cat = 'Body Lotion';
      else if (lower.includes('wash')) cat = 'Body Wash & Shower Gel';

      // Build variants from p.variants
      const variants = p.variants.slice(0, 3).map((v, i) => ({
        label: v.title === 'Default Title' ? 'Standard Pack' : v.title,
        price: Math.round(parseFloat(v.price) || basePrice),
        is_default: i === 0
      }));

      himalayaList.push({
        brand: 'Himalaya',
        name: title,
        category: cat,
        imageUrl: mainImg,
        basePrice,
        variants
      });
    });

    console.log(`Extracted ${himalayaList.length} Himalaya Personal Care products.`);
    fs.writeFileSync('scripts/himalaya_products.json', JSON.stringify(himalayaList, null, 2), 'utf8');
  });
});
