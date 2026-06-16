'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { removeOrderItem, updateOrderItemQty, updateDeliverySchedule } from './actions'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { ArrowLeft, Trash2, Heart, Plus, Minus, Calendar, Sun, Moon, Carrot, Apple, Milk, Wheat, Flame, Croissant, GlassWater, Fish, Cookie, Package, CupSoda } from 'lucide-react'

function getFallbackIcon(name: string = '', size = 40) {
  const lower = name.toLowerCase()
  if (lower.includes('apple')) return <Apple size={size} className="text-muted" />
  if (lower.includes('carrot')) return <Carrot size={size} className="text-muted" />
  if (lower.includes('banana')) return <Apple size={size} className="text-muted" />
  if (lower.includes('orange')) return <Apple size={size} className="text-muted" />
  if (lower.includes('potato')) return <Carrot size={size} className="text-muted" />
  if (lower.includes('tomato')) return <Carrot size={size} className="text-muted" />
  if (lower.includes('milk') || lower.includes('dairy')) return <Milk size={size} className="text-muted" />
  if (lower.includes('bread')) return <Croissant size={size} className="text-muted" />
  if (lower.includes('egg')) return <Carrot size={size} className="text-muted" /> // fallback
  return <Package size={size} className="text-muted" />
}

import { useEffect } from 'react'

