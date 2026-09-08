const fs = require('fs');
const path = require('path');

function inspectCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  console.log(`\n=== File: ${path.basename(filePath)} (${lines.length - 1} rows) ===`);
  console.log('Header:', lines[0]);
  if (lines.length > 1) {
    console.log('Row 1:', lines[1]);
  }
  if (lines.length > 2) {
    console.log('Row 2:', lines[2]);
  }
}

['1.1.csv', '1.2.csv', '1.3.csv', '1.4.csv', '1.5.csv', '1.6.csv', '1.7.csv', '1.8.csv'].forEach(f => {
  const p = path.join(__dirname, '../../cateloge/01', f);
  if (fs.existsSync(p)) inspectCsv(p);
});

['2.1.csv', '2.2.csv', '2.3.csv'].forEach(f => {
  const p = path.join(__dirname, '../../cateloge/02', f);
  if (fs.existsSync(p)) inspectCsv(p);
});
