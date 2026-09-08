const fs = require('fs');

function validateCsv(filePath, expectedCat, expectedCount) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  console.log(`\nValidating ${filePath}: ${lines.length} lines total`);

  const header = lines[0];
  const expectedHeader = 'S.No.,Category,Product Name,Description,Quantity,Original Price (MRP),Selling Price,Image URL';
  if (header !== expectedHeader) {
    console.error(`Header mismatch! Expected: ${expectedHeader}\nGot: ${header}`);
    return false;
  }

  // Simple CSV line parser handling quotes
  function parseCsvLine(line) {
    const res = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        res.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    res.push(cur);
    return res;
  }

  const rows = lines.slice(1);
  if (rows.length !== expectedCount) {
    console.error(`Row count mismatch: expected ${expectedCount}, got ${rows.length}`);
    return false;
  }

  for (let i = 0; i < rows.length; i++) {
    const fields = parseCsvLine(rows[i]);
    if (fields.length !== 8) {
      console.error(`Line ${i + 2} has ${fields.length} columns instead of 8:`, rows[i]);
      return false;
    }
    const [sNo, cat, name, desc, qty, mrp, sp, img] = fields;
    if (parseInt(sNo) !== i + 1) {
      console.error(`Line ${i + 2} sNo mismatch: ${sNo} vs ${i + 1}`);
      return false;
    }
    if (cat !== expectedCat) {
      console.error(`Line ${i + 2} cat mismatch: ${cat} vs ${expectedCat}`);
      return false;
    }
    if (!name || name.trim().length === 0) {
      console.error(`Line ${i + 2} missing name`);
      return false;
    }
    if (mrp !== '' || sp !== '') {
      console.error(`Line ${i + 2} has non-empty price: MRP=${mrp}, SP=${sp}`);
      return false;
    }
  }

  console.log(`[PASS] ${filePath} verified successfully! ${rows.length} rows, 8 columns, strictly blank prices.`);
  return true;
}

const v1 = validateCsv('D:/Labeeb/ANGADI/cateloge/angadi_kerala_oils_ghee_master_v1.csv', 'Oils & Ghee', 48);
const v2 = validateCsv('D:/Labeeb/ANGADI/cateloge/angadi_kerala_spices_masalas_master_v1.csv', 'Spices & Masalas', 121);

if (!v1 || !v2) {
  process.exit(1);
}
