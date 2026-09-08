const fs = require('fs');

const meatFishMasterItems = [
  // --- POULTRY (CHICKEN & DUCK) ---
  {
    name: 'Fresh Chicken Curry Cut (Skinless)',
    brand: 'Local Meat',
    family: 'Fresh Chicken',
    description: 'Tender farm-fresh broiler chicken cut into even bone-in curry pieces, thoroughly washed and skin removed.',
    sell_mode: 'Dynamic',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg', '2 kg']
  },
  {
    name: 'Fresh Chicken Curry Cut (With Skin)',
    brand: 'Local Meat',
    family: 'Fresh Chicken',
    description: 'Juicy bone-in chicken curry cut pieces with clean skin intact, ideal for traditional Kerala chicken roast and fry.',
    sell_mode: 'Dynamic',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg', '2 kg']
  },
  {
    name: 'Fresh Chicken Boneless Breast',
    brand: 'Local Meat',
    family: 'Fresh Chicken',
    description: 'Clean lean succulent chicken breast fillets with zero fat, ideal for cutlets, nuggets, and grilling.',
    sell_mode: 'Dynamic',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },
  {
    name: 'Fresh Whole Chicken (Dressed)',
    brand: 'Local Meat',
    family: 'Fresh Chicken',
    description: 'Fully dressed and gutted whole fresh chicken, ready for whole tandoori, alfahm, or family roast.',
    sell_mode: 'Dynamic',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop&q=80',
    variants: ['1 kg', '1.5 kg', '2 kg']
  },
  {
    name: 'Kerala Nadan Kozhi (Country Chicken)',
    brand: 'Local Farm',
    family: 'Country Poultry',
    description: 'Free-range desi country chicken, firmer texture and intense flavour, prized for authentic nadan kozhi curry.',
    sell_mode: 'Dynamic',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop&q=80',
    variants: ['1 kg', '1.5 kg']
  },
  {
    name: 'Kuttanadan Duck Meat (Tharavu)',
    brand: 'Local Farm',
    family: 'Duck Meat',
    description: 'Authentic Kuttanad paddy-reared fresh duck, cleaned and cut for festive Syrian Christian duck roast and mapas.',
    sell_mode: 'Dynamic',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop&q=80',
    variants: ['1 kg', '1.5 kg']
  },

  // --- RED MEAT (BEEF & MUTTON) ---
  {
    name: 'Fresh Kerala Beef (Curry Cut with Bone)',
    brand: 'Local Butcher',
    family: 'Fresh Beef',
    description: 'Daily fresh butchered tender beef cuts with marrow bones, slow-cooked for traditional Kerala erachi varattiyathu.',
    sell_mode: 'Dynamic',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg', '2 kg']
  },
  {
    name: 'Fresh Kerala Beef (Boneless Roast Cut)',
    brand: 'Local Butcher',
    family: 'Fresh Beef',
    description: 'Prime lean beef cubes with zero bone, trimmed and prepped for dry beef fry (BFF) and chilli beef.',
    sell_mode: 'Dynamic',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg', '2 kg']
  },
  {
    name: 'Fresh Goat / Mutton (Curry Cut)',
    brand: 'Local Butcher',
    family: 'Fresh Mutton',
    description: 'Fresh tender grass-fed goat meat cuts with ribs, shanks, and bone-in pieces, perfect for Malabar mutton biriyani.',
    sell_mode: 'Dynamic',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg', '2 kg']
  },
  {
    name: 'Fresh Goat / Mutton (Boneless)',
    brand: 'Local Butcher',
    family: 'Fresh Mutton',
    description: 'Succulent prime boneless mutton chunks, trimmed of sinew for kebabs, chops, and kurma.',
    sell_mode: 'Dynamic',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },

  // --- COASTAL KERALA FRESH FISH ---
  {
    name: 'Fresh Sardine / Mathi (Whole)',
    brand: 'Local Fishery',
    family: 'Coastal Fish',
    description: 'Fresh glistening sea catch sardines rich in Omega-3 fatty acids, irreplaceable hero of Kerala fish curry.',
    sell_mode: 'Dynamic',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },
  {
    name: 'Fresh Sardine / Mathi (Cleaned)',
    brand: 'Local Fishery',
    family: 'Coastal Fish',
    description: 'Scale-removed, descaled, and gutted fresh sardines ready for frying with coconut oil and spices.',
    sell_mode: 'Dynamic',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },
  {
    name: 'Fresh Indian Mackerel / Ayala (Whole)',
    brand: 'Local Fishery',
    family: 'Coastal Fish',
    description: 'Silvery fresh sea mackerel, meaty texture perfect for Kudampuli meen pollichathu and spicy curry.',
    sell_mode: 'Dynamic',
    default_quantity: '1 kg',
    default_image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },
  {
    name: 'Fresh Indian Mackerel / Ayala (Cleaned & Cut)',
    brand: 'Local Fishery',
    family: 'Coastal Fish',
    description: 'Gutted, fin-trimmed, and cleanly scored fresh mackerel ready for marination.',
    sell_mode: 'Dynamic',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },
  {
    name: 'Fresh Seer Fish / Neymeen (Steaks)',
    brand: 'Local Fishery',
    family: 'Premium Fish',
    description: 'King of Kerala fish, thick center-cut round steaks with single central bone, royal fry fish.',
    sell_mode: 'Dynamic',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },
  {
    name: 'Fresh Pearl Spot / Karimeen (Whole)',
    brand: 'Local Fishery',
    family: 'Backwater Fish',
    description: 'Prestigious Kerala state fish caught fresh from backwaters, celebrated for banana-leaf Karimeen Pollichathu.',
    sell_mode: 'Dynamic',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },
  {
    name: 'Fresh Prawns / Chemmeen (Cleaned & Deveined)',
    brand: 'Local Fishery',
    family: 'Crustaceans',
    description: 'Plump coastal prawns with shell and dark intestinal vein removed, ready to drop into coconut curries and roast.',
    sell_mode: 'Dynamic',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&auto=format&fit=crop&q=80',
    variants: ['250 g', '500 g', '1 kg']
  },
  {
    name: 'Fresh Anchovy / Netholi (Kozhuva)',
    brand: 'Local Fishery',
    family: 'Coastal Fish',
    description: 'Tiny glistening fresh white anchovies, famous for crunchy tawa fry and banana-leaf peera pattichathu.',
    sell_mode: 'Dynamic',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },
  {
    name: 'Fresh Tuna / Choora (Curry Cut)',
    brand: 'Local Fishery',
    family: 'Pelagic Fish',
    description: 'Dark red firm-fleshed tuna cubes with no small bones, deeply absorbs spicy roasted coconut gravy.',
    sell_mode: 'Dynamic',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },
  {
    name: 'Fresh White Pomfret / Vella Aavoli',
    brand: 'Local Fishery',
    family: 'Premium Fish',
    description: 'Delicate buttery white flesh flatfish, whole cleaned with head on, ideal for gentle pan frying.',
    sell_mode: 'Dynamic',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },
  {
    name: 'Fresh Squid / Koonthal (Cleaned Rings)',
    brand: 'Local Fishery',
    family: 'Cephalopods',
    description: 'Fresh tender sea calamari cleaned, ink-sac removed, and sliced into ready-to-cook rings.',
    sell_mode: 'Dynamic',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },
  {
    name: 'Fresh Mud Crab / Njandu',
    brand: 'Local Fishery',
    family: 'Crustaceans',
    description: 'Live sweet-meat coastal mud crabs, washed and prepped for spicy Kerala crab roast.',
    sell_mode: 'Dynamic',
    default_quantity: '500 g',
    default_image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&auto=format&fit=crop&q=80',
    variants: ['500 g', '1 kg']
  },

  // --- EGGS ---
  {
    name: 'Farm Fresh White Eggs',
    brand: 'Local Farm',
    family: 'Eggs',
    description: 'Clean grade-A farm fresh white poultry eggs rich in complete protein and essential choline.',
    sell_mode: 'Fixed',
    default_quantity: '6 pcs',
    default_image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&auto=format&fit=crop&q=80',
    variants: ['6 pcs', '10 pcs', '30 pcs']
  },
  {
    name: 'Farm Fresh Brown Eggs',
    brand: 'Local Farm',
    family: 'Eggs',
    description: 'Naturally laid nutrient-dense brown eggs with deep orange yolk from well-fed country hens.',
    sell_mode: 'Fixed',
    default_quantity: '6 pcs',
    default_image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&auto=format&fit=crop&q=80',
    variants: ['6 pcs', '10 pcs']
  },
  {
    name: 'Kerala Nadan Hen Eggs (Country Eggs)',
    brand: 'Local Farm',
    family: 'Eggs',
    description: 'Free-range backyard country hen eggs, prized in traditional Kerala postpartum and wellness diets.',
    sell_mode: 'Fixed',
    default_quantity: '6 pcs',
    default_image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&auto=format&fit=crop&q=80',
    variants: ['6 pcs', '10 pcs']
  },
  {
    name: 'Fresh Kuttanadan Duck Eggs',
    brand: 'Local Farm',
    family: 'Eggs',
    description: 'Large, thick-shelled duck eggs with rich creamy yolks, classic pairing with Kerala appam and roast.',
    sell_mode: 'Fixed',
    default_quantity: '6 pcs',
    default_image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&auto=format&fit=crop&q=80',
    variants: ['6 pcs', '10 pcs']
  }
];

fs.writeFileSync('scripts/meat_fish_data.json', JSON.stringify(meatFishMasterItems, null, 2), 'utf8');
console.log(`Defined Meat & Fish master items: ${meatFishMasterItems.length}`);
