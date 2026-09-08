const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const files = [
  'd:/Labeeb/ANGADI/cateloge/01/1.2.csv',
  'd:/Labeeb/ANGADI/cateloge/01/1.3.csv',
  'd:/Labeeb/ANGADI/cateloge/01/1.4.csv',
  'd:/Labeeb/ANGADI/cateloge/01/1.5.csv',
  'd:/Labeeb/ANGADI/cateloge/01/1.6.csv',
  'd:/Labeeb/ANGADI/cateloge/01/1.7.csv',
  'd:/Labeeb/ANGADI/cateloge/01/1.8.csv',
  'd:/Labeeb/ANGADI/cateloge/02/2.3.csv'
];

const catImages = {};

files.forEach(f => {
  const lines = fs.readFileSync(f, 'utf8').split('\n').filter(Boolean);
  lines.slice(1).forEach(l => {
    const cols = parseCSVLine(l);
    const cat = cols[1];
    const img = cols[cols.length - 1];
    if (img && img.includes('images.unsplash.com')) {
      if (!catImages[cat]) catImages[cat] = [];
      if (!catImages[cat].includes(img)) {
        catImages[cat].push(img);
      }
    }
  });
});

console.log('Categories with working Unsplash images:');
Object.keys(catImages).forEach(k => {
  console.log(`- ${k}: ${catImages[k].length} unique images. Sample: ${catImages[k][0]}`);
});
