export const CATEGORY_TRANSLATIONS: Record<string, Record<string, string>> = {
  'Groceries': {
    ml: 'ഗ്രോസറി',
    ar: 'البقالة',
    hi: 'किराना',
    en: 'Groceries'
  },
  'Grocery': {
    ml: 'ഗ്രോസറി',
    ar: 'البقالة',
    hi: 'किराना',
    en: 'Grocery'
  },
  'Fruits': {
    ml: 'പഴങ്ങൾ',
    ar: 'الفواكه',
    hi: 'फल',
    en: 'Fruits'
  },
  'Vegetables': {
    ml: 'പച്ചക്കറികൾ',
    ar: 'الخضروات',
    hi: 'सब्जियां',
    en: 'Vegetables'
  },
  'Meat & Fish': {
    ml: 'മത്സ്യ മാംസങ്ങൾ',
    ar: 'اللحوم والأسماك',
    hi: 'मांस और मछली',
    en: 'Meat & Fish'
  },
  'Bakery': {
    ml: 'ബേക്കറി',
    ar: 'المخبز',
    hi: 'बेकरी',
    en: 'Bakery'
  },
  'Dairy & Beverages': {
    ml: 'പാലും പാനീയങ്ങളും',
    ar: 'الألبان والمشروبات',
    hi: 'डेयरी और पेय पदार्थ',
    en: 'Dairy & Beverages'
  },
  'Household Essentials': {
    ml: 'വീട്ടുസാധനങ്ങൾ',
    ar: 'المستلزمات المنزلية',
    hi: 'घरेलू सामान',
    en: 'Household Essentials'
  },
  'Stationery': {
    ml: 'സ്റ്റേഷനറി',
    ar: 'الأدوات المكتبية',
    hi: 'स्टेशनरी',
    en: 'Stationery'
  }
}

export function getCategoryLocalizedName(categoryName: string, locale: string = 'en'): string {
  if (!categoryName) return ''
  const mapping = CATEGORY_TRANSLATIONS[categoryName.trim()]
  if (mapping && mapping[locale]) {
    return mapping[locale]
  }
  return categoryName
}
