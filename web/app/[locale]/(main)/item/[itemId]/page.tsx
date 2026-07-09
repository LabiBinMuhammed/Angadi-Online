import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Item, ItemVariant, ItemSellConfig, Unit } from '@/types'
import AddToCartButton from './AddToCartButton'

type Props = { params: Promise<{ itemId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { itemId } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('items')
    .select('name, description, shops(name)')
    .eq('id', itemId)
    .single()
  
  const itemName = data?.name ?? 'Item'
  const shopName = (data?.shops as any)?.name ?? 'Angadi Online'
  const description = data?.description || `Buy ${itemName} at ${shopName} on Angadi Online. Enjoy quality fresh products delivered right to your door.`

  return {
    title: `${itemName} | ${shopName} | Angadi Online`,
    description,
  }
}

export default async function ItemPage({ params }: Props) {
  const { itemId } = await params
  const supabase = await createClient()

  const [
    { data: item },
    { data: variants },
    { data: sellConfig },
    { data: units }
  ] = await Promise.all([
    supabase.from('items').select('*, item_images(*)').eq('id', itemId).single(),
    supabase
      .from('vw_item_variants_with_fallback')
      .select('*')
      .eq('item_id', itemId)
      .eq('is_active', true)
      .order('is_default', { ascending: false }),
    supabase.from('item_sell_config').select('*').eq('item_id', itemId).single(),
    supabase.from('units').select('*'),
  ])

  if (!item) notFound()

  const itemData    = item as Item
  const variantList = (variants ?? []) as ItemVariant[]
  const config      = sellConfig as ItemSellConfig | null
  const unitList    = (units ?? []) as Unit[]

  return (
    <div style={{ paddingBottom: '120px' }}>
      <AddToCartButton
        item={itemData}
        variants={variantList}
        sellConfig={config}
        units={unitList}
      />
    </div>
  )
}
