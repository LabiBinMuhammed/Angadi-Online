const fs = require('fs');
const https = require('https');

function fetchUrl(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

const pages = [
  { url: 'https://www.camerry.in/tubs.html', type: 'Tub' },
  { url: 'https://www.camerry.in/cone.html', type: 'Cone' },
  { url: 'https://www.camerry.in/bars.html', type: 'Bar' },
  { url: 'https://www.camerry.in/fruiticle.html', type: 'Fruiticle / Pop' },
  { url: 'https://www.camerry.in/milkies.html', type: 'Milkies / Bar' },
  { url: 'https://www.camerry.in/sipie.html', type: 'Sipie' },
  { url: 'https://www.camerry.in/specialities.html', type: 'Speciality' }
];

async function scrapeAll() {
  const allProducts = [];
  const seen = new Set();

  for (const page of pages) {
    console.log(`Scraping ${page.url} (${page.type})...`);
    const html = await fetchUrl(page.url);

    // Look for portfolio items or grid-item
    const itemRegex = /<li[^>]*class="[^"]*grid-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
    let match;
    let pageCount = 0;

    while ((match = itemRegex.exec(html)) !== null) {
      const block = match[1];
      const imgMatch = block.match(/<img[^>]+src="([^">]+)"/i);
      const titleMatch = block.match(/<p[^>]*>[\s\S]*?<strong>([\s\S]*?)<\/strong>[\s\S]*?<\/p>/i)
        || block.match(/<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>/i)
        || block.match(/alt="([^"]+)"/i);

      if (imgMatch && titleMatch) {
        let rawTitle = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        // Clean alt prefix if it matched alt="camerry red velvet ice cream"
        rawTitle = rawTitle.replace(/^camerry\s+/i, '').replace(/\s+ice\s*cream$/i, '').trim();

        // Convert ALL CAPS to Title Case e.g. "RED VELVET" -> "Red Velvet"
        const formattedTitle = rawTitle.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        let imgUrl = imgMatch[1].trim();
        if (!imgUrl.startsWith('http')) {
          imgUrl = new URL(imgUrl, 'https://www.camerry.in/').toString();
        }

        const key = `${formattedTitle}:::${page.type}`.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          allProducts.push({
            brand: 'Camerry',
            rawName: formattedTitle,
            fullName: `Camerry ${formattedTitle} Ice Cream (${page.type})`,
            type: page.type,
            imageUrl: imgUrl,
            source: page.url
          });
          pageCount++;
        }
      }
    }
    console.log(`  -> Found ${pageCount} products for ${page.type}`);
  }

  console.log(`\nTotal unique Camerry products extracted: ${allProducts.length}`);
  fs.writeFileSync('scripts/camerry_products.json', JSON.stringify(allProducts, null, 2));
}

scrapeAll().catch(console.error);
