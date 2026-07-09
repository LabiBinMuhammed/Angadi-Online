import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FavoritesClient from './FavoritesClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../messages/en.json')
  }
  const t = (key: string) => {
    const parts = key.split('.')
    let curr = messages as any
    for (const part of parts) {
      if (!curr) return key
      curr = curr[part]
    }
    return typeof curr === 'string' ? curr : key
  }

  return {
    title: t('favorites.title'),
    description: t('favorites.add_prompt'),
  }
}

export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let favorites: any[] = []

  try {
    const { data, error } = await supabase
      .from('customer_favorite_items')
      .select(`
        id,
        item:items(
          id,
          name,
          is_active,
          status,
          shop_id,
          shops(name),
          item_images(image_url, is_primary, sort_order),
          item_variants(id, price, is_default)
        )
      `)
      .eq('user_id', user.id)

    if (!error && data) {
      favorites = data.filter((f: any) => f.item).map((f: any) => {
        const item = f.item
        
        // Find primary image or fallback to first
        const primaryImg = item.item_images?.find((img: any) => img.is_primary) 
          || item.item_images?.sort((a: any, b: any) => a.sort_order - b.sort_order)[0]
        
        // Find default variant price, fallback to first variant, fallback to 0
        const defaultVar = item.item_variants?.find((v: any) => v.is_default) || item.item_variants?.[0]
        const price = defaultVar ? Number(defaultVar.price || 0) : 0
        const variantId = defaultVar ? defaultVar.id : null

        return {
          id: f.id,
          item: {
            id: item.id,
            name: item.name,
            price,
            image_url: primaryImg?.image_url || null,
            shop_id: item.shop_id,
            shop_name: item.shops?.name || 'Angadi Online Shop',
            is_active: item.is_active,
            status: item.status,
            variant_id: variantId
          }
        }
      })
    }
  } catch (err) {
    console.error('Failed to fetch favorites:', err)
  }

  return <FavoritesClient initialFavorites={favorites} />
}
