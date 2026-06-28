export function getServerTranslations(locale: string) {
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  
  let messages: any = {}
  let fallback: any = {}

  try {
    messages = require(`../../messages/${activeLocale}.json`)
  } catch (e) {
    // fallback will be caught below
  }

  try {
    fallback = require('../../messages/en.json')
  } catch (e) {
    //
  }

  const t = (key: string) => {
    const parts = key.split('.')
    let curr = messages
    
    // 1. Try to find in selected locale
    for (const part of parts) {
      if (!curr) break
      curr = curr[part]
    }
    
    if (typeof curr === 'string') return curr

    // 2. Try to find in English fallback
    let fb = fallback
    for (const part of parts) {
      if (!fb) return key
      fb = fb[part]
    }
    
    if (typeof fb === 'string') return fb
    
    // 3. Return key if not found
    return key
  }

  return t
}
