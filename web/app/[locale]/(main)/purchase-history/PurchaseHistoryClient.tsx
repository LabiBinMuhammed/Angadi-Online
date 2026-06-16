'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Calendar, Landmark, Tag, Download, Printer, ShoppingBag, Eye, TrendingUp } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface OrderItemInfo {
  id: string
  requested_value: number
  final_price: number
  items: {
    name: string
    categories: {
      name: string
    } | null
  } | null
}

interface OrderHistoryItem {
  id: string
  order_number: number
  status: string
  total_final_price: number
  created_at: string
  payment_type: string | null
  shops: {
    name: string
  } | null
  order_items: OrderItemInfo[]
}

interface StatsInfo {
  total_orders: number
  total_spent: number
  favorite_shop_name: string | null
  favorite_category_name: string | null
}

interface Props {
  initialOrders: OrderHistoryItem[]
  initialStats: StatsInfo
}

export default function PurchaseHistoryClient({ initialOrders, initialStats }: Props) {
  const { t } = useTranslation()
  const [orders] = useState<OrderHistoryItem[]>(initialOrders)
  const [stats] = useState<StatsInfo>(initialStats)
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleExportCSV = () => {
    // Columns: Order #, Date, Shop, Items, Total Price, Status, Payment Type
    const headers = ['Order Number', 'Date', 'Shop Name', 'Items Summary', 'Total Price (INR)', 'Status', 'Payment Type']
    const rows = filteredOrders.map(o => {
      const itemsStr = o.order_items.map(oi => `${oi.items?.name || 'Item'} (x${oi.requested_value})`).join('; ')
      return [
        o.order_number || o.id.substring(0, 8),
        new Date(o.created_at).toLocaleDateString(),
        o.shops?.name || 'Unknown',
        itemsStr,
        o.total_final_price.toFixed(2),
        o.status,
        o.payment_type || 'COD'
      ]
    })

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Purchase_History_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    window.print()
  }

  // Filter Logic Client-side
  const filteredOrders = orders.filter(o => {
    // 1. Date Filter
    const oDate = new Date(o.created_at)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (dateFilter === 'today') {
      if (oDate < today) return false
    } else if (dateFilter === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      if (oDate < weekAgo) return false
    } else if (dateFilter === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      if (oDate < monthAgo) return false
    } else if (dateFilter === 'year') {
      const yearAgo = new Date()
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      if (oDate < yearAgo) return false
    }

    // 2. Search query (Order #, Shop Name, Product Name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchOrderNum = String(o.order_number).includes(query)
      const matchShopName = o.shops?.name?.toLowerCase().includes(query)
      const matchItemName = o.order_items.some(oi => oi.items?.name?.toLowerCase().includes(query))

      if (!matchOrderNum && !matchShopName && !matchItemName) return false
    }

    return true
  })

  // Calculate local statistics based on the active date filter
  const localStats = {
    totalOrders: filteredOrders.filter(o => o.status === 'delivered').length,
    totalSpent: filteredOrders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + o.total_final_price, 0),
    favoriteShop: stats.favorite_shop_name || 'N/A',
    favoriteCategory: stats.favorite_category_name || 'N/A'
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: var(--bg-base); }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 24px 100px; position: relative; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .back-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-base); transition: all 0.2s; cursor: pointer; }
        .back-btn:active { transform: scale(0.95); }
        .title { font-size: 28px; font-weight: 800; color: var(--text-base); margin: 0; letter-spacing: -0.5px; }

        /* Stats Dashboard Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
        .stat-card { background: var(--bg-surface); border-radius: 20px; border: 1px solid var(--border); padding: 16px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .stat-header { display: flex; align-items: center; justify-content: space-between; color: var(--text-muted); }
        .stat-value { font-size: 18px; font-weight: 800; color: var(--text-base); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-label { font-size: 12px; font-weight: 600; color: var(--text-muted); }

        .search-container { position: relative; margin-bottom: 16px; }
        .search-input { width: 100%; height: 50px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 0 20px 0 48px; font-size: 15px; color: var(--text-base); outline: none; transition: border-color 0.2s; font-weight: 500; }
        .search-input:focus { border-color: var(--wa-green); }
        .search-icon { position: absolute; left: 16px; top: 15px; color: var(--text-muted); }

        .filters-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 8px; flex-wrap: wrap; }
        .filter-row { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
        .filter-row::-webkit-scrollbar { display: none; }
        .filter-pill { padding: 6px 12px; border-radius: 16px; background: var(--bg-surface); border: 1px solid var(--border); font-size: 12px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .filter-pill.active { background: var(--wa-green-light); color: var(--wa-green-dark); border-color: var(--wa-green); }

        .export-actions { display: flex; gap: 8px; }
        .export-btn { height: 36px; padding: 0 12px; border-radius: 12px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px; border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-base); cursor: pointer; transition: all 0.2s; }
        .export-btn:hover { background: var(--bg-muted); }

        .orders-list { display: flex; flex-direction: column; gap: 16px; }
        .order-card { background: var(--bg-surface); border-radius: 20px; border: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .order-meta { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border); padding-bottom: 12px; }
        .order-num { font-size: 15px; font-weight: 800; color: var(--text-base); }
        .order-date { font-size: 13px; color: var(--text-muted); font-weight: 500; }
        
        .order-details { display: flex; flex-direction: column; gap: 8px; }
        .detail-row { display: flex; justify-content: space-between; font-size: 14px; }
        .shop-name { font-weight: 700; color: var(--text-base); }
        .items-preview { font-size: 13px; color: var(--text-muted); font-weight: 500; }
        
        .status-badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .status-delivered { background: rgba(76,217,100,0.1); color: var(--wa-green-dark); }
        .status-pending { background: rgba(245,158,11,0.1); color: #f59e0b; }
        .status-cancelled { background: rgba(239,68,68,0.1); color: #ef4444; }
        .status-other { background: var(--bg-muted); color: var(--text-muted); }

        .order-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
        .total-box { display: flex; flex-direction: column; }
        .total-lbl { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
        .total-val { font-size: 18px; font-weight: 900; color: var(--text-base); }

        .view-btn { height: 38px; border-radius: 12px; padding: 0 16px; border: 1px solid var(--border); background: var(--bg-muted); color: var(--text-base); font-size: 13px; font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .view-btn:active { transform: scale(0.97); }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; }
        .empty-icon { font-size: 64px; margin-bottom: 24px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; }
        .empty-title { font-size: 24px; font-weight: 800; color: var(--text-base); margin: 0 0 8px; }
        .empty-sub { font-size: 15px; color: var(--text-muted); margin: 0 0 32px; font-weight: 500; }
        .browse-btn { background: var(--wa-green); color: #fff; border: none; border-radius: 24px; padding: 16px 32px; font-size: 16px; font-weight: 700; text-decoration: none; box-shadow: 0 8px 20px rgba(76,217,100,0.3); transition: all 0.2s; }
        
        /* Print Stylesheet for PDF Report */
        @media print {
          body { background: #fff !important; color: #000 !important; }
          .page-container { max-width: 100% !important; padding: 0 !important; }
          .back-btn, .search-container, .filters-toolbar, .view-btn { display: none !important; }
          .stats-grid { display: flex !important; justify-content: space-between !important; border: 1px solid #ccc !important; padding: 12px !important; border-radius: 8px !important; margin-bottom: 24px !important; }
          .stat-card { border: none !important; padding: 0 !important; width: 23% !important; }
          .order-card { page-break-inside: avoid !important; border: 1px solid #eee !important; border-radius: 8px !important; margin-bottom: 16px !important; }
        }
      `}} />

      <div className="page-container">
        <div className="header">
          <Link href="/profile" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="title">{t('purchase_history.title')}</h1>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">{t('purchase_history.total_orders')}</span>
              <ShoppingBag size={16} />
            </div>
            <span className="stat-value">{localStats.totalOrders}</span>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">{t('purchase_history.total_spent')}</span>
              <TrendingUp size={16} />
            </div>
            <span className="stat-value">₹{localStats.totalSpent.toFixed(2)}</span>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">{t('purchase_history.favorite_shop')}</span>
              <Landmark size={16} />
            </div>
            <span className="stat-value" title={localStats.favoriteShop}>{localStats.favoriteShop}</span>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">{t('purchase_history.favorite_category')}</span>
              <Tag size={16} />
            </div>
            <span className="stat-value" title={localStats.favoriteCategory}>{localStats.favoriteCategory}</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder={t('common.search')} 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Toolbar: Filters & Export */}
        <div className="filters-toolbar">
          <div className="filter-row">
            <button 
              className={`filter-pill ${dateFilter === 'today' ? 'active' : ''}`}
              onClick={() => setDateFilter('today')}
            >
              {t('purchase_history.filter_today')}
            </button>
            <button 
              className={`filter-pill ${dateFilter === 'week' ? 'active' : ''}`}
              onClick={() => setDateFilter('week')}
            >
              {t('purchase_history.filter_week')}
            </button>
            <button 
              className={`filter-pill ${dateFilter === 'month' ? 'active' : ''}`}
              onClick={() => setDateFilter('month')}
            >
              {t('purchase_history.filter_month')}
            </button>
            <button 
              className={`filter-pill ${dateFilter === 'year' ? 'active' : ''}`}
              onClick={() => setDateFilter('year')}
            >
              {t('purchase_history.filter_year')}
            </button>
            <button 
              className={`filter-pill ${dateFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDateFilter('all')}
            >
              {t('purchase_history.filter_all')}
            </button>
          </div>

          <div className="export-actions">
            <button className="export-btn" onClick={handleExportCSV} title={t('purchase_history.export_csv')}>
              <Download size={14} />
              CSV
            </button>
            <button className="export-btn" onClick={handleExportPDF} title={t('purchase_history.print_pdf')}>
              <Printer size={14} />
              PDF
            </button>
          </div>
        </div>

        {/* Order History Cards */}
        {filteredOrders.length > 0 ? (
          <div className="orders-list">
            {filteredOrders.map((order) => {
              const statusClass = order.status === 'delivered' 
                ? 'status-delivered' 
                : order.status === 'pending'
                  ? 'status-pending'
                  : order.status === 'cancelled'
                    ? 'status-cancelled'
                    : 'status-other'

              const itemsPreview = order.order_items
                .map(oi => `${oi.items?.name || 'Item'} (x${oi.requested_value})`)
                .join(', ')

              return (
                <div key={order.id} className="order-card">
                  <div className="order-meta">
                    <span className="order-num">#{order.order_number || order.id.substring(0, 8)}</span>
                    <span className="order-date">{new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  </div>

                  <div className="order-details">
                    <div className="detail-row">
                      <span className="shop-name">{order.shops?.name || 'Village Market Shop'}</span>
                      <span className={`status-badge ${statusClass}`}>{t('orders.status_' + order.status)}</span>
                    </div>
                    <p className="items-preview">{itemsPreview}</p>
                  </div>

                  <div className="order-footer">
                    <div className="total-box">
                      <span className="total-lbl">{t('purchase_history.total')}</span>
                      <span className="total-val">₹{order.total_final_price.toFixed(2)}</span>
                    </div>

                    <Link href={`/orders/${order.id}`} className="view-btn">
                      <Eye size={14} />
                      {t('purchase_history.view_order')}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <ShoppingBag size={64} style={{ opacity: 0.3 }} />
            </div>
            <h2 className="empty-title">{t('purchase_history.no_history')}</h2>
            <p className="empty-sub">{t('recent_purchases.start_shopping')}</p>
            <Link href="/home" className="browse-btn">
              {t('pinned_shops.open_shop')}
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
