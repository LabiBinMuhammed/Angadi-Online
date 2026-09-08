const fs = require('fs');

const dessertsMasterItems = [
  // --- PAYASAM MIXES (KERALA CELEBRATION CLASSICS) ---
  {
    name: 'Instant Palada Payasam Mix',
    brand: 'Milma',
    family: 'Payasam Mix',
    description: 'Authentic Kerala temple-style creamy pink palada payasam mix with rice flakes, sugar, and cardamom.',
    sell_mode: 'Fixed',
    default_quantity: '200 g',
    default_image: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=500&auto=format&fit=crop&q=80',
    variants: ['200 g', '500 g']
  },
  {
    name: 'Vermicelli Semi-ya Payasam Mix',
    brand: 'Eastern',
    family: 'Payasam Mix',
    description: 'Golden roasted wheat vermicelli payasam mix with raisins, cashew nuts, and cardamom.',
    sell_mode: 'Fixed',
    default_quantity: '200 g',
    default_image: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=500&auto=format&fit=crop&q=80',
    variants: ['200 g', '500 g']
  },
  {
    name: 'Traditional Kerala Halwa (Black / Karutha Halwa)',
    brand: 'Local Sweets',
    family: 'Halwa',
    description: 'Legendary Calicut black halwa slow-stirred in pure coconut oil with jaggery and crushed cashews.',
    sell_mode: 'Fixed',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=500&auto=format&fit=crop&q=80',
    variants: ['250 g', '500 g', '1 kg']
  },
  {
    name: 'Kozhikodan Yellow Halwa',
    brand: 'Local Sweets',
    family: 'Halwa',
    description: 'Authentic melt-in-mouth yellow halwa enriched with cardamom and crunchy cashew pieces.',
    sell_mode: 'Fixed',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=500&auto=format&fit=crop&q=80',
    variants: ['250 g', '500 g', '1 kg']
  },
  {
    name: 'Ghee Mysore Pak',
    brand: 'Local Sweets',
    family: 'Traditional Sweets',
    description: 'Rich royal confection prepared with gram flour, sugar, and generous quantity of pure cow ghee.',
    sell_mode: 'Fixed',
    default_quantity: '250 g',
    default_image: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=500&auto=format&fit=crop&q=80',
    variants: ['250 g', '500 g']
  },
  {
    name: 'Gulab Jamun (Canned)',
    brand: 'Amul',
    family: 'Canned Sweets',
    description: 'Soft melt-in-mouth cottage milk balls soaked in sweet aromatic saffron and rose syrup.',
    sell_mode: 'Fixed',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },
  {
    name: 'Rasgulla Tin',
    brand: 'Amul',
    family: 'Canned Sweets',
    description: 'Spongy chhena dumplings soaked in delicate light sugar syrup.',
    sell_mode: 'Fixed',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },

  // --- ICE CREAMS ---
  {
    name: 'Milma Real Vanilla Ice Cream Tub',
    brand: 'Milma',
    family: 'Ice Cream',
    description: 'Creamy rich vanilla frozen dessert made with 100 percent pure cow milk and cream.',
    sell_mode: 'Fixed',
    default_quantity: '1 L',
    default_image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=80',
    variants: ['500 ml', '1 L', '2 L']
  },
  {
    name: 'Milma Rich Chocolate Ice Cream Tub',
    brand: 'Milma',
    family: 'Ice Cream',
    description: 'Decadent chocolate dairy ice cream made with rich cocoa.',
    sell_mode: 'Fixed',
    default_quantity: '1 L',
    default_image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=80',
    variants: ['500 ml', '1 L']
  },
  {
    name: 'Amul Alphonso Mango Ice Cream Tub',
    brand: 'Amul',
    family: 'Ice Cream',
    description: 'Made with genuine Alphonso mango pulp and real milk cream.',
    sell_mode: 'Fixed',
    default_quantity: '1 L',
    default_image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=80',
    variants: ['500 ml', '1 L']
  },
  {
    name: 'Amul Chocobar Ice Cream',
    brand: 'Amul',
    family: 'Ice Cream',
    description: 'Creamy vanilla ice cream bar coated with a crisp dark chocolate shell.',
    sell_mode: 'Fixed',
    default_quantity: '1 pc',
    default_image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=80',
    variants: ['1 pc', '4 pcs']
  }
];

