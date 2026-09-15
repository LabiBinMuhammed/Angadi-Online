const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require(path.join(__dirname, '../web/node_modules/@supabase/supabase-js'));

const envText = fs.readFileSync(path.join(__dirname, '../web/.env.local'), 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CATEGORY_ID = 'cc30f6b9-532d-48ad-8c1c-7e2542e62454'; // Beverages
const CATEGORY_NAME = 'Beverages';

const UNITS = {
  ml: '4d3b2515-c26d-4c05-ab72-13ff6c6d0938',
  L: '24f2e09f-23d1-4919-a6c3-7a3d11fae4ef',
  bottle: '6aece001-9ce7-4325-b1ff-5b4f9405a97a',
  pack: '5cb5e824-4974-40f9-82ec-6edaa9ad32aa',
  pcs: '9137e686-0e75-4a6b-a261-891b1e4e9774'
};

const beverageProducts = [
  // 7UP
  {
    code: 'ANG-BEV-1275',
    name: '7UP Original Lemon-Lime Soda',
    mlName: '7അപ്പ് ലെമൺ ലൈം സോഡ',
    imgUrl: 'https://www.7up.ie/prod/s3fs-public/2024-12/7up-slim-pack-regular.png',
    basePrice: 53.33, // per L (~₹40 for 750ml)
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: false, order: 1 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 38, is_default: false, order: 2 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 40, is_default: true, order: 3 },
      { label: '1.25L Bottle', unitId: UNITS.L, value: 1.25, price: 65, is_default: false, order: 4 },
      { label: '2L Bottle', unitId: UNITS.L, value: 2, price: 95, is_default: false, order: 5 },
      { label: '2.25L Bottle', unitId: UNITS.L, value: 2.25, price: 100, is_default: false, order: 6 }
    ]
  },
  {
    code: 'ANG-BEV-1276',
    name: '7UP Zero Sugar Lemon-Lime Soda',
    mlName: '7അപ്പ് സീറോ ഷുഗർ ലെമൺ ലൈം സോഡ',
    imgUrl: 'https://www.7up.ie/prod/s3fs-public/2024-12/7up-slim-pack-zero.png',
    basePrice: 53.33,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: false, order: 1 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 38, is_default: false, order: 2 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 40, is_default: true, order: 3 }
    ]
  },
  {
    code: 'ANG-BEV-1277',
    name: '7UP Pink Lemonade Zero Sugar',
    mlName: '7അപ്പ് പിങ്ക് ലെമണേഡ് സീറോ ഷുഗർ',
    imgUrl: 'https://www.7up.ie/prod/s3fs-public/2025-06/250428_7Up_PinkLemonade_ATL_KVs_0015_AlphaCondensation_CanCondensation%201.png',
    basePrice: 160.00,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 40, is_default: true, order: 1 },
      { label: '330ml Can', unitId: UNITS.ml, value: 330, price: 60, is_default: false, order: 2 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 45, is_default: false, order: 3 }
    ]
  },
  {
    code: 'ANG-BEV-1278',
    name: '7UP Nimbooz Real Lemon Juice Drink',
    mlName: '7അപ്പ് നിമ്പൂസ് റിയൽ ലെമൺ ജ്യൂസ്',
    imgUrl: 'https://www.7up.ie/prod/s3fs-public/2024-12/7up-slim-pack-regular.png',
    basePrice: 66.67,
    variants: [
      { label: '250ml Tetra Pack', unitId: UNITS.ml, value: 250, price: 20, is_default: false, order: 1 },
      { label: '350ml Bottle', unitId: UNITS.ml, value: 350, price: 25, is_default: true, order: 2 },
      { label: '600ml Bottle', unitId: UNITS.ml, value: 600, price: 40, is_default: false, order: 3 }
    ]
  },

  // PEPSI
  {
    code: 'ANG-BEV-1279',
    name: 'Pepsi Cola Original Soft Drink',
    mlName: 'പെപ്സി ഒറിജിനൽ കോള സോഫ്റ്റ്‌ ഡ്രിങ്ക്',
    imgUrl: 'https://www.pepsi.com/prod/s3fs-public/2026-01/product_image_pepsi.png',
    basePrice: 53.33,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: false, order: 1 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 38, is_default: false, order: 2 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 40, is_default: true, order: 3 },
      { label: '1.25L Bottle', unitId: UNITS.L, value: 1.25, price: 65, is_default: false, order: 4 },
      { label: '2L Bottle', unitId: UNITS.L, value: 2, price: 95, is_default: false, order: 5 },
      { label: '2.25L Bottle', unitId: UNITS.L, value: 2.25, price: 100, is_default: false, order: 6 }
    ]
  },
  {
    code: 'ANG-BEV-1280',
    name: 'Pepsi Zero Sugar Cola Soft Drink',
    mlName: 'പെപ്സി സീറോ ഷുഗർ / പെപ്സി ബ്ലാക്ക്',
    imgUrl: 'https://www.pepsi.com/prod/s3fs-public/2026-01/product_image_pepsi_zero_0.png',
    basePrice: 53.33,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: true, order: 1 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 38, is_default: false, order: 2 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 40, is_default: false, order: 3 }
    ]
  },
  {
    code: 'ANG-BEV-1281',
    name: 'Diet Pepsi Soft Drink',
    mlName: 'ഡയറ്റ് പെപ്സി സോഫ്റ്റ്‌ ഡ്രിങ്ക്',
    imgUrl: 'https://www.pepsi.com/prod/s3fs-public/2026-01/product_image_pepsi_diet_0.png',
    basePrice: 80.00,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 40, is_default: true, order: 1 },
      { label: '300ml Can', unitId: UNITS.ml, value: 300, price: 45, is_default: false, order: 2 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 40, is_default: false, order: 3 }
    ]
  },
  {
    code: 'ANG-BEV-1282',
    name: 'Pepsi Wild Cherry Flavoured Cola',
    mlName: 'പെപ്സി വൈൽഡ് ചെറി ഫ്ലേവർഡ് കോള',
    imgUrl: 'https://www.pepsi.com/prod/s3fs-public/2026-01/product_image_pepsi_wild_cherry.png',
    basePrice: 180.00,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 45, is_default: true, order: 1 },
      { label: '355ml Can', unitId: UNITS.ml, value: 355, price: 70, is_default: false, order: 2 }
    ]
  },
  {
    code: 'ANG-BEV-1283',
    name: 'Pepsi-Cola Real Sugar Soft Drink',
    mlName: 'പെപ്സി കോള റിയൽ ഷുഗർ',
    imgUrl: 'https://www.pepsi.com/prod/s3fs-public/2026-01/product_image_pepsi_soda_1.png',
    basePrice: 151.51,
    variants: [
      { label: '330ml Glass Bottle', unitId: UNITS.ml, value: 330, price: 50, is_default: true, order: 1 },
      { label: '355ml Can', unitId: UNITS.ml, value: 355, price: 75, is_default: false, order: 2 }
    ]
  },

  // MOUNTAIN DEW
  {
    code: 'ANG-BEV-1284',
    name: 'Mountain Dew Original Citrus Soft Drink',
    mlName: 'മൗണ്ടൻ ഡ്യൂ സിട്രസ് സോഫ്റ്റ്‌ ഡ്രിങ്ക്',
    imgUrl: 'https://www.mountaindew.com/prod/s3fs-public/2026-02/Original-Dew-thumbnail.png',
    basePrice: 53.33,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: false, order: 1 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 38, is_default: false, order: 2 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 40, is_default: true, order: 3 },
      { label: '1.25L Bottle', unitId: UNITS.L, value: 1.25, price: 65, is_default: false, order: 4 },
      { label: '2L Bottle', unitId: UNITS.L, value: 2, price: 95, is_default: false, order: 5 },
      { label: '2.25L Bottle', unitId: UNITS.L, value: 2.25, price: 100, is_default: false, order: 6 }
    ]
  },
  {
    code: 'ANG-BEV-1285',
    name: 'Mountain Dew Zero Sugar Citrus Drink',
    mlName: 'മൗണ്ടൻ ഡ്യൂ സീറോ ഷുഗർ',
    imgUrl: 'https://www.mountaindew.com/prod/s3fs-public/2025-05/Product%20Square%20-%20Zero.png',
    basePrice: 53.33,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: true, order: 1 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 38, is_default: false, order: 2 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 40, is_default: false, order: 3 }
    ]
  },
  {
    code: 'ANG-BEV-1286',
    name: 'Mountain Dew Baja Blast Tropical Lime Drink',
    mlName: 'മൗണ്ടൻ ഡ്യൂ ബാജ ബ്ലാസ്റ്റ് ട്രോപ്പിക്കൽ ലൈം',
    imgUrl: 'https://www.mountaindew.com/prod/s3fs-public/2026-04/Baja-Blast-thumbnail.png',
    basePrice: 180.00,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 45, is_default: true, order: 1 },
      { label: '355ml Can', unitId: UNITS.ml, value: 355, price: 75, is_default: false, order: 2 },
      { label: '591ml Bottle', unitId: UNITS.ml, value: 591, price: 95, is_default: false, order: 3 }
    ]
  },
  {
    code: 'ANG-BEV-1287',
    name: 'Mountain Dew Baja Blast Zero Sugar',
    mlName: 'മൗണ്ടൻ ഡ്യൂ ബാജ ബ്ലാസ്റ്റ് സീറോ ഷുഗർ',
    imgUrl: 'https://www.mountaindew.com/prod/s3fs-public/2026-04/Baja-Blast-Zero-thumbnail.png',
    basePrice: 211.26,
    variants: [
      { label: '355ml Can', unitId: UNITS.ml, value: 355, price: 75, is_default: true, order: 1 },
      { label: '591ml Bottle', unitId: UNITS.ml, value: 591, price: 95, is_default: false, order: 2 }
    ]
  },
  {
    code: 'ANG-BEV-1288',
    name: 'Mountain Dew Code Red Cherry Flavoured Soda',
    mlName: 'മൗണ്ടൻ ഡ്യൂ കോഡ് റെഡ് ചെറി ഫ്ലേവർ',
    imgUrl: 'https://www.mountaindew.com/prod/s3fs-public/2026-02/Code-Red-thumbnail.png',
    basePrice: 211.26,
    variants: [
      { label: '355ml Can', unitId: UNITS.ml, value: 355, price: 75, is_default: true, order: 1 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 80, is_default: false, order: 2 }
    ]
  },
  {
    code: 'ANG-BEV-1289',
    name: 'Mountain Dew Voltage Raspberry Citrus Soda',
    mlName: 'മൗണ്ടൻ ഡ്യൂ വോൾട്ടേജ് റാസ്പ്ബെറി സിട്രസ്',
    imgUrl: 'https://www.mountaindew.com/prod/s3fs-public/2026-02/Voltage-thumbnail.png',
    basePrice: 211.26,
    variants: [
      { label: '355ml Can', unitId: UNITS.ml, value: 355, price: 75, is_default: true, order: 1 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 80, is_default: false, order: 2 }
    ]
  },
  {
    code: 'ANG-BEV-1290',
    name: 'Mountain Dew Diet Dew Citrus Drink',
    mlName: 'ഡയറ്റ് മൗണ്ടൻ ഡ്യൂ സിട്രസ് ഡ്രിങ്ക്',
    imgUrl: 'https://www.mountaindew.com/prod/s3fs-public/2026-03/Diet-Dew-thumbnail.png',
    basePrice: 211.26,
    variants: [
      { label: '355ml Can', unitId: UNITS.ml, value: 355, price: 75, is_default: true, order: 1 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 80, is_default: false, order: 2 }
    ]
  },

  // COCA-COLA INDIA
  {
    code: 'ANG-BEV-1291',
    name: 'Coca-Cola Original Taste Cola',
    mlName: 'കൊക്കക്കോള ഒറിജിനൽ ടേസ്റ്റ് കോള',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/coca-cola/Coke_234x700.png',
    basePrice: 53.33,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: false, order: 1 },
      { label: '300ml Can', unitId: UNITS.ml, value: 300, price: 40, is_default: false, order: 2 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 38, is_default: false, order: 3 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 40, is_default: true, order: 4 },
      { label: '1.25L Bottle', unitId: UNITS.L, value: 1.25, price: 65, is_default: false, order: 5 },
      { label: '2L Bottle', unitId: UNITS.L, value: 2, price: 95, is_default: false, order: 6 },
      { label: '2.25L Bottle', unitId: UNITS.L, value: 2.25, price: 100, is_default: false, order: 7 }
    ]
  },
  {
    code: 'ANG-BEV-1292',
    name: 'Coca-Cola Zero Sugar Soft Drink',
    mlName: 'കൊക്കക്കോള സീറോ ഷുഗർ സോഫ്റ്റ്‌ ഡ്രിങ്ക്',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/coca-cola/can%20of%20cola%20zero.png',
    basePrice: 53.33,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: true, order: 1 },
      { label: '300ml Can', unitId: UNITS.ml, value: 300, price: 40, is_default: false, order: 2 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 40, is_default: false, order: 3 }
    ]
  },
  {
    code: 'ANG-BEV-1293',
    name: 'Diet Coke Soft Drink',
    mlName: 'ഡയറ്റ് കോക്ക് സോഫ്റ്റ്‌ ഡ്രിങ്ക്',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/coca-cola/Diet-coke234-700.png',
    basePrice: 60.00,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 40, is_default: true, order: 1 },
      { label: '300ml Can', unitId: UNITS.ml, value: 300, price: 45, is_default: false, order: 2 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 45, is_default: false, order: 3 }
    ]
  },
  {
    code: 'ANG-BEV-1294',
    name: 'Sprite Lemon-Lime Flavoured Drink',
    mlName: 'സ്പ്രൈറ്റ് ലെമൺ ലൈം സോഫ്റ്റ്‌ ഡ്രിങ്ക്',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/sprite/Sprite-234x700.png',
    basePrice: 53.33,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: false, order: 1 },
      { label: '300ml Can', unitId: UNITS.ml, value: 300, price: 40, is_default: false, order: 2 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 38, is_default: false, order: 3 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 40, is_default: true, order: 4 },
      { label: '1.25L Bottle', unitId: UNITS.L, value: 1.25, price: 65, is_default: false, order: 5 },
      { label: '2L Bottle', unitId: UNITS.L, value: 2, price: 95, is_default: false, order: 6 },
      { label: '2.25L Bottle', unitId: UNITS.L, value: 2.25, price: 100, is_default: false, order: 7 }
    ]
  },
  {
    code: 'ANG-BEV-1295',
    name: 'Thums Up Charged Fizzy Cola',
    mlName: 'തംസ് അപ്പ് ചാർജ്ഡ് ഫിസ്സി കോള',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/brands/thums-up/products-thums-up/tu-750ml-new-label-r2-copy.png',
    basePrice: 53.33,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: false, order: 1 },
      { label: '300ml Can', unitId: UNITS.ml, value: 300, price: 40, is_default: false, order: 2 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 38, is_default: false, order: 3 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 40, is_default: true, order: 4 },
      { label: '1.25L Bottle', unitId: UNITS.L, value: 1.25, price: 65, is_default: false, order: 5 },
      { label: '2L Bottle', unitId: UNITS.L, value: 2, price: 95, is_default: false, order: 6 },
      { label: '2.25L Bottle', unitId: UNITS.L, value: 2.25, price: 100, is_default: false, order: 7 }
    ]
  },
  {
    code: 'ANG-BEV-1296',
    name: 'Thums Up X-Force Strong Fizzy Cola',
    mlName: 'തംസ് അപ്പ് എക്സ്-ഫോഴ്സ് കോള',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/brands/thums-up/products-thums-up/thums-up_500ml-e-com_1.jpg',
    basePrice: 60.00,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: false, order: 1 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 40, is_default: true, order: 2 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 45, is_default: false, order: 3 }
    ]
  },
  {
    code: 'ANG-BEV-1297',
    name: 'Limca Lemon & Lime Flavoured Drink',
    mlName: 'ലിംക ലെമൺ & ലൈം ഫ്ലേവർഡ് ഡ്രിങ്ക്',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/limca/limca%20new%20bottle%20desktop.jpg',
    basePrice: 53.33,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: false, order: 1 },
      { label: '300ml Can', unitId: UNITS.ml, value: 300, price: 40, is_default: false, order: 2 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 38, is_default: false, order: 3 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 40, is_default: true, order: 4 },
      { label: '1.25L Bottle', unitId: UNITS.L, value: 1.25, price: 65, is_default: false, order: 5 },
      { label: '2L Bottle', unitId: UNITS.L, value: 2, price: 95, is_default: false, order: 6 }
    ]
  },
  {
    code: 'ANG-BEV-1298',
    name: 'Fanta Orange Flavoured Drink',
    mlName: 'ഫാന്റാ ഓറഞ്ച് ഫ്ലേവർഡ് ഡ്രിങ്ക്',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/fanta/updated-packshots/750x750-packshot-desktop.jpg',
    basePrice: 53.33,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: false, order: 1 },
      { label: '300ml Can', unitId: UNITS.ml, value: 300, price: 40, is_default: false, order: 2 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 38, is_default: false, order: 3 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 40, is_default: true, order: 4 },
      { label: '1.25L Bottle', unitId: UNITS.L, value: 1.25, price: 65, is_default: false, order: 5 },
      { label: '2L Bottle', unitId: UNITS.L, value: 2, price: 95, is_default: false, order: 6 },
      { label: '2.25L Bottle', unitId: UNITS.L, value: 2.25, price: 100, is_default: false, order: 7 }
    ]
  },
  {
    code: 'ANG-BEV-1299',
    name: 'Fanta Apple Delite Fizzy Drink',
    mlName: 'ഫാന്റാ ആപ്പിൾ ഡിലൈറ്റ് ഫിസ്സി ഡ്രിങ്ക്',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/fanta/apple-234-700-fanta-test.png',
    basePrice: 53.33,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 35, is_default: false, order: 1 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 38, is_default: false, order: 2 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 40, is_default: true, order: 3 }
    ]
  },
  {
    code: 'ANG-BEV-1300',
    name: 'Maaza Real Mango Juice Drink',
    mlName: 'മാസ മാമ്പഴ ജ്യൂസ് ഡ്രിങ്ക്',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/maaza/maaza-bottles/maaza_packshot_1100x1100.jpg',
    basePrice: 70.00,
    variants: [
      { label: '150ml Tetra Pack', unitId: UNITS.ml, value: 150, price: 15, is_default: false, order: 1 },
      { label: '250ml Bottle', unitId: UNITS.ml, value: 250, price: 20, is_default: false, order: 2 },
      { label: '600ml Bottle', unitId: UNITS.ml, value: 600, price: 42, is_default: true, order: 3 },
      { label: '1.2L Bottle', unitId: UNITS.L, value: 1.2, price: 75, is_default: false, order: 4 }
    ]
  },
  {
    code: 'ANG-BEV-1301',
    name: 'Minute Maid Pulpy Orange Juice Drink',
    mlName: 'മിനിറ്റ് മെയ്ഡ് പൾപ്പി ഓറഞ്ച് ജ്യൂസ്',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/minute-maid/464x464.jpg',
    basePrice: 85.00,
    variants: [
      { label: '250ml Bottle', unitId: UNITS.ml, value: 250, price: 25, is_default: false, order: 1 },
      { label: '400ml Bottle', unitId: UNITS.ml, value: 400, price: 38, is_default: true, order: 2 },
      { label: '1L Bottle', unitId: UNITS.L, value: 1, price: 85, is_default: false, order: 3 }
    ]
  },
  {
    code: 'ANG-BEV-1302',
    name: 'Minute Maid Honey Infused Apple Juice',
    mlName: 'മിനിറ്റ് മെയ്ഡ് ഹണി ഇൻഫ്യൂസ്ഡ് ആപ്പിൾ ജ്യൂസ്',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/minute-maid-tetra/mmtetra-resize-desktop/1.png',
    basePrice: 110.00,
    variants: [
      { label: '150ml Tetra Pack', unitId: UNITS.ml, value: 150, price: 20, is_default: true, order: 1 },
      { label: '1L Tetra Pack', unitId: UNITS.L, value: 1, price: 110, is_default: false, order: 2 }
    ]
  },
  {
    code: 'ANG-BEV-1303',
    name: 'Minute Maid Honey Infused Guava Juice',
    mlName: 'മിനിറ്റ് മെയ്ഡ് ഹണി ഇൻഫ്യൂസ്ഡ് ഗ്വാവ ജ്യൂസ്',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/minute-maid-tetra/mmtetra-resize-desktop/2.png',
    basePrice: 110.00,
    variants: [
      { label: '150ml Tetra Pack', unitId: UNITS.ml, value: 150, price: 20, is_default: true, order: 1 },
      { label: '1L Tetra Pack', unitId: UNITS.L, value: 1, price: 110, is_default: false, order: 2 }
    ]
  },
  {
    code: 'ANG-BEV-1304',
    name: 'Minute Maid Honey Infused Mixed Fruit Juice',
    mlName: 'മിനിറ്റ് മെയ്ഡ് ഹണി ഇൻഫ്യൂസ്ഡ് മിക്സഡ് ഫ്രൂട്ട് ജ്യൂസ്',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/minute-maid-tetra/mmtetra-resize-desktop/3.png',
    basePrice: 110.00,
    variants: [
      { label: '150ml Tetra Pack', unitId: UNITS.ml, value: 150, price: 20, is_default: true, order: 1 },
      { label: '1L Tetra Pack', unitId: UNITS.L, value: 1, price: 110, is_default: false, order: 2 }
    ]
  },
  {
    code: 'ANG-BEV-1305',
    name: 'Minute Maid Vita Punch Apple Berry Drink',
    mlName: 'മിനിറ്റ് മെയ്ഡ് വീറ്റാ പഞ്ച് ആപ്പിൾ ബെറി',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/minute-maid-tetra/mmtetra-resize-desktop/4.png',
    basePrice: 125.00,
    variants: [
      { label: '150ml Tetra Pack', unitId: UNITS.ml, value: 150, price: 20, is_default: true, order: 1 },
      { label: '200ml Tetra Pack', unitId: UNITS.ml, value: 200, price: 25, is_default: false, order: 2 }
    ]
  },
  {
    code: 'ANG-BEV-1306',
    name: 'Minute Maid Vita Punch Mixed Fruit Drink',
    mlName: 'മിനിറ്റ് മെയ്ഡ് വീറ്റാ പഞ്ച് മിക്സഡ് ഫ്രൂട്ട്',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/minute-maid-tetra/mmtetra-resize-desktop/5.png',
    basePrice: 125.00,
    variants: [
      { label: '150ml Tetra Pack', unitId: UNITS.ml, value: 150, price: 20, is_default: true, order: 1 },
      { label: '200ml Tetra Pack', unitId: UNITS.ml, value: 200, price: 25, is_default: false, order: 2 }
    ]
  },
  {
    code: 'ANG-BEV-1307',
    name: 'Kinley Packaged Drinking Water',
    mlName: 'കിൻലെ പാക്കേജ്ഡ് ഡ്രിങ്കിംഗ് വാട്ടർ',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/kinley/kinley%20desktop.jpg',
    basePrice: 20.00,
    variants: [
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 10, is_default: false, order: 1 },
      { label: '1L Bottle', unitId: UNITS.L, value: 1, price: 20, is_default: true, order: 2 },
      { label: '2L Bottle', unitId: UNITS.L, value: 2, price: 30, is_default: false, order: 3 },
      { label: '20L Can', unitId: UNITS.L, value: 20, price: 90, is_default: false, order: 4 }
    ]
  },
  {
    code: 'ANG-BEV-1308',
    name: 'Kinley Club Soda',
    mlName: 'കിൻലെ ക്ലബ്ബ് സോഡ',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/home-page-test-img/brands/kinley/Kinley-Soda-234x700.jpg',
    basePrice: 26.67,
    variants: [
      { label: '250ml Can', unitId: UNITS.ml, value: 250, price: 20, is_default: false, order: 1 },
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 15, is_default: false, order: 2 },
      { label: '750ml Bottle', unitId: UNITS.ml, value: 750, price: 20, is_default: true, order: 3 }
    ]
  },
  {
    code: 'ANG-BEV-1309',
    name: 'Kinley Copper Extra Mineral Water',
    mlName: 'കിൻലെ കോപ്പർ മിനറൽ വാട്ടർ',
    imgUrl: 'https://www.coca-cola.com/content/dam/onexp/in/en/brands/kinley/kinley-copper/kinley-extra-copper-bottle.jpg',
    basePrice: 25.00,
    variants: [
      { label: '500ml Bottle', unitId: UNITS.ml, value: 500, price: 15, is_default: false, order: 1 },
      { label: '1L Bottle', unitId: UNITS.L, value: 1, price: 25, is_default: true, order: 2 }
    ]
  }
];

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const referer = url.includes('pepsi.com') ? 'https://www.pepsi.com/products' : (url.includes('7up.ie') ? 'https://www.7up.ie/products' : parsed.origin);
    client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': referer
      },
      timeout: 30000
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, url).toString();
        }
        return downloadImage(redirectUrl).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || 'image/jpeg';
        let ext = 'jpg';
        if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('svg')) ext = 'svg';
        resolve({ buffer, contentType, ext });
      });
    }).on('error', reject);
  });
}

