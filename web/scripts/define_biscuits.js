const fs = require('fs');

const biscuitsMasterItems = [
  // --- BRITANNIA ---
  {
    name: 'Britannia Good Day Cashew Cookies',
    brand: 'Britannia',
    family: 'Cookies',
    description: 'Rich buttery round cookies loaded with crunchy toasted cashew bits, iconic smiling ridges.',
    sell_mode: 'Fixed',
    default_quantity: '200 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['50 g', '100 g', '200 g', '400 g']
  },
  {
    name: 'Britannia Good Day Butter Cookies',
    brand: 'Britannia',
    family: 'Cookies',
    description: 'Crisp golden baked sweet cookies infused with rich dairy butter aroma.',
    sell_mode: 'Fixed',
    default_quantity: '200 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['50 g', '100 g', '200 g']
  },
  {
    name: 'Britannia Good Day Chocochip Cookies',
    brand: 'Britannia',
    family: 'Cookies',
    description: 'Buttery cookie studded with decadent dark chocolate chips.',
    sell_mode: 'Fixed',
    default_quantity: '100 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '200 g']
  },
  {
    name: 'Britannia Good Day Pista Badam Cookies',
    brand: 'Britannia',
    family: 'Cookies',
    description: 'Delightful crunchy cookies flavored with real pistachio and almond slivers.',
    sell_mode: 'Fixed',
    default_quantity: '100 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '200 g']
  },
  {
    name: 'Britannia Marie Gold Biscuits',
    brand: 'Britannia',
    family: 'Marie Biscuits',
    description: 'Crisp, light, low-fat tea biscuits made with wholesome wheat and 10 vitamins.',
    sell_mode: 'Fixed',
    default_quantity: '250 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '250 g', '500 g', '950 g']
  },
  {
    name: 'Britannia Milk Bikis Biscuits',
    brand: 'Britannia',
    family: 'Milk Biscuits',
    description: 'Nutrient-rich round milk biscuits made with pure milk cream, favorite snack for kids.',
    sell_mode: 'Fixed',
    default_quantity: '150 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['80 g', '150 g', '300 g']
  },
  {
    name: 'Britannia Milk Bikis Cream Biscuits',
    brand: 'Britannia',
    family: 'Cream Biscuits',
    description: 'Sandwich biscuits filled with rich, creamy sweet milk frosting.',
    sell_mode: 'Fixed',
    default_quantity: '100 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '200 g']
  },
  {
    name: 'Britannia NutriChoice Digestive Biscuits',
    brand: 'Britannia',
    family: 'Digestive Biscuits',
    description: 'High-fiber whole wheat flour biscuits crafted without trans fats for wholesome snacking.',
    sell_mode: 'Fixed',
    default_quantity: '250 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '250 g', '500 g']
  },
  {
    name: 'Britannia NutriChoice Oats Biscuits',
    brand: 'Britannia',
    family: 'Digestive Biscuits',
    description: 'Crunchy digestive biscuits enriched with rolled oats and dietary fiber.',
    sell_mode: 'Fixed',
    default_quantity: '100 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '200 g']
  },
  {
    name: 'Britannia 50-50 Sweet & Salty Biscuits',
    brand: 'Britannia',
    family: 'Crackers',
    description: 'Crisp square crackers perfectly balancing sweet crunch with savoury saltiness.',
    sell_mode: 'Fixed',
    default_quantity: '100 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '200 g']
  },
  {
    name: 'Britannia 50-50 Maska Chaska Biscuits',
    brand: 'Britannia',
    family: 'Crackers',
    description: 'Herb and butter flavored light savoury crackers sprinkled with aromatic green herbs.',
    sell_mode: 'Fixed',
    default_quantity: '100 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['50 g', '100 g', '200 g']
  },
  {
    name: 'Britannia Bourbon Chocolate Cream Biscuits',
    brand: 'Britannia',
    family: 'Cream Biscuits',
    description: 'Classic rectangular chocolate sandwich biscuits with smooth dark cocoa cream and sugar crystal sprinkles.',
    sell_mode: 'Fixed',
    default_quantity: '150 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['50 g', '150 g']
  },
  {
    name: 'Britannia Treat Jim Jam Biscuits',
    brand: 'Britannia',
    family: 'Cream Biscuits',
    description: 'Sweet vanilla cream sandwich biscuits topped with sticky red fruit jam centre and sugar dusting.',
    sell_mode: 'Fixed',
    default_quantity: '150 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['50 g', '150 g']
  },

  // --- PARLE ---
  {
    name: 'Parle-G Glucose Biscuits',
    brand: 'Parle',
    family: 'Glucose Biscuits',
    description: 'India beloved energy biscuit made with wheat flour and milk solids, legendary daily chai companion.',
    sell_mode: 'Fixed',
    default_quantity: '250 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['50 g', '100 g', '250 g', '500 g', '800 g']
  },
  {
    name: 'Parle-G Gold Biscuits',
    brand: 'Parle',
    family: 'Glucose Biscuits',
    description: 'Richer, crunchier gold edition of original Parle-G with extra milk and wholesome wheat.',
    sell_mode: 'Fixed',
    default_quantity: '250 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '250 g', '500 g']
  },
  {
    name: 'Parle Monaco Classic Salted Crackers',
    brand: 'Parle',
    family: 'Crackers',
    description: 'Crispy salted round crackers, ideal base for quick cheese toppings and party canapes.',
    sell_mode: 'Fixed',
    default_quantity: '120 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['50 g', '120 g', '250 g']
  },
  {
    name: 'Parle Krackjack Sweet & Salty Crackers',
    brand: 'Parle',
    family: 'Crackers',
    description: 'The original dual-taste biscuit blending savoury saltiness with sweet crunch.',
    sell_mode: 'Fixed',
    default_quantity: '150 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['60 g', '150 g', '300 g']
  },
  {
    name: 'Parle Hide & Seek Chocolate Chip Cookies',
    brand: 'Parle',
    family: 'Cookies',
    description: 'Crisp chocolate cookies densely embedded with rich dark chocolate chips.',
    sell_mode: 'Fixed',
    default_quantity: '200 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '200 g', '400 g']
  },
  {
    name: 'Parle 20-20 Cashew Cookies',
    brand: 'Parle',
    family: 'Cookies',
    description: 'Crisp budget-friendly butter cookies with generous cashew nut taste.',
    sell_mode: 'Fixed',
    default_quantity: '100 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '200 g']
  },

  // --- SUNFEAST ---
  {
    name: 'Sunfeast Dark Fantasy Choco Fills',
    brand: 'Sunfeast',
    family: 'Cream Biscuits',
    description: 'Crisp dark chocolate cookie shell oozing with molten liquid chocolate fudge centre.',
    sell_mode: 'Fixed',
    default_quantity: '150 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['75 g', '150 g', '300 g']
  },
  {
    name: 'Sunfeast Mom\'s Magic Cashew & Almond Cookies',
    brand: 'Sunfeast',
    family: 'Cookies',
    description: 'Homestyle baked butter cookies loaded with rich almonds and cashews.',
    sell_mode: 'Fixed',
    default_quantity: '200 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '200 g']
  },
  {
    name: 'Sunfeast Bounce Cream Biscuits (Chocolate)',
    brand: 'Sunfeast',
    family: 'Cream Biscuits',
    description: 'Crisp biscuits with gooey chocolate flavored cream center.',
    sell_mode: 'Fixed',
    default_quantity: '100 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '200 g']
  },

  // --- CADBURY OREO ---
  {
    name: 'Cadbury Oreo Original Vanilla Cream Cookies',
    brand: 'Oreo',
    family: 'Cream Biscuits',
    description: 'Rich dark cocoa embossed sandwich cookies filled with sweet vanilla creme.',
    sell_mode: 'Fixed',
    default_quantity: '120 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['50 g', '120 g', '300 g']
  },
  {
    name: 'Cadbury Oreo Choco Cream Cookies',
    brand: 'Oreo',
    family: 'Cream Biscuits',
    description: 'Double chocolate cocoa cookies filled with chocolate creme.',
    sell_mode: 'Fixed',
    default_quantity: '120 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['120 g', '300 g']
  },

  // --- UNIBIC ---
  {
    name: 'Unibic Choco Chip Cookies',
    brand: 'Unibic',
    family: 'Cookies',
    description: 'Traditional wire-cut cookies loaded with 16 percent rich real chocolate chips.',
    sell_mode: 'Fixed',
    default_quantity: '150 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['75 g', '150 g', '250 g']
  },
  {
    name: 'Unibic Oatmeal Digestives',
    brand: 'Unibic',
    family: 'Digestive Biscuits',
    description: 'Hearty high-fiber biscuits made from wholegrain rolled oats and golden syrup.',
    sell_mode: 'Fixed',
    default_quantity: '150 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['75 g', '150 g']
  },

  // --- MCVITIE'S ---
  {
    name: 'McVitie\'s Original Digestive Biscuits',
    brand: 'McVitie\'s',
    family: 'Digestive Biscuits',
    description: 'The original British recipe whole wheat digestives rich in dietary fiber.',
    sell_mode: 'Fixed',
    default_quantity: '250 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['100 g', '250 g', '500 g']
  },

  // --- LOCAL KERALA BAKERY BISCUITS ---
  {
    name: 'Local Bakery Butter Biscuits',
    brand: 'Local Bakery',
    family: 'Bakery Biscuits',
    description: 'Melt-in-mouth traditional Kerala bakery butter biscuits hand-baked in stone ovens.',
    sell_mode: 'Fixed',
    default_quantity: '200 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['200 g', '500 g']
  },
  {
    name: 'Local Bakery Salt Biscuits',
    brand: 'Local Bakery',
    family: 'Bakery Biscuits',
    description: 'Crispy, crumbly savoury tea biscuits sprinkled with sea salt.',
    sell_mode: 'Fixed',
    default_quantity: '200 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['200 g', '500 g']
  },
  {
    name: 'Local Bakery Coconut Biscuits',
    brand: 'Local Bakery',
    family: 'Bakery Biscuits',
    description: 'Aromatic sweet cookies made with freshly roasted desiccated coconut.',
    sell_mode: 'Fixed',
    default_quantity: '200 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['200 g', '500 g']
  },
  {
    name: 'Local Bakery Ghee Biscuits (Nankhatai)',
    brand: 'Local Bakery',
    family: 'Bakery Biscuits',
    description: 'Traditional crumbly cardamom-scented shortbread cookies prepared with pure desi ghee.',
    sell_mode: 'Fixed',
    default_quantity: '200 g',
    default_image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    variants: ['200 g', '500 g']
  }
];

fs.writeFileSync('scripts/biscuits_data.json', JSON.stringify(biscuitsMasterItems, null, 2), 'utf8');
console.log(`Defined Biscuits & Cookies master items: ${biscuitsMasterItems.length}`);
