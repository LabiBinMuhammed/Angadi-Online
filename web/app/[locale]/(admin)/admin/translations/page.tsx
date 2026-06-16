import { createClient } from '@/lib/supabase/server'
import TranslationsClient from './TranslationsClient'

export const metadata = {
  title: 'Translation Management',
}

export default async function TranslationsPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  // Fetch categories with their translations
  const { data: categories } = await supabase
    .from('categories')
    .select('*, category_translations(*)')
    .order('name')

  // Fetch demo items with their translations
  const { data: demoItems } = await supabase
    .from('demo_items')
    .select('*, demo_item_translations(*)')
    .order('name')

  return (
    <TranslationsClient
      initialCategories={categories || []}
      initialDemoItems={demoItems || []}
      locale={locale}
    />
  )
}
