const fs = require('fs');

const vivelProducts = [
  // Soaps
  {
    brand: 'Vivel',
    name: 'Vivel Aloe Vera Soap',
    category: 'Bathing Soaps',
    description: 'Enriched with Aloe Vera extracts and Vitamin E+ for soft, nourished skin.',
    imageUrl: 'https://www.vivel.in/uploads/product/shop-8-new1.png',
    basePrice: 38,
    variants: [
      { label: 'Pack of 5 (5 x 100 g)', price: 165, is_default: true },
      { label: 'Single Bar (100 g)', price: 38, is_default: false },
      { label: 'Mega Saver Pack (8 x 100 g)', price: 295, is_default: false }
    ]
  },
  {
    brand: 'Vivel',
    name: 'Vivel Lotus Oil & Vitamin E Soap',
    category: 'Bathing Soaps',
    description: 'Infused with Lotus Oil and Vitamin E for glowing, radiant skin.',
    imageUrl: 'https://www.vivel.in/uploads/product/shop-10-new1.png',
    basePrice: 38,
    variants: [
      { label: 'Pack of 5 (5 x 100 g)', price: 165, is_default: true },
      { label: 'Single Bar (100 g)', price: 38, is_default: false }
    ]
  },
  {
    brand: 'Vivel',
    name: 'Vivel Ayurvedic Essence Soap',
    category: 'Bathing Soaps',
    description: 'Enriched with Kalyanaka Tailam and 20 Ayurvedic herbs for clear, nourished skin.',
    imageUrl: 'https://www.vivel.in/uploads/product/shop-9-new1.png',
    basePrice: 40,
    variants: [
      { label: 'Pack of 4 (4 x 100 g)', price: 155, is_default: true },
      { label: 'Single Bar (100 g)', price: 40, is_default: false }
    ]
  },
  {
    brand: 'Vivel',
    name: 'Vivel Glycerin & Almond Oil Soap',
    category: 'Bathing Soaps',
    description: 'Pure glycerine and almond oil for deep moisturization and winter care.',
    imageUrl: 'https://www.vivel.in/uploads/product/shopa-2-new1.png',
    basePrice: 45,
    variants: [
      { label: 'Pack of 3 (3 x 100 g)', price: 130, is_default: true },
      { label: 'Single Bar (100 g)', price: 45, is_default: false }
    ]
  },
  {
    brand: 'Vivel',
    name: 'Vivel Sandal Glow Soap',
    category: 'Bathing Soaps',
    description: 'Natural sandalwood oil for glowing and fragrant skin.',
    imageUrl: 'https://www.vivel.in/uploads/product/shopa-3-new1.png',
    basePrice: 42,
    variants: [
      { label: 'Pack of 4 (4 x 100 g)', price: 160, is_default: true },
      { label: 'Single Bar (100 g)', price: 42, is_default: false }
    ]
  },
  {
    brand: 'Vivel',
    name: 'Vivel Cool Mint & Lime Soap',
    category: 'Bathing Soaps',
    description: 'Refreshing cool mint and fresh lime for day-long freshness and 99.9% germ protection.',
    imageUrl: 'https://www.vivel.in/uploads/product/lime-soap.png',
    basePrice: 38,
    variants: [
      { label: 'Pack of 5 (5 x 100 g)', price: 165, is_default: true },
      { label: 'Single Bar (100 g)', price: 38, is_default: false }
    ]
  },

  // Body Washes
  {
    brand: 'Vivel',
    name: 'Vivel Lavender & Almond Oil Body Wash',
    category: 'Body Wash & Shower Gel',
    description: 'Calming lavender fragrance and almond oil for soft, aromatic body cleansing.',
    imageUrl: 'https://www.vivel.in/newimgs/Lava-new.png',
    basePrice: 99,
    variants: [
      { label: '200 ml Bottle with Loofah', price: 99, is_default: true },
      { label: 'Pack of 2 (200 ml x 2)', price: 190, is_default: false }
    ]
  },
  {
    brand: 'Vivel',
    name: 'Vivel Mint & Cucumber Body Wash',
    category: 'Body Wash & Shower Gel',
    description: 'Cooling mint and hydrating cucumber for an invigorating shower experience.',
    imageUrl: 'https://www.vivel.in/newimgs/Mint-new.png',
    basePrice: 99,
    variants: [
      { label: '200 ml Bottle with Loofah', price: 99, is_default: true },
      { label: 'Pack of 2 (200 ml x 2)', price: 190, is_default: false }
    ]
  },
  {
    brand: 'Vivel',
    name: 'Vivel Pure Glycerin Body Wash',
    category: 'Body Wash & Shower Gel',
    description: 'Moisturizing glycerine body wash for smooth, hydrated, glowing skin.',
    imageUrl: 'https://www.vivel.in/newimgs/Glycerin-100ml-new.png',
    basePrice: 99,
    variants: [
      { label: '200 ml Bottle with Loofah', price: 99, is_default: true },
      { label: 'Pack of 2 (200 ml x 2)', price: 190, is_default: false }
    ]
  },
  {
    brand: 'Vivel',
    name: 'Vivel Neem Oil & Aloe Body Wash',
    category: 'Body Wash & Shower Gel',
    description: 'Antibacterial neem oil and soothing aloe vera for pure, protected skin.',
    imageUrl: 'https://www.vivel.in/newimgs/Neem-new.png',
    basePrice: 99,
    variants: [
      { label: '200 ml Bottle with Loofah', price: 99, is_default: true },
      { label: 'Pack of 2 (200 ml x 2)', price: 190, is_default: false }
    ]
  }
];

fs.writeFileSync('scripts/vivel_products.json', JSON.stringify(vivelProducts, null, 2), 'utf8');
console.log(`Saved ${vivelProducts.length} Vivel products to scripts/vivel_products.json`);
