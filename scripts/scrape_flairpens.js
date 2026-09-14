const https = require('https');
const fs = require('fs');
const path = require('path');

const FLAIR_CATEGORIES = [
  { slug: 'metal-pens', name: 'Metal & Executive Pens', url: 'https://flairpens.com/metal-pens.html' },
  { slug: 'ball-pens', name: 'Ball Pens', url: 'https://flairpens.com/ball-pens.html' },
  { slug: 'gel-pens', name: 'Gel Pens', url: 'https://flairpens.com/gel-pens.html' },
  { slug: 'fountain-pens', name: 'Fountain Pens', url: 'https://flairpens.com/fountain-pens.html' },
  { slug: 'platinum-series', name: 'Platinum Luxury Series', url: 'https://flairpens.com/platinum-series.html' },
  { slug: 'writing-kits', name: 'Writing & Stationery Kits', url: 'https://flairpens.com/Writing-Kits.html' },
  { slug: 'gift-sets', name: 'Gift Sets', url: 'https://flairpens.com/gift-sets.html' },
  { slug: 'packaging', name: 'Refills & Packaging', url: 'https://flairpens.com/packaging.html' }
];

function fetchPage(url) {
  return new Promise(resolve => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      timeout: 15000
    }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve(b));
    }).on('error', () => resolve(''));
  });
}

function parseFlair(html, catInfo) {
  const products = [];
  // Match <a class="prod-item-innerblk" href="..."> ... <div class="prod-item-name">...</div>
  const blockRegex = /<a[^>]+class="[^"]*prod-item-innerblk[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  const seen = new Set();

  while ((match = blockRegex.exec(html)) !== null) {
    const relHref = match[1];
    const cardHtml = match[2];

    // Image: src="images/products/..."
    const imgMatch = cardHtml.match(/src="([^"]+\.(?:png|jpg|jpeg|webp))"/i);
    let fullImgUrl = null;
    if (imgMatch) {
      const relImg = imgMatch[1];
      fullImgUrl = relImg.startsWith('http') ? relImg : `https://flairpens.com/${relImg.replace(/^\//, '')}`;
    }

    // Title: <div class="prod-item-name">([\s\S]*?)<\/div>
    const nameMatch = cardHtml.match(/class="[^"]*prod-item-name[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    let title = '';
    if (nameMatch) {
      title = nameMatch[1].replace(/<[^>]+>/g, '').replace(/&#174;/g, '').replace(/&reg;/g, '').replace(/\s+/g, ' ').trim();
    }
    if (!title || seen.has(title)) continue;
    seen.add(title);

    const fullProdUrl = relHref.startsWith('http') ? relHref : `https://flairpens.com/${relHref.replace(/^\//, '')}`;

    products.push({
      brand: 'Flair',
      categorySlug: catInfo.slug,
      categoryName: catInfo.name,
      title: title.replace(/&amp;/g, '&'),
      productUrl: fullProdUrl,
      imageUrl: fullImgUrl
    });
  }

  return products;
}

async function run() {
  console.log('Crawling Flair Pens categories...');
  const allProducts = [];
  const seenTitles = new Set();

  for (const cat of FLAIR_CATEGORIES) {
    console.log(`Fetching ${cat.name} (${cat.url})...`);
    const html = await fetchPage(cat.url);
    const prods = parseFlair(html, cat);
    console.log(`  Found ${prods.length} products`);

    for (const p of prods) {
      if (!seenTitles.has(p.title)) {
        seenTitles.add(p.title);
        allProducts.push(p);
      }
    }
  }

  console.log(`\nTotal unique Flair products scraped: ${allProducts.length}`);
  fs.writeFileSync(path.join(__dirname, 'flair_raw_products.json'), JSON.stringify(allProducts, null, 2));
  console.log('Saved to scripts/flair_raw_products.json');
}

run();
