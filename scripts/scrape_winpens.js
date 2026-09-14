const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchPage(url) {
  return new Promise(resolve => {
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
      if (res.statusCode !== 200) return resolve({ statusCode: res.statusCode, body: '' });
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ statusCode: 200, body }));
    }).on('error', err => resolve({ statusCode: 500, body: '' }));
  });
}

function parseWinProducts(html, brandCategory) {
  const products = [];
  // Each product in WooCommerce:
  // <li class="product ...">
  //   <a href="https://winpens.co.in/product/..." ...>
  //     <img ... data-src="https://winpens.co.in/wp-content/uploads/..." alt="Win Guide" ...>
  //     <h2 class="woocommerce-loop-product__title">Win Guide</h2>
  //   </a>
  const itemRegex = /<li[^>]+class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  const seen = new Set();

  while ((match = itemRegex.exec(html)) !== null) {
    const cardHtml = match[1];
    
    // Link
    const linkMatch = cardHtml.match(/href="(https:\/\/winpens\.co\.in\/product\/([^"\/]+)\/?)"/i);
    if (!linkMatch) continue;
    const prodUrl = linkMatch[1];
    const slug = linkMatch[2];
    if (seen.has(prodUrl)) continue;
    seen.add(prodUrl);

    // Image: data-src or src
    let img = null;
    const dataSrcMatch = cardHtml.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp))"/i)
      || cardHtml.match(/src="([^"]+\.(?:jpg|jpeg|png|webp))"/i);
    if (dataSrcMatch && !dataSrcMatch[1].includes('data:image')) {
      img = dataSrcMatch[1];
    }

    // Title: <h2 class="woocommerce-loop-product__title">...</h2> or alt="..."
    let title = '';
    const titleMatch = cardHtml.match(/<h[2-4][^>]+class="[^"]*woocommerce-loop-product__title[^"]*"[^>]*>([\s\S]*?)<\/h[2-4]>/i)
      || cardHtml.match(/alt="([^"]+)"/i);
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    if (!title || title.length < 3) {
      title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Category type based on name
    let catType = 'Ball Pens';
    const lower = title.toLowerCase();
    if (lower.includes('gel')) catType = 'Gel Pens';
    else if (lower.includes('roller')) catType = 'Roller Pens';
    else if (lower.includes('fountain')) catType = 'Fountain Pens';
    else if (lower.includes('kit') || lower.includes('pack')) catType = 'Stationery Kits';

    products.push({
      brand: brandCategory,
      slug,
      title: title.replace(/&amp;/g, '&'),
      category: catType,
      productUrl: prodUrl,
      imageUrl: img
    });
  }

  return products;
}

async function run() {
  console.log('Crawling Win Pens and Totem...');
  const allProducts = [];
  const seenSlugs = new Set();

  const SOURCES = [
    { brand: 'Win Pens', url: 'https://winpens.co.in/product-win/' },
    { brand: 'Totem Pens', url: 'https://winpens.co.in/product-totem/' }
  ];

  for (const src of SOURCES) {
    console.log(`\nFetching ${src.brand} (${src.url})...`);
    let pageNum = 1;
    let hasMore = true;

    while (hasMore) {
      const pageUrl = pageNum === 1 ? src.url : `${src.url}page/${pageNum}/`;
      const res = await fetchPage(pageUrl);
      if (res.statusCode !== 200 || !res.body) {
        console.log(`Page ${pageNum} returned ${res.statusCode}.`);
        break;
      }

      const prods = parseWinProducts(res.body, src.brand);
      console.log(`Page ${pageNum}: found ${prods.length} products`);

      let newCount = 0;
      for (const p of prods) {
        if (!seenSlugs.has(p.slug)) {
          seenSlugs.add(p.slug);
          allProducts.push(p);
          newCount++;
        }
      }

      const hasNext = res.body.includes(`/page/${pageNum + 1}/`);
      if (hasNext && newCount > 0) {
        pageNum++;
      } else {
        hasMore = false;
      }
    }
  }

  console.log(`\nTotal Win & Totem products scraped: ${allProducts.length}`);
  fs.writeFileSync(path.join(__dirname, 'winpens_raw_products.json'), JSON.stringify(allProducts, null, 2));
  console.log('Saved to scripts/winpens_raw_products.json');
}

run();
