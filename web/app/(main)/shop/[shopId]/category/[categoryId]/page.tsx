import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Item, Category } from '@/types'

type Props = { params: Promise<{ shopId: string; categoryId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params
  const supabase = await createClient()
  const { data: cat } = await supabase
    .from('categories').select('name').eq('id', categoryId).single()
  return { title: cat?.name ?? 'Category' }
}

export default async function ShopCategoryPage({ params }: Props) {
  const { shopId, categoryId } = await params
  const supabase = await createClient()

  const [{ data: category }, { data: items }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('id', categoryId).single(),
    supabase
      .from('items')
      .select('id, name, description, has_variants, status, item_variants:vw_item_variants_with_fallback(id, label, image_url)')
      .eq('shop_id', shopId)
      .eq('category_id', categoryId)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('name'),
  ])

  if (!category) notFound()

  const itemList = (items ?? []) as Item[]

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.5rem' }}>
        <Link href={`/shop/${shopId}`} className="btn btn-ghost btn-sm">← Back</Link>
        <h1 className="text-2xl font-bold">{(category as Category).name}</h1>
      </div>

      {itemList.length > 0 ? (
        <div className="grid-3">
          {itemList.map((item) => (
            <Link
              key={item.id}
              href={`/item/${item.id}`}
              id={`item-cat-${item.id}`}
              className="card"
              style={{ display: 'block' }}
            >
              <div
                style={{
                  height: 120, background: 'var(--bg-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
                }}
              >
                {item.item_variants?.[0]?.image_url
                  ? <img src={item.item_variants[0].image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '📦'}
              </div>
              <div className="card-body">
                <p className="font-semibold">{item.name}</p>
                {item.description && (
                  <p className="text-sm text-muted" style={{ marginTop: '.2rem' }}>{item.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon">📦</span>
          <p className="font-semibold">No items in this category</p>
        </div>
      )}
    </>
  )
}
