const fs = require('fs');

const oils = JSON.parse(fs.readFileSync('scripts/oils_ghee_data.json', 'utf8'));
const spices = JSON.parse(fs.readFileSync('scripts/spices_masalas_data.json', 'utf8'));

console.log(`Oils & Ghee count: ${oils.length}`);
console.log(`Spices & Masalas count: ${spices.length}`);

// Check for duplicates within each category
function checkDups(arr, label) {
  const seen = new Set();
  const dups = [];
  for (const item of arr) {
    const norm = item.name.toLowerCase().trim();
    if (seen.has(norm)) {
      dups.push(item.name);
    }
    seen.add(norm);
  }
  if (dups.length > 0) {
    console.error(`Duplicate names in ${label}:`, dups);
  } else {
    console.log(`No duplicate names in ${label}.`);
  }
}

checkDups(oils, 'Oils & Ghee');
checkDups(spices, 'Spices & Masalas');

// Selling mode distribution
function analyzeModes(arr, label) {
  const modes = {};
  for (const item of arr) {
    modes[item.sell_mode] = (modes[item.sell_mode] || 0) + 1;
  }
  console.log(`${label} sell modes:`, modes);
}

analyzeModes(oils, 'Oils & Ghee');
analyzeModes(spices, 'Spices & Masalas');
