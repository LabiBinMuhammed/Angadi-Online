'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Item, Category, ItemStatus } from '@/types'
import { Search, Package, Edit, Trash2, Power, PackagePlus } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/I18nContext'

const STATUS_META: Record<ItemStatus, { label: string; cls: string }> = {
  published:    { label: 'Live',         cls: 'vp-badge-success'  },
  draft:        { label: 'Draft',        cls: 'vp-badge-neutral'  },
  incomplete:   { label: 'Incomplete',   cls: 'vp-badge-warning'  },
  ready:        { label: 'Ready',        cls: 'vp-badge-info'     },
  hidden:       { label: 'Hidden',       cls: 'vp-badge-neutral'  },
  rejected:     { label: 'Rejected',     cls: 'vp-badge-danger'   },
  out_of_stock: { label: 'Out of Stock', cls: 'vp-badge-warning'  },
}

type FilterValue = 'all' | 'active' | 'draft' | 'inactive'

export default function VendorItemsClient({
  items: initialItems,
  shopId,
  categories,
}: {
  items: Item[]
  shopId: string
  categories: Category[]
}) {
  const { t } = useTranslation()
  const [items, setItems] = useState(initialItems)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<FilterValue>('all')
  const router = useRouter()

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  const filtered = items.filter(it => {
    const itStatus = it.status || (it.is_active ? 'published' : 'draft')
    const matchSearch = it.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'active'   ? itStatus === 'published' :
      filter === 'draft'    ? itStatus === 'draft' || itStatus === 'incomplete' :
      /* inactive */          itStatus === 'hidden' || itStatus === 'rejected' || itStatus === 'out_of_stock'
    return matchSearch && matchFilter
  })

  async function toggleActive(item: Item) {
    const supabase = createClient()
    const itStatus = item.status || (item.is_active ? 'published' : 'draft')
    const nextStatus: ItemStatus = itStatus === 'published' ? 'hidden' : 'published'
    const { error } = await supabase.from('items').update({ is_active: nextStatus === 'published' }).eq('id', item.id)
    if (!error) {
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: nextStatus, is_active: nextStatus === 'published' } : it))
    } else {
      console.error('Failed to toggle active:', error)
    }
  }

  async function deleteItem(item: Item) {
    if (!confirm((t('vendor_dashboard.delete_product_dialog_message') || 'Permanently delete "{name}"? This cannot be undone.').replace('{name}', item.name))) return
    const supabase = createClient()
    await supabase.from('items').update({ deleted_at: new Date().toISOString() }).eq('id', item.id)
    setItems(prev => prev.filter(it => it.id !== item.id))
  }

  const FILTERS: { value: FilterValue; label: string; labelKey: string }[] = [
    { value: 'all',      label: 'All',      labelKey: 'vendor_dashboard.filter_all' },
    { value: 'active',   label: 'Live',     labelKey: 'vendor_dashboard.filter_live' },
    { value: 'draft',    label: 'Draft',    labelKey: 'vendor_dashboard.filter_draft' },
    { value: 'inactive', label: 'Inactive', labelKey: 'vendor_dashboard.filter_inactive' },
  ]

  return (
    <div className="vp-card" style={{ padding: '1.25rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: 180 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            className="vp-input"
            style={{ paddingLeft: '2.5rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', borderRadius: '99px', fontSize: '0.88rem' }}
            placeholder={t('vendor_dashboard.search_products_placeholder') || 'Search products by name…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.15)', padding: '0.2rem', borderRadius: '99px' }}>
          {FILTERS.map(f => (
            <button
              key={f.value}
              id={`filter-${f.value}`}
              className="vp-btn"
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.8rem',
                borderRadius: '99px',
                background: filter === f.value ? '#3b82f6' : 'transparent',
                color:      filter === f.value ? '#fff'    : '#94a3b8',
                boxShadow:  filter === f.value ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setFilter(f.value)}
            >
              {t(f.labelKey) || f.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>
          {filtered.length} {t('purchase_history.of') || 'of'} {items.length} {t('vendor_dashboard.orders_count_label') || 'items'}
        </span>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748b' }}>
          <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.35, display: 'block' }} />
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8' }}>
            {items.length === 0 ? (t('vendor_dashboard.no_products_found') || 'No items yet') : (t('common.no_items') || 'No items match your search')}
          </p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.4rem', marginBottom: '1.25rem' }}>
            {items.length === 0
              ? (t('vendor_dashboard.setup_shop_subtitle') || 'Add your first product to start selling.')
              : (t('recent_purchases.no_purchases') || 'Try adjusting your search or filter.')}
          </p>
          {items.length === 0 && (
            <Link href="/vendor/items/new" className="vp-btn vp-btn-primary" id="empty-add-item-btn" style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}>
              <PackagePlus size={16} /> {t('vendor_dashboard.add_new_product_action') || 'Add First Item'}
            </Link>
          )}
        </div>
      ) : (
        <div className="vp-table-wrapper" style={{ width: '100%', overflowX: 'hidden' }}>
          <table className="vp-table" style={{ width: '100%', minWidth: 0, tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '62%', padding: '0.6rem 0.5rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-base)' }}>Name</th>
                <th style={{ width: '38%', textAlign: 'right', padding: '0.6rem 0.5rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-base)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const itStatus = item.status || (item.is_active ? 'published' : 'draft')
                const thumb = item.item_images?.find(img => img.is_primary)?.image_url
                            ?? item.item_images?.[0]?.image_url

                return (
                  <tr key={item.id} id={`item-row-${item.id}`}>
                    <td style={{ padding: '0.5rem 0.5rem', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                        {thumb
                          ? <img src={thumb} alt={item.name} style={{ width: 36, height: 36, borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                          : <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}><Package size={18} /></div>
                        }
                        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <p style={{ fontWeight: 600, color: 'var(--text-base)', fontSize: '0.88rem', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</p>
                          {item.description && (
                            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem 0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          id={`toggle-${item.id}`}
                          className={`vp-btn vp-btn-sm ${itStatus === 'published' ? 'vp-btn-outline' : 'vp-btn-primary'}`}
                          onClick={() => toggleActive(item)}
                          style={{ padding: '0.35rem 0.5rem', minWidth: 28, height: 28 }}
                          title={itStatus === 'published' ? (t('vendor_dashboard.deactivate_tooltip') || 'Deactivate') : (t('vendor_dashboard.go_live_tooltip') || 'Go Live')}
                        >
                          <Power size={13} />
                        </button>
                        <button
                          id={`edit-${item.id}`}
                          className="vp-btn vp-btn-outline vp-btn-sm"
                          onClick={() => router.push(`/vendor/items/${item.id}`)}
                          style={{ padding: '0.35rem 0.5rem', minWidth: 28, height: 28 }}
                          title={t('common.edit') || 'Edit'}
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          id={`del-${item.id}`}
                          className="vp-btn vp-btn-danger vp-btn-sm"
                          onClick={() => deleteItem(item)}
                          style={{ padding: '0.35rem 0.5rem', minWidth: 28, height: 28 }}
                          title={t('common.delete') || 'Delete'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
