const https = require('https');
const fs = require('fs');
const path = require('path');

const CATEGORIES = [
  { slug: 'pencils', name: 'Pencils', url: 'https://apsaraofficial.com/product-category/pencils/' },
  { slug: 'erasers', name: 'Erasers', url: 'https://apsaraofficial.com/product-category/erasers/' },
  { slug: 'scales', name: 'Scales & Rulers', url: 'https://apsaraofficial.com/product-category/scales/' },
  { slug: 'sharpners', name: 'Sharpeners', url: 'https://apsaraofficial.com/product-category/sharpners/' },
  { slug: 'pens', name: 'Pens', url: 'https://apsaraofficial.com/product-category/pens/' },
  { slug: 'notebooks', name: 'Notebooks', url: 'https://apsaraofficial.com/product-category/notebooks/' },
  { slug: 'chalks', name: 'Chalks', url: 'https://apsaraofficial.com/product-category/chalks/' },
  { slug: 'art-material', name: 'Art Material', url: 'https://apsaraofficial.com/product-category/art-material/' },
  { slug: 'kits', name: 'Stationery Kits', url: 'https://apsaraofficial.com/product-category/kits/' }
];

function fetchPage(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve);
      }
      if (res.statusCode !== 200) {
        return resolve({ statusCode: res.statusCode, body: '' });
      }
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ statusCode: 200, body }));
    }).on('error', err => {
      resolve({ statusCode: 500, error: err.message, body: '' });
    });
  });
}

function parseProductsFromCategoryHtml(html, catInfo) {
  const products = [];
  
  // In Elementor, each product card typically has:
  // <a class="... elementor-widget-image ..." href="https://apsaraofficial.com/product/...">
  //   <img src="..." .../>
  // </a>
  // ...
  // <h3 class="elementor-icon-box-title"><span>Product Title</span></h3>
  // ...
  // <a class="elementor-button ... " href="https://apsaraofficial.com/product/...">
  
  // Let's find all product URLs
  const buttonRegex = /<a[^>]+class="[^"]*elementor-button[^"]*"[^>]+href="(https:\/\/apsaraofficial\.com\/product\/([^"\/]+)\/?)"/gi;
  let match;
  const seenUrls = new Set();

  // Alternative: match each product link block
  // Let's find all href="https://apsaraofficial.com/product/..."
  const regex = /href="(https:\/\/apsaraofficial\.com\/product\/([^"\/]+)\/?)"/gi;
  while ((match = regex.exec(html)) !== null) {
    const prodUrl = match[1];
    const prodSlug = match[2];
    if (seenUrls.has(prodUrl)) continue;
    seenUrls.add(prodUrl);

    // Let's find the nearest title and image around this link in the html
    const linkIdx = match.index;
    const windowSnippet = html.substring(Math.max(0, linkIdx - 1500), Math.min(html.length, linkIdx + 1500));

    // Look for image inside or near snippet
    // e.g. <img ... src="(https://apsaraofficial.com/wp-content/uploads/[^"]+)"
    const imgMatches = [...windowSnippet.matchAll(/src="(https:\/\/apsaraofficial\.com\/wp-content\/uploads\/[^"]+\.(?:png|jpg|jpeg|webp))"/gi)];
    // Filter out logo, icons, amazon buttons
    const validImgs = imgMatches
      .map(m => m[1])
      .filter(u => !u.includes('Logo') && !u.includes('Amazon') && !u.includes('Button') && !u.includes('banner') && !u.includes('Cart'));

    let bestImg = validImgs.length > 0 ? validImgs[0] : null;

    // Look for title: <h3 class="elementor-icon-box-title">\s*<span[^>]*>([^<]+)<\/span>\s*<\/h3>
    let title = '';
    const titleMatch = windowSnippet.match(/<h[2-4][^>]*class="[^"]*elementor-icon-box-title[^"]*"[^>]*>\s*<span[^>]*>([\s\S]*?)<\/span>\s*<\/h[2-4]>/i)
      || windowSnippet.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
    
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    
    // If title is empty or generic, use slug formatting
    if (!title || title.toLowerCase().includes('apsara') && title.length < 5) {
      title = prodSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    products.push({
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
  console.log('Starting Apsara category crawl...');
  const allProducts = [];
  const seenSlugs = new Set();

  for (const cat of CATEGORIES) {
    console.log(`\n--- Fetching Category: ${cat.name} (${cat.url}) ---`);
    let pageNum = 1;
    let hasMore = true;

    while (hasMore) {
      const pageUrl = pageNum === 1 ? cat.url : `${cat.url}page/${pageNum}/`;
      console.log(`Fetching page ${pageNum}: ${pageUrl}`);
      const res = await fetchPage(pageUrl);

      if (res.statusCode !== 200 || !res.body) {
        console.log(`Page ${pageNum} returned ${res.statusCode}. No more pages.`);
        break;
      }

      const products = parseProductsFromCategoryHtml(res.body, cat);
      console.log(`Found ${products.length} products on page ${pageNum}`);

      let newCount = 0;
      for (const p of products) {
        if (!seenSlugs.has(p.slug)) {
          seenSlugs.add(p.slug);
          allProducts.push(p);
          newCount++;
        }
      }

      // Check if there is next page link in HTML
      const hasNextPage = res.body.includes(`/page/${pageNum + 1}/`);
      if (hasNextPage && newCount > 0) {
        pageNum++;
      } else {
        hasMore = false;
      }
    }
  }

  console.log(`\nTotal unique products scraped across all 9 categories: ${allProducts.length}`);
  fs.writeFileSync(path.join(__dirname, 'apsara_raw_products.json'), JSON.stringify(allProducts, null, 2));
  console.log('Saved to scripts/apsara_raw_products.json');
}

run();
