'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Package, ArrowUpDown, ExternalLink, Scale, Sparkles } from 'lucide-react'
import { TopProductItem, CategoryPerformanceItem } from '../actions'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface ProductsTabProps {
  products: TopProductItem[]
  categories: CategoryPerformanceItem[]
  locale: string
}

export default function ProductsTab({ products, categories, locale }: ProductsTabProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'sales' | 'quantity' | 'orders'>('sales')

  const formatINR = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        if (categoryFilter !== 'all' && p.categoryName !== categoryFilter) {
          return false
        }
        if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'quantity') return b.quantitySold - a.quantitySold
        if (sortBy === 'orders') return b.ordersCount - a.ordersCount
        return b.totalSales - a.totalSales
      })
  }, [products, categoryFilter, search, sortBy])

  const totalProductSales = filteredProducts.reduce((sum, p) => sum + p.totalSales, 0)
  const totalUnitsSold = filteredProducts.reduce((sum, p) => sum + p.quantitySold, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Category Performance Summary Grid */}
      <div className="vp-card" style={{ padding: '1.5rem' }}>
        <h3 className="vp-title" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>{t('vendor_reports.category_performance')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {categories.map(c => (
            <div
              key={c.categoryId}
              onClick={() => setCategoryFilter(categoryFilter === c.name ? 'all' : c.name)}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: categoryFilter === c.name ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-muted)',
                border: `1px solid ${categoryFilter === c.name ? '#3b82f6' : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.percentage}%</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', margin: '0.35rem 0 0.15rem' }}>
                {formatINR(c.totalSales)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.ordersCount} orders</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="vp-card"
        style={{
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="vp-input"
            style={{ paddingLeft: '2.75rem' }}
            placeholder={t('vendor_reports.search_products')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Category Filter */}
          <select
            className="vp-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">{t('vendor_reports.all_categories')}</option>
            {categories.map(c => (
              <option key={c.categoryId} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            className="vp-select"
            style={{ width: 'auto', minWidth: '160px' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="sales">{t('vendor_reports.sort_sales')}</option>
            <option value="quantity">{t('vendor_reports.sort_units')}</option>
            <option value="orders">{t('vendor_reports.sort_orders')}</option>
          </select>
        </div>
      </div>

      {/* Summary Counts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Showing <strong style={{ color: 'var(--text-base)' }}>{filteredProducts.length}</strong> products
        </span>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Total Units: <strong style={{ color: 'var(--text-base)' }}>{totalUnitsSold}</strong> | Total Sales: <strong style={{ color: '#10b981', fontSize: '1.05rem' }}>{formatINR(totalProductSales)}</strong>
        </span>
      </div>

      {/* Product Table */}
      <div className="vp-table-wrapper" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
            <Package size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', opacity: 0.5 }} />
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>No products found</h4>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No products match the selected filters or date range.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="vp-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Product</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Category</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>Orders</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Qty Sold</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Avg. Price</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Total Sales</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>Manage</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr
                    key={p.itemId}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                    className="hover-row"
                  >
                    {/* Product */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'var(--bg-muted)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={20} color="var(--text-muted)" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                          {p.isDynamic && (
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                              <Scale size={10} /> Dynamic Weight
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {p.categoryName}
                    </td>

                    {/* Orders */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'center', fontWeight: 600 }}>
                      {p.ordersCount}
                    </td>

                    {/* Qty Sold */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 700, fontSize: '0.95rem' }}>
                      {p.quantitySold}
                    </td>

                    {/* Avg Price */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {formatINR(p.avgPrice)}
                    </td>

                    {/* Total Sales */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: '1.05rem' }}>
                      {formatINR(p.totalSales)}
                    </td>

                    {/* Manage Link */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                      <Link
                        href={`/${locale}/vendor/items/${p.itemId}`}
                        className="vp-btn vp-btn-outline vp-btn-sm"
                        style={{ padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                        title="Edit Item in Inventory"
                      >
                        <span>Edit</span>
                        <ExternalLink size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
