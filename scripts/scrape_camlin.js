const fs = require('fs');
const { execSync } = require('child_process');

function fetchHtml(url) {
  try {
    return execSync(`curl.exe -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9" "${url}"`).toString();
  } catch (e) {
    console.error(`Fetch error for ${url}:`, e.message);
    return '';
  }
}

const sections = [
  { category: 'Writing Pencils', url: 'https://www.kokuyocamlin.com/camlin/pencils-and-accessories?section=writing-pencils' },
  { category: 'Drawing Pencils', url: 'https://www.kokuyocamlin.com/camlin/pencils-and-accessories?section=drawing-pencils' },
  { category: 'Fountain Pens & Inks', url: 'https://www.kokuyocamlin.com/camlin/markers-and-pens?section=fountain-pen' },
  { category: 'Student Notebooks', url: 'https://www.kokuyocamlin.com/camlin/notebooks?section=student-notebooks' },
  { category: 'Geometry Box & Instruments', url: 'https://www.kokuyocamlin.com/camlin/geometry-box?section=geometry-box' },
  { category: 'Permanent Marker Inks', url: 'https://www.kokuyocamlin.com/camlin/office-supplies?section=permanent-marker-ink' }
];

const allCamlin = [];
const seenNames = new Set();

for (const sec of sections) {
  console.log(`Scraping Camlin: ${sec.category}...`);
  const html = fetchHtml(sec.url);
  
  // Find each product item: usually contains common-src, productName, and productInfo
  // Pattern: common-src="([^"]+)"[\s\S]*?productName[^>]*>([\s\S]*?)<\/h2>
  const itemRegex = /common-src="([^"]+)"[\s\S]*?<h2 class="c-subcategoryListing__productName[^"]*"[^>]*>([\s\S]*?)<\/h2>(?:[\s\S]*?<h3 class="c-subcategoryListing__productInfo[^"]*"[^>]*>([\s\S]*?)<\/h3>)?/gi;
  
  let match;
  let count = 0;
  while ((match = itemRegex.exec(html)) !== null) {
    let rawImg = match[1].trim();
    let name = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    let info = (match[3] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    if (!name || seenNames.has(name.toLowerCase())) continue;
    seenNames.add(name.toLowerCase());

    let imgUrl = rawImg;
    if (!imgUrl.startsWith('http')) {
      if (imgUrl.startsWith('/')) {
        imgUrl = `https://www.kokuyocamlin.com${imgUrl}`;
      } else {
        imgUrl = `https://www.kokuyocamlin.com/camlin/${imgUrl}`;
      }
    }

    allCamlin.push({
      brand: 'Camlin',
      name,
      category: sec.category,
      info,
      imageUrl: imgUrl
    });
    count++;
  }
  console.log(`  -> Extracted ${count} products from ${sec.category}`);
}

console.log(`\nTotal unique Camlin products scraped: ${allCamlin.length}`);
fs.writeFileSync('scripts/camlin_products.json', JSON.stringify(allCamlin, null, 2), 'utf8');
