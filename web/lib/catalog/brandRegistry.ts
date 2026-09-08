export interface MasterCatalogProduct {
  canonicalName: string
  category: string
  brands: string[]
  aliases: string[]
  malayalam: string
  sellMode: 'Fixed' | 'Manual'
  defaultQuantity: string
  variants: string[]
  description: string
  defaultImage?: string | null
}

export const KERALA_BRAND_CATALOG: MasterCatalogProduct[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. BISCUITS & COOKIES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    canonicalName: 'Butter Cookies',
    category: 'Biscuits & Cookies',
    brands: ['Britannia', 'Elite', 'Parle', 'Local Bakery', 'Unibic'],
    aliases: ['Good Day Butter', '20-20 Butter', 'Butter Biscuit', 'Rich Butter Cookies'],
    malayalam: 'ബട്ടർ കുക്കീസ്',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g', '250g', '500g'],
    description: 'Crisp and buttery baked cookies, perfect with tea or coffee.'
  },
  {
    canonicalName: 'Cashew Cookies',
    category: 'Biscuits & Cookies',
    brands: ['Britannia', 'Sunfeast', 'Parle', 'Local Bakery'],
    aliases: ['Good Day Cashew', "Mom's Magic Cashew", '20-20 Cashew', 'Kaju Biscuits'],
    malayalam: 'കശുവണ്ടി കുക്കീസ്',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g', '250g'],
    description: 'Crunchy golden cookies blended with premium roasted cashew nuts.'
  },
  {
    canonicalName: 'Pista Badam Cookies',
    category: 'Biscuits & Cookies',
    brands: ['Britannia', 'Sunfeast', 'Local Bakery'],
    aliases: ['Good Day Pista Badam', 'Pistachio Almond Cookies', 'Pista Biscuits'],
    malayalam: 'പിസ്ത ബദാം കുക്കീസ്',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g'],
    description: 'Delicately flavoured cookies with crushed pistachios and almonds.'
  },
  {
    canonicalName: 'Marie Biscuits',
    category: 'Biscuits & Cookies',
    brands: ['Britannia', 'Sunfeast', 'Parle', 'Milma', 'Local Bakery'],
    aliases: ['Marie Gold', 'Marie Light', 'Tea Time Marie', 'Tea Biscuits'],
    malayalam: 'മേരി ബിസ്ക്കറ്റ്',
    sellMode: 'Fixed',
    defaultQuantity: '120g',
    variants: ['120g', '200g', '250g', '300g', '1kg'],
    description: 'Light and crispy semi-sweet biscuits made for dipping in tea.'
  },
  {
    canonicalName: 'Glucose Biscuits',
    category: 'Biscuits & Cookies',
    brands: ['Parle', 'Britannia', 'Sunfeast', 'Local Brand'],
    aliases: ['Parle-G', 'Parle-G Gold', 'Tiger Glucose', 'Glucose Shakti'],
    malayalam: 'ഗ്ലൂക്കോസ് ബിസ്ക്കറ്റ്',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g', '250g', '800g', '1kg'],
    description: 'Classic energy-rich wheat and milk glucose biscuits.'
  },
  {
    canonicalName: 'Milk Biscuits',
    category: 'Biscuits & Cookies',
    brands: ['Britannia', 'Parle', 'Sunfeast', 'Milma', 'Local Bakery'],
    aliases: ['Milk Bikis', 'Milk Shakti', 'Milk Crunch'],
    malayalam: 'മിൽക്ക് ബിസ്ക്കറ്റ്',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['60g', '100g', '200g', '250g'],
    description: 'Nourishing milk-enriched biscuits baked for kids and families.'
  },
  {
    canonicalName: 'Sweet & Salty Crackers',
    category: 'Biscuits & Cookies',
    brands: ['Britannia', 'Parle', 'Sunfeast'],
    aliases: ['50-50', 'KrackJack', 'Sweet and Salt Biscuit', '50-50 Maska Chaska'],
    malayalam: 'സ്വീറ്റ് & സാൾട്ടി ക്രാക്കേഴ്സ്',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g', '300g'],
    description: 'Light, flaky golden crackers balancing sweet and salty tastes.'
  },
  {
    canonicalName: 'Salted Crackers',
    category: 'Biscuits & Cookies',
    brands: ['Parle', 'Britannia', 'Sunfeast', 'Elite'],
    aliases: ['Monaco', 'Salt Biscuit', 'Salt Crackers', 'Club Crackers'],
    malayalam: 'സാൾട്ട് ക്രാക്കേഴ്സ്',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '75g', '100g', '200g', '250g'],
    description: 'Crispy salted snack biscuits ideal for light snacks and toppings.'
  },
  {
    canonicalName: 'Bourbon Cream Biscuits',
    category: 'Biscuits & Cookies',
    brands: ['Britannia', 'Parle', 'Sunfeast'],
    aliases: ['Britannia Bourbon', 'Hide & Seek Bourbon', 'Chocolate Bourbon'],
    malayalam: 'ബോർബൺ ക്രീം ബിസ്ക്കറ്റ്',
    sellMode: 'Fixed',
    defaultQuantity: '120g',
    variants: ['60g', '120g', '150g', '250g'],
    description: 'Chocolate biscuits sandwiched with rich chocolate cream and sugar crystals.'
  },
  {
    canonicalName: 'Digestive Biscuits',
    category: 'Biscuits & Cookies',
    brands: ['Britannia', "McVitie's", 'Sunfeast', 'Parle'],
    aliases: ['NutriChoice Digestive', 'Original Digestive', 'High Fibre Digestive'],
    malayalam: 'ഡൈജസ്റ്റീവ് ബിസ്ക്കറ്റ്',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['100g', '200g', '250g', '500g', '1kg'],
    description: 'Whole wheat and high-fibre baked digestive biscuits for everyday wellness.'
  },
  {
    canonicalName: 'Jim Jam Biscuits',
    category: 'Biscuits & Cookies',
    brands: ['Britannia', 'Local Bakery'],
    aliases: ['Treat Jim Jam', 'Jam Biscuits', 'Vanilla Cream Jam Biscuit'],
    malayalam: 'ജിം ജാം ബിസ്ക്കറ്റ്',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '150g', '200g'],
    description: 'Crisp biscuits layered with smooth vanilla cream and berry jam centre.'
  },
  {
    canonicalName: 'Little Hearts',
    category: 'Biscuits & Cookies',
    brands: ['Britannia'],
    aliases: ['Britannia Little Hearts', 'Sugar Glazed Biscuits', 'Heart Biscuits'],
    malayalam: 'ലിറ്റിൽ ഹാർട്ട്സ്',
    sellMode: 'Fixed',
    defaultQuantity: '75g',
    variants: ['35g', '75g', '150g'],
    description: 'Heart-shaped crunchy poppables coated with golden sugar crystals.'
  },
  {
    canonicalName: 'Choco Fills Cookies',
    category: 'Biscuits & Cookies',
    brands: ['Sunfeast', 'Unibic', 'Local Bakery'],
    aliases: ['Dark Fantasy Choco Fills', 'Choco Lava Cookies', 'Molten Choco Cookies'],
    malayalam: 'ചോക്കോ ഫിൽസ് കുക്കീസ്',
    sellMode: 'Fixed',
    defaultQuantity: '75g',
    variants: ['75g', '150g', '300g'],
    description: 'Rich dark cookie crust filled with luscious molten chocolate cream.'
  },
  {
    canonicalName: 'Chocolate Chip Cookies',
    category: 'Biscuits & Cookies',
    brands: ['Parle', 'Britannia', 'Unibic', 'Sunfeast', 'Local Bakery'],
    aliases: ['Hide & Seek', 'Good Day Chocochip', 'Choco Chip Cookies'],
    malayalam: 'ചോക്ലേറ്റ് ചിപ്പ് കുക്കീസ്',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '120g', '200g'],
    description: 'Crunchy baked cookies packed with melting chocolate chips.'
  },
  {
    canonicalName: 'Cream Biscuits (Assorted)',
    category: 'Biscuits & Cookies',
    brands: ['Sunfeast', 'Britannia', 'Parle', 'Elite', 'Local Bakery'],
    aliases: ['Bounce', 'Treat', 'Kreams', 'Orange Cream', 'Elaichi Cream', 'Strawberry Cream'],
    malayalam: 'ക്രീം ബിസ്ക്കറ്റ്',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '120g', '200g'],
    description: 'Crunchy sandwich biscuits layered with fruit or vanilla cream fillings.'
  },
  {
    canonicalName: 'Sandwich Cream Cookies (Vanilla/Chocolate)',
    category: 'Biscuits & Cookies',
    brands: ['Cadbury', 'Sunfeast', 'Local Bakery'],
    aliases: ['Oreo Original Vanilla', 'Oreo Choco Cream', 'Oreo Cookies'],
    malayalam: 'സാൻഡ്വിച്ച് ക്രീം കുക്കീസ്',
    sellMode: 'Fixed',
    defaultQuantity: '120g',
    variants: ['50g', '100g', '120g', '300g'],
    description: 'Crisp cocoa cookies sandwiched with smooth vanilla or rich chocolate cream.'
  },
  {
    canonicalName: 'Coconut Cookies',
    category: 'Biscuits & Cookies',
    brands: ['Elite', 'Britannia', 'Sunfeast', 'Parle', 'Local Bakery'],
    aliases: ['Nice Time', 'Nice Biscuits', 'Coconut Biscuits', 'Desiccated Coconut Cookies'],
    malayalam: 'തെങ്ങ് കുക്കീസ് / കോക്കനട്ട് ബിസ്ക്കറ്റ്',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '150g', '200g'],
    description: 'Crispy cookies baked with freshly grated coconut and sugar sprinkles.'
  },
  {
    canonicalName: 'Milk Rusk',
    category: 'Biscuits & Cookies',
    brands: ['Elite', 'Britannia', 'Milma', 'Traditional Kerala Bakery'],
    aliases: ['Premium Milk Rusk', 'Toastea Milk Rusk', 'Tea Rusk', 'Bakery Rusk'],
    malayalam: 'മിൽക്ക് റസ്ക്',
    sellMode: 'Fixed',
    defaultQuantity: '200g',
    variants: ['150g', '200g', '300g', '400g'],
    description: 'Twice-baked crispy golden wheat rusks infused with aromatic elaichi and milk.'
  },
  {
    canonicalName: 'Local Bakery Butter Biscuits',
    category: 'Biscuits & Cookies',
    brands: ['Local Bakery', 'Kerala Bakery', 'Town Bakery'],
    aliases: ['Nadan Butter Biscuit', 'Tea Kadai Butter Biscuit', 'Bakery Fresh Biscuit'],
    malayalam: 'നാടൻ ബട്ടർ ബിസ്ക്കറ്റ്',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['100g', '200g', '250g', '500g', '1kg'],
    description: 'Freshly baked traditional Kerala bakery butter biscuits with a melt-in-mouth crumb.'
  },
  {
    canonicalName: 'Local Bakery Salt Biscuits',
    category: 'Biscuits & Cookies',
    brands: ['Local Bakery', 'Kerala Bakery'],
    aliases: ['Nadan Uppu Biscuit', 'Uppu Biscuit', 'Bakery Salt Biscuit'],
    malayalam: 'നാടൻ ഉപ്പ് ബിസ്ക്കറ്റ്',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['100g', '200g', '250g', '500g'],
    description: 'Traditional savoury salt biscuits fresh from local Kerala ovens.'
  },
  {
    canonicalName: 'Local Bakery Ghee Biscuits (Nankhatai)',
    category: 'Biscuits & Cookies',
    brands: ['Local Bakery', 'Kerala Bakery'],
    aliases: ['Neyy Biscuit', 'Nankhatai', 'Ghee Biscuit', 'Nadan Neyy Biscuit'],
    malayalam: 'നെയ്യ് ബിസ്ക്കറ്റ് (നാൻഖട്ടായ്)',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['100g', '250g', '500g'],
    description: 'Rich and crumbly traditional ghee-infused cardamom shortbread biscuits.'
  },
  {
    canonicalName: 'Jeera Biscuits',
    category: 'Biscuits & Cookies',
    brands: ['Local Bakery', 'Elite', 'Kerala Bakery'],
    aliases: ['Cumin Biscuits', 'Jeerakam Biscuit', 'Savoury Cumin Cookies'],
    malayalam: 'ജീരക ബിസ്ക്കറ്റ്',
    sellMode: 'Fixed',
    defaultQuantity: '200g',
    variants: ['100g', '200g', '250g', '500g'],
    description: 'Crispy salted tea biscuits flavoured with roasted cumin seeds.'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. BAKERY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    canonicalName: 'White Bread',
    category: 'Bakery',
    brands: ['Elite', 'Britannia', 'Milma', 'Modern', 'Local Bakery'],
    aliases: ['White Sandwich Bread', 'Slice Bread', 'Regular Bread', 'Toast Bread'],
    malayalam: 'വൈറ്റ് ബ്രെഡ്',
    sellMode: 'Fixed',
    defaultQuantity: '400g',
    variants: ['200g', '350g', '400g', '600g', '800g'],
    description: 'Soft, freshly sliced white bread baked for breakfast toast and sandwiches.'
  },
  {
    canonicalName: 'Milk Bread',
    category: 'Bakery',
    brands: ['Elite', 'Britannia', 'Milma', 'Local Bakery'],
    aliases: ['Sweet Milk Bread', 'Fresh Milk Bread', 'Malk Bread'],
    malayalam: 'പാൽ ബ്രെഡ്',
    sellMode: 'Fixed',
    defaultQuantity: '400g',
    variants: ['200g', '350g', '400g'],
    description: 'Pillowy soft bread enriched with whole milk for a gentle sweetness.'
  },
  {
    canonicalName: 'Whole Wheat Bread',
    category: 'Bakery',
    brands: ['Elite', 'Britannia', 'Modern', 'Local Bakery'],
    aliases: ['Wheat Bread', 'Brown Bread', '100% Atta Bread', 'Multigrain Bread'],
    malayalam: 'ഹോൾ വീറ്റ് ബ്രെഡ് (ആട്ട ബ്രെഡ്)',
    sellMode: 'Fixed',
    defaultQuantity: '400g',
    variants: ['250g', '400g'],
    description: 'Fibre-packed bread baked with 100% stone-ground whole wheat atta.'
  },
  {
    canonicalName: 'Sandwich Bread',
    category: 'Bakery',
    brands: ['Elite', 'Britannia', 'Modern', 'Local Bakery'],
    aliases: ['Jumbo Sandwich Bread', 'Toast Bread', 'Club Sandwich Bread'],
    malayalam: 'സാൻഡ്വിച്ച് ബ്രെഡ്',
    sellMode: 'Fixed',
    defaultQuantity: '400g',
    variants: ['400g', '600g', '800g'],
    description: 'Large square-cut soft slices crafted specifically for grilled sandwiches.'
  },
  {
    canonicalName: 'Burger Bun',
    category: 'Bakery',
    brands: ['Elite', 'Britannia', 'Local Bakery'],
    aliases: ['Burger Buns', 'Sesame Bun', 'Hamburger Bun'],
    malayalam: 'ബർഗർ ബൺ',
    sellMode: 'Fixed',
    defaultQuantity: '2pcs',
    variants: ['2pcs', '4pcs', '6pcs'],
    description: 'Soft and lightly sweetened round buns sprinkled with sesame seeds.'
  },
  {
    canonicalName: 'Hot Dog Bun',
    category: 'Bakery',
    brands: ['Elite', 'Local Bakery'],
    aliases: ['Long Bun', 'Roll Bun', 'Frankfurter Bun'],
    malayalam: 'ഹോട്ട് ഡോഗ് ബൺ',
    sellMode: 'Fixed',
    defaultQuantity: '2pcs',
    variants: ['2pcs', '4pcs'],
    description: 'Elongated soft baker buns baked for hot dog sandwiches and rolls.'
  },
  {
    canonicalName: 'Pav Bun',
    category: 'Bakery',
    brands: ['Elite', 'Britannia', 'Local Bakery'],
    aliases: ['Ladi Pav', 'Dinner Roll', 'Maskapav Bun'],
    malayalam: 'പാവ് ബൺ',
    sellMode: 'Fixed',
    defaultQuantity: '6pcs',
    variants: ['4pcs', '6pcs', '12pcs'],
    description: 'Feather-light cluster rolls perfect for bhaji, maska, and curries.'
  },
  {
    canonicalName: 'Sweet Bun',
    category: 'Bakery',
    brands: ['Local Bakery', 'Elite', 'Milma'],
    aliases: ['Kerala Sweet Bun', 'Cherry Bun', 'Fruit Bun', 'Nadan Bun'],
    malayalam: 'സ്വീറ്റ് ബൺ',
    sellMode: 'Fixed',
    defaultQuantity: '2pcs',
    variants: ['1pc', '2pcs', '4pcs'],
    description: 'Traditional sweet baked buns studded with candied fruit peel and tutty fruity.'
  },
  {
    canonicalName: 'Cream Bun',
    category: 'Bakery',
    brands: ['Local Bakery', 'Kerala Bakery'],
    aliases: ['Vanilla Cream Bun', 'Bakery Cream Bun', 'Butter Bun'],
    malayalam: 'ക്രീം ബൺ',
    sellMode: 'Fixed',
    defaultQuantity: '2pcs',
    variants: ['1pc', '2pcs', '4pcs'],
    description: 'Soft split bun generously filled with fluffy sweet bakery cream.'
  },
  {
    canonicalName: 'Fruit Cake',
    category: 'Bakery',
    brands: ['Elite', 'Britannia', 'Milma', 'Local Bakery'],
    aliases: ['Real Fruit Cake', 'Fruit Roll Cake', 'Bar Cake'],
    malayalam: 'ഫ്രൂട്ട് കേക്ക്',
    sellMode: 'Fixed',
    defaultQuantity: '150g',
    variants: ['65g', '120g', '150g', '250g', '350g', '500g'],
    description: 'Golden sponge cake packed with colourful candied fruits and citrus zest.'
  },
  {
    canonicalName: 'Plum Cake',
    category: 'Bakery',
    brands: ['Elite', 'Milma', 'Local Bakery', 'Kerala Traditional Bakery'],
    aliases: ['Rich Plum Cake', 'Christmas Plum Cake', 'Kerala Plum Cake'],
    malayalam: 'പ്ലം കേക്ക്',
    sellMode: 'Fixed',
    defaultQuantity: '400g',
    variants: ['200g', '350g', '400g', '500g', '800g', '1kg'],
    description: 'Traditional moist dark plum cake infused with caramel, spices, and soaked dry fruits.'
  },
  {
    canonicalName: 'Tea Cake',
    category: 'Bakery',
    brands: ['Local Bakery', 'Elite', 'Britannia'],
    aliases: ['Plain Cake', 'Sponge Cake', 'Butter Sponge Cake'],
    malayalam: 'ടീ കേക്ക് / പ്ലെയിൻ കേക്ക്',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['150g', '250g', '350g', '500g'],
    description: 'Light and aromatic vanilla tea sponge cake baked for afternoon tea.'
  },
  {
    canonicalName: 'Black Forest Cake',
    category: 'Bakery',
    brands: ['Local Bakery', 'Fresh Cream Bakery'],
    aliases: ['Chocolate Forest Cake', 'Fresh Cream Black Forest', 'Pastry Cake'],
    malayalam: 'ബ്ലാക്ക് ഫോറസ്റ്റ് കേക്ക്',
    sellMode: 'Fixed',
    defaultQuantity: '500g',
    variants: ['250g', '500g', '1kg'],
    description: 'Moist chocolate sponge layered with whipped cream, cherries, and chocolate curls.'
  },
  {
    canonicalName: 'Kerala Egg Puff',
    category: 'Bakery',
    brands: ['Local Bakery', 'Kerala Bakery'],
    aliases: ['Mutta Puff', 'Bakery Mutta Puff', 'Egg Puffs'],
    malayalam: 'മുട്ട പഫ്സ്',
    sellMode: 'Fixed',
    defaultQuantity: '1pc',
    variants: ['1pc', '2pcs', '4pcs', '6pcs'],
    description: 'Flaky golden puff pastry encasing spiced masala egg halves.'
  },
  {
    canonicalName: 'Kerala Chicken Puff',
    category: 'Bakery',
    brands: ['Local Bakery', 'Kerala Bakery'],
    aliases: ['Kozhi Puff', 'Chicken Puffs', 'Bakery Chicken Puff'],
    malayalam: 'ചിക്കൻ പഫ്സ്',
    sellMode: 'Fixed',
    defaultQuantity: '1pc',
    variants: ['1pc', '2pcs', '4pcs', '6pcs'],
    description: 'Golden, crispy layered pastry stuffed with slow-cooked shredded pepper chicken masala.'
  },
  {
    canonicalName: 'Kerala Veg Puff',
    category: 'Bakery',
    brands: ['Local Bakery', 'Kerala Bakery'],
    aliases: ['Vegetable Puff', 'Veg Puffs'],
    malayalam: 'വെജ് പഫ്സ്',
    sellMode: 'Fixed',
    defaultQuantity: '1pc',
    variants: ['1pc', '2pcs', '4pcs', '6pcs'],
    description: 'Buttery flaky pastry filled with curried potatoes, carrots, and peas.'
  },
  {
    canonicalName: 'Kerala Meat Puff (Beef)',
    category: 'Bakery',
    brands: ['Local Bakery', 'Kerala Bakery'],
    aliases: ['Beef Puff', 'Iraichi Puff', 'Meat Puffs'],
    malayalam: 'മീറ്റ് പഫ്സ് (ബീഫ്)',
    sellMode: 'Fixed',
    defaultQuantity: '1pc',
    variants: ['1pc', '2pcs', '4pcs'],
    description: 'Flaky baked pastry loaded with aromatic Kerala beef roast masala.'
  },
  {
    canonicalName: 'Kerala Chicken Cutlet',
    category: 'Bakery',
    brands: ['Local Bakery', 'Kerala Bakery'],
    aliases: ['Chicken Cutlets', 'Nadan Chicken Cutlet'],
    malayalam: 'ചിക്കൻ കട്ട്ലറ്റ്',
    sellMode: 'Fixed',
    defaultQuantity: '2pcs',
    variants: ['1pc', '2pcs', '4pcs'],
    description: 'Breadcrumb-crusted deep-fried cutlets packed with spiced chicken and potatoes.'
  },
  {
    canonicalName: 'Kerala Meat Cutlet (Beef)',
    category: 'Bakery',
    brands: ['Local Bakery', 'Kerala Bakery'],
    aliases: ['Beef Cutlet', 'Nadan Beef Cutlet'],
    malayalam: 'മീറ്റ് കട്ട്ലറ്റ് (ബീഫ്)',
    sellMode: 'Fixed',
    defaultQuantity: '2pcs',
    variants: ['1pc', '2pcs', '4pcs'],
    description: 'Crisp golden cutlets filled with minced beef and roasted spices.'
  },
  {
    canonicalName: 'Kerala Veg Cutlet',
    category: 'Bakery',
    brands: ['Local Bakery', 'Kerala Bakery'],
    aliases: ['Vegetable Cutlets', 'Veg Cutlet'],
    malayalam: 'വെജ് കട്ട്ലറ്റ്',
    sellMode: 'Fixed',
    defaultQuantity: '2pcs',
    variants: ['1pc', '2pcs', '4pcs'],
    description: 'Deep-fried crumbed vegetable patties seasoned with ginger, green chilli, and garam masala.'
  },
  {
    canonicalName: 'Kerala Onion Samosa',
    category: 'Bakery',
    brands: ['Local Bakery', 'Kerala Bakery'],
    aliases: ['Ulli Samosa', 'Mini Samosa', 'Nadan Samosa'],
    malayalam: 'ഉള്ളി സമൂസ',
    sellMode: 'Fixed',
    defaultQuantity: '4pcs',
    variants: ['2pcs', '4pcs', '6pcs', '10pcs'],
    description: 'Crisp triangular fried pastry stuffed with spiced caramelised onions and herbs.'
  },
  {
    canonicalName: 'Banana Fry (Pazham Pori)',
    category: 'Bakery',
    brands: ['Local Bakery', 'Tea Shop / Nadan Chaya Kada'],
    aliases: ['Pazham Pori', 'Ethakka Appam', 'Banana Fritters', 'Nenthra Pazham Pori'],
    malayalam: 'പഴം പൊരി (ഏത്തക്ക അപ്പം)',
    sellMode: 'Fixed',
    defaultQuantity: '2pcs',
    variants: ['1pc', '2pcs', '4pcs'],
    description: 'Ripe Nendran bananas dipped in golden batter and fried to sweet perfection.'
  },
  {
    canonicalName: 'Unniyappam',
    category: 'Bakery',
    brands: ['Local Bakery', 'Kerala Sweet Shop'],
    aliases: ['Neyy Unniyappam', 'Nadan Unniyappam', 'Rice Jaggery Fritters'],
    malayalam: 'ഉണ്ണിയപ്പം',
    sellMode: 'Fixed',
    defaultQuantity: '6pcs',
    variants: ['4pcs', '6pcs', '10pcs', '12pcs'],
    description: 'Traditional spongy sweet snack made of rice flour, jaggery, roasted coconut bits, and banana.'
  },
  {
    canonicalName: 'Neyyappam',
    category: 'Bakery',
    brands: ['Local Bakery', 'Kerala Sweet Shop'],
    aliases: ['Ghee Neyyappam', 'Kerala Neyyappam'],
    malayalam: 'നെയ്യപ്പം',
    sellMode: 'Fixed',
    defaultQuantity: '4pcs',
    variants: ['2pcs', '4pcs', '6pcs'],
    description: 'Fried sweet rice cake with roasted sesame seeds and crispy edges cooked in pure ghee.'
  },
  {
    canonicalName: 'Achappam (Rose Cookies)',
    category: 'Bakery',
    brands: ['Local Bakery', 'Kerala Traditional Snack'],
    aliases: ['Rose Cookies', 'Kerala Achappam', 'Achu Murukku'],
    malayalam: 'അച്ചപ്പം',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['100g', '200g', '250g', '500g'],
    description: 'Delicate and crispy patterned sweet rosettes made from rice flour and coconut milk.'
  },
  {
    canonicalName: 'Vattayappam',
    category: 'Bakery',
    brands: ['Local Bakery', 'Kerala Traditional Bakery'],
    aliases: ['Steamed Rice Cake', 'Sweet Vattayappam'],
    malayalam: 'വട്ടയപ്പം',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['250g', '500g'],
    description: 'Soft and spongy fermented steamed rice cake sweetened with cardamom and raisins.'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. DAIRY (MILMA ANCHOR + AMUL, MILKY MIST, LOCAL DAIRY)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    canonicalName: 'Toned Milk',
    category: 'Dairy',
    brands: ['Milma', 'Amul', 'Milky Mist', 'Heritage', 'Local Dairy'],
    aliases: ['Milma Toned Milk', 'Blue Packet Milk', 'Amul Taaza', 'Pasteurised Toned Milk'],
    malayalam: 'ടോൺഡ് പാൽ',
    sellMode: 'Fixed',
    defaultQuantity: '500ml',
    variants: ['200ml', '500ml', '1L'],
    description: 'Fresh pasteurised and homogenised toned milk with 3.0% fat, ideal for daily tea and coffee.'
  },
  {
    canonicalName: 'Full Cream Milk',
    category: 'Dairy',
    brands: ['Milma', 'Amul', 'Nandini', 'Local Dairy'],
    aliases: ['Milma Rich', 'Amul Gold', 'Orange Packet Milk', 'Cream Milk'],
    malayalam: 'ഫുൾ ക്രീം പാൽ',
    sellMode: 'Fixed',
    defaultQuantity: '500ml',
    variants: ['500ml', '1L'],
    description: 'Wholesome fresh milk with 6.0% milk fat for creamy payasam, sweets, and thick curd.'
  },
  {
    canonicalName: 'Cow Milk (Pasteurised)',
    category: 'Dairy',
    brands: ['Milma', 'Amul', 'Local Dairy Farm'],
    aliases: ['Nadan Cow Milk', 'Milma Cow Milk', 'Farm Fresh Cow Milk'],
    malayalam: 'പശുവിൻ പാൽ',
    sellMode: 'Fixed',
    defaultQuantity: '500ml',
    variants: ['500ml', '1L'],
    description: 'Pure and wholesome pasteurised cow milk rich in natural proteins and calcium.'
  },
  {
    canonicalName: 'Double Toned Milk',
    category: 'Dairy',
    brands: ['Milma', 'Amul'],
    aliases: ['Milma Smart', 'Low Fat Milk', 'Slim Milk'],
    malayalam: 'ഡബിൾ ടോൺഡ് പാൽ (സ്മാർട്ട് പാൽ)',
    sellMode: 'Fixed',
    defaultQuantity: '500ml',
    variants: ['500ml', '1L'],
    description: 'Light and diet-friendly milk with 1.5% fat, tailored for calorie-conscious consumers.'
  },
  {
    canonicalName: 'Curd / Pouch Curd',
    category: 'Dairy',
    brands: ['Milma', 'Amul', 'Milky Mist', 'Hatsun', 'Local Dairy'],
    aliases: ['Milma Curd', 'Thaimoru', 'Fresh Dahi', 'Pouch Curd'],
    malayalam: 'തൈര്',
    sellMode: 'Fixed',
    defaultQuantity: '500g',
    variants: ['200g', '400g', '500g', '1kg'],
    description: 'Freshly cultured, thick and creamy curd prepared from pure pasteurised milk.'
  },
  {
    canonicalName: 'Set Curd',
    category: 'Dairy',
    brands: ['Milma', 'Amul', 'Milky Mist'],
    aliases: ['Set Dahi', 'Cup Curd', 'Tub Curd'],
    malayalam: 'സെറ്റ് തൈര്',
    sellMode: 'Fixed',
    defaultQuantity: '400g',
    variants: ['200g', '400g', '1kg'],
    description: 'Thick, creamy set curd cultured in tubs for a velvety texture.'
  },
  {
    canonicalName: 'Buttermilk / Sambharam',
    category: 'Dairy',
    brands: ['Milma', 'Local Dairy', 'Amul'],
    aliases: ['Milma Sambharam', 'Spiced Buttermilk', 'Moru', 'Kattimoru'],
    malayalam: 'സംഭാരം (മോര്)',
    sellMode: 'Fixed',
    defaultQuantity: '200ml',
    variants: ['200ml', '500ml', '1L'],
    description: 'Traditional spiced buttermilk blended with ginger, green chilli, and curry leaves.'
  },
  {
    canonicalName: 'Table Butter (Salted)',
    category: 'Dairy',
    brands: ['Milma', 'Amul', 'Milky Mist'],
    aliases: ['Milma Butter', 'Amul Butter', 'Salted Table Butter', 'Yellow Butter'],
    malayalam: 'ടേബിൾ ബട്ടർ (വെണ്ണ)',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['100g', '200g', '500g'],
    description: 'Classic salted table butter crafted from fresh cream for toasts and breakfast dishes.'
  },
  {
    canonicalName: 'Cooking Butter (Unsalted)',
    category: 'Dairy',
    brands: ['Milma', 'Amul', 'Local Dairy'],
    aliases: ['White Butter', 'Venna', 'Unsalted Butter', 'Fresh Churned Butter'],
    malayalam: 'വെള്ള വെണ്ണ (കുക്കിംഗ് ബട്ടർ)',
    sellMode: 'Fixed',
    defaultQuantity: '200g',
    variants: ['100g', '200g', '500g', '1kg'],
    description: 'Pure unsalted churned butter used for baking, cooking, and making fresh ghee.'
  },
  {
    canonicalName: 'Pure Cow Ghee',
    category: 'Dairy',
    brands: ['Milma', 'Amul', 'KLF', 'Aashirvaad', 'Local Dairy'],
    aliases: ['Milma Ghee', 'Nadan Pasu Neyy', 'Clarified Butter', 'Desi Ghee'],
    malayalam: 'പശുവിൻ നെയ്യ്',
    sellMode: 'Fixed',
    defaultQuantity: '200ml',
    variants: ['100ml', '200ml', '500ml', '1L'],
    description: 'Granular and golden clarified butter churned from pure cow milk cream.'
  },
  {
    canonicalName: 'Paneer / Fresh Malai Paneer',
    category: 'Dairy',
    brands: ['Milma', 'Amul', 'Milky Mist', 'Local Dairy'],
    aliases: ['Milma Paneer', 'Amul Malai Paneer', 'Cottage Cheese', 'Fresh Paneer Block'],
    malayalam: 'പനീർ',
    sellMode: 'Fixed',
    defaultQuantity: '200g',
    variants: ['100g', '200g', '500g', '1kg'],
    description: 'Soft, creamy and protein-rich fresh cottage cheese cubes or blocks.'
  },
  {
    canonicalName: 'Fresh Cream',
    category: 'Dairy',
    brands: ['Amul', 'Milma', 'Milky Mist'],
    aliases: ['Amul Fresh Cream', 'Low Fat Cream', 'Cooking Cream'],
    malayalam: 'ഫ്രഷ് ക്രീം',
    sellMode: 'Fixed',
    defaultQuantity: '250ml',
    variants: ['250ml', '1L'],
    description: 'Smooth sterilised fresh dairy cream for curries, desserts, fruit salads, and coffee.'
  },
  {
    canonicalName: 'Flavoured Milk',
    category: 'Dairy',
    brands: ['Milma', 'Amul', 'Milky Mist'],
    aliases: ['Milma Badam Milk', 'Chocolate Milk', 'Pista Milk', 'Mango Milk Drink'],
    malayalam: 'ഫ്ലേവർഡ് പാൽ',
    sellMode: 'Fixed',
    defaultQuantity: '200ml',
    variants: ['200ml', '250ml'],
    description: 'Sterilised sweetened flavoured milk drink infused with natural flavours and nuts.'
  },
  {
    canonicalName: 'Lassi',
    category: 'Dairy',
    brands: ['Milma', 'Amul'],
    aliases: ['Sweet Lassi', 'Mango Lassi', 'Milma Lassi'],
    malayalam: 'ലസ്സി',
    sellMode: 'Fixed',
    defaultQuantity: '200ml',
    variants: ['200ml', '250ml'],
    description: 'Thick, sweet yogurt beverage blended with cardamom and natural fruit extracts.'
  },
  {
    canonicalName: 'Milk Peda',
    category: 'Dairy',
    brands: ['Milma', 'Amul', 'Local Dairy Sweet Shop'],
    aliases: ['Milma Peda', 'Traditional Peda', 'Pal Peda'],
    malayalam: 'പാൽ പേഡ',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['100g', '250g', '500g'],
    description: 'Classic rich milk sweet prepared by slowly condensing pure milk with sugar and cardamom.'
  },
  {
    canonicalName: 'Condensed Milk',
    category: 'Dairy',
    brands: ['Amul', 'Milma', 'Nestlé'],
    aliases: ['Amul Mithai Mate', 'Milkmaid', 'Sweetened Condensed Milk'],
    malayalam: 'കണ്ടൻസ്ഡ് പാൽ',
    sellMode: 'Fixed',
    defaultQuantity: '400g',
    variants: ['200g', '400g'],
    description: 'Sweetened condensed whole milk for fast and luscious payasam, cakes, and pudding.'
  },
  {
    canonicalName: 'Cheese Slices',
    category: 'Dairy',
    brands: ['Amul', 'Milky Mist', 'Britannia'],
    aliases: ['Processed Cheese Slices', 'Amul Cheese', 'Sandwich Slices'],
    malayalam: 'ചീസ് സ്ലൈസുകൾ',
    sellMode: 'Fixed',
    defaultQuantity: '200g',
    variants: ['100g', '200g', '400g'],
    description: 'Individually wrapped creamy processed cheddar cheese slices.'
  },
  {
    canonicalName: 'Mozzarella Pizza Cheese',
    category: 'Dairy',
    brands: ['Amul', 'Milky Mist'],
    aliases: ['Pizza Cheese', 'Diced Mozzarella', 'Grated Mozzarella'],
    malayalam: 'മൊസറല്ല ചീസ്',
    sellMode: 'Fixed',
    defaultQuantity: '200g',
    variants: ['200g', '500g', '1kg'],
    description: 'High-stretch mozzarella cheese ideal for pizzas, toasties, and baked pastas.'
  },
  {
    canonicalName: 'Skimmed Milk Powder',
    category: 'Dairy',
    brands: ['Milma', 'Amul', 'Sagar'],
    aliases: ['Milma Milk Powder', 'Dairy Whitener', 'Spray Dried Milk Powder'],
    malayalam: 'പാൽപ്പൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '500g',
    variants: ['200g', '500g', '1kg'],
    description: 'Instant spray-dried pasteurised skimmed milk powder for tea, coffee, and sweets.'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. BEVERAGES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    canonicalName: 'Premium Dust Tea',
    category: 'Beverages',
    brands: ['AVT', 'Tata Tea', 'Brooke Bond', 'Kannan Devan', 'Wagh Bakri'],
    aliases: ['AVT Premium', 'Tata Tea Premium', '3 Roses Dust', 'Red Label', 'Kannan Devan Classic'],
    malayalam: 'ഡസ്റ്റ് ചായപ്പൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['100g', '250g', '500g', '1kg'],
    description: 'Fine Kerala dust tea leaves delivering deep amber liquor and full-bodied strength.'
  },
  {
    canonicalName: 'Strong Tea',
    category: 'Beverages',
    brands: ['AVT', 'Tata Tea', 'Kannan Devan', 'Brooke Bond'],
    aliases: ['AVT Gold Cup', 'Tata Tea Agni', 'Kannan Devan Strong', 'Strong Chaya Podi'],
    malayalam: 'സ്ട്രോങ്ങ് ചായപ്പൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['100g', '250g', '500g', '1kg'],
    description: 'High-grown strong CTC and dust tea blend crafted for brisk, energetic morning tea.'
  },
  {
    canonicalName: 'Leaf Tea / Gold Tea',
    category: 'Beverages',
    brands: ['Tata Tea', 'AVT', 'Brooke Bond', 'Society'],
    aliases: ['Tata Tea Gold', 'Taj Mahal Tea', 'AVT Leaf Tea', 'Long Leaf Tea'],
    malayalam: 'ലീഫ് ചായപ്പൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['100g', '250g', '500g'],
    description: 'Fragrant blend of whole and broken tea leaves for an exquisite aroma and refined taste.'
  },
  {
    canonicalName: 'Green Tea',
    category: 'Beverages',
    brands: ['Lipton', 'Tetley', 'AVT', 'Organic India'],
    aliases: ['Lipton Pure & Light', 'Green Tea Bags', 'Lemon Honey Green Tea'],
    malayalam: 'ഗ്രീൻ ടീ',
    sellMode: 'Fixed',
    defaultQuantity: '25 bags',
    variants: ['10 bags', '25 bags', '50 bags', '100g'],
    description: 'Refreshing unoxidized green tea rich in natural catechins and antioxidants.'
  },
  {
    canonicalName: 'Instant Coffee',
    category: 'Beverages',
    brands: ['Bru', 'Nescafé', 'Continental', 'Tata Coffee'],
    aliases: ['Bru Instant', 'Nescafé Classic', 'Sunrise Instant', 'Gold Coffee'],
    malayalam: 'ഇൻസ്റ്റന്റ് കോഫി',
    sellMode: 'Fixed',
    defaultQuantity: '50g',
    variants: ['25g', '50g', '100g', '200g'],
    description: 'Finely granulated instant coffee powder made from carefully roasted beans.'
  },
  {
    canonicalName: 'Filter Coffee Powder',
    category: 'Beverages',
    brands: ['Bru', 'Cothas', 'Local Kerala Roaster', 'Continental'],
    aliases: ['Bru Green Label', 'Chicory Coffee', 'Nadan Filter Coffee', 'Kerala Roast Coffee'],
    malayalam: 'ഫിൽട്ടർ കോഫി പൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '200g',
    variants: ['100g', '200g', '500g', '1kg'],
    description: 'Freshly ground aromatic roasted coffee blended with chicory for South Indian filter brew.'
  },
  {
    canonicalName: 'Malt Nutrition Drink',
    category: 'Beverages',
    brands: ['Horlicks', 'Boost', 'Cadbury', 'Complan', 'Nestlé'],
    aliases: ['Boost Drink', 'Horlicks Classic', 'Bournvita', 'Complan Chocolate', 'Milo'],
    malayalam: 'മാൾട്ട് ഹെൽത്ത് ഡ്രിങ്ക്',
    sellMode: 'Fixed',
    defaultQuantity: '500g',
    variants: ['200g', '400g', '500g', '750g', '1kg'],
    description: 'Malted barley and wheat nutritional beverage powder for kids and families.'
  },
  {
    canonicalName: 'Packaged Drinking Water',
    category: 'Beverages',
    brands: ['Bisleri', 'Kinley', 'Aquafina', 'Local Brand'],
    aliases: ['Mineral Water', 'Bottled Water', 'Bisleri 1L'],
    malayalam: 'കുടിവെള്ളം',
    sellMode: 'Fixed',
    defaultQuantity: '1L',
    variants: ['500ml', '1L', '2L', '5L', '20L'],
    description: 'Purified and ozonated packaged drinking water with essential minerals.'
  },
  {
    canonicalName: 'Club Soda',
    category: 'Beverages',
    brands: ['Kinley', 'Bisleri', 'Local Brand'],
    aliases: ['Carbonated Soda', 'Kinley Soda', 'Fresh Soda'],
    malayalam: 'ക്ലബ് സോഡ',
    sellMode: 'Fixed',
    defaultQuantity: '750ml',
    variants: ['300ml', '750ml', '1L'],
    description: 'Brisk, highly carbonated sparkling club soda for mixing and cooling drinks.'
  },
  {
    canonicalName: 'Tender Coconut Water (Karikku)',
    category: 'Beverages',
    brands: ['Local Vendor', 'Kerala Farms'],
    aliases: ['Karikku', 'Elaneer', 'Fresh Coconut Water'],
    malayalam: 'കരിക്ക്',
    sellMode: 'Manual',
    defaultQuantity: '1pc',
    variants: ['1pc', '2pcs', '3pcs', '5pcs'],
    description: 'Naturally pure, electrolyte-rich sweet fresh tender coconut water.'
  },
  {
    canonicalName: 'Fresh Lime Juice',
    category: 'Beverages',
    brands: ['Local Juice Bar', 'Local Shop'],
    aliases: ['Cherunaranga Vellam', 'Nimbu Pani', 'Fresh Lime Soda'],
    malayalam: 'ഫ്രഷ് ലൈം ജ്യൂസ്',
    sellMode: 'Manual',
    defaultQuantity: '300ml',
    variants: ['300ml', '500ml', '1L'],
    description: 'Freshly pressed lime juice served sweet, salted, or mixed with chilled soda.'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. DESSERTS & ICE CREAM
  // ═══════════════════════════════════════════════════════════════════════════
  {
    canonicalName: 'Vanilla Ice Cream',
    category: 'Desserts & Ice Creams',
    brands: ['Milma', 'Amul', 'Arun', 'Hangyo', 'Dairy Day', 'Kwality Wall\'s'],
    aliases: ['Milma Real Vanilla', 'Vanilla Tub', 'Vanilla Brick'],
    malayalam: 'വാനില ഐസ്ക്രീം',
    sellMode: 'Fixed',
    defaultQuantity: '500ml',
    variants: ['100ml', '500ml', '1L', '2L'],
    description: 'Smooth and classic vanilla bean ice cream churned from fresh dairy cream.'
  },
  {
    canonicalName: 'Chocolate Ice Cream',
    category: 'Desserts & Ice Creams',
    brands: ['Milma', 'Amul', 'Arun', 'Hangyo', 'Kwality Wall\'s'],
    aliases: ['Milma Rich Chocolate', 'Choco Tub', 'Chocolate Ice Cream Brick'],
    malayalam: 'ചോക്ലേറ്റ് ഐസ്ക്രീം',
    sellMode: 'Fixed',
    defaultQuantity: '500ml',
    variants: ['100ml', '500ml', '1L'],
    description: 'Decadent chocolate dairy ice cream loaded with rich cocoa flavours.'
  },
  {
    canonicalName: 'Mango Ice Cream',
    category: 'Desserts & Ice Creams',
    brands: ['Amul', 'Milma', 'Arun', 'Hangyo'],
    aliases: ['Alphonso Mango Tub', 'Mango Ice Cream', 'Amul Alphonso'],
    malayalam: 'മാംഗോ ഐസ്ക്രീം',
    sellMode: 'Fixed',
    defaultQuantity: '500ml',
    variants: ['100ml', '500ml', '1L'],
    description: 'Luscious seasonal ice cream infused with real ripe Alphonso mango pulp.'
  },
  {
    canonicalName: 'Tender Coconut Ice Cream',
    category: 'Desserts & Ice Creams',
    brands: ['Milma', 'Arun', 'Dairy Day'],
    aliases: ['Elaneer Ice Cream', 'Karikku Ice Cream', 'Tender Coconut Tub'],
    malayalam: 'കരിക്ക് ഐസ്ക്രീം',
    sellMode: 'Fixed',
    defaultQuantity: '500ml',
    variants: ['100ml', '500ml', '1L'],
    description: 'Unique Kerala speciality ice cream containing tender coconut malai shreds.'
  },
  {
    canonicalName: 'Kulfi',
    category: 'Desserts & Ice Creams',
    brands: ['Milma', 'Amul', 'Arun'],
    aliases: ['Malai Kulfi', 'Matka Kulfi', 'Kulfi Bar', 'Pista Kulfi'],
    malayalam: 'കുൽഫി',
    sellMode: 'Fixed',
    defaultQuantity: '60ml',
    variants: ['60ml', '100ml', '120ml'],
    description: 'Traditional slow-cooked condensed milk frozen dessert infused with saffron and pistachios.'
  },
  {
    canonicalName: 'Ice Cream Bars / Chocobar',
    category: 'Desserts & Ice Creams',
    brands: ['Amul', 'Milma', 'Arun', 'Kwality Wall\'s'],
    aliases: ['Amul Chocobar', 'Choco Feast', 'Ice Cream Stick'],
    malayalam: 'ചോക്കോബാർ / ഐസ്ക്രീം ബാർ',
    sellMode: 'Fixed',
    defaultQuantity: '60ml',
    variants: ['60ml', '80ml', '100ml'],
    description: 'Creamy vanilla ice cream stick coated in a crisp shell of crackling milk chocolate.'
  },
  {
    canonicalName: 'Kozhikode Halwa (Black / Karutha Halwa)',
    category: 'Desserts & Ice Creams',
    brands: ['Local Sweet Shop', 'Calicut Halwa Merchants', 'Kerala Bakery'],
    aliases: ['Calicut Black Halwa', 'Karutha Halwa', 'Nadan Halwa', 'Rice Flour Jaggery Halwa'],
    malayalam: 'കോഴിക്കോടൻ കറുത്ത ഹൽവ',
    sellMode: 'Manual',
    defaultQuantity: '500g',
    variants: ['250g', '500g', '1kg', '2kg'],
    description: 'Celebrated dark Calicut halwa slow-simmered with coconut oil, jaggery, and cashews.'
  },
  {
    canonicalName: 'Kozhikodan Yellow Halwa',
    category: 'Desserts & Ice Creams',
    brands: ['Local Sweet Shop', 'Calicut Halwa Merchants'],
    aliases: ['Manja Halwa', 'Yellow Fruit Halwa', 'Pineapple Halwa'],
    malayalam: 'കോഴിക്കോടൻ മഞ്ഞ ഹൽവ',
    sellMode: 'Manual',
    defaultQuantity: '500g',
    variants: ['250g', '500g', '1kg'],
    description: 'Tender translucent wheat and coconut oil halwa garnished with chopped nuts.'
  },
  {
    canonicalName: 'Palada Payasam Mix',
    category: 'Desserts & Ice Creams',
    brands: ['Milma', 'Double Horse', 'Brahmins', 'Eastern', 'Kitchen Treasures'],
    aliases: ['Instant Palada', 'Palada Mix', 'Palada Pradhaman Mix'],
    malayalam: 'പാലട പായസം മിക്സ്',
    sellMode: 'Fixed',
    defaultQuantity: '200g',
    variants: ['200g', '300g', '500g'],
    description: 'Pre-mixed rice flakes, sugar, and milk solids for quick preparation of Kerala palada.'
  },
  {
    canonicalName: 'Semiya Payasam Mix',
    category: 'Desserts & Ice Creams',
    brands: ['Double Horse', 'Brahmins', 'Eastern', 'Kitchen Treasures'],
    aliases: ['Vermicelli Payasam Mix', 'Semiya Kheer Mix'],
    malayalam: 'സേമിയ പായസം മിക്സ്',
    sellMode: 'Fixed',
    defaultQuantity: '200g',
    variants: ['200g', '300g', '500g'],
    description: 'Roasted vermicelli blend with dry fruits and cardamom for festive payasam.'
  },
  {
    canonicalName: 'Gulab Jamun',
    category: 'Desserts & Ice Creams',
    brands: ['Amul', 'Milma', 'Haldiram\'s', 'Local Sweet Shop'],
    aliases: ['Gulab Jamun Tin', 'Canned Gulab Jamun'],
    malayalam: 'ഗുലാബ് ജാമുൻ',
    sellMode: 'Fixed',
    defaultQuantity: '500g',
    variants: ['250g', '500g', '1kg'],
    description: 'Deep-fried khoya dumplings soaked in fragrant cardamom and rose sugar syrup.'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. DRY FRUITS & CEREALS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    canonicalName: 'Almonds (Badam)',
    category: 'Dry Fruits & Cereals',
    brands: ['Happilo', 'Nutraj', 'Farmley', 'Local Dry Fruit Merchant'],
    aliases: ['California Almonds', 'Badam Whole', 'Raw Badam'],
    malayalam: 'ബദാം',
    sellMode: 'Manual',
    defaultQuantity: '250g',
    variants: ['100g', '200g', '250g', '500g', '1kg'],
    description: 'Crisp Californian whole almonds packed with healthy fats, vitamin E, and dietary fibre.'
  },
  {
    canonicalName: 'Whole Cashew Nuts (Kaju)',
    category: 'Dry Fruits & Cereals',
    brands: ['Happilo', 'Nutraj', 'Local Kerala Mill', 'Farmley'],
    aliases: ['W240 Cashews', 'W320 Cashews', 'Whole Kaju', 'Kollam Cashews'],
    malayalam: 'കശുവണ്ടി (അണ്ടിപ്പരിപ്പ്)',
    sellMode: 'Manual',
    defaultQuantity: '250g',
    variants: ['100g', '200g', '250g', '500g', '1kg'],
    description: 'Creamy, premium whole Kerala and imported cashew nut kernels.'
  },
  {
    canonicalName: 'Split Cashew Nuts (Kaju Tukda)',
    category: 'Dry Fruits & Cereals',
    brands: ['Local Dry Fruit Merchant', 'Nutraj', 'Happilo'],
    aliases: ['Broken Cashews', 'Payasam Cashews', 'Kaju Tukda'],
    malayalam: 'മുറിച്ച കശുവണ്ടി',
    sellMode: 'Manual',
    defaultQuantity: '250g',
    variants: ['100g', '250g', '500g', '1kg'],
    description: 'Clean split cashew kernels suitable for payasam, garnishing, and curries.'
  },
  {
    canonicalName: 'Walnuts (Akhrot)',
    category: 'Dry Fruits & Cereals',
    brands: ['Happilo', 'Nutraj', 'Farmley'],
    aliases: ['Walnut Kernels', 'Kashmiri Akhrot', 'Brain Nut'],
    malayalam: 'വാൽനട്ട് (അക്രോട്ട്)',
    sellMode: 'Manual',
    defaultQuantity: '200g',
    variants: ['100g', '200g', '250g', '500g'],
    description: 'Wholesome halved walnut kernels rich in plant-based Omega-3 fatty acids.'
  },
  {
    canonicalName: 'Pistachios (Pista)',
    category: 'Dry Fruits & Cereals',
    brands: ['Happilo', 'Nutraj', 'Farmley'],
    aliases: ['Roasted Salted Pista', 'Pistachio Kernels', 'In-Shell Pista'],
    malayalam: 'പിസ്ത',
    sellMode: 'Manual',
    defaultQuantity: '200g',
    variants: ['100g', '200g', '250g', '500g'],
    description: 'Roasted and lightly salted pistachios in easy-open shells.'
  },
  {
    canonicalName: 'Raisins (Kishmish)',
    category: 'Dry Fruits & Cereals',
    brands: ['Happilo', 'Nutraj', 'Local Dry Fruit Merchant'],
    aliases: ['Green Raisins', 'Kishmish Whole', 'Unakka Munthiri', 'Dry Grapes'],
    malayalam: 'ഉണക്കമുന്തിരി (കിസ്മിസ്)',
    sellMode: 'Manual',
    defaultQuantity: '250g',
    variants: ['100g', '200g', '250g', '500g', '1kg'],
    description: 'Naturally sweet green sun-dried seedless grapes for payasam and desserts.'
  },
  {
    canonicalName: 'Arabian Dates (Seedless)',
    category: 'Dry Fruits & Cereals',
    brands: ['Happilo', 'Nutraj', 'Local Merchant', 'Falcon'],
    aliases: ['Seedless Dates', 'Ithatha Pazham', 'Eenthapazham', 'Black Dates'],
    malayalam: 'ഈന്തപ്പഴം',
    sellMode: 'Manual',
    defaultQuantity: '500g',
    variants: ['250g', '500g', '1kg'],
    description: 'Naturally sweet and juicy pitted Arabian desert dates.'
  },
  {
    canonicalName: 'Corn Flakes',
    category: 'Dry Fruits & Cereals',
    brands: ['Kellogg\'s', 'Bagrry\'s', 'Saffola'],
    aliases: ['Kellogg\'s Corn Flakes', 'Breakfast Corn Flakes', 'Toasted Flakes'],
    malayalam: 'കോൺ ഫ്ലേക്സ്',
    sellMode: 'Fixed',
    defaultQuantity: '475g',
    variants: ['250g', '475g', '875g', '1kg'],
    description: 'Crisp golden toasted corn cereal enriched with iron and 8 essential vitamins.'
  },
  {
    canonicalName: 'Chocos',
    category: 'Dry Fruits & Cereals',
    brands: ['Kellogg\'s', 'Local Brand'],
    aliases: ['Kellogg\'s Chocos', 'Chocolate Flakes', 'Choco Scoops'],
    malayalam: 'ചോക്കോസ്',
    sellMode: 'Fixed',
    defaultQuantity: '375g',
    variants: ['125g', '250g', '375g', '1kg'],
    description: 'Crunchy chocolate-flavoured scoops made from whole wheat grain.'
  },
  {
    canonicalName: 'Rolled Oats',
    category: 'Dry Fruits & Cereals',
    brands: ['Quaker', 'Saffola', 'Kellogg\'s', 'Bagrry\'s'],
    aliases: ['Instant Oats', 'Whole Rolled Oats', 'Quaker Oats'],
    malayalam: 'ഓട്സ്',
    sellMode: 'Fixed',
    defaultQuantity: '1kg',
    variants: ['400g', '500g', '1kg', '1.5kg', '2kg'],
    description: '100% natural wholegrain rolled oats rich in beta-glucan soluble fibre.'
  },
  {
    canonicalName: 'Copra / Dry Coconut',
    category: 'Dry Fruits & Cereals',
    brands: ['Local Mill', 'Kerala Farms'],
    aliases: ['Kopra', 'Unakka Thenga', 'Desiccated Coconut', 'Coconut Halves'],
    malayalam: 'കൊപ്ര (ഉണക്കത്തേങ്ങ)',
    sellMode: 'Manual',
    defaultQuantity: '500g',
    variants: ['250g', '500g', '1kg', '2kg'],
    description: 'Sun-dried high-oil coconut halves for traditional culinary and home milling.'
  },
  {
    canonicalName: 'Roasted Peanuts',
    category: 'Dry Fruits & Cereals',
    brands: ['Local Roasters', 'Haldiram\'s'],
    aliases: ['Varutha Kappalandi', 'Roasted Groundnuts', 'Salted Peanuts'],
    malayalam: 'വറുത്ത കപ്പലണ്ടി',
    sellMode: 'Manual',
    defaultQuantity: '250g',
    variants: ['100g', '250g', '500g', '1kg'],
    description: 'Freshly roasted crunchy peanuts with skins, perfect for evening tea.'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. OILS & GHEE (KERALA COCONUT OIL CULTURE FIRST)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    canonicalName: 'Coconut Oil',
    category: 'Oils & Ghee',
    brands: ['KLF', 'Karun\'s', 'Yesra', 'Organo Mills', 'Pavizham', 'Milma', 'Local Mill'],
    aliases: ['Velichenna', 'KLF Coconad', 'Pure Coconut Oil', 'Kerala Cooking Coconut Oil'],
    malayalam: 'വെളിച്ചെണ്ണ',
    sellMode: 'Fixed',
    defaultQuantity: '1L',
    variants: ['250ml', '500ml', '1L', '2L', '5L'],
    description: 'Pure extracted coconut oil processed from roasted copra, the quintessential Kerala cooking medium.'
  },
  {
    canonicalName: 'Virgin Coconut Oil',
    category: 'Oils & Ghee',
    brands: ['KLF', 'Organo Mills', 'Yesra', 'Local Mill'],
    aliases: ['VCO', 'Cold Extracted Coconut Oil', 'Urukku Velichenna'],
    malayalam: 'വിർജിൻ വെളിച്ചെണ്ണ (ഉരുക്ക് വെളിച്ചെണ്ണ)',
    sellMode: 'Fixed',
    defaultQuantity: '500ml',
    variants: ['100ml', '250ml', '500ml', '1L'],
    description: 'Clear, raw unrefined coconut oil cold-pressed from fresh coconut milk without heat.'
  },
  {
    canonicalName: 'Cold-Pressed Coconut Oil',
    category: 'Oils & Ghee',
    brands: ['Karun\'s', 'Yesra', 'Organo Mills', 'Local Mill'],
    aliases: ['Chekku Velichenna', 'Wood Pressed Coconut Oil', 'Mara Chekku Oil'],
    malayalam: 'ചെക്കിലാട്ടിയ വെളിച്ചെണ്ണ',
    sellMode: 'Fixed',
    defaultQuantity: '1L',
    variants: ['500ml', '1L', '2L', '5L'],
    description: 'Traditional wood/stone-pressed unrefined coconut oil preserving all nutrients and natural aroma.'
  },
  {
    canonicalName: 'Sesame Oil / Gingelly Oil',
    category: 'Oils & Ghee',
    brands: ['Idhayam', 'Pavizham', 'KLF', 'Local Mill'],
    aliases: ['Nallenna', 'Ellenna', 'Til Oil', 'Gingelly Oil'],
    malayalam: 'നല്ലെണ്ണ (എള്ളെണ്ണ)',
    sellMode: 'Fixed',
    defaultQuantity: '500ml',
    variants: ['200ml', '500ml', '1L', '2L'],
    description: 'Extracted from whole sesame seeds, traditionally used for pickles, dosas, and seasoning.'
  },
  {
    canonicalName: 'Sunflower Oil',
    category: 'Oils & Ghee',
    brands: ['Gold Winner', 'Fortune', 'Sunpure', 'Saffola'],
    aliases: ['Refined Sunflower Oil', 'Cooking Oil', 'Surajmukhi Oil'],
    malayalam: 'സൂര്യകാന്തി എണ്ണ',
    sellMode: 'Fixed',
    defaultQuantity: '1L',
    variants: ['500ml', '1L', '2L', '5L'],
    description: 'Light and neutral refined sunflower cooking oil with a high smoke point for frying.'
  },
  {
    canonicalName: 'Rice Bran Oil',
    category: 'Oils & Ghee',
    brands: ['Fortune', 'Saffola', 'Pavizham'],
    aliases: ['Refined Rice Bran Oil', 'Health Oil', 'Oryzanol Oil'],
    malayalam: 'റൈസ് ബ്രാൻ ഓയിൽ',
    sellMode: 'Fixed',
    defaultQuantity: '1L',
    variants: ['1L', '2L', '5L'],
    description: 'Heart-healthy cooking oil naturally rich in Oryzanol with balanced fatty acids.'
  },
  {
    canonicalName: 'Groundnut Oil',
    category: 'Oils & Ghee',
    brands: ['Fortune', 'Local Mill', 'Organo Mills'],
    aliases: ['Peanut Oil', 'Kappalandi Enna', 'Chekku Groundnut Oil'],
    malayalam: 'നിലക്കടല എണ്ണ',
    sellMode: 'Fixed',
    defaultQuantity: '1L',
    variants: ['500ml', '1L', '2L', '5L'],
    description: 'Aromatic pressed groundnut oil valued for deep frying and traditional sauteing.'
  },
  {
    canonicalName: 'Mustard Oil',
    category: 'Oils & Ghee',
    brands: ['Fortune', 'Engine', 'Patanjali'],
    aliases: ['Kachi Ghani Mustard Oil', 'Sarson Ka Tel', 'Kaduku Enna'],
    malayalam: 'കടുക് എണ്ണ',
    sellMode: 'Fixed',
    defaultQuantity: '1L',
    variants: ['500ml', '1L', '2L'],
    description: 'Pungent cold-pressed mustard seed oil essential for pickles and aromatic seasoning.'
  },
  {
    canonicalName: 'Olive Oil / Extra Virgin Olive Oil',
    category: 'Oils & Ghee',
    brands: ['Figaro', 'Borges', 'Del Monte'],
    aliases: ['EVOO', 'Extra Virgin Olive Oil', 'Pure Olive Oil'],
    malayalam: 'ഒലിവ് ഓയിൽ',
    sellMode: 'Fixed',
    defaultQuantity: '500ml',
    variants: ['250ml', '500ml', '1L'],
    description: 'First cold-pressed unrefined olive oil suited for salads, dressings, and gentle cooking.'
  },
  {
    canonicalName: 'Palmolein Oil',
    category: 'Oils & Ghee',
    brands: ['Ruchi Gold', 'Fortune', 'Local Brand'],
    aliases: ['Refined Palmolein', 'Palm Oil', 'Frying Oil'],
    malayalam: 'പാല്മോലിൻ എണ്ണ',
    sellMode: 'Fixed',
    defaultQuantity: '1L',
    variants: ['1L', '5L'],
    description: 'Economical, high-stability refined cooking oil commonly utilized for commercial frying.'
  },
  {
    canonicalName: 'Vanaspati / Dalda',
    category: 'Oils & Ghee',
    brands: ['Dalda', 'Rath', 'Local Brand'],
    aliases: ['Hydrogenated Vegetable Oil', 'Vanaspati Ghee', 'Dalda Ghee'],
    malayalam: 'ഡാൽഡ (വനസ്പതി)',
    sellMode: 'Fixed',
    defaultQuantity: '1L',
    variants: ['500ml', '1L', '5L'],
    description: 'Hydrogenated vegetable oil used in bakeries and savoury snacks for extra flakiness.'
  },
  {
    canonicalName: 'Pooja Deepam Oil',
    category: 'Oils & Ghee',
    brands: ['Pooja Brand', 'Local Mill'],
    aliases: ['Vilakku Enna', 'Pancha Deepam Oil', 'Lamp Oil'],
    malayalam: 'വിളക്കെണ്ണ (പൂജാ എണ്ണ)',
    sellMode: 'Fixed',
    defaultQuantity: '1L',
    variants: ['500ml', '1L', '2L'],
    description: 'Special fragrant blend of 5 traditional seed oils formulated exclusively for lighting temple and altar lamps.'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. SPICES & MASALAS (HIGHEST PRIORITY KERALA CATALOG)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    canonicalName: 'Black Pepper',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Local Spice Mill'],
    aliases: ['Kurumulaku', 'Whole Black Pepper', 'Malabar Black Pepper', 'Tellicherry Garbled'],
    malayalam: 'കുരുമുളക്',
    sellMode: 'Manual',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g', '250g', '500g', '1kg'],
    description: 'Pungent whole sun-dried black peppercorns from Malabar pepper vines.'
  },
  {
    canonicalName: 'Green Cardamom',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Wayanad Spices', 'Local Spice Merchant'],
    aliases: ['Elakkai', 'Elaichi', 'Chotta Elaichi', 'Green Elaichi'],
    malayalam: 'ഏലക്കായ',
    sellMode: 'Manual',
    defaultQuantity: '50g',
    variants: ['25g', '50g', '100g', '250g', '500g'],
    description: 'Aromatic green cardamom pods cultivated in the Western Ghats of Idukki and Wayanad.'
  },
  {
    canonicalName: 'Cloves',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Local Spice Mill'],
    aliases: ['Grambu', 'Lavangam', 'Laung', 'Whole Cloves'],
    malayalam: 'ഗ്രാമ്പൂ (കരയാമ്പൂ)',
    sellMode: 'Manual',
    defaultQuantity: '50g',
    variants: ['25g', '50g', '100g', '250g', '500g'],
    description: 'Aromatic dried flower buds with intensely warm, sweet, and spicy notes.'
  },
  {
    canonicalName: 'Cinnamon',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Local Spice Merchant'],
    aliases: ['Karuvapatta', 'Dalchini', 'Ceylon Cinnamon', 'True Cinnamon'],
    malayalam: 'കറുവപ്പട്ട',
    sellMode: 'Manual',
    defaultQuantity: '50g',
    variants: ['25g', '50g', '100g', '250g', '500g'],
    description: 'Fragrant sweet inner bark scrolls essential for biriyanis, tea, and garam masala.'
  },
  {
    canonicalName: 'Cassia Bark',
    category: 'Spices & Masalas',
    brands: ['Local Spice Merchant', 'Eastern'],
    aliases: ['Thick Cinnamon', 'Taj Patta', 'Chinese Cinnamon'],
    malayalam: 'കാസിയ പട്ട',
    sellMode: 'Manual',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g', '500g'],
    description: 'Robust, spicy tree bark with a bold woodiness, popular in rich meat marinades.'
  },
  {
    canonicalName: 'Cumin Seeds',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Local Spice Mill'],
    aliases: ['Jeerakam', 'Jeera Whole', 'Nalla Jeerakam', 'White Cumin'],
    malayalam: 'ജീരകം',
    sellMode: 'Manual',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g', '250g', '500g', '1kg'],
    description: 'Earthy, aromatic whole cumin seeds used for tempering dals, curries, and rasam.'
  },
  {
    canonicalName: 'Fennel Seeds',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Local Spice Mill'],
    aliases: ['Perumjeerakam', 'Saunf', 'Sweet Cumin', 'Big Jeera'],
    malayalam: 'പെരുംജീരകം',
    sellMode: 'Manual',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g', '250g', '500g', '1kg'],
    description: 'Sweet, fragrant fennel seeds essential for Kerala meat curries and after-meal digestion.'
  },
  {
    canonicalName: 'Black Mustard Seeds',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Local Spice Mill'],
    aliases: ['Kaduku', 'Sarson', 'Rai', 'Small Mustard Seeds'],
    malayalam: 'കടുക്',
    sellMode: 'Manual',
    defaultQuantity: '100g',
    variants: ['100g', '250g', '500g', '1kg'],
    description: 'Tiny black mustard seeds that release a pungent, nutty aroma upon popping in hot oil.'
  },
  {
    canonicalName: 'Yellow Mustard Seeds',
    category: 'Spices & Masalas',
    brands: ['Local Spice Merchant', 'Eastern'],
    aliases: ['Peeli Sarson', 'Yellow Kaduku', 'White Mustard'],
    malayalam: 'മഞ്ഞ കടുക്',
    sellMode: 'Manual',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g'],
    description: 'Mild, slightly sweet yellow mustard seeds used in specialised pickling and gravies.'
  },
  {
    canonicalName: 'Fenugreek Seeds',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Local Spice Mill'],
    aliases: ['Uluva', 'Methi Seeds', 'Whole Fenugreek'],
    malayalam: 'ഉലുവ',
    sellMode: 'Manual',
    defaultQuantity: '100g',
    variants: ['100g', '250g', '500g', '1kg'],
    description: 'Golden-brown angular seeds with a distinctive bitter flavour essential for fish curries and sambar.'
  },
  {
    canonicalName: 'Coriander Seeds',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Local Spice Mill'],
    aliases: ['Malli', 'Dhania Whole', 'Sabut Dhania'],
    malayalam: 'മല്ലി',
    sellMode: 'Manual',
    defaultQuantity: '250g',
    variants: ['100g', '250g', '500g', '1kg'],
    description: 'Whole round coriander seeds with a fresh citrusy, herbaceous scent for fresh roasts.'
  },
  {
    canonicalName: 'Dry Red Chilli',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Local Spice Merchant'],
    aliases: ['Vattal Mulaku', 'Unakka Mulaku', 'Guntur Chilli', 'Round Chilli'],
    malayalam: 'വറ്റൽമുളക് (ഉണക്കമുളക്)',
    sellMode: 'Manual',
    defaultQuantity: '250g',
    variants: ['100g', '250g', '500g', '1kg'],
    description: 'Whole sun-dried red chillies prized for heat and deep red colour in tadkas and curries.'
  },
  {
    canonicalName: 'Kashmiri Dry Red Chilli',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Local Spice Merchant'],
    aliases: ['Kashmiri Mulaku', 'Wrinkled Red Chilli', 'Mild Red Chilli'],
    malayalam: 'കാശ്മീരി വറ്റൽമുളക്',
    sellMode: 'Manual',
    defaultQuantity: '100g',
    variants: ['100g', '250g', '500g'],
    description: 'Wrinkled, vibrant ruby-red chillies offering brilliant color with gentle warmth.'
  },
  {
    canonicalName: 'Star Anise',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Wayanad Spices', 'Local Spice Merchant'],
    aliases: ['Thakkolam', 'Chakra Phool', 'Star Spice'],
    malayalam: 'തക്കോലം',
    sellMode: 'Manual',
    defaultQuantity: '50g',
    variants: ['25g', '50g', '100g', '250g'],
    description: 'Star-shaped licorice-scented pods essential for Malabar biriyani and meat curries.'
  },
  {
    canonicalName: 'Nutmeg Whole',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Wayanad Spices', 'Local Spice Merchant'],
    aliases: ['Jathikka', 'Jaiphal', 'Whole Nutmeg with Shell'],
    malayalam: 'ജാതിക്ക',
    sellMode: 'Manual',
    defaultQuantity: '50g',
    variants: ['25g', '50g', '100g', '250g'],
    description: 'Whole aromatic Kerala nutmeg kernels yielding warm, sweet, and nutty grated spice.'
  },
  {
    canonicalName: 'Mace Whole',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Wayanad Spices', 'Local Spice Merchant'],
    aliases: ['Jathipathri', 'Javitri', 'Nutmeg Aril'],
    malayalam: 'ജാതിപത്രി',
    sellMode: 'Manual',
    defaultQuantity: '25g',
    variants: ['25g', '50g', '100g'],
    description: 'Delicate, lacy dried orange-red arils of the nutmeg fruit with an elegant perfume.'
  },
  {
    canonicalName: 'Bay Leaf',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Local Spice Merchant'],
    aliases: ['Vayana Ila', 'Tej Patta', 'Indian Bay Leaf', 'Biriyani Ila'],
    malayalam: 'വയണയില (കറുവയില)',
    sellMode: 'Manual',
    defaultQuantity: '30g',
    variants: ['20g', '30g', '50g', '100g'],
    description: 'Aromatic dried tree leaves infused into boiling rice, biriyanis, and rich kormas.'
  },
  {
    canonicalName: 'Carom Seeds (Ajwain)',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Local Spice Merchant'],
    aliases: ['Ayamodakam', 'Ajwain Whole', 'Bishop\'s Weed'],
    malayalam: 'അയമോദകം',
    sellMode: 'Manual',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g'],
    description: 'Pungent, thyme-like seeds famous for aiding digestion in savoury batters and pastries.'
  },
  {
    canonicalName: 'White Sesame Seeds',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Local Spice Merchant'],
    aliases: ['Vella Ellu', 'Safed Til', 'White Gingelly Seeds'],
    malayalam: 'വെള്ള എള്ള്',
    sellMode: 'Manual',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g', '500g'],
    description: 'Hulled delicate white sesame seeds for sweets, bakery toppings, and chutneys.'
  },
  {
    canonicalName: 'Black Sesame Seeds',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Local Spice Merchant'],
    aliases: ['Karutha Ellu', 'Kala Til', 'Black Gingelly Seeds'],
    malayalam: 'കറുത്ത എള്ള്',
    sellMode: 'Manual',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g', '500g'],
    description: 'Earthy, mineral-rich whole black sesame seeds traditional for temple offerings and sweets.'
  },
  {
    canonicalName: 'Poppy Seeds (Khas Khas)',
    category: 'Spices & Masalas',
    brands: ['Local Spice Merchant', 'Eastern'],
    aliases: ['Kaskas', 'Khus Khus', 'White Poppy Seeds'],
    malayalam: 'കസ്‌കസ് (പോപ്പി സീഡ്സ്)',
    sellMode: 'Manual',
    defaultQuantity: '50g',
    variants: ['25g', '50g', '100g'],
    description: 'Nutty, tiny white poppy seeds ground into pastes to thicken creamy kurmas and kormas.'
  },

  // Single-Spice Powders
  {
    canonicalName: 'Turmeric Powder',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Brahmins', 'Double Horse', 'Kitchen Treasures', 'Melam', 'Local Spice Mill'],
    aliases: ['Manjal Podi', 'Haldi Powder', 'Pure Turmeric'],
    malayalam: 'മഞ്ഞൾപ്പൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['50g', '100g', '250g', '500g', '1kg'],
    description: 'Finely ground sun-dried Alleppey and Salem turmeric roots for curry colour and seasoning.'
  },
  {
    canonicalName: 'Red Chilli Powder',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Brahmins', 'Double Horse', 'Kitchen Treasures', 'Melam', 'Local Spice Mill'],
    aliases: ['Mulaku Podi', 'Hot Chilli Powder', 'Lal Mirch Powder'],
    malayalam: 'മുളകുപൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['50g', '100g', '250g', '500g', '1kg'],
    description: 'Vibrant hot red chilli powder ground from premium dried chillies for deep heat.'
  },
  {
    canonicalName: 'Kashmiri Chilli Powder',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Brahmins', 'Double Horse', 'Kitchen Treasures', 'Melam', 'Local Spice Mill'],
    aliases: ['Kashmiri Mulaku Podi', 'Mild Colour Chilli Powder', 'Deggi Mirch'],
    malayalam: 'കാശ്മീരി മുളകുപൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['50g', '100g', '250g', '500g', '1kg'],
    description: 'Low-heat, brilliantly red ground chilli giving glowing colour and mild flavour.'
  },
  {
    canonicalName: 'Coriander Powder',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Brahmins', 'Double Horse', 'Kitchen Treasures', 'Melam', 'Local Spice Mill'],
    aliases: ['Malli Podi', 'Dhania Powder', 'Ground Coriander'],
    malayalam: 'മല്ലിപ്പൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['50g', '100g', '250g', '500g', '1kg'],
    description: 'Aromatic cool ground coriander seeds forming the aromatic base for curries and gravies.'
  },
  {
    canonicalName: 'Cumin Powder',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Brahmins', 'Double Horse', 'Kitchen Treasures', 'Melam', 'Local Spice Mill'],
    aliases: ['Jeeraka Podi', 'Jeera Powder', 'Roasted Cumin Powder'],
    malayalam: 'ജീരകപ്പൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g', '500g'],
    description: 'Warm, nutty ground cumin powder for tempering, marinades, and buttermilk seasoning.'
  },
  {
    canonicalName: 'Black Pepper Powder',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Brahmins', 'Double Horse', 'Kitchen Treasures', 'Melam', 'Local Spice Mill'],
    aliases: ['Kurumulaku Podi', 'Kali Mirch Powder', 'Crushed Pepper'],
    malayalam: 'കുരുമുളകുപൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g', '500g'],
    description: 'Freshly pulverized Malabar black peppercorns delivering immediate pungent heat.'
  },
  {
    canonicalName: 'Fennel Powder',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Melam'],
    aliases: ['Perumjeeraka Podi', 'Saunf Powder', 'Sweet Cumin Powder'],
    malayalam: 'പെരുംജീരകപ്പൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g'],
    description: 'Fragrant sweet fennel powder vital for Malabar fish and chicken curries.'
  },
  {
    canonicalName: 'Fenugreek Powder',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures'],
    aliases: ['Uluva Podi', 'Methi Powder', 'Ground Fenugreek'],
    malayalam: 'ഉലുവപ്പൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g'],
    description: 'Finely ground roasted fenugreek giving characteristic aroma to sambar, pulissery, and pickles.'
  },
  {
    canonicalName: 'Dry Ginger Powder (Chukku Podi)',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Brahmins', 'Double Horse', 'Local Spice Mill'],
    aliases: ['Chukku Podi', 'Sonth Powder', 'Ginger Powder'],
    malayalam: 'ചുക്കുപൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g'],
    description: 'Pungent warming powder from dried ginger rhizomes, used for herbal coffee and curries.'
  },
  {
    canonicalName: 'Asafoetida Powder (Kayam)',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Brahmins', 'Double Horse', 'LG', 'Everest'],
    aliases: ['Kayam Podi', 'Hing Powder', 'Compounded Asafoetida'],
    malayalam: 'കായം പൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '50g',
    variants: ['20g', '50g', '100g', '200g'],
    description: 'Aromatic compounded asafoetida powder providing savoury umami and digestive balance.'
  },

  // Kerala Spice Ingredients (Key Anchor Masters)
  {
    canonicalName: 'Dry Ginger (Chukku)',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Wayanad Spices', 'Local Spice Merchant'],
    aliases: ['Chukku', 'Dry Ginger Whole', 'Sonth Whole', 'Chukku Kaapi Root'],
    malayalam: 'ചുക്ക്',
    sellMode: 'Manual',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g', '250g', '500g'],
    description: 'Peeled and sun-dried whole ginger roots cherished for chukku kaapi and medicinal teas.'
  },
  {
    canonicalName: 'Kudampuli (Malabar Tamarind)',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Wayanad Spices', 'Local Spice Merchant'],
    aliases: ['Malabar Tamarind', 'Fish Tamarind', 'Garcinia Cambogia', 'Kodampuli'],
    malayalam: 'കുടംപുളി',
    sellMode: 'Manual',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g', '250g', '500g', '1kg'],
    description: 'Smoke-dried dark Malabar tamarind rinds giving authentic tart flavour to Kerala fish curries.'
  },
  {
    canonicalName: 'Tamarind (Valan Puli)',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Local Spice Merchant'],
    aliases: ['Valan Puli', 'Puli Whole', 'Imli', 'Seedless Tamarind'],
    malayalam: 'വാളൻപുളി',
    sellMode: 'Manual',
    defaultQuantity: '250g',
    variants: ['100g', '250g', '500g', '1kg'],
    description: 'Tangy, sticky mature brown tamarind pulp for sambar, rasam, and chutneys.'
  },
  {
    canonicalName: 'Dried Curry Leaves',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Local Spice Merchant'],
    aliases: ['Unakka Kariveppila', 'Curry Patta Dry', 'Dried Kariveppila'],
    malayalam: 'ഉണക്ക കറിവേപ്പില',
    sellMode: 'Fixed',
    defaultQuantity: '25g',
    variants: ['25g', '50g', '100g'],
    description: 'Air-dried fragrant whole curry leaves preserving their herbal aroma for tempering.'
  },

  // South Indian & Kerala Masala Blends
  {
    canonicalName: 'Sambar Powder',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Brahmins', 'Double Horse', 'Kitchen Treasures', 'Melam', 'Local Spice Mill'],
    aliases: ['Sambar Podi', 'Kerala Sambar Powder', 'Authentic Sambar Masala'],
    malayalam: 'സാമ്പാർ പൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '250g',
    variants: ['50g', '100g', '250g', '500g', '1kg'],
    description: 'Traditional slow-roasted blend of coriander, chillies, fenugreek, and lentils for Kerala sambar.'
  },
  {
    canonicalName: 'Rasam Powder',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Brahmins', 'Double Horse', 'Kitchen Treasures', 'Melam'],
    aliases: ['Rasa Podi', 'Kerala Rasam Masala', 'Pepper Rasam Powder'],
    malayalam: 'രസം പൊടി',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g', '500g'],
    description: 'Aromatic pepper, cumin, and coriander blend for tangy, soothing South Indian rasam.'
  },
  {
    canonicalName: 'Fish Curry Masala',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Melam', 'Malabar Choice', 'Local Spice Mill'],
    aliases: ['Meen Curry Masala', 'Kerala Fish Masala', 'Malabar Fish Curry Powder'],
    malayalam: 'മീൻ കറി മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g', '500g'],
    description: 'Signature Kerala spice combination for red fish curries made with kudampuli and coconut milk.'
  },
  {
    canonicalName: 'Fish Fry Masala',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Melam', 'Malabar Choice'],
    aliases: ['Meen Porichathu Masala', 'Fish Fry Mix', 'Kerala Fish Fry Podi'],
    malayalam: 'മീൻ ഫ്രൈ മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g', '500g'],
    description: 'Crisp coating blend of chilli, turmeric, garlic, and spices for pan-fried fish.'
  },
  {
    canonicalName: 'Chicken Masala',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Melam', 'Ajmi'],
    aliases: ['Kozhi Curry Masala', 'Kerala Chicken Curry Powder'],
    malayalam: 'ചിക്കൻ മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g', '500g', '1kg'],
    description: 'Robust aromatic spice blend for homestyle Kerala chicken curries and gravies.'
  },
  {
    canonicalName: 'Chicken Fry Masala',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Melam'],
    aliases: ['Chicken 65 Masala', 'Kozhi Porichathu Masala', 'Chicken Fry Mix'],
    malayalam: 'ചിക്കൻ ഫ്രൈ മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g'],
    description: 'Spicy marinade mix crafted for crispy, deep-fried Kerala pepper chicken and chicken 65.'
  },
  {
    canonicalName: 'Meat Masala',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Melam', 'Pavan', 'Pavizham'],
    aliases: ['Kerala Meat Masala', 'Iraichi Masala', 'Mutton Masala'],
    malayalam: 'മീറ്റ് മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g', '500g', '1kg'],
    description: 'Hearty, deeply aromatic blend of coriander, fennel, black pepper, and cinnamon for red meat.'
  },
  {
    canonicalName: 'Beef Masala / Beef Roast Masala',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Kitchen Treasures', 'Melam', 'Malabar Choice'],
    aliases: ['Beef Roast Masala', 'Kerala Beef Masala', 'Beef Fry Masala'],
    malayalam: 'ബീഫ് റോസ്റ്റ് മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g', '500g'],
    description: 'Signature roasted black pepper, fennel, and coriander mix for authentic Kerala beef fry and roast.'
  },
  {
    canonicalName: 'Egg Curry Masala',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Melam'],
    aliases: ['Mutta Curry Masala', 'Egg Roast Masala'],
    malayalam: 'മുട്ട കറി മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g'],
    description: 'Rich onion and tomato gravy seasoning crafted for Kerala boiled egg curries.'
  },
  {
    canonicalName: 'Malabar Biriyani Masala',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Melam', 'Malabar Choice'],
    aliases: ['Biriyani Masala Podi', 'Thalassery Biriyani Masala', 'Biryani Spice Blend'],
    malayalam: 'മലബാർ ബിരിയാണി മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g', '500g'],
    description: 'Fragrant blend of mace, cardamom, star anise, and cloves for legendary Thalassery dum biriyani.'
  },
  {
    canonicalName: 'Kerala Garam Masala',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Double Horse', 'Brahmins', 'Kitchen Treasures', 'Melam', 'Local Spice Mill'],
    aliases: ['Nadan Garam Masala', 'Kerala All-Spice Powder', 'Whole Spice Powder'],
    malayalam: 'കേരള ഗരം മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g', '250g'],
    description: 'Aromatic finishing spice powder ground from whole cloves, cardamom, cinnamon, and star anise.'
  },
  {
    canonicalName: 'Pickle Masala',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Brahmins', 'Double Horse', 'Kitchen Treasures', 'Melam'],
    aliases: ['Achar Masala', 'Achar Podi', 'Fish Pickle Masala', 'Mango Pickle Masala'],
    malayalam: 'അച്ചാർ മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g', '500g'],
    description: 'Piquant blend of roasted fenugreek, mustard, chilli, and asafoetida for instant pickles.'
  },
  {
    canonicalName: 'Vegetable Masala / Veg Kurma Masala',
    category: 'Spices & Masalas',
    brands: ['Eastern', 'Brahmins', 'Double Horse', 'Kitchen Treasures', 'Melam'],
    aliases: ['Veg Curry Masala', 'Vegetable Kurma Masala', 'Vegetable Stew Masala'],
    malayalam: 'വെജിറ്റബിൾ കുറുമ മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '250g'],
    description: 'Mildly spiced, fragrant masala for creamy vegetable stew, kurma, and coconut gravies.'
  },
  {
    canonicalName: 'Avial Masala',
    category: 'Spices & Masalas',
    brands: ['Brahmins', 'Double Horse', 'Eastern'],
    aliases: ['Avial Mix Podi', 'Sadya Avial Masala'],
    malayalam: 'അവിയൽ മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g'],
    description: 'Coarsely blended cumin, green chilli, and turmeric notes for traditional Kerala sadya avial.'
  },
  {
    canonicalName: 'Theeyal Masala',
    category: 'Spices & Masalas',
    brands: ['Brahmins', 'Double Horse', 'Eastern'],
    aliases: ['Varutharacha Theeyal Masala', 'Ulli Theeyal Podi'],
    malayalam: 'തീയൽ മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g'],
    description: 'Slow-roasted grated coconut and spice mixture for authentic dark, toasted Kerala theeyal.'
  },
  // Secondary Indian Masala Masters
  {
    canonicalName: 'Chana Masala',
    category: 'Spices & Masalas',
    brands: ['Everest', 'Eastern', 'MDH', 'Catch'],
    aliases: ['Chole Masala', 'Kabuli Chana Masala'],
    malayalam: 'ചനാ മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g'],
    description: 'Tangy, spicy pomegranate and amchur-infused masala for chickpea curries.'
  },
  {
    canonicalName: 'Pav Bhaji Masala',
    category: 'Spices & Masalas',
    brands: ['Everest', 'MDH', 'Catch', 'Eastern'],
    aliases: ['Bhaji Masala', 'Mumbai Pav Bhaji Mix'],
    malayalam: 'പാവ് ഭാജി മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g'],
    description: 'Zesty ground spice blend crafted for buttery mashed vegetable bhaji.'
  },
  {
    canonicalName: 'Chaat Masala',
    category: 'Spices & Masalas',
    brands: ['Everest', 'MDH', 'Catch'],
    aliases: ['Tangy Sprinkler', 'Chaat Podi'],
    malayalam: 'ചാറ്റ് മസാല',
    sellMode: 'Fixed',
    defaultQuantity: '100g',
    variants: ['50g', '100g', '200g'],
    description: 'Tangy sprinkling spice made with black salt, dry mango powder, and asafoetida.'
  }
]

// Helper to find master catalog item by name or alias
export function findCatalogProduct(name: string): MasterCatalogProduct | undefined {
  const q = name.toLowerCase().trim()
  return KERALA_BRAND_CATALOG.find(p => 
    p.canonicalName.toLowerCase() === q ||
    p.aliases.some(a => a.toLowerCase() === q) ||
    p.malayalam === name
  )
}

// Helper to get all available brands for a category
export function getCategoryBrands(categoryName: string): { brand: string, count: number }[] {
  const brandCounts: Record<string, number> = {}
  KERALA_BRAND_CATALOG
    .filter(p => p.category.toLowerCase() === categoryName.toLowerCase())
    .forEach(p => {
      p.brands.forEach(b => {
        brandCounts[b] = (brandCounts[b] || 0) + 1
      })
    })

  return Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([brand, count]) => ({ brand, count }))
}
