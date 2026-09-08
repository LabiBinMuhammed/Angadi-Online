const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../../cateloge/02/2.1.csv'), 'utf8');
const lines = content.split('\n').filter(l => l.trim());
console.log(`Total rows in 2.1.csv: ${lines.length}`);
const meatFish = lines.filter(l => l.includes('Meat & Fish'));
console.log(`Meat & Fish count: ${meatFish.length}`);
meatFish.forEach((m, i) => {
  const cols = m.split(',');
  console.log(`${i + 1}. [${cols[2]}] (Cat: ${cols[1]}, Var: ${cols[3]}, Qty: ${cols[5]}, MRP: ₹${cols[6]})`);
});