const dryfruitsMasterItems = [
  // --- NUTS & SEEDS ---
  {
    name: 'Whole Cashew Nuts (W240)',
    brand: 'Happilo',
    family: 'Cashews',
    description: 'Premium jumbo whole white cashew kernels, crunchy and creamy, perfect for snacking and cooking.',
    sell_mode: 'Fixed',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1509358211563-08035a092822?w=500&auto=format&fit=crop&q=80',
    variants: ['200 g', '500 g', '1 kg']
  },
  {
    name: 'Split Cashew Nuts (Kaju Tukda)',
    brand: 'Local Grocery',
    family: 'Cashews',
    description: 'Clean split cashew bits, perfect for daily payasam, biriyani, and curries.',
    sell_mode: 'Manual',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1509358211563-08035a092822?w=500&auto=format&fit=crop&q=80',
    variants: ['250 g', '500 g', '1 kg']
  },
  {
    name: 'California Almonds Whole (Badam)',
    brand: 'Happilo',
    family: 'Almonds',
    description: 'High-grade whole natural California almonds, packed with protein and Vitamin E.',
    sell_mode: 'Fixed',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d96?w=500&auto=format&fit=crop&q=80',
    variants: ['200 g', '500 g', '1 kg']
  },
  {
    name: 'Green Raisins (Kishmish)',
    brand: 'Happilo',
    family: 'Raisins',
    description: 'Naturally sun-dried sweet seedless green raisins, rich in iron.',
    sell_mode: 'Fixed',
    default_quantity: '250 g',
    default_image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d96?w=500&auto=format&fit=crop&q=80',
    variants: ['250 g', '500 g']
  },
  {
    name: 'Arabian Dates (Seedless)',
    brand: 'Happilo',
    family: 'Dates',
    description: 'Naturally sweet soft black dates, nutrient-dense natural sweetener.',
    sell_mode: 'Fixed',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d96?w=500&auto=format&fit=crop&q=80',
    variants: ['250 g', '500 g', '1 kg']
  },
  {
    name: 'Roasted & Salted Pistachios (Pista)',
    brand: 'Happilo',
    family: 'Pistachios',
    description: 'California inshell roasted pistachios lightly salted for crunchy snacking.',
    sell_mode: 'Fixed',
    default_quantity: '200 g',
    default_image: 'https://images.unsplash.com/photo-1509358211563-08035a092822?w=500&auto=format&fit=crop&q=80',
    variants: ['200 g', '500 g']
  },
  {
    name: 'Whole Walnut Kernels (Akhrot)',
    brand: 'Happilo',
    family: 'Walnuts',
    description: 'Crisp butterfly walnut halves rich in Omega-3 brain-supporting nutrients.',
    sell_mode: 'Fixed',
    default_quantity: '250 g',
    default_image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d96?w=500&auto=format&fit=crop&q=80',
    variants: ['250 g', '500 g']
  },

  // --- CEREALS & OATS ---
  {
    name: 'Quaker Rolled Oats',
    brand: 'Quaker',
    family: 'Breakfast Cereals',
    description: '100% natural wholegrain rolled oats, supports heart health and reduces cholesterol.',
    sell_mode: 'Fixed',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg', '2 kg']
  },
  {
    name: 'Kellogg\'s Corn Flakes Original',
    brand: 'Kellogg\'s',
    family: 'Breakfast Cereals',
    description: 'Golden crunchy toasted corn flakes enriched with Vitamin D, B vitamins, and iron.',
    sell_mode: 'Fixed',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop&q=80',
    variants: ['250 g', '500 g', '1.2 kg']
  },
  {
    name: 'Kellogg\'s Chocos',
    brand: 'Kellogg\'s',
    family: 'Breakfast Cereals',
    description: 'Crunchy chocolaty wheat scoops enriched with calcium and protein for active kids.',
    sell_mode: 'Fixed',
    default_quantity: '375 g',
    default_image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop&q=80',
    variants: ['250 g', '375 g']
  }
];

fs.writeFileSync('scripts/desserts_data.json', JSON.stringify(dessertsMasterItems, null, 2), 'utf8');
fs.writeFileSync('scripts/dryfruits_data.json', JSON.stringify(dryfruitsMasterItems, null, 2), 'utf8');
console.log(`Defined Desserts: ${dessertsMasterItems.length}, Dry Fruits & Cereals: ${dryfruitsMasterItems.length}`);
