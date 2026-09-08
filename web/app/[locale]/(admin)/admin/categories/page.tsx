import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CategoriesClient from './CategoriesClient'
import type { Category } from '@/types'

export const metadata: Metadata = { title: 'Category Management | Angadi Admin' }

export default async function CategoriesPage() {
  const supabase = await createClient()
  
  // 1. Fetch all categories with their translations
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*, category_translations(*)')
    .order('display_order', { ascending: true })

  // 2. Fetch demo product counts per category
  const { data: demoCounts } = await supabase
    .from('demo_items')
    .select('category_id')

  const countMap = new Map<string, number>()
  if (demoCounts) {
    demoCounts.forEach(item => {
      if (item.category_id) {
        countMap.set(item.category_id, (countMap.get(item.category_id) || 0) + 1)
      }
    })
  }

  const enrichedCategories: Category[] = (categoriesData ?? []).map(cat => ({
    ...cat,
    item_count: countMap.get(cat.id) || 0
  }))

  return <CategoriesClient categories={enrichedCategories} />
}
