const fs = require('fs');
const path = require('path');

const csvFiles = [
  '01/1.1.csv',
  '01/1.2.csv',
  '01/1.3.csv',
  '01/1.4.csv',
  '01/1.5.csv',
  '01/1.6.csv',
  '01/1.7.csv',
  '01/1.8.csv',
  '02/2.1.csv',
  '02/2.2.csv',
  '02/2.3.csv',
].map(rel => path.join(__dirname, '..', '..', 'cateloge', rel));

csvFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  const header = lines[0];
  const catIdx = header.split(',').findIndex(h => h.toLowerCase().includes('category'));
  const cats = new Set();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols[catIdx]) cats.add(cols[catIdx].trim());
  }
  console.log(`${f} (${lines.length - 1} rows): Cats -> ${Array.from(cats).join('; ')}`);
});
