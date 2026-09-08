const fs = require('fs');

const parseCSVLine = (text) => {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i+1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === ',' && !inQuotes) {
      result.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
};

function analyzeCSV(filename) {
  const fullPath = 'd:/Labeeb/ANGADI/cateloge/' + filename;
  const lines = fs.readFileSync(fullPath, 'utf8').trim().split('\n');
  const header = lines[0];
  const rows = lines.slice(1).map(l => parseCSVLine(l));
  console.log(`\n================ ${filename} (Total rows: ${rows.length}) ================`);
  console.log('Header:', header);

  const products = rows.map(r => ({
    sno: r[0],
    cat: r[1],
    name: r[2],
    brand: r[3],
    desc: r[4],
    qty: r[5],
    mrp: r[6],
    sp: r[7],
    img: r[8]
  }));

  const brands = new Set();
  const names = [];
  products.forEach(p => {
    if (p.brand) brands.add(p.brand);
    names.push({ name: p.name, brand: p.brand, qty: p.qty, img: p.img });
  });

  console.log('Brands found:', Array.from(brands));
  console.log('Sample 15 rows:');
  names.slice(0, 15).forEach((n, idx) => {
    console.log(`${idx + 1}. [${n.brand}] ${n.name} - ${n.qty} (img: ${n.img ? n.img.slice(0, 30) : 'none'})`);
  });
}

analyzeCSV('01/1.4.csv');
analyzeCSV('01/1.7.csv');
