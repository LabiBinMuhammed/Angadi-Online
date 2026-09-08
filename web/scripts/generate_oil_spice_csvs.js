const fs = require('fs');
const path = require('path');

const oils = JSON.parse(fs.readFileSync('scripts/oils_ghee_data.json', 'utf8'));
const spices = JSON.parse(fs.readFileSync('scripts/spices_masalas_data.json', 'utf8'));

function escapeCsvField(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCsv(items, categoryName, outputPath) {
  const headers = ['S.No.', 'Category', 'Product Name', 'Description', 'Quantity', 'Original Price (MRP)', 'Selling Price', 'Image URL'];
  const rows = [headers.join(',')];

  items.forEach((item, index) => {
    const sNo = index + 1;
    const cat = categoryName;
    const name = item.name;
    const desc = item.description || '';
    const qty = item.default_quantity || '1 kg';
    const mrp = ''; // Must remain blank per catalog architecture
    const sp = '';  // Must remain blank per catalog architecture
    const img = item.default_image || '';

    const row = [
      escapeCsvField(sNo),
      escapeCsvField(cat),
      escapeCsvField(name),
      escapeCsvField(desc),
      escapeCsvField(qty),
      escapeCsvField(mrp),
      escapeCsvField(sp),
      escapeCsvField(img)
    ].join(',');
    rows.push(row);
  });

  fs.writeFileSync(outputPath, rows.join('\r\n'), 'utf8');
  console.log(`Generated ${outputPath} with ${items.length} items.`);
}

const outDir = path.resolve(__dirname, '../../cateloge');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

generateCsv(oils, 'Oils & Ghee', path.join(outDir, 'angadi_kerala_oils_ghee_master_v1.csv'));
generateCsv(spices, 'Spices & Masalas', path.join(outDir, 'angadi_kerala_spices_masalas_master_v1.csv'));
