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
  'd:/Labeeb/ANGADI/cateloge/01/1.1.csv',
  'd:/Labeeb/ANGADI/cateloge/01/1.2.csv',
  'd:/Labeeb/ANGADI/cateloge/01/1.3.csv',
  'd:/Labeeb/ANGADI/cateloge/01/1.4.csv',
  'd:/Labeeb/ANGADI/cateloge/01/1.5.csv',
  'd:/Labeeb/ANGADI/cateloge/01/1.6.csv',
  'd:/Labeeb/ANGADI/cateloge/01/1.7.csv',
  'd:/Labeeb/ANGADI/cateloge/01/1.8.csv',
  'd:/Labeeb/ANGADI/cateloge/02/2.1.csv',
  'd:/Labeeb/ANGADI/cateloge/02/2.2.csv',
  'd:/Labeeb/ANGADI/cateloge/02/2.3.csv'
];

let totalRows = 0;
const catCounts = {};
const domainCounts = {};
const unitsFound = {};

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const header = parseCSVLine(lines[0]);
  const hasBrand = header.includes('Brand');

  lines.slice(1).forEach((line, idx) => {
    const cols = parseCSVLine(line);
    totalRows++;

    const cat = cols[1];
    catCounts[cat] = (catCounts[cat] || 0) + 1;

    // Quantity
    const qty = hasBrand ? cols[5] : cols[4];
    if (qty) {
      const uMatch = qty.match(/[a-zA-Z]+/g);
      const u = uMatch ? uMatch.join(' ').toLowerCase() : 'none';
      unitsFound[u] = (unitsFound[u] || 0) + 1;
    }

    // Image URL is the last column
    const imgUrl = cols[cols.length - 1];
    let domain = 'other';
    try {
      if (imgUrl.startsWith('http')) {
        const parsed = new URL(imgUrl);
        domain = parsed.hostname;
      }
    } catch (e) {
      domain = 'invalid';
    }
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });
});

console.log('Total Rows:', totalRows);
console.log('\nCategories:', catCounts);
console.log('\nImage Domains:', domainCounts);
console.log('\nQuantity Units:', unitsFound);
