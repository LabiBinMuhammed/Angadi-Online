import { useState, useEffect } from 'react'

interface TranslationRow {
  language_code: string
  name?: string
  description?: string
}

interface ItemImage {
  image_url: string
  is_primary: boolean
}

interface Item {
  id: string
  name: string
  description?: string
  image_url?: string
  price?: number
  item_translations?: TranslationRow[]
  item_images?: ItemImage[]
}

export function useProductSearch(initialQuery = '', lang = 'en', shopId?: string, categoryId?: string) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        let url = `/api/search?q=${encodeURIComponent(query.trim())}&lang=${lang}`
        if (shopId) {
          url += `&shopId=${shopId}`
        }
        if (categoryId) {
          url += `&categoryId=${categoryId}`
        }

        const res = await fetch(url)
        if (!res.ok) {
          throw new Error('Search failed')
        }
        const data = await res.json()
        
        // Map backend returned key 'item_id' to frontend key 'id' if needed
        const mapped = data.map((item: any) => ({
          ...item,
          id: item.item_id || item.id
        }))
        
        setResults(mapped)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, lang, shopId, categoryId])

  return { query, setQuery, results, loading, error }
}
export type { Item }