export default function CartPageClient({ 
  initialOrders,
  deliverySettings = [],
  placedOrders = []
}: { 
  initialOrders: any[]
  deliverySettings?: any[]
  placedOrders?: any[]
}) {
  const { t } = useTranslation()
  const [isPending, startTransition] = useTransition()

  const pendingOrders = initialOrders?.filter(o => o.status === 'pending' && !o.payment_type) || []
  const savedOrder = pendingOrders[0]

  const todayStr = (() => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })()

  const [deliveryDate, setDeliveryDate] = useState(() => {
    if (savedOrder?.delivery_date) {
      const d = new Date(savedOrder.delivery_date)
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
    }
    return todayStr;
  })

  const [deliveryMode, setDeliveryMode] = useState(() => {
    const slot = savedOrder?.delivery_slot || 'morning'
    return slot.toLowerCase()
  })

  const handleScheduleChange = (newDate: string, newMode: string) => {
    if (newDate === deliveryDate && newMode === deliveryMode) return
    setDeliveryDate(newDate)
    setDeliveryMode(newMode)
    startTransition(async () => {
      try {
        await updateDeliverySchedule(newDate, newMode)
      } catch (err) {
        console.error('Failed to update delivery schedule:', err)
      }
    })
  }

  const getSlotStatus = (dateStr: string) => {
    let morningDisabled = false
    let eveningDisabled = false
    let morningReason = ''
    let eveningReason = ''
    
    const isToday = dateStr === todayStr
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentSeconds = now.getSeconds()
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:${String(currentSeconds).padStart(2, '0')}`

    pendingOrders.forEach((order) => {
      const shopId = order.shop_id
      const settings = deliverySettings.find(s => s.shop_id === shopId) || {
        morning_enabled: true,
        evening_enabled: true,
        morning_order_limit: 50,
        evening_order_limit: 50,
        morning_cutoff_time: '08:00:00',
        evening_cutoff_time: '14:00:00'
      }

      // 1. Check if enabled by shop
      if (!settings.morning_enabled) {
        morningDisabled = true
        morningReason = 'Morning delivery is not offered by this shop.'
      }
      if (!settings.evening_enabled) {
        eveningDisabled = true
        eveningReason = 'Evening delivery is not offered by this shop.'
      }

      // 2. Check cutoff time (if today)
      if (isToday) {
        if (currentTimeStr >= settings.morning_cutoff_time) {
          morningDisabled = true
          morningReason = 'cutoff'
        }
        if (currentTimeStr >= settings.evening_cutoff_time) {
          eveningDisabled = true
          eveningReason = 'cutoff'
        }
      }

      // 3. Check capacity limit
      const morningPlacedCount = placedOrders.filter(o => o.shop_id === shopId && o.delivery_date === dateStr && o.delivery_slot === 'morning').length
      const eveningPlacedCount = placedOrders.filter(o => o.shop_id === shopId && o.delivery_date === dateStr && o.delivery_slot === 'evening').length

      if (morningPlacedCount >= settings.morning_order_limit) {
        morningDisabled = true
        morningReason = 'capacity'
      }
      if (eveningPlacedCount >= settings.evening_order_limit) {
        eveningDisabled = true
        eveningReason = 'capacity'
      }
    })

    return {
      morningDisabled,
      eveningDisabled,
      morningReason,
      eveningReason
    }
  }

  // Auto-suggestion logic
  useEffect(() => {
    const status = getSlotStatus(deliveryDate)
    
    if (deliveryMode === 'morning' && status.morningDisabled) {
      if (!status.eveningDisabled) {
        handleScheduleChange(deliveryDate, 'evening')
      } else {
        // Find next day's available slot
        let nextDate = new Date(deliveryDate)
        for (let i = 1; i <= 7; i++) {
          nextDate.setDate(nextDate.getDate() + 1)
          const nextDateStr = nextDate.toISOString().split('T')[0]
          const nextStatus = getSlotStatus(nextDateStr)
          if (!nextStatus.morningDisabled) {
            handleScheduleChange(nextDateStr, 'morning')
            break
          } else if (!nextStatus.eveningDisabled) {
            handleScheduleChange(nextDateStr, 'evening')
            break
          }
        }
      }
    } else if (deliveryMode === 'evening' && status.eveningDisabled) {
      // Find next day's available slot
      let nextDate = new Date(deliveryDate)
      for (let i = 1; i <= 7; i++) {
        nextDate.setDate(nextDate.getDate() + 1)
        const nextDateStr = nextDate.toISOString().split('T')[0]
        const nextStatus = getSlotStatus(nextDateStr)
        if (!nextStatus.morningDisabled) {
          handleScheduleChange(nextDateStr, 'morning')
          break
        } else if (!nextStatus.eveningDisabled) {
          handleScheduleChange(nextDateStr, 'evening')
          break
        }
      }
    }
  }, [deliveryDate, deliveryMode])

  const slotStatus = getSlotStatus(deliveryDate)

  const handleDateChange = (newDate: string) => {
    // Determine default slot for the new date
    const status = getSlotStatus(newDate)
    const newMode = !status.morningDisabled ? 'morning' : 'evening'
    handleScheduleChange(newDate, newMode)
  }

  const handleModeChange = (newMode: string) => {
    handleScheduleChange(deliveryDate, newMode)
  }
  const cartItems = pendingOrders.flatMap(o => o.order_items?.map((item: any) => ({ ...item, orderId: o.id })) || [])

  const subtotal = cartItems.reduce((acc, item) => acc + (item.final_price ?? (item.requested_value * item.estimated_price)), 0)
  const discount = 0
  const finalTotal = subtotal

  const formattedDate = (() => {
    const [y, m, d] = deliveryDate.split('-')
    return `${parseInt(d)}/${parseInt(m)}/${y}`
  })()

  function handleRemoveItem(orderId: string, itemId: string) {
    startTransition(async () => {
      try {
        await removeOrderItem(orderId, itemId)
      } catch (err) {
        alert(t('cart.err_remove_item'))
      }
    })
  }

  function handleUpdateQty(orderId: string, itemId: string, newQty: number) {
    if (newQty < 0.01) return handleRemoveItem(orderId, itemId)
    startTransition(async () => {
      try {
        await updateOrderItemQty(orderId, itemId, newQty)
      } catch (err) {
        alert(t('cart.err_update_qty'))
      }
    })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        main.page:has(.cart-layout) {
          padding: 0 !important;
          max-width: 100% !important;
          height: 100vh !important;
          height: 100dvh !important;
          overflow: hidden !important;
        }
        main.page:has(.cart-layout) footer {
          display: none !important;
        }
        @media (max-width: 767px) {
          .main-layout-wrapper:has(.cart-layout) {
            height: 100vh !important;
            height: 100dvh !important;
            overflow: hidden !important;
          }
          .main-viewport:has(.cart-layout) {
            height: 100vh !important;
            height: 100dvh !important;
            overflow: hidden !important;
          }
        }

        body { background: var(--bg-base); margin: 0; font-family: system-ui, -apple-system, sans-serif; overflow: hidden; }
        .cart-layout { display: flex; width: 100%; height: 100dvh; background: var(--bg-base); justify-content: center; }
        .cart-page { width: 100%; max-width: 600px; height: 100%; display: flex; flex-direction: column; position: relative; background: var(--bg-base); box-shadow: 0 0 40px rgba(0,0,0,0.02); }
        
        .cart-header { padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); background: var(--bg-surface); z-index: 10; }
        .cart-header-top { display: flex; align-items: center; gap: 10px; width: 100%; }
        .back-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; background: var(--bg-surface); color: var(--text-base); text-decoration: none; transition: background 0.2s; }
        .back-btn:hover { background: var(--bg-muted); }
        .cart-title { font-size: 17px; font-weight: 800; color: var(--text-base); margin: 0; letter-spacing: -0.3px; flex: 1; }
        .cart-count { font-size: 12px; color: var(--text-muted); font-weight: 600; }
        
        .cart-items { flex: 1; overflow-y: auto; padding: 12px 12px 120px; display: flex; flex-direction: column; gap: 10px; }
        .cart-items::-webkit-scrollbar { display: none; }
        
        .cart-item-content { position: relative; width: 100%; background: var(--bg-surface); border-radius: 16px; padding: 12px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
        
        .item-img-wrap { width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--bg-muted); border-radius: 12px; overflow: hidden; padding: 6px; }
        .item-img { max-width: 100%; max-height: 100%; object-fit: contain; }
        
        .item-info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; padding-right: 18px; }
        .item-name { font-size: 14px; font-weight: 700; color: var(--text-base); margin: 0; line-height: 1.3; white-space: normal; word-break: break-word; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .item-weight { font-size: 12px; color: var(--text-muted); font-weight: 500; }
        .item-price-qty-row { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; }
        .item-price { font-size: 15px; font-weight: 800; color: var(--wa-green-dark); }
        
        .delete-btn-absolute { position: absolute; top: 8px; right: 8px; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; color: var(--text-light); transition: all 0.2s; border: none; background: transparent; cursor: pointer; }
        .delete-btn-absolute:hover { color: #ff4757; background: rgba(255,71,87,0.08); }
        
        .qty-control { display: flex; align-items: center; gap: 6px; background: var(--bg-muted); border-radius: 12px; padding: 3px 6px; border: 1px solid var(--border); }
        .qty-btn { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; color: var(--wa-green-dark); font-weight: bold; cursor: pointer; border-radius: 6px; transition: background 0.2s; }
        .qty-btn:hover { background: rgba(0, 0, 0, 0.04); }
        .qty-btn.minus { color: var(--text-muted); }
        
        
        .summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .summary-label { font-size: 14px; color: var(--text-base); font-weight: 500; }
        .summary-val { font-size: 18px; font-weight: 800; color: var(--wa-green); }
        .summary-val.red { color: #ff4757; }
        
        .divider { height: 1px; background: var(--border); margin: 12px 0; }
        
        .checkout-btn { width: 100%; background: var(--wa-green); color: #fff; border: none; border-radius: 20px; padding: 14px; font-size: 15px; font-weight: 700; margin-top: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(76,217,100,0.2); transition: opacity 0.2s; text-align: center; text-decoration: none; }
        .checkout-btn:hover { opacity: 0.9; }
 
        .delivery-schedule-card { margin: 8px 0; padding: 16px; background: var(--bg-surface); border-radius: 20px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px; }
        .schedule-title-row { display: flex; align-items: center; gap: 8px; color: var(--wa-green); font-weight: 800; font-size: 15px; }
        .date-picker-row { display: flex; align-items: center; justify-content: space-between; background: var(--bg-muted); border: 1px solid var(--border); border-radius: 12px; padding: 10px 14px; cursor: pointer; position: relative; }
        .date-picker-label { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px; color: var(--text-base); }
        .date-input-hidden { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
        .change-date-text { color: var(--wa-green); font-weight: 700; font-size: 11px; }
        .mode-toggle-row { display: flex; gap: 10px; }
        .mode-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; border-radius: 12px; background: var(--bg-surface); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s ease; }
        .mode-btn.active.morning { background: var(--wa-green-light); border: 1.5px solid var(--wa-green); color: var(--wa-green-dark); }
        .mode-btn.active.evening { background: var(--bg-muted); border: 1.5px solid #f97316; color: #f97316; }
        .mode-btn-title { font-weight: 800; font-size: 12px; margin-top: 2px; color: var(--text-muted); }
        .mode-btn.active.morning .mode-btn-title { color: var(--wa-green-dark); }
        .mode-btn.active.evening .mode-btn-title { color: #f97316; }
        .mode-btn-time { font-size: 9px; color: var(--text-light); font-weight: 600; margin-top: 1px; }
        .mode-btn.active.morning .mode-btn-time { color: var(--wa-green); }
        .mode-btn.active.evening .mode-btn-time { color: #ea580c; }
 
        .browse-btn { background: var(--wa-green); color: #fff; padding: 10px 20px; border-radius: 16px; font-weight: 600; text-decoration: none; display: inline-block; transition: opacity 0.2s; }
        .browse-btn:hover { opacity: 0.9; }
      `}} />
      
      <div className="cart-layout">
        <div className="cart-page">
          <div className="cart-header">
            <div className="cart-header-top">
              <Link href="/home" className="back-btn">
                <ArrowLeft size={16} />
              </Link>
              <h1 className="cart-title">{t('cart.title')}</h1>
              <span className="cart-count">{cartItems.length} {cartItems.length === 1 ? t('cart.item_label') : t('cart.items_label')}</span>
            </div>
          </div>

          <div className="cart-items" style={{ opacity: isPending ? 0.7 : 1 }}>
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '16px', color: 'var(--text-light)', fontWeight: 600 }}>{t('cart.empty')}</span>
                <Link href="/home" className="browse-btn">
                  {t('cart.browse_shops')}
                </Link>
              </div>
            ) : (
              cartItems.map((item) => {
                const imgUrl = item.item_variants?.image_url
                const sellConfig = Array.isArray(item.items?.item_sell_config) ? item.items.item_sell_config[0] : item.items?.item_sell_config
                const isManual = sellConfig?.sell_mode?.toLowerCase() === 'manual'
                const unitPrice = item.estimated_price
                const label = item.item_variants?.label || `${item.requested_value} kg`

                return (
                  <div key={item.id} className="cart-item-content">
                    <div className="item-img-wrap">
                      {imgUrl ? (
                        <img src={imgUrl} className="item-img" alt={item.items?.name} />
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', width: '100%', height: '100%' }}>
                          {getFallbackIcon(item.items?.name, 32)}
                        </span>
                      )}
                    </div>
                    <div className="item-info">
                      <h3 className="item-name">{item.items?.name}</h3>
                      <span className="item-weight">{label}</span>
                      <div className="item-price-qty-row">
                        <span className="item-price">
                          ₹ {unitPrice.toFixed(0)}{isManual ? ' / kg' : ''}
                        </span>
                        <div className="qty-control">
                          <button className="qty-btn minus" onClick={() => handleUpdateQty(item.orderId, item.id, item.requested_value - 1)}>
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <span style={{ fontSize: '13px', fontWeight: 700, width: '18px', textAlign: 'center', color: 'var(--text-base)' }}>
                            {item.requested_value % 1 === 0 ? item.requested_value.toString() : item.requested_value.toFixed(1)}
                          </span>
                          <button className="qty-btn" onClick={() => handleUpdateQty(item.orderId, item.id, item.requested_value + 1)}>
                            <Plus size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="delete-btn-absolute" 
                      onClick={() => handleRemoveItem(item.orderId, item.id)}
                      title={t('cart.remove_item')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })
            )}

            {cartItems.length > 0 && (
              <>
                {/* Delivery Schedule Preferences */}
                <div className="delivery-schedule-card">
                  <div className="schedule-title-row">
                    <span style={{ color: '#4cd964', display: 'flex', alignItems: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </span>
                    <span>{t('cart.delivery_schedule')}</span>
                  </div>
                  
                  {/* Date Selector */}
                  <div className="date-picker-row">
                    <div className="date-picker-label">
                      <Calendar size={16} style={{ color: '#64748b' }} />
                      <span>{formattedDate}</span>
                    </div>
                    <span className="change-date-text">{t('cart.change_date')}</span>
                    <input
                      type="date"
                      className="date-input-hidden"
                      value={deliveryDate}
                      min={todayStr}
                      onChange={(e) => handleDateChange(e.target.value)}
                    />
                  </div>

                  {/* Morning/Evening Toggle */}
                  <div className="mode-toggle-row">
                    <button
                      type="button"
                      className={`mode-btn ${deliveryMode === 'morning' ? 'active morning' : ''}`}
                      disabled={slotStatus.morningDisabled}
                      onClick={() => handleModeChange('morning')}
                      style={{
                        opacity: slotStatus.morningDisabled ? 0.5 : 1,
                        cursor: slotStatus.morningDisabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Sun size={20} style={{ color: deliveryMode === 'morning' ? '#15803d' : '#64748b', transition: 'color 0.2s' }} />
                      <span className="mode-btn-title">{t('cart.morning')}</span>
                      <span className="mode-btn-time">
                        {slotStatus.morningDisabled 
                          ? (slotStatus.morningReason === 'cutoff' ? t('cart.cutoff_passed') : slotStatus.morningReason === 'capacity' ? t('cart.limit_reached') : t('cart.unavailable')) 
                          : '7 AM - 12 PM'}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`mode-btn ${deliveryMode === 'evening' ? 'active evening' : ''}`}
                      disabled={slotStatus.eveningDisabled}
                      onClick={() => handleModeChange('evening')}
                      style={{
                        opacity: slotStatus.eveningDisabled ? 0.5 : 1,
                        cursor: slotStatus.eveningDisabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Moon size={20} style={{ color: deliveryMode === 'evening' ? '#c2410c' : '#64748b', transition: 'color 0.2s' }} />
                      <span className="mode-btn-title">{t('cart.evening')}</span>
                      <span className="mode-btn-time">
                        {slotStatus.eveningDisabled 
                          ? (slotStatus.eveningReason === 'cutoff' ? t('cart.cutoff_passed') : slotStatus.eveningReason === 'capacity' ? t('cart.limit_reached') : t('cart.unavailable')) 
                          : '4 PM - 8 PM'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="summary-row">
                  <span className="summary-label">{t('cart.total')}</span>
                  <span className="summary-val">₹ {finalTotal.toFixed(0)}</span>
                </div>

                <Link
                  href={`/checkout?date=${deliveryDate}&mode=${deliveryMode}`}
                  className="checkout-btn"
                >
                  {t('cart.proceed_checkout')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
