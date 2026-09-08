const fs = require('fs');

const SPICES_MASALAS = [
  // ==========================================
  // 1. WHOLE SPICES (Kerala & South Indian Core)
  // ==========================================
  {
    name: "Black Pepper",
    desc: "Sun-dried whole black peppercorns from Malabar, locally known as Kurumulaku; the iconic King of Spices providing sharp heat and pungent aroma.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g", "500 g", "1 kg"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Loose Black Pepper",
    desc: "Whole Malabar black peppercorns sold loose by weight directly from spice sacks in local Kerala grocery stores.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "White Pepper",
    desc: "Dehulled ripe peppercorns with outer skin removed, known as Vella Kurumulaku; delivers subtle heat and delicate white color for light gravies and continental soups.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g"],
    img: ""
  },
  {
    name: "Green Cardamom",
    desc: "Whole plump green cardamom pods from the Cardamom Hills of Idukki, locally called Elakkaya; sweet floral perfume essential for payasam, tea, and biryani.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["25 g", "50 g", "100 g", "250 g", "500 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Loose Green Cardamom",
    desc: "Aromatic green cardamom pods weighed and sold loose by weight at local spice and grocery counters.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Black Cardamom",
    desc: "Large smokey brown cardamom pods, locally called Valiya Elakkaya; intensely aromatic whole spice utilized in rich meat marinades and biryanis.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Cloves",
    desc: "Dried whole aromatic flower buds of Syzygium aromaticum, locally named Gramboo or Karampu; deep warm spice for biryanis, meat curries, and confectionery.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["25 g", "50 g", "100 g", "250 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Loose Cloves",
    desc: "Aromatic whole cloves sold loose by weight at traditional grocery shops.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Cinnamon",
    desc: "Thin, multi-layered sweet aromatic bark quills of Ceylon cinnamon, locally known as Karuvapatta; delicate woody perfume for desserts and rich curries.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Cassia Bark",
    desc: "Thick, hard cinnamon bark quills with robust pungent flavor; commonly used in tempering, garam masala blends, and commercial spice mixes.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g"],
    img: ""
  },
  {
    name: "Cumin Seeds",
    desc: "Whole aromatic dried seeds of Cuminum cyminum, locally known as Jeerakam or Nalla Jeerakam; universal tempering spice for rasam, moru curry, and dal.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g", "500 g", "1 kg"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Loose Cumin Seeds",
    desc: "Cleaned whole cumin seeds dispensed and sold loose by weight from grocery sacks.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Fennel Seeds",
    desc: "Sweet licorice-scented whole seeds, locally celebrated as Perunjeerakam; irreplaceable fragrant whole spice for Malabar chicken curry, mutton stews, and mouth fresheners.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g", "500 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Loose Fennel Seeds",
    desc: "Whole sweet fennel seeds weighed and sold loose by weight in local grocery stores.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Black Mustard Seeds",
    desc: "Tiny pungent black seeds, locally known as Kaduku; the essential crackling tempering base for nearly every traditional Kerala thoran, curry, and chutney.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g", "500 g", "1 kg"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Loose Black Mustard Seeds",
    desc: "Whole black mustard seeds sold loose by weight at local grocery counters.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Yellow Mustard Seeds",
    desc: "Mild yellow mustard seeds, locally known as Valiya Kaduku or Rai; used in traditional pickling, fish marinades, and spice pastes.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Fenugreek Seeds",
    desc: "Small yellowish-brown bitter whole seeds, locally called Uluva; essential whole spice for Kerala fish curry, sambar, moru kachiyathu, and idli batter fermentation.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g", "500 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Loose Fenugreek Seeds",
    desc: "Whole fenugreek seeds sold loose by weight from bulk jars at local provision stores.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Coriander Seeds",
    desc: "Whole fragrant dried coriander fruits, locally known as Malli; foundational base spice roasted and ground for Kerala sambar, theeyal, and meat gravies.",
    qty: "250 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g", "500 g", "1 kg"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Loose Coriander Seeds",
    desc: "Whole coriander seeds sold loose by weight for home dry-roasting and grinding.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Dry Red Chilli",
    desc: "Sun-dried whole red chillies with stems, locally known as Vattal Mulaku or Unakka Mulaku; quintessential tempering spice for curries and spicy chutneys.",
    qty: "250 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g", "500 g", "1 kg"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Loose Dry Red Chilli",
    desc: "Whole dry red chillies sold loose by weight from traditional gunny sacks in local markets.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Kashmiri Dry Red Chilli",
    desc: "Whole wrinkled mild red chillies prized for imparting deep natural crimson color and gentle warmth to gravies and marinades.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g", "500 g"],
    img: ""
  },
  {
    name: "Guntur Dry Red Chilli",
    desc: "Pungent whole red chillies with intense fiery heat; favored for spicy South Indian non-veg curries, podis, and Andhra style chutneys.",
    qty: "250 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["250 g", "500 g", "1 kg"],
    img: ""
  },
  {
    name: "Round Red Chilli",
    desc: "Small round dried chillies, locally called Gundu Mulaku; popular for South Indian tempering, sambar seasoning, and pickle preparation.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Star Anise",
    desc: "Star-shaped dried spice fruit, locally called Thakkolam; powerful sweet licorice aroma essential for Kerala meat stews, chicken curries, and Thalassery biryani.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["25 g", "50 g", "100 g", "250 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Nutmeg Whole",
    desc: "Whole shelled seed of Myristica fragrans, locally known as Jathikka; grated sparingly for traditional Kerala festive payasam, meat roasts, and garam masala.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Mace Whole",
    desc: "Lacy reddish-orange dried aril surrounding the nutmeg seed, locally known as Jathipathri; delicate sweet aroma essential for biryani rice and meat stews.",
    qty: "25 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["25 g", "50 g", "100 g"],
    img: ""
  },
  {
    name: "Bay Leaf",
    desc: "Aromatic dried leaves of the cinnamon tree, locally known as Vazhana Ila or Tejpatta; simmered in hot oil for biryanis, pulao, and festive gravies.",
    qty: "30 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["30 g", "50 g", "100 g"],
    img: ""
  },
  {
    name: "Carom Seeds",
    desc: "Small striped aromatic seeds with thymol aroma, locally called Ayamodakam or Ajwain; popular digestive spice for snacks, batter tempering, and herbal decoctions.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g"],
    img: ""
  },
  {
    name: "White Sesame Seeds",
    desc: "Whole hulled white sesame seeds, locally known as Vella Ellu; roasted for sweet til laddus, spice blends, and crunchy garnishes.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g", "500 g"],
    img: ""
  },
  {
    name: "Black Sesame Seeds",
    desc: "Whole unhulled black sesame seeds, locally named Karutha Ellu; essential for traditional Ellunda snacks, temple offerings, and Ayurvedic preparations.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g", "500 g"],
    img: ""
  },
  {
    name: "Poppy Seeds",
    desc: "Tiny ivory-colored seeds of the opium poppy, locally known as Kaskas; soaked and ground to impart rich creamy thickness and subtle nutty flavor to kormas and payasams.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Nigella Seeds",
    desc: "Small matte-black teardrop seeds, commonly known as Kalonji or Karimjeerakam; onion-like peppery flavor for pickling, flatbreads, and spice blends.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Shahjeera",
    desc: "Dark slender aromatic caraway seeds, known as Shahi Jeera or Royal Cumin; distinctive earthy perfume essential for Hyderabadi and royal biryanis.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Allspice",
    desc: "Whole dried berries of Pimenta dioica, locally known in Kerala as Sarvasugandhi; combines the scents of cinnamon, nutmeg, and cloves.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Stone Flower",
    desc: "Dried edible lichen, locally called Kalpasi or Dagad Phool; unique earthy woody umami flavor utilized in Chettinad and Malabar meat masalas.",
    qty: "25 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["25 g", "50 g"],
    img: ""
  },
  {
    name: "Cubeb Pepper",
    desc: "Tailed whole peppercorns, locally known as Vaal Mulaku; warm peppery spice with clove notes used in authentic Malabar biryani and traditional tonics.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Long Pepper",
    desc: "Dried spike-shaped spice fruits, locally called Thippali; pungent sweet-hot flavor widely used in traditional Kerala herbal broths and rasams.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },

  // ==========================================
  // 2. GROUND & SINGLE SPICES
  // ==========================================
  {
    name: "Turmeric Powder",
    desc: "Finely ground pure dried turmeric root, locally known as Manjal Podi; fundamental cooking staple imparting rich golden yellow color and warm earthy aroma.",
    qty: "250 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g", "500 g", "1 kg"],
    img: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500"
  },
  {
    name: "Loose Turmeric Powder",
    desc: "Pure stone-ground turmeric powder weighed and sold loose by weight at local grocery mills and spice stores.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Red Chilli Powder",
    desc: "Finely ground sun-dried red chillies, locally called Mulaku Podi; primary culinary source of vibrant red color and spicy heat across Kerala curries.",
    qty: "250 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g", "500 g", "1 kg"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Loose Red Chilli Powder",
    desc: "Pure ground red chilli powder sold loose by weight in local grocery shops.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Kashmiri Chilli Powder",
    desc: "Mildly pungent ground dried Kashmiri chillies, celebrated for providing brilliant natural ruby-red color to curries, fry roasts, and gravies.",
    qty: "250 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g", "500 g", "1 kg"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Crushed Chilli Flakes",
    desc: "Coarsely crushed red chilli pods with seeds; ideal for pasta seasoning, pizza toppings, and spicy stir-fry tempering.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g"],
    img: ""
  },
  {
    name: "Coriander Powder",
    desc: "Freshly ground pure coriander seeds, locally known as Malli Podi; foundational body-thickening spice for Kerala vegetable, fish, and meat gravies.",
    qty: "250 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g", "500 g", "1 kg"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Loose Coriander Powder",
    desc: "Freshly ground pure coriander powder sold loose by weight in traditional provision stores.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Roasted Coriander Powder",
    desc: "Evenly dry-roasted ground coriander seeds, locally called Varutha Malli Podi; imparts deep smoky aroma to Kerala Theeyal and Varutharacha curries.",
    qty: "250 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g", "500 g"],
    img: ""
  },
  {
    name: "Cumin Powder",
    desc: "Finely milled cumin seeds, locally called Jeeraka Podi; warm aromatic spice powder essential for buttermilk, rasam, and vegetable dishes.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g", "500 g"],
    img: ""
  },
  {
    name: "Roasted Cumin Powder",
    desc: "Dry-roasted whole cumin seeds ground into fine aromatic powder, known as Bhuna Jeera; adds smoky zesty finish to raita, chaats, and salads.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g"],
    img: ""
  },
  {
    name: "Black Pepper Powder",
    desc: "Finely ground pure Malabar black peppercorns, locally called Kurumulaku Podi; daily table seasoning and cooking spice for omelettes, soups, and chicken roast.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g", "500 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "White Pepper Powder",
    desc: "Finely milled white peppercorns delivering sharp heat without dark flecks; suited for white sauces, fried rice, and seafood seasoning.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Fennel Powder",
    desc: "Aromatic sweet ground fennel seeds, locally called Perunjeeraka Podi; key seasoning powder for Kerala chicken roast, beef fry, and Thalassery biryani.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g"],
    img: ""
  },
  {
    name: "Fenugreek Powder",
    desc: "Finely ground dried fenugreek seeds, locally called Uluva Podi; distinctive bitter-savory spice powder essential for fish curry and traditional pickles.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g"],
    img: ""
  },
  {
    name: "Dry Ginger Powder",
    desc: "Pure ground dried ginger root, locally known as Chukku Podi; warming aromatic spice used in Chukku Kaapi, gingerbread baking, and digestive curries.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g"],
    img: ""
  },
  {
    name: "Garlic Powder",
    desc: "Dehydrated pure garlic cloves ground into fine seasoning powder; convenient for dry rubs, marinades, garlic breads, and snack seasoning.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Onion Powder",
    desc: "Dehydrated ground onion powder offering sweet concentrated allium flavor for dry batters, seasoning blends, and sauces.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Asafoetida Powder",
    desc: "Compounded asafoetida powder, locally celebrated as Kaayam or Hing; pungent umami aroma released upon heating, essential for sambar and rasam.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Asafoetida Block",
    desc: "Traditional solid resin lump of pure compounded asafoetida, locally known as Katti Kaayam; dissolved in water for intense authentic sambar aroma.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Amchur Powder",
    desc: "Tangy dried unripe green mango powder; provides pleasant sour fruity acidity to North Indian curries, chaats, and stuffed parathas.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Nutmeg Powder",
    desc: "Freshly ground pure nutmeg powder, locally called Jathikka Podi; warm aromatic spice for puddings, festive desserts, and specialty meat curries.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["25 g", "50 g"],
    img: ""
  },
  {
    name: "Cardamom Powder",
    desc: "Pure finely ground green cardamom seeds mixed with a pinch of sugar; instant aromatic flavor for tea, payasam, and baked goods.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["25 g", "50 g"],
    img: ""
  },
  {
    name: "Cinnamon Powder",
    desc: "Fine aromatic ground cinnamon powder; sweet spicy fragrance for cakes, rolls, French toast, and warm spiced beverages.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Clove Powder",
    desc: "Finely milled whole cloves; concentrated warm spice powder used in specialty marinades and baking.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g"],
    img: ""
  },

  // ==========================================
  // 3. KERALA SPICE INGREDIENTS & SOURING AGENTS
  // ==========================================
  {
    name: "Kudampuli",
    desc: "Sun-dried and smoke-cured Garcinia cambogia rinds, also known as Malabar Tamarind; the definitive souring agent for authentic Kerala fish curries.",
    qty: "200 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "200 g", "500 g", "1 kg"],
    img: ""
  },
  {
    name: "Loose Kudampuli",
    desc: "Smoke-cured Malabar tamarind sold loose by weight directly from spice bins in Kerala markets.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Seedless Tamarind",
    desc: "Cleaned pliable pulp of ripe tamarind pods with seeds and fiber removed, locally known as Valan Puli or Vaalampuli; staple for sambar and pulissery.",
    qty: "500 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["200 g", "500 g", "1 kg"],
    img: ""
  },
  {
    name: "Loose Tamarind",
    desc: "Traditional aged tamarind with seeds sold loose by weight at local grocery stores.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Dry Ginger",
    desc: "Whole unpeeled sun-dried ginger rhizomes, locally known as Chukku; essential for preparing herbal Chukku Kaapi, digestive decoctions, and winter tonics.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g", "500 g"],
    img: ""
  },
  {
    name: "Loose Dry Ginger",
    desc: "Whole dry ginger rhizomes weighed and sold loose by weight in provision shops.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Dried Curry Leaves",
    desc: "Dehydrated dark green curry leaves, locally called Unakka Kariveppila; convenient shelf-stable aromatic herb for tempering curries when fresh leaves are unavailable.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["25 g", "50 g"],
    img: ""
  },
  {
    name: "Kokum Rinds",
    desc: "Sun-dried deep purple rinds of Garcinia indica; tangy cooling souring agent used in coastal fish curries and refreshing sol kadhi.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Kasuri Methi",
    desc: "Fragrant sun-dried fenugreek leaves; rubbed between palms and sprinkled over butter chicken, paneer gravies, and dal for restaurant-style aroma.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["25 g", "50 g", "100 g"],
    img: ""
  },
  {
    name: "Dry Amla",
    desc: "Sun-dried deseeded Indian gooseberry pieces, locally called Unakka Nellikka; traditional ingredient for herbal hair oils and digestive preparations.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },

  // ==========================================
  // 4. KERALA & SOUTH INDIAN BLENDED MASALAS
  // ==========================================
  {
    name: "Sambar Powder",
    desc: "Traditional Kerala roasted blend of coriander, red chilli, fenugreek, toor dal, and asafoetida; provides rich aroma and thickness to daily vegetable sambar.",
    qty: "250 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g", "500 g", "1 kg"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Rasam Powder",
    desc: "Authentic South Indian spice blend of crushed black pepper, cumin, coriander, and red chillies for preparing piping hot aromatic rasam.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Kerala Chicken Masala",
    desc: "Signature Kerala spice blend infused with roasted coriander, black pepper, fennel, and whole spices for rich homestyle chicken curry.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g", "500 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Chicken Fry Masala",
    desc: "Spicy Kerala marinade powder formulated for making crispy deep-fried chicken, chicken perattu, and dry roasts.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Chicken 65 Masala",
    desc: "Fiery red restaurant-style spice blend formulated for marinating succulent bite-sized Chicken 65 appetizers.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Chicken Sukka Masala",
    desc: "Robust roasted coastal spice blend crafted for cooking semi-dry chicken sukka with grated coconut and curry leaves.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Kerala Meat Masala",
    desc: "Authentic spice mix formulated with roasted coriander, black pepper, star anise, and cinnamon for classic Kerala Erachi Varattiyathu and meat curries.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g", "500 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Beef Roast Masala",
    desc: "Specialized Malabar spice blend packed with black pepper, crushed fennel, and coriander for authentic Kerala slow-roasted beef fry.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Mutton Curry Masala",
    desc: "Rich aromatic spice mix with whole spices and roasted coriander tailored for slow-simmered tender mutton curries.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Fish Curry Masala",
    desc: "Signature Kerala fish curry spice blend with Kashmiri chilli, coriander, and fenugreek; cooks into vibrant red Meen Curry with kudampuli.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g", "500 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Fish Fry Masala",
    desc: "Pre-blended marinade powder of red chilli, turmeric, black pepper, and ginger-garlic for making crispy golden Kerala Meen Porichathu.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Malabar Biriyani Masala",
    desc: "Authentic North Kerala spice blend featuring green cardamom, mace, nutmeg, and cloves for aromatic Thalassery and Kozhikode dum biryani.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g"],
    img: ""
  },
  {
    name: "Kerala Garam Masala",
    desc: "Freshly ground blend of traditional whole spices—cloves, cinnamon, cardamom, star anise, and fennel—essential for Kerala non-veg finishing.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g", "250 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Egg Curry Masala",
    desc: "Mildly spiced fragrant masala mix formulated for preparing Kerala restaurant-style Mutta Roast and coconut milk egg curry.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Vegetable Kurma Masala",
    desc: "Mild fragrant white spice powder with poppy seeds, fennel, and green cardamom for traditional South Indian vegetable kurma with appam and parotta.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Theeyal Masala",
    desc: "Dark roasted spice blend formulated with browned coconut, coriander, and fenugreek for classic Kerala Ulli Theeyal and vegetable theeyal.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Avial Masala",
    desc: "Coarse aromatic cumin-curry leaf spice mix formulated for seasoning traditional mixed vegetable Kerala Avial.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g"],
    img: ""
  },
  {
    name: "Pulissery Masala",
    desc: "Delicate cumin, green chilli, and turmeric blend tailored for simmering Kerala spiced yogurt Moru Curry and Mambazha Pulissery.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g"],
    img: ""
  },
  {
    name: "Kootu Curry Masala",
    desc: "Traditional Sadya spice mix of roasted black pepper, cumin, and browned coconut for celebratory black chickpea and yam Kootu Curry.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g"],
    img: ""
  },
  {
    name: "Curry Powder",
    desc: "Standard South Indian Madras curry powder blend formulated for mild multi-purpose vegetable and meat seasonings.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Idli Podi",
    desc: "Spicy dry roasted lentil and red chilli condiment, commonly known as Gunpowder or Milagai Podi; mixed with sesame oil or ghee for dipping idli and dosa.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g", "500 g"],
    img: ""
  },
  {
    name: "Paruppu Podi",
    desc: "Nutritious roasted lentil powder seasoned with cumin, black pepper, and garlic; mixed directly into hot steaming rice with pure cow ghee.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Chukku Kaapi Powder",
    desc: "Traditional Kerala wellness beverage blend crafted from dried ginger, black pepper, coriander seeds, and tulsi; brewed with palm jaggery.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "200 g"],
    img: ""
  },
  {
    name: "Mango Pickle Masala",
    desc: "Pungent pickling spice blend of mustard, fenugreek, asafoetida, and red chilli powder for preparing homestyle spicy Kerala mango pickles.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Fish Pickle Masala",
    desc: "Specially formulated spicy marinade powder with vinegar notes and mustard for preserving authentic Kerala Meen Achar.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Lemon Pickle Masala",
    desc: "Spicy and tangy pickling spice mix crafted for long-life preservation of salted Naranga Achar.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },

  // ==========================================
  // 5. REGIONAL & PAN-INDIAN MASALAS
  // ==========================================
  {
    name: "Chana Masala",
    desc: "Pungent North Indian chickpea spice blend featuring dried mango, pomegranate seeds, and black salt for spicy Chole gravies.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Pav Bhaji Masala",
    desc: "Aromatic mixed spice blend crafted with fennel, coriander, and amchur for Mumbai-style mashed vegetable bhaji.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Chaat Masala",
    desc: "Zesty, tart seasoning powder with black salt, dry mango, and mint; sprinkled over fruit salads, fried snacks, and street foods.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Kitchen King Masala",
    desc: "Versatile all-purpose North Indian curry powder blend suitable for everyday mixed vegetable curries and paneer gravies.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
  },
  {
    name: "Paneer Butter Masala Mix",
    desc: "Creamy, mildly sweet tomato-cashew spice blend tailored for making restaurant-style rich Paneer Butter Masala.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Shahi Paneer Masala",
    desc: "Royal white-gravy spice blend with green cardamom and mace for mild cottage cheese curries.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Dal Tadka Masala",
    desc: "Tempering spice powder blend featuring roasted cumin, garlic, and dried fenugreek for aromatic dhaba-style yellow dal.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g"],
    img: ""
  },
  {
    name: "Rajma Masala",
    desc: "Robust North Indian spice blend designed for cooking slow-simmered Punjabi red kidney bean gravies.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g"],
    img: ""
  },
  {
    name: "Kebab Masala",
    desc: "Smoky, spicy marinade powder blended for tandoori chicken tikka, seekh kebabs, and barbecue skewers.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g"],
    img: ""
  },
  {
    name: "Tandoori Chicken Masala",
    desc: "Vibrant red tandoor spice marinade formulated for clay-oven and oven-roasted chicken drumsticks.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g"],
    img: ""
  },
  {
    name: "Shawarma Spice Mix",
    desc: "Middle Eastern inspired aromatic seasoning with cumin, allspice, and paprika; popular in Kerala street-food and home kitchen wraps.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Chilli Chicken Masala",
    desc: "Indo-Chinese seasoning mix with garlic, white pepper, and soy notes for making quick spicy chilli chicken stir-fry.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },
  {
    name: "Schezwan Fried Rice Masala",
    desc: "Spicy wok seasoning with dried red chillies, garlic, and Sichuan pepper for home cooking of Chinese fried rice and noodles.",
    qty: "50 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g"],
    img: ""
  },
  {
    name: "Shahi Garam Masala",
    desc: "Refined Mughlai whole spice blend with high proportions of green cardamom, mace, and royal cumin for fragrant festive rice dishes.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["50 g", "100 g"],
    img: ""
  },

  // ==========================================
  // 6. CULINARY SALTS & NATURAL SEASONINGS
  // ==========================================
  {
    name: "Crystal Salt",
    desc: "Unrefined whole sea salt crystals, locally celebrated as Kalluppu; essential for boiling rice kanji, pickling, and traditional South Indian cooking.",
    qty: "1 kg",
    sell_mode: "Fixed",
    unit_symbol: "kg",
    variants: ["1 kg"],
    img: ""
  },
  {
    name: "Loose Crystal Salt",
    desc: "Pure sea salt crystals sold loose by weight at local grocery stores.",
    qty: "1 kg",
    sell_mode: "Manual",
    unit_symbol: "kg",
    variants: [],
    img: ""
  },
  {
    name: "Table Salt",
    desc: "Free-flowing vacuum-evaporated iodized fine salt, locally known as Podi Uppu; standard daily dining table seasoning.",
    qty: "1 kg",
    sell_mode: "Fixed",
    unit_symbol: "kg",
    variants: ["500 g", "1 kg"],
    img: ""
  },
  {
    name: "Black Salt",
    desc: "Kiln-fired mineral rock salt, commonly known as Kala Namak; pungent sulfurous aroma essential for chaats, jaljeera, and vegan egg seasoning.",
    qty: "100 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["100 g", "250 g"],
    img: ""
  },
  {
    name: "Himalayan Pink Salt",
    desc: "Natural unrefined rock salt mined from the Himalayan foothills, locally known as Induppu; rich in trace minerals for daily seasoning.",
    qty: "500 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["500 g", "1 kg"],
    img: ""
  },
  {
    name: "Rock Salt Crystals",
    desc: "Coarse natural rock salt chunks, known as Sendha Namak; used in traditional Ayurvedic fasting diets and cleansing gargles.",
    qty: "500 g",
    sell_mode: "Fixed",
    unit_symbol: "g",
    variants: ["500 g", "1 kg"],
    img: ""
  }
];

console.log('Spices & Masalas items defined:', SPICES_MASALAS.length);
fs.writeFileSync('d:/Labeeb/ANGADI/web/scripts/spices_masalas_data.json', JSON.stringify(SPICES_MASALAS, null, 2), 'utf8');
