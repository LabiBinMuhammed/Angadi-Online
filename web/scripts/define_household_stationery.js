const fs = require('fs');

const householdStationeryMasterItems = [
  // --- DISHWASHING ---
  {
    name: 'Vim Dishwash Bar',
    brand: 'Vim',
    family: 'Dishwash',
    description: 'Tough grease-cleaning dishwashing bar powered by pure lemon peel concentrates.',
    sell_mode: 'Fixed',
    default_quantity: '250 g',
    default_image: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=500&auto=format&fit=crop&q=80',
    variants: ['125 g', '250 g', '500 g']
  },
  {
    name: 'Vim Lemon Dishwash Liquid Gel',
    brand: 'Vim',
    family: 'Dishwash',
    description: 'Concentrated grease-dissolving lemon liquid leaving utensils sparkling clean with zero white residue.',
    sell_mode: 'Fixed',
    default_quantity: '500 ml',
    default_image: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=500&auto=format&fit=crop&q=80',
    variants: ['250 ml', '500 ml', '750 ml']
  },
  {
    name: 'Exo Dish Shine Round Bar',
    brand: 'Exo',
    family: 'Dishwash',
    description: 'Antibacterial round dishwash bar infused with ginger power preventing soggy bar wastage.',
    sell_mode: 'Fixed',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=500&auto=format&fit=crop&q=80',
    variants: ['250 g', '500 g']
  },
  {
    name: 'Scotch-Brite Scrub Sponge / Pad',
    brand: 'Scotch-Brite',
    family: 'Cleaning Accessories',
    description: 'Heavy duty kitchen scrub pad with thick sponge back for easy lathering and stubborn vessel scouring.',
    sell_mode: 'Fixed',
    default_quantity: '1 pc',
    default_image: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=500&auto=format&fit=crop&q=80',
    variants: ['1 pc', '3 pcs']
  },

  // --- LAUNDRY & FABRIC CARE ---
  {
    name: 'Surf Excel Easy Wash Detergent Powder',
    brand: 'Surf Excel',
    family: 'Laundry Powder',
    description: 'Superior stain-removal detergent powder that removes stubborn curry, mud, and oil stains with ease.',
    sell_mode: 'Fixed',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg', '2 kg']
  },
  {
    name: 'Surf Excel Matic Liquid Detergent',
    brand: 'Surf Excel',
    family: 'Liquid Detergent',
    description: 'High-performance liquid laundry detergent specially formulated for washing machines.',
    sell_mode: 'Fixed',
    default_quantity: '1 L',
    default_image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&auto=format&fit=crop&q=80',
    variants: ['500 ml', '1 L', '2 L']
  },
  {
    name: 'Rin Detergent Bar Soap',
    brand: 'Rin',
    family: 'Laundry Bar',
    description: 'Brightening laundry bar with yellow bleach particles for crisp, sparkling white clothes.',
    sell_mode: 'Fixed',
    default_quantity: '250 g',
    default_image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&auto=format&fit=crop&q=80',
    variants: ['150 g', '250 g']
  },
  {
    name: 'Ujala Supreme Fabric Whitener',
    brand: 'Ujala',
    family: 'Fabric Care',
    description: 'Kerala legendary 4-drop fabric whitener suspension for ultra-radiant white shirts and dhotis.',
    sell_mode: 'Fixed',
    default_quantity: '100 ml',
    default_image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&auto=format&fit=crop&q=80',
    variants: ['100 ml', '250 ml']
  },
  {
    name: 'Comfort Fabric Conditioner Morning Fresh',
    brand: 'Comfort',
    family: 'Fabric Conditioner',
    description: 'Leaves clothes soft, smooth, and smelling garden-fresh with long-lasting fragrance.',
    sell_mode: 'Fixed',
    default_quantity: '220 ml',
    default_image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&auto=format&fit=crop&q=80',
    variants: ['220 ml', '860 ml']
  },

  // --- SURFACE & BATHROOM CLEANERS ---
  {
    name: 'Harpic Power Plus Toilet Cleaner',
    brand: 'Harpic',
    family: 'Toilet Cleaners',
    description: 'Disinfectant toilet cleaner that removes 99.9 percent germs and stubborn yellowish limescale.',
    sell_mode: 'Fixed',
    default_quantity: '500 ml',
    default_image: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=500&auto=format&fit=crop&q=80',
    variants: ['500 ml', '1 L']
  },
  {
    name: 'Lizol Disinfectant Surface & Floor Cleaner',
    brand: 'Lizol',
    family: 'Floor Cleaners',
    description: 'Citrus and floral scented antibacterial floor cleaner safe for marble, mosaic, and tiles.',
    sell_mode: 'Fixed',
    default_quantity: '500 ml',
    default_image: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=500&auto=format&fit=crop&q=80',
    variants: ['500 ml', '1 L']
  },

  // --- REPELLENTS & PERSONAL SOAPS ---
  {
    name: 'Good Knight Gold Flash Liquid Vaporizer Refill',
    brand: 'Good Knight',
    family: 'Pest Control',
    description: 'Twin action mosquito repellent liquid refill release for total protection from dengue and malaria mosquitoes.',
    sell_mode: 'Fixed',
    default_quantity: '45 ml',
    default_image: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=500&auto=format&fit=crop&q=80',
    variants: ['45 ml']
  },
  {
    name: 'Medimix Ayurvedic 18 Herbs Classic Soap',
    brand: 'Medimix',
    family: 'Bath Soap',
    description: 'Centuries-old Kerala handmade Ayurvedic bathing bar enriched with 18 medicinal herb oils.',
    sell_mode: 'Fixed',
    default_quantity: '125 g',
    default_image: 'https://images.unsplash.com/photo-1607006314180-3058866503c8?w=500&auto=format&fit=crop&q=80',
    variants: ['75 g', '125 g']
  },
  {
    name: 'Chandrika Ayurvedic Handmade Soap',
    brand: 'Chandrika',
    family: 'Bath Soap',
    description: 'Traditional green Ayurvedic soap with coconut oil, sandalwood, and patchouli essential oils.',
    sell_mode: 'Fixed',
    default_quantity: '125 g',
    default_image: 'https://images.unsplash.com/photo-1607006314180-3058866503c8?w=500&auto=format&fit=crop&q=80',
    variants: ['75 g', '125 g']
  },
  {
    name: 'Santoor Sandal & Turmeric Soap',
    brand: 'Santoor',
    family: 'Bath Soap',
    description: 'Deep skin nourishment soap made with natural sandalwood and turmeric extracts.',
    sell_mode: 'Fixed',
    default_quantity: '100 g',
    default_image: 'https://images.unsplash.com/photo-1607006314180-3058866503c8?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g']
  },
  {
    name: 'Dettol Original Germ Protection Bath Soap',
    brand: 'Dettol',
    family: 'Bath Soap',
    description: 'Trusted antiseptic bar soap providing 100 percent better germ defense.',
    sell_mode: 'Fixed',
    default_quantity: '125 g',
    default_image: 'https://images.unsplash.com/photo-1607006314180-3058866503c8?w=500&auto=format&fit=crop&q=80',
    variants: ['75 g', '125 g']
  },
  {
    name: 'Colgate Strong Teeth Dental Cream Toothpaste',
    brand: 'Colgate',
    family: 'Oral Care',
    description: 'Calcium and fluoride enriched toothpaste providing all-around cavity defense and fresh breath.',
    sell_mode: 'Fixed',
    default_quantity: '100 g',
    default_image: 'https://images.unsplash.com/photo-1559591937-e62fb330bc1f?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '200 g']
  },

  // --- STATIONERY ---
  {
    name: 'Standard Single Line Notebook (192 Pages)',
    brand: 'Local Stationery',
    family: 'Notebooks',
    description: 'Hardbound/softbound ruled school and college notebook with high quality white paper.',
    sell_mode: 'Fixed',
    default_quantity: '1 pc',
    default_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
    variants: ['1 pc', '4 pcs']
  },
  {
    name: 'Standard Four Line English Notebook (192 Pages)',
    brand: 'Local Stationery',
    family: 'Notebooks',
    description: 'Four line ruled notebook for primary cursive handwriting practice.',
    sell_mode: 'Fixed',
    default_quantity: '1 pc',
    default_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
    variants: ['1 pc', '4 pcs']
  },
  {
    name: 'Cello Gripper Ballpoint Pens (Blue)',
    brand: 'Cello',
    family: 'Pens',
    description: 'Smooth-flow 0.7mm tip blue ballpoint pen with comfortable elastic rubber grip.',
    sell_mode: 'Fixed',
    default_quantity: '5 pcs',
    default_image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80',
    variants: ['1 pc', '5 pcs', '10 pcs']
  },
  {
    name: 'Reynolds 045 Fine Carbure Ball Pen (Blue)',
    brand: 'Reynolds',
    family: 'Pens',
    description: 'Classic durable transparent blue ink pen with precision ball tip.',
    sell_mode: 'Fixed',
    default_quantity: '5 pcs',
    default_image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80',
    variants: ['1 pc', '5 pcs']
  },
  {
    name: 'Apsara Platinum Extra Dark Pencils Box',
    brand: 'Apsara',
    family: 'Pencils',
    description: 'Lead pencils designed for neat, extra-dark handwriting, includes eraser and sharpener.',
    sell_mode: 'Fixed',
    default_quantity: '10 pcs',
    default_image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80',
    variants: ['10 pcs']
  },
  {
    name: 'A4 White Copier Paper Ream (75 GSM)',
    brand: 'Local Stationery',
    family: 'Office Paper',
    description: 'Clean bright white multipurpose paper for photocopiers, laser printers, and documents.',
    sell_mode: 'Fixed',
    default_quantity: '500 sheets',
    default_image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80',
    variants: ['100 sheets', '500 sheets']
  }
];

fs.writeFileSync('scripts/household_stationery_data.json', JSON.stringify(householdStationeryMasterItems, null, 2), 'utf8');
console.log(`Defined Household & Stationery master items: ${householdStationeryMasterItems.length}`);
