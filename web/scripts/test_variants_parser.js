const fs = require('fs');

const oils = JSON.parse(fs.readFileSync('scripts/oils_ghee_data.json', 'utf8'));
const spices = JSON.parse(fs.readFileSync('scripts/spices_masalas_data.json', 'utf8'));

const UNITS = {
  kg: 'fc6f287c-0b3c-458e-8d4f-4679d0059c32',
  g: '32d0b812-34cc-415c-b7cf-1f96dc2f841f',
  L: '24f2e09f-23d1-4919-a6c3-7a3d11fae4ef',
  ml: '4d3b2515-c26d-4c05-ab72-13ff6c6d0938',
  pack: '5cb5e824-4974-40f9-82ec-6edaa9ad32aa'
};

function parseVariant(label) {
  const clean = label.trim();
  let unit_id = UNITS.pack;
  let value = 1;

  const mlMatch = clean.match(/^([\d.]+)\s*ml$/i);
  const lMatch = clean.match(/^([\d.]+)\s*l$/i);
  const kgMatch = clean.match(/^([\d.]+)\s*kg$/i);
  const gMatch = clean.match(/^([\d.]+)\s*g$/i);

  if (mlMatch) {
    value = parseFloat(mlMatch[1]);
    unit_id = UNITS.ml;
  } else if (lMatch) {
    value = parseFloat(lMatch[1]);
    unit_id = UNITS.L;
  } else if (kgMatch) {
    value = parseFloat(kgMatch[1]);
    unit_id = UNITS.kg;
  } else if (gMatch) {
    value = parseFloat(gMatch[1]);
    unit_id = UNITS.g;
  } else {
    console.warn(`Unmatched variant label: "${clean}"`);
  }

  return { label: clean, value, unit_id };
}

let totalVariants = 0;
[...oils, ...spices].forEach(item => {
  if (item.variants && item.variants.length > 0) {
    item.variants.forEach(v => {
      const parsed = parseVariant(v);
      totalVariants++;
      if (!parsed.unit_id) {
        console.error('Failed to resolve unit for', v, 'in item', item.name);
      }
    });
  }
});

console.log(`Total variants parsed across both catalogs: ${totalVariants}`);
