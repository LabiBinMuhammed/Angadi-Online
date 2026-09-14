const fs = require('fs');
const https = require('https');
const http = require('http');

function fetchUrl(urlStr) {
  return new Promise((resolve) => {
    const urlObj = new URL(urlStr);
    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirect = res.headers.location;
        if (!redirect.startsWith('http')) redirect = new URL(redirect, urlStr).toString();
        return fetchUrl(redirect).then(resolve);
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });
    req.on('error', () => resolve(''));
    req.setTimeout(15000, () => {
      req.destroy();
      resolve('');
    });
  });
}

const targetPages = [
  { url: 'https://elitefoods.co.in/more-health-range.php', name: 'More Health Range' },
  { url: 'https://elitefoods.co.in/cake.php', name: 'Cake' },
  { url: 'https://elitefoods.co.in/baking-rusk.php', name: 'Baking Rusk' },
  { url: 'https://elitefoods.co.in/bread-bun.php', name: 'Bread & Bun' },
  { url: 'https://elitefoods.co.in/snacks.php', name: 'Snacks' },
  { url: 'https://elitefoods.co.in/wheat-range.php', name: 'Wheat Range' },
  { url: 'https://elitefoods.co.in/rice-range.php', name: 'Rice Range' },
  { url: 'https://elitefoods.co.in/flour.php', name: 'Flour' },
  { url: 'https://elitefoods.co.in/instant-mix.php', name: 'Instant Mix' }
];

async function scrapeElite() {
  const allProducts = [];
  const seen = new Set();

  for (const page of targetPages) {
    console.log(`\nFetching ${page.name} (${page.url})...`);
    const html = await fetchUrl(page.url);

    // Extract product-large items
    const regex = /<a[^>]*class=['"]product-large['"][^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    let pageCount = 0;

    while ((match = regex.exec(html)) !== null) {
      const href = match[1].trim();
      const inner = match[2];

      const titleMatch = inner.match(/<h[45][^>]*>([\s\S]*?)<\/h[45]>/i) || inner.match(/alt=['"]([^'"]+)['"]/i);
      const imgMatch = inner.match(/data-src=['"]([^'"]+)['"]/i) || inner.match(/src=['"]([^'"]+)['"]/i);

      if (titleMatch && imgMatch) {
        let rawTitle = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        rawTitle = rawTitle.replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

        let rawImg = imgMatch[1].trim().replace(/[\r\n\t]/g, '').trim();
        // Remove WordPress CDN wrapper if present
        let cleanImg = rawImg.replace(/^https?:\/\/i\d\.wp\.com\//i, 'https://');
        // Remove query parameters like ?h=225
        cleanImg = cleanImg.replace(/\?.*$/, '').trim();
        if (!cleanImg.startsWith('http')) {
          cleanImg = new URL(cleanImg, 'https://elitefoods.co.in/').toString();
        }
        cleanImg = cleanImg.replace('http://', 'https://').trim();

        const key = `${rawTitle.toLowerCase()}:::${page.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          allProducts.push({
            brand: 'Elite',
            rawName: rawTitle,
            fullName: rawTitle.toLowerCase().startsWith('elite') ? rawTitle : `Elite ${rawTitle}`,
            pageName: page.name,
            productUrl: href,
            imageUrl: cleanImg,
            rawImageUrl: rawImg
          });
          pageCount++;
        }
      }
    }
    console.log(`  -> Found ${pageCount} products.`);
  }

  console.log(`\nTotal Elite products extracted: ${allProducts.length}`);
  fs.writeFileSync('scripts/elite_products.json', JSON.stringify(allProducts, null, 2));
}

scrapeElite().catch(console.error);
