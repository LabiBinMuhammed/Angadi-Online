const https = require('https');
const fs = require('fs');
const path = require('path');

const NATARAJ_CATEGORIES = [
  { slug: 'pencils', name: 'Pencils', url: 'https://natarajofficial.com/product-category/pencils/' },
  { slug: 'erasers', name: 'Erasers', url: 'https://natarajofficial.com/product-category/erasers/' },
  { slug: 'sharpeners', name: 'Sharpeners', url: 'https://natarajofficial.com/product-category/sharpeners/' },
  { slug: 'scales', name: 'Scales & Rulers', url: 'https://natarajofficial.com/product-category/scales/' },
  { slug: 'pens', name: 'Pens', url: 'https://natarajofficial.com/product-category/pens/' },
  { slug: 'kits', name: 'Stationery Kits', url: 'https://natarajofficial.com/product-category/kits/' },
  { slug: 'cutters', name: 'Cutters & Scissors', url: 'https://natarajofficial.com/product-category/cutters/' },
  { slug: 'measuring-instruments', name: 'Measuring & Geometry', url: 'https://natarajofficial.com/product-category/measuring-instruments/' }
];

function fetchPage(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      timeout: 15000
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (!loc.startsWith('http')) loc = new URL(loc, url).toString();
        return fetchPage(loc).then(resolve);
      }
      if (res.statusCode !== 200) {
        return resolve({ statusCode: res.statusCode, body: '' });
      }
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ statusCode: 200, body }));
    }).on('error', err => {
      resolve({ statusCode: 500, error: err.message, body: '' });
    }).on('timeout', () => {
      resolve({ statusCode: 408, body: '' });
    });
  });
}

function parseProducts(html, catInfo) {
  const products = [];
  const regex = /href="(https:\/\/natarajofficial\.com\/product\/([^"\/]+)\/?)"/gi;
  let match;
  const seen = new Set();

  while ((match = regex.exec(html)) !== null) {
    const prodUrl = match[1];
    const prodSlug = match[2];
    if (seen.has(prodUrl)) continue;
    seen.add(prodUrl);

    const linkIdx = match.index;
    const windowSnippet = html.substring(Math.max(0, linkIdx - 1200), Math.min(html.length, linkIdx + 1200));

    // Image
    const imgMatches = [...windowSnippet.matchAll(/src="(https:\/\/natarajofficial\.com\/wp-content\/uploads\/[^"]+\.(?:png|jpg|jpeg|webp))"/gi)];
    const validImgs = imgMatches
      .map(m => m[1])
      .filter(u => !u.includes('Logo') && !u.includes('Amazon') && !u.includes('Button') && !u.includes('banner') && !u.includes('Cart'));
    const bestImg = validImgs.length > 0 ? validImgs[0] : null;

    // Title
    let title = '';
    const titleMatch = windowSnippet.match(/<h[2-4][^>]*class="[^"]*elementor-icon-box-title[^"]*"[^>]*>\s*<span[^>]*>([\s\S]*?)<\/span>\s*<\/h[2-4]>/i)
      || windowSnippet.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    if (!title || (title.toLowerCase().includes('nataraj') && title.length < 5)) {
      title = prodSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    products.push({
      brand: 'Nataraj',
      categorySlug: catInfo.slug,
      categoryName: catInfo.name,
      slug: prodSlug,
      title: title.replace(/&amp;/g, '&'),
      productUrl: prodUrl,
      imageUrl: bestImg
    });
  }

  return products;
}

async function run() {
  console.log('Starting Nataraj category crawl...');
  const allProducts = [];
  const seenSlugs = new Set();

  for (const cat of NATARAJ_CATEGORIES) {
    console.log(`\n--- Fetching Category: ${cat.name} (${cat.url}) ---`);
    let pageNum = 1;
    let hasMore = true;

    while (hasMore) {
      const pageUrl = pageNum === 1 ? cat.url : `${cat.url}page/${pageNum}/`;
      const res = await fetchPage(pageUrl);

      if (res.statusCode !== 200 || !res.body) {
        console.log(`Page ${pageNum} returned ${res.statusCode}.`);
        break;
      }

      const products = parseProducts(res.body, cat);
      console.log(`Page ${pageNum}: found ${products.length} products`);

      let newCount = 0;
      for (const p of products) {
        if (!seenSlugs.has(p.slug)) {
          seenSlugs.add(p.slug);
          allProducts.push(p);
          newCount++;
        }
      }

      const hasNextPage = res.body.includes(`/page/${pageNum + 1}/`);
      if (hasNextPage && newCount > 0) {
        pageNum++;
      } else {
        hasMore = false;
      }
    }
  }

  console.log(`\nTotal unique Nataraj products: ${allProducts.length}`);
  fs.writeFileSync(path.join(__dirname, 'nataraj_raw_products.json'), JSON.stringify(allProducts, null, 2));
  console.log('Saved to scripts/nataraj_raw_products.json');
}

run();
