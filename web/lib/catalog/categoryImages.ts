/**
 * Curated Kerala-first Category Images & Visual Identity Registry
 * Provides crisp, high-resolution photography and iconography for all canonical categories.
 */

export interface CategoryVisualMeta {
  imageUrl: string
  emoji: string
  color: string
  malayalamDefault: string
  tags: string[]
}

export const CATEGORY_VISUALS: Record<string, CategoryVisualMeta> = {
  'Fresh Vegetables': {
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    emoji: '🥬',
    color: '#10b981',
    malayalamDefault: 'പച്ചക്കറികൾ',
    tags: ['vegetable', 'greens', 'organic', 'farm fresh']
  },
  'Fresh Fruits': {
    imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80',
    emoji: '🍒',
    color: '#f43f5e',
    malayalamDefault: 'പഴങ്ങൾ',
    tags: ['fruit', 'banana', 'mango', 'apple', 'tropical']
  },
  'Rice, Atta, Flours & Mixes': {
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    emoji: '🌾',
    color: '#eab308',
    malayalamDefault: 'അരി, ആട്ട, പൊടികൾ & മിക്സുകൾ',
    tags: ['rice', 'matta', 'atta', 'flour', 'puttu podi', 'mixes', 'batter']
  },
  'Rice, Atta & Flours': {
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    emoji: '🌾',
    color: '#eab308',
    malayalamDefault: 'അരി, ആട്ട & പൊടികൾ',
    tags: ['rice', 'matta', 'atta', 'flour', 'puttu podi']
  },
  'Dals, Pulses & Beans': {
    imageUrl: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80',
    emoji: '🫘',
    color: '#d97706',
    malayalamDefault: 'പരിപ്പുകൾ & പയറുകൾ',
    tags: ['dal', 'cherupayar', 'kadala', 'toor dal', 'pulses']
  },
  'Dairy': {
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    emoji: '🥛',
    color: '#0284c7',
    malayalamDefault: 'പാൽ ഉൽപ്പന്നങ്ങൾ',
    tags: ['milk', 'curd', 'milma', 'paneer', 'butter']
  },
  'Cooking Essentials': {
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    emoji: '🧈',
    color: '#f59e0b',
    malayalamDefault: 'പാചക അവശ്യവസ്തുക്കൾ',
    tags: ['coconut oil', 'velichenna', 'ghee', 'gingelly oil', 'cooking essentials']
  },
  'Oils & Ghee': {
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    emoji: '🧈',
    color: '#f59e0b',
    malayalamDefault: 'എണ്ണകൾ & നെയ്യ്',
    tags: ['coconut oil', 'velichenna', 'ghee', 'gingelly oil']
  },
  'Spices & Masalas': {
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
    emoji: '🌶️',
    color: '#ef4444',
    malayalamDefault: 'മസാലകൾ & സുഗന്ധവ്യഞ്ജനങ്ങൾ',
    tags: ['turmeric', 'chilli', 'coriander', 'pepper', 'eastern']
  },
  'Bakery': {
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    emoji: '🍞',
    color: '#8b5cf6',
    malayalamDefault: 'ബേക്കറി പലഹാരങ്ങൾ',
    tags: ['bread', 'bun', 'cake', 'rusk', 'puffs']
  },
  'Biscuits & Cookies': {
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80',
    emoji: '🍪',
    color: '#ec4899',
    malayalamDefault: 'ബിസ്ക്കറ്റുകൾ & കുക്കികൾ',
    tags: ['biscuit', 'cookies', 'crackers', 'rusk']
  },
  'Dry Goods & Cereals': {
    imageUrl: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80',
    emoji: '🥜',
    color: '#b45309',
    malayalamDefault: 'ഡ്രൈ ഫ്രൂട്ട്സ് & ധാന്യങ്ങൾ',
    tags: ['cashew', 'almond', 'kismis', 'oats', 'cereal', 'dry goods']
  },
  'Dry Fruits & Cereals': {
    imageUrl: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&auto=format&fit=crop&q=80',
    emoji: '🥜',
    color: '#b45309',
    malayalamDefault: 'ഡ്രൈ ഫ്രൂട്ട്സ് & ധാന്യങ്ങൾ',
    tags: ['cashew', 'almond', 'kismis', 'oats', 'cereal']
  },
  'Beverages': {
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
    emoji: '☕',
    color: '#06b6d4',
    malayalamDefault: 'പാനീയങ്ങൾ',
    tags: ['tea', 'coffee', 'juice', 'horlicks', 'boost']
  },
  'Desserts & Ice Creams': {
    imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&auto=format&fit=crop&q=80',
    emoji: '🍦',
    color: '#a855f7',
    malayalamDefault: 'ഐസ്ക്രീം & മധുരപലഹാരങ്ങൾ',
    tags: ['ice cream', 'payasam', 'kulfi', 'sweets']
  },
  'Meat & Fish': {
    imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=80',
    emoji: '🥩',
    color: '#be123c',
    malayalamDefault: 'ഇറച്ചി & മീൻ',
    tags: ['chicken', 'fish', 'mutton', 'beef', 'eggs']
  },
  'Household & Stationery': {
    imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80',
    emoji: '🏠',
    color: '#64748b',
    malayalamDefault: 'വീട്ടുപകരണങ്ങൾ & സ്റ്റേഷനറി',
    tags: ['detergent', 'cleaning', 'soap', 'notebook', 'pen']
  }
}

/**
 * Resolves the display image for a category with safe multi-tier fallbacks:
 * 1. Category's custom image_url if provided.
 * 2. Curated Kerala visual matching category name.
 * 3. Fallback generic market image.
 */
export function getCategoryImageUrl(categoryName: string, customImageUrl?: string | null): string {
  if (customImageUrl && customImageUrl.trim().length > 5) {
    return customImageUrl.trim()
  }

  const cleanName = categoryName.replace(/^[\p{Emoji}\s]+/gu, '').trim()
  for (const [name, meta] of Object.entries(CATEGORY_VISUALS)) {
    if (cleanName.toLowerCase() === name.toLowerCase()) {
      return meta.imageUrl
    }
  }

  // Generic fallback
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'
}

export function getCategoryEmoji(categoryName: string): string {
  const cleanName = categoryName.replace(/^[\p{Emoji}\s]+/gu, '').trim()
  for (const [name, meta] of Object.entries(CATEGORY_VISUALS)) {
    if (cleanName.toLowerCase() === name.toLowerCase()) {
      return meta.emoji
    }
  }
  return '📦'
}

export function getCategoryMalayalamName(categoryName: string): string {
  const cleanName = categoryName.replace(/^[\p{Emoji}\s]+/gu, '').trim()
  for (const [name, meta] of Object.entries(CATEGORY_VISUALS)) {
    if (cleanName.toLowerCase() === name.toLowerCase()) {
      return meta.malayalamDefault
    }
  }
  return cleanName
}

export function getCategoryColor(categoryName: string): string {
  const cleanName = categoryName.replace(/^[\p{Emoji}\s]+/gu, '').trim()
  for (const [name, meta] of Object.entries(CATEGORY_VISUALS)) {
    if (cleanName.toLowerCase() === name.toLowerCase()) {
      return meta.color
    }
  }
  return '#3b82f6'
}

export function getCategoryVisualMeta(categoryName: string): CategoryVisualMeta | null {
  const cleanName = categoryName.replace(/^[\p{Emoji}\s]+/gu, '').trim()
  for (const [name, meta] of Object.entries(CATEGORY_VISUALS)) {
    if (cleanName.toLowerCase() === name.toLowerCase()) {
      return meta
    }
  }
  return null
}

