const fs = require('fs');
const https = require('https');

https.get('https://papergrid.in/products.json?limit=250', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const data = JSON.parse(body);
    const papergridList = [];

    // Map each distinct notebook model
    data.products.forEach((p, pIdx) => {
      // Group variants by type / size
      const variantGroups = new Map();
      p.variants.forEach(v => {
        // e.g. "King - 24 x 18 cm - Soft Cover / 172 Pages - Pack of 6 / Ruled"
        const parts = v.title.split(' / ');
        const mainType = parts[0] || p.title;
        if (!variantGroups.has(mainType)) {
          variantGroups.set(mainType, []);
        }
        variantGroups.get(mainType).push(v);
      });

      variantGroups.forEach((vars, groupName) => {
        const cleanName = `Papergrid ${groupName.replace(/-/g, '').replace(/\s+/g, ' ').trim()}`;
        const mainImage = p.images[0]?.src || 'https://papergrid.in/cdn/shop/files/1.jpg';
        const baseVariant = vars[0];
        const basePrice = Math.round(parseFloat(baseVariant.price) || 200);

        // Build 2-3 standard variants
        const standardVariants = vars.slice(0, 3).map((v, i) => {
          const price = Math.round(parseFloat(v.price) || basePrice);
          const vParts = v.title.split(' / ');
          const label = vParts.slice(1).join(' - ') || v.title;
          return {
            label: label.length > 40 ? label.slice(0, 37) + '...' : label,
            price,
            is_default: i === 0
          };
        });

        papergridList.push({
          brand: 'Papergrid',
          name: cleanName,
          category: 'Student Notebooks',
          imageUrl: mainImage,
          basePrice,
          variants: standardVariants
        });
      });
    });

    console.log(`Extracted ${papergridList.length} Papergrid models.`);
    fs.writeFileSync('scripts/papergrid_products.json', JSON.stringify(papergridList, null, 2), 'utf8');
  });
});