async function uploadToSupabase(buffer, contentType, ext, filename) {
  const filePath = `demos/beverages/${filename}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('item-images')
    .upload(filePath, buffer, {
      contentType,
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('item-images')
    .getPublicUrl(filePath);

  return publicUrl;
}

function verifyCdnUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 200) resolve(true);
      else reject(new Error(`CDN verification failed with status ${res.statusCode}`));
    }).on('error', reject);
  });
}

async function run() {
  console.log(`Starting import of ${beverageProducts.length} beverage product templates...`);
  const results = [];

  for (const item of beverageProducts) {
    console.log(`\nProcessing [${item.code}] ${item.name}...`);
    try {
      // 1. Download image
      const safeName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
      const imgData = await downloadImage(item.imgUrl);
      console.log(`  Downloaded image (${imgData.buffer.length} bytes, ${imgData.ext})`);

      // 2. Upload to Supabase Storage
      const cdnUrl = await uploadToSupabase(imgData.buffer, imgData.contentType, imgData.ext, safeName);
      console.log(`  Uploaded to Supabase Storage: ${cdnUrl}`);

      // 3. Verify CDN
      await verifyCdnUrl(cdnUrl);
      console.log(`  Verified CDN: HTTP 200 OK`);

      // 4. Upsert demo_item
      const { data: existing } = await supabase
        .from('demo_items')
        .select('id')
        .eq('code', item.code)
        .maybeSingle();

      let itemId;
      if (existing) {
        itemId = existing.id;
        const { error: updErr } = await supabase
          .from('demo_items')
          .update({
            name: item.name,
            category_id: CATEGORY_ID,
            unit_id: UNITS.L,
            sell_mode: 'Fixed',
            default_image: cdnUrl
          })
          .eq('id', itemId);
        if (updErr) throw updErr;
        console.log(`  Updated demo_item ID: ${itemId}`);
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('demo_items')
          .insert({
            code: item.code,
            name: item.name,
            category_id: CATEGORY_ID,
            unit_id: UNITS.L,
            sell_mode: 'Fixed',
            default_image: cdnUrl
          })
          .select('id')
          .single();
        if (insErr) throw insErr;
        itemId = inserted.id;
        console.log(`  Inserted demo_item ID: ${itemId}`);
      }

      // 5. Upsert demo_item_translations (Malayalam)
      const { error: trErr } = await supabase
        .from('demo_item_translations')
        .upsert({
          demo_item_id: itemId,
          language_code: 'ml',
          name: item.mlName
        }, { onConflict: 'demo_item_id,language_code' });
      if (trErr) console.warn('  Translation upsert warning:', trErr.message);
      else console.log(`  Malayalam translation saved: ${item.mlName}`);

      // 6. Upsert demo_sell_config (+15% ceiling limit)
      const maxPrice = Math.round(item.basePrice * 1.15 * 100) / 100;
      const { error: sellErr } = await supabase
        .from('demo_sell_config')
        .upsert({
          demo_item_id: itemId,
          sell_mode: 'Fixed',
          base_unit_id: UNITS.L,
          price_per_base_unit: item.basePrice,
          allow_custom_quantity: false,
          max_price_increase_percent: 15.00,
          max_price_limit: maxPrice
        }, { onConflict: 'demo_item_id' });
      if (sellErr) console.warn('  Sell config upsert warning:', sellErr.message);
      else console.log(`  Sell config saved: ₹${item.basePrice}/L (Ceiling: ₹${maxPrice})`);

      // 7. Re-insert demo_variants
      await supabase.from('demo_variants').delete().eq('demo_item_id', itemId);
      const varRows = item.variants.map(v => ({
        demo_item_id: itemId,
        variant_type: 'Fixed',
        label: v.label,
        unit_id: v.unitId,
        value: v.value,
        price: v.price,
        is_default: v.is_default,
        is_active: true,
        display_order: v.order
      }));
      const { error: varErr } = await supabase.from('demo_variants').insert(varRows);
      if (varErr) console.warn('  Variants insert warning:', varErr.message);
      else console.log(`  Inserted ${varRows.length} packaging variants`);

      results.push({
        code: item.code,
        name: item.name,
        mlName: item.mlName,
        category: CATEGORY_NAME,
        image: cdnUrl,
        variantsCount: item.variants.length,
        defaultVariant: item.variants.find(v => v.is_default)?.label || ''
      });
    } catch(err) {
      console.error(`  Error processing ${item.code}:`, err.message);
    }
  }

  // Export CSV
  console.log(`\nExporting ${results.length} items to CSV...`);
  const csvDir = path.join(__dirname, '../cateloge/new');
  if (!fs.existsSync(csvDir)) fs.mkdirSync(csvDir, { recursive: true });
  const csvPath = path.join(csvDir, 'angadi_kerala_beverages_catalog.csv');

  const headers = ['Code', 'Product Name', 'Malayalam Name', 'Category', 'Default Image URL', 'Variants Count', 'Default Variant'];
  const rows = results.map(r => [
    `"${r.code}"`,
    `"${r.name.replace(/"/g, '""')}"`,
    `"${r.mlName.replace(/"/g, '""')}"`,
    `"${r.category}"`,
    `"${r.image}"`,
    r.variantsCount,
    `"${r.defaultVariant}"`
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  fs.writeFileSync(csvPath, csvContent);
  console.log(`Exported catalog CSV successfully to ${csvPath}`);
}

run();
