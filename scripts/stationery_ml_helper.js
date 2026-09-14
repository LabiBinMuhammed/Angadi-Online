// Comprehensive Malayalam translation helper for Stationery and Personal Care brands

const mlPhrases = [
  // Brands - Stationery
  ['papergrid', 'പേപ്പർഗ്രിഡ്'],
  ['kokuyo camlin', 'കൊകുയോ ക്യാംലിൻ'],
  ['camlin kokuyo', 'ക്യാംലിൻ കൊകുയോ'],
  ['camlin', 'ക്യാംലിൻ'],
  ['pentonic', 'പെന്റോണിക്'],
  ['win pens', 'വിൻ പെന്നുകൾ'],
  ['win pen', 'വിൻ പേന'],
  ['win', 'വിൻ'],
  ['totem', 'ടോട്ടം'],
  ['flair', 'ഫ്ലെയർ'],
  ['doms amariz', 'ഡോംസ് അമരിസ്'],
  ['amariz', 'അമരിസ്'],
  ['doms', 'ഡോംസ്'],
  ['nataraj', 'നടരാജ്'],

  // Brands - Personal Care & Hygiene
  ['parachute advansed', 'പാരഷൂട്ട് അഡ്വാൻസ്ഡ്'],
  ['parachute', 'പാരഷൂട്ട്'],
  ['himalaya', 'ഹിമാലയ'],
  ['lux', 'ലക്സ്'],
  ['vivel', 'വിവെൽ'],
  ['cutee', 'ക്യൂട്ടീ'],
  ['pears', 'പിയേഴ്സ്'],
  ['santoor', 'സന്തൂർ'],
  ['cinthol', 'സിന്തോൾ'],

  // Personal Care Product Types
  ['aloe vera soap', 'കറ്റാർവാഴ സോപ്പ്'],
  ['bathing soap', 'കുളി സോപ്പ്'],
  ['beauty soap', 'സൗന്ദര്യ സോപ്പ്'],
  ['baby soap', 'ബേബി സോപ്പ്'],
  ['body wash', 'ബോഡി വാഷ്'],
  ['shower gel', 'ഷവർ ജെൽ'],
  ['hand wash', 'ഹാൻഡ് വാഷ്'],
  ['body lotion', 'ബോഡി ലോഷൻ'],
  ['hair oil', 'ഹെയർ ഓയിൽ'],
  ['coconut hair oil', 'വെളിച്ചെണ്ണ ഹെയർ ഓയിൽ'],
  ['face wash', 'ഫേസ് വാഷ്'],
  ['face serum', 'ഫേസ് സെറം'],
  ['face cream', 'ഫേസ് ക്രീം'],
  ['sunscreen', 'സൺസ്ക്രീൻ'],
  ['talc powder', 'ടാൽക്കം പൗഡർ'],
  ['talc', 'ടാൽക്ക്'],
  ['deodorant', 'ഡിയോഡറന്റ്'],
  ['deo', 'ഡിയോ'],
  ['shampoo', 'ഷാംപൂ'],
  ['conditioner', 'കണ്ടീഷണർ'],
  ['lip balm', 'ലിപ് ബാം'],
  ['lip butter', 'ലിപ് ബട്ടർ'],
  ['baby powder', 'ബേബി പൗഡർ'],
  ['baby lotion', 'ബേബി ലോഷൻ'],
  ['baby cream', 'ബേബി ക്രീം'],
  ['baby wash', 'ബേബി വാഷ്'],
  ['pure glycerine', 'പ്യുവർ ഗ്ലിസറിൻ'],
  ['glycerin', 'ഗ്ലിസറിൻ'],
  ['sandalwood', 'ചന്ദനം'],
  ['sandal', 'ചന്ദനം'],
  ['turmeric', 'മഞ്ഞൾ'],
  ['rose', 'പനിനീർ'],
  ['jasmine', 'മുല്ലപ്പൂ'],
  ['neem', 'വേപ്പ്'],
  ['aloe vera', 'കറ്റാർവാഴ'],
  ['aloe', 'കറ്റാർവാഴ'],
  ['almond', 'ബദാം'],
  ['olive', 'ഒലിവ്'],
  ['honey', 'തേൻ'],
  ['lime', 'നാരങ്ങ'],
  ['cool mint', 'കൂൾ പുതിന'],
  ['soap', 'സോപ്പ്'],
  ['soaps', 'സോപ്പുകൾ'],

  // Stationery Terms
  ['writing pencils', 'എഴുത്ത് പെൻസിലുകൾ'],
  ['writing pencil', 'എഴുത്ത് പെൻസിൽ'],
  ['drawing pencils', 'ഡ്രോയിംഗ് പെൻസിലുകൾ'],
  ['drawing pencil', 'ഡ്രോയിംഗ് പെൻസിൽ'],
  ['student notebooks', 'സ്റ്റുഡന്റ് നോട്ട്ബുക്കുകൾ'],
  ['student notebook', 'സ്റ്റുഡന്റ് നോട്ട്ബുക്ക്'],
  ['soft cover', 'സോഫ്റ്റ് കവർ'],
  ['hard cover', 'ഹാർഡ് കവർ'],
  ['geometry box', 'ജോമെട്രി ബോക്സ്'],
  ['scale', 'സ്കെയിൽ'],
  ['eraser', 'ഇറേസർ'],
  ['sharpener', 'ഷാർപ്നർ'],
  ['fountain pen', 'ഫൗണ്ടൻ പേന'],
  ['fountain pens', 'ഫൗണ്ടൻ പെന്നുകൾ'],
  ['marker ink', 'മാർക്കർ മഷി'],
  ['permanent marker', 'പെർമനന്റ് മാർക്കർ'],
  ['notebook', 'നോട്ട്ബുക്ക്'],
  ['notebooks', 'നോട്ട്ബുക്കുകൾ'],
  ['ball pen', 'ബോൾ പേന'],
  ['gel pen', 'ജെൽ പേന'],
  ['pen', 'പേന'],
  ['pens', 'പെന്നുകൾ']
];

function getMalayalamTranslation(cleanName) {
  let res = cleanName.toLowerCase();
  for (const [en, ml] of mlPhrases) {
    const reg = new RegExp(`\\b${en.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`, 'gi');
    res = res.replace(reg, ml);
  }
  return res.replace(/\s+/g, ' ').trim();
}

module.exports = {
  getStationeryMalayalam: getMalayalamTranslation,
  getMalayalamTranslation
};
