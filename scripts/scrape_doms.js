const https = require('https');
const fs = require('fs');
const path = require('path');

const DOMS_CATEGORIES = [
  { slug: 'pens-writing-instruments', name: 'Pens & Writing', url: 'https://domsindia.com/product-category/pens-writing-instruments/' },
  { slug: 'pencils-accessories', name: 'Pencils & Accessories', url: 'https://domsindia.com/product-category/pencils-accessories/' },
  { slug: 'paper-stationery', name: 'Paper & Notebooks', url: 'https://domsindia.com/product-category/paper-stationery/' },
  { slug: 'mathematical-drawing-instruments', name: 'Mathematical Instruments', url: 'https://domsindia.com/product-category/mathematical-drawing-instruments/' },
  { slug: 'markers-highlighters', name: 'Markers & Highlighters', url: 'https://domsindia.com/product-category/markers-highlighters/' },
  { slug: 'gifting', name: 'Gifting & Stationery Kits', url: 'https://domsindia.com/product-category/gifting/' },
  { slug: 'drawing-colouring', name: 'Drawing & Colouring', url: 'https://domsindia.com/product-category/drawing-colouring/' },
  { slug: 'crafts-hobbyist', name: 'Crafts & Hobbyist', url: 'https://domsindia.com/product-category/crafts-hobbyist/' }
];

function fetchPage(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      timeout: 20000
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

function parseDomsCategory(html, catInfo) {
  const products = [];
  // Each product link pattern: href="(https://domsindia.com/product/([^"\/]+)\/?)"
  const regex = /href="(https:\/\/domsindia\.com\/product\/([^"\/]+)\/?)"/gi;
  let match;
  const seenUrls = new Set();

  while ((match = regex.exec(html)) !== null) {
    const prodUrl = match[1];
    const prodSlug = match[2];
    if (seenUrls.has(prodUrl)) continue;
    seenUrls.add(prodUrl);

    const linkIdx = match.index;
    const snippet = html.substring(Math.max(0, linkIdx - 800), Math.min(html.length, linkIdx + 1200));

    // Image
    const imgMatches = [...snippet.matchAll(/src="(https:\/\/domsindia\.com\/wp-content\/uploads\/[^"]+\.(?:png|jpg|jpeg|webp))"/gi)];
    const validImgs = imgMatches
      .map(m => m[1])
      .filter(u => !u.includes('Logo') && !u.includes('Amazon') && !u.includes('Button') && !u.includes('banner') && !u.includes('Cart') && !u.includes('footer'));
    const bestImg = validImgs.length > 0 ? validImgs[0] : null;

    // Title: <h1 ... class="product_title ...">Title</h1> or <h2 ...>Title</h2>
    let title = '';
    const titleMatch = snippet.match(/class="[^"]*product_title[^"]*"[^>]*>([\s\S]*?)<\/h[1-4]>/i)
      || snippet.match(/<h[2-4][^>]*class="[^"]*elementor-heading-title[^"]*"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i)
      || snippet.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);

    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    if (!title || title.toLowerCase() === 'doms' || title.length < 3) {
      title = prodSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    products.push({
      brand: 'DOMS',
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

async function scrapeAmariz() {
  console.log('\n--- Fetching Amariz Products via Shopify API ---');
  return new Promise(resolve => {
    https.get('https://amarizindia.com/products.json?limit=250', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const products = (data.products || []).map(p => {
            const firstImg = p.images && p.images.length > 0 ? p.images[0].src : null;
            const firstVariant = p.variants && p.variants.length > 0 ? p.variants[0] : null;
            return {
              brand: 'DOMS Amariz',
              categorySlug: 'fine-art',
              categoryName: 'Fine Art & Painting',
              slug: p.handle,
              title: p.title,
              productUrl: `https://amarizindia.com/products/${p.handle}`,
              imageUrl: firstImg,
              price: firstVariant ? parseFloat(firstVariant.price) : 250,
              variants: (p.variants || []).map(v => ({
                label: v.title,
                price: parseFloat(v.price)
              }))
            };
          });
          console.log(`Fetched ${products.length} products from Amariz India.`);
          resolve(products);
        } catch (e) {
          console.error('Error parsing Amariz JSON:', e.message);
          resolve([]);
        }
      });
    }).on('error', err => {
      console.error('Amariz fetch error:', err.message);
      resolve([]);
    });
  });
}

async function run() {
  console.log('Starting DOMS category crawl...');
  const allProducts = [];
  const seenSlugs = new Set();

  for (const cat of DOMS_CATEGORIES) {
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

      const products = parseDomsCategory(res.body, cat);
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

  // Also fetch Amariz
  const amarizProducts = await scrapeAmariz();
  for (const p of amarizProducts) {
    if (!seenSlugs.has(p.slug)) {
      seenSlugs.add(p.slug);
      allProducts.push(p);
    }
  }

  console.log(`\nTotal unique DOMS + Amariz products: ${allProducts.length}`);
  fs.writeFileSync(path.join(__dirname, 'doms_raw_products.json'), JSON.stringify(allProducts, null, 2));
  console.log('Saved to scripts/doms_raw_products.json');
}

run();
