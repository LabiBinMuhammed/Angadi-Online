const fs = require('fs');
const https = require('https');
const http = require('http');

function fetchUrl(urlStr) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, urlStr).toString();
        }
        return fetchUrl(redirectUrl).then(resolve).catch(reject);
      }
      if (res.statusCode === 404) {
        return resolve({ statusCode: 404, body: '' });
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error('Timeout fetching ' + urlStr));
    });
  });
}

// 1. Scrape Skei Ice Cream
async function scrapeSkei() {
  console.log('--- Scraping Skei Ice Cream ---');
  const res = await fetchUrl('https://skeiicecream.com/products');
  const html = res.body;

  // Regex to extract each product-block
  const blockRegex = /<div class="product-block all mix ([^"]*) col-[^"]*">([\s\S]*?)<\/div>\s*<\/div>/gi;
  const products = [];
  let match;

  while ((match = blockRegex.exec(html)) !== null) {
    const filterClass = match[1].trim(); // e.g. "tubs", "cone", "cup", "stick", "sundae"
    const content = match[2];

    const imgMatch = content.match(/<img src="([^"]+)"/i);
    const titleMatch = content.match(/<h4>([\s\S]*?)<\/h4>/i);

    if (titleMatch) {
      let rawTitle = titleMatch[1].replace(/&amp;/g, '&').replace(/<br\s*\/?>/gi, ' | ').replace(/<[^>]+>/g, '').trim();
      let parts = rawTitle.split('|').map(s => s.trim());
      let name = parts[0];
      let variantsStr = parts[1] || '';

      // Normalize name casing e.g. "BLUEBERRY" -> "Blueberry", "MINI CHOCOBAR" -> "Mini Chocobar"
      name = name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      // Determine category subtype
      let type = 'Ice Cream';
      if (filterClass.includes('tub')) type = 'Tub';
      else if (filterClass.includes('cone')) type = 'Cone';
      else if (filterClass.includes('cup')) type = 'Cup';
      else if (filterClass.includes('stick')) type = 'Stick / Bar';
      else if (filterClass.includes('sundae')) type = 'Sundae';

      const img = imgMatch ? imgMatch[1] : '';

      products.push({
        brand: 'Skei',
        rawName: name,
        fullName: `Skei ${name} Ice Cream (${type})`,
        type: type,
        variantsStr: variantsStr.replace(/[()]/g, '').trim(),
        imageUrl: img,
        source: 'https://skeiicecream.com/products'
      });
    }
  }

  console.log(`Scraped ${products.length} products from Skei Ice Cream.`);
  return products;
}

// 2. Scrape Vesta Ice Cream
async function scrapeVesta() {
  console.log('\n--- Scraping Vesta Ice Cream ---');
  const products = [];
  const visitedUrls = new Set();
  let page = 1;

  while (true) {
    const pageUrl = page === 1 ? 'https://vestaicecream.com/products/' : `https://vestaicecream.com/products/page/${page}/`;
    console.log(`Fetching Vesta page ${page}: ${pageUrl}`);
    try {
      const res = await fetchUrl(pageUrl);
      if (res.statusCode === 404 || !res.body || res.body.includes('Nothing Found')) {
        console.log(`Page ${page} returned 404 or empty. Done.`);
        break;
      }

      const html = res.body;
      const liRegex = /<li[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch;
      let countOnPage = 0;

      while ((liMatch = liRegex.exec(html)) !== null) {
        const block = liMatch[1];
        const linkMatch = block.match(/href="([^"]+)"/i);
        const titleMatch = block.match(/class="woocommerce-loop-product__title">([^<]+)<\/h[23]>/i);
        // Look for image: prefer highest res srcset or strip size suffixes like -400x500
        const imgMatch = block.match(/src="([^"]+)"/i);
        const srcsetMatch = block.match(/srcset="([^"]+)"/i);

        if (titleMatch) {
          const title = titleMatch[1].trim();
          let prodUrl = linkMatch ? linkMatch[1] : '';
          let img = imgMatch ? imgMatch[1] : '';

          if (srcsetMatch) {
            // Find largest image in srcset
            const sources = srcsetMatch[1].split(',').map(s => s.trim().split(' '));
            const largest = sources[sources.length - 1];
            if (largest && largest[0]) img = largest[0];
          }

          // Strip thumbnail resize if full original is available
          // e.g. P2-ARABIAN-DELITE-1-600x750.png -> P2-ARABIAN-DELITE-1.png
          const originalImg = img.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1');

          if (!visitedUrls.has(title.toLowerCase())) {
            visitedUrls.add(title.toLowerCase());
            products.push({
              brand: 'Vesta',
              rawName: title,
              fullName: title.toLowerCase().includes('ice cream') ? `Vesta ${title}` : `Vesta ${title} Ice Cream`,
              imageUrl: originalImg,
              thumbUrl: img,
              source: prodUrl
            });
            countOnPage++;
          }
        }
      }

      console.log(`Found ${countOnPage} products on page ${page}. (Total: ${products.length})`);
      if (countOnPage === 0) break;

      // Check if next page exists
      const nextPattern = new RegExp(`/products/page/${page + 1}/`, 'i');
      if (!nextPattern.test(html)) {
        console.log('No next page link found. Done.');
        break;
      }

      page++;
    } catch (e) {
      console.error(`Error on page ${page}:`, e.message);
      break;
    }
  }

  console.log(`Scraped ${products.length} products from Vesta Ice Cream.`);
  return products;
}

async function main() {
  const skei = await scrapeSkei();
  const vesta = await scrapeVesta();

  const combined = {
    skei,
    vesta,
    total: skei.length + vesta.length
  };

  fs.writeFileSync('scripts/icecream_products.json', JSON.stringify(combined, null, 2));
  console.log(`\nSuccessfully saved ${combined.total} products to scripts/icecream_products.json`);
}

main().catch(console.error);
