const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../../cateloge/01/1.2.csv'), 'utf8');
const lines = content.split('\n').filter(l => l.trim());
const fruits = lines.filter(l => l.includes('Fresh Fruits'));

console.log(`Total fruits in 1.2.csv: ${fruits.length}`);
fruits.forEach((f, i) => {
  const cols = f.split(',');
  console.log(`${i + 1}. [${cols[2]}] (Variant: ${cols[3]}, Qty: ${cols[5]}, MRP: ₹${cols[6]})`);
});
