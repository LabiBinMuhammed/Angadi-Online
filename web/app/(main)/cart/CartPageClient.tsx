'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { removeOrderItem, updateOrderItemQty } from './actions'
import { ArrowLeft, Trash2, Heart, Plus, Minus, Home, LayoutGrid, ShoppingBag, User as UserIcon } from 'lucide-react'

export default function CartPageClient({ initialOrders }: { initialOrders: any[] }) {
  const [isPending, startTransition] = useTransition()
  
  const pendingOrders = initialOrders?.filter(o => o.status === 'pending') || []
  const cartItems = pendingOrders.flatMap(o => o.order_items?.map((item: any) => ({ ...item, orderId: o.id })) || [])

  const subtotal = cartItems.reduce((acc, item) => acc + (item.final_price ?? (item.requested_value * item.estimated_price)), 0)
  const discount = cartItems.length > 0 ? 5.2 : 0 // Hardcoded to match image
  const finalTotal = Math.max(0, subtotal - discount)

  function handleRemoveItem(orderId: string, itemId: string) {
    startTransition(async () => {
      try {
        await removeOrderItem(orderId, itemId)
      } catch (err) {
        alert('Failed to remove item')
      }
    })
  }

  function handleUpdateQty(orderId: string, itemId: string, newQty: number) {
    if (newQty < 1) return handleRemoveItem(orderId, itemId)
    startTransition(async () => {
      try {
        await updateOrderItemQty(orderId, itemId, newQty)
      } catch (err) {
        alert('Failed to update quantity')
      }
    })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: #fafafa; margin: 0; font-family: system-ui, -apple-system, sans-serif; overflow: hidden; }
        .cart-layout { display: flex; width: 100%; height: 100dvh; background: #fafafa; justify-content: center; }
        .cart-page { width: 100%; max-width: 600px; height: 100%; display: flex; flex-direction: column; position: relative; background: #fafafa; box-shadow: 0 0 40px rgba(0,0,0,0.02); }
        .cart-header { padding: 40px 24px 20px; display: flex; flex-direction: column; gap: 24px; }
        .back-btn { width: 44px; height: 44px; border-radius: 50%; border: 1px solid #e0e0e0; display: flex; align-items: center; justify-content: center; background: #fff; color: #555; text-decoration: none; }
        .cart-title-row { display: flex; justify-content: space-between; align-items: flex-end; }
        .cart-title { font-size: 32px; font-weight: 800; color: #1e4d1e; margin: 0; letter-spacing: -1px; }
        .cart-count { font-size: 16px; color: #999; font-weight: 500; }
        
        .cart-items { flex: 1; overflow-y: auto; padding: 0 24px 120px; display: flex; flex-direction: column; gap: 16px; }
        .cart-items::-webkit-scrollbar { display: none; }
        
        .cart-item-wrap { position: relative; border-radius: 24px; overflow: hidden; background: #ffebeb; display: flex; align-items: center; justify-content: flex-end; }
        .cart-item-content { position: relative; width: 100%; background: #fff; border-radius: 24px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); z-index: 2; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .cart-item-wrap:hover .cart-item-content { transform: translateX(-70px); }
        .delete-btn { position: absolute; right: 0; width: 70px; height: 100%; display: flex; align-items: center; justify-content: center; color: #ff4757; background: transparent; border: none; cursor: pointer; z-index: 1; }
        
        .item-img-wrap { width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .item-img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.1)); }
        
        .item-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .item-name { font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 0; }
        .item-weight { font-size: 12px; color: #999; font-weight: 500; }
        .item-price { font-size: 18px; font-weight: 800; color: #4cd964; }
        
        .item-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
        .heart-btn { width: 24px; height: 24px; border-radius: 50%; background: #fff; border: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: center; color: #ff4757; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .qty-control { display: flex; align-items: center; gap: 12px; background: #fff; border-radius: 12px; padding: 4px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .qty-btn { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; color: #4cd964; font-weight: bold; cursor: pointer; }
        .qty-btn.minus { color: #999; }
        
        .promo-code { margin: 24px 0; background: #f5f5f5; border-radius: 20px; display: flex; align-items: center; padding: 6px 6px 6px 20px; }
        .promo-input { flex: 1; border: none; background: transparent; font-size: 14px; font-weight: 600; color: #333; outline: none; }
        .promo-btn { background: #1e4d1e; color: #fff; border: none; border-radius: 16px; padding: 12px 24px; font-weight: 600; font-size: 14px; cursor: pointer; transition: opacity 0.2s; }
        .promo-btn:hover { opacity: 0.9; }
        
        .summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .summary-label { font-size: 16px; color: #1a1a1a; font-weight: 500; }
        .summary-val { font-size: 20px; font-weight: 800; color: #4cd964; }
        .summary-val.red { color: #ff4757; }
        
        .divider { height: 1px; background: #eaeaea; margin: 16px 0; }
        
        .checkout-btn { width: 100%; background: linear-gradient(135deg, #4cd964, #32b84a); color: #fff; border: none; border-radius: 24px; padding: 18px; font-size: 16px; font-weight: 700; margin-top: 10px; cursor: pointer; box-shadow: 0 8px 20px rgba(76,217,100,0.3); transition: transform 0.2s; }
        .checkout-btn:hover { transform: translateY(-2px); }

        .mobile-footer { position: absolute; bottom: 0; left: 0; width: 100%; background: #fff; border-top-left-radius: 32px; border-top-right-radius: 32px; display: flex; justify-content: space-around; padding: 24px 20px 32px; box-shadow: 0 -10px 40px rgba(0,0,0,0.04); z-index: 100; }
        header.wa-sidebar-top, .global-navbar, .mobile-footer-nav, main ~ .mobile-footer-nav { display: none !important; }
      `}} />
      
      <div className="cart-layout">
        <div className="cart-page">
          <div className="cart-header">
            <Link href="/home" className="back-btn">
              <ArrowLeft size={20} />
            </Link>
            <div className="cart-title-row">
              <h1 className="cart-title">My Bag</h1>
              <span className="cart-count">{cartItems.length} items</span>
            </div>
          </div>

          <div className="cart-items">
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999', fontSize: '18px', fontWeight: 600 }}>Your bag is empty</div>
            ) : (
              cartItems.map((item, idx) => {
                const imgUrl = item.item_variants?.image_url
                const price = item.final_price ?? (item.requested_value * item.estimated_price)
                const unit = 'kg'

                return (
                  <div key={item.id} className="cart-item-wrap">
                    <button className="delete-btn" onClick={() => handleRemoveItem(item.orderId, item.id)}>
                      <Trash2 size={24} />
                    </button>
                    <div className="cart-item-content">
                      <div className="item-img-wrap">
                        {imgUrl ? (
                          <img src={imgUrl} className="item-img" alt={item.items?.name} />
                        ) : (
                          <span style={{ fontSize: '40px' }}>📦</span>
                        )}
                      </div>
                      <div className="item-info">
                        <h3 className="item-name">{item.items?.name}</h3>
                        <span className="item-weight">{item.requested_value} {unit}</span>
                        <span className="item-price">$ {price.toFixed(1)}</span>
                      </div>
                      <div className="item-actions">
                        <div className="heart-btn">
                          <Heart size={10} fill="#ff4757" color="#ff4757" />
                        </div>
                        <div className="qty-control">
                          <button className="qty-btn minus" onClick={() => handleUpdateQty(item.orderId, item.id, item.requested_value - 1)}>
                            <Minus size={16} strokeWidth={3} />
                          </button>
                          <span style={{ fontSize: '14px', fontWeight: 600, width: '12px', textAlign: 'center' }}>{item.requested_value}</span>
                          <button className="qty-btn" onClick={() => handleUpdateQty(item.orderId, item.id, item.requested_value + 1)}>
                            <Plus size={16} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            {cartItems.length > 0 && (
              <>
                <div className="promo-code">
                  <input type="text" className="promo-input" defaultValue="WELCOME2021" />
                  <button className="promo-btn">Apply</button>
                </div>

                <div className="summary-row">
                  <span className="summary-label">Total</span>
                  <span className="summary-val">$ {subtotal.toFixed(1)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Discount</span>
                  <span className="summary-val red">$ {discount.toFixed(1)}</span>
                </div>
                <div className="divider"></div>
                <div className="summary-row">
                  <span className="summary-label">Total</span>
                  <span className="summary-val">$ {finalTotal.toFixed(1)}</span>
                </div>

                <button className="checkout-btn">Proceed To Checkout</button>
              </>
            )}
          </div>

          {/* Footer with Bag active */}
          <div className="mobile-footer">
            <Link href="/home" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#999', textDecoration: 'none', paddingTop: '4px' }}>
              <Home size={24} strokeWidth={2.5} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Home</span>
            </Link>
            <Link href="/home" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#999', textDecoration: 'none', paddingTop: '4px' }}>
              <LayoutGrid size={24} strokeWidth={2.5} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Categories</span>
            </Link>
            <Link href="/cart" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#2b5a2b', textDecoration: 'none' }}>
              <div style={{ 
                position: 'absolute', 
                top: '-42px', 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #4cd964, #32b84a)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(76,217,100,0.4)',
                color: '#fff'
              }}>
                <ShoppingBag size={28} strokeWidth={2.5} />
                <div style={{ position: 'absolute', top: '16px', right: '16px', width: '8px', height: '8px', borderRadius: '50%', background: '#ff4757', border: '2px solid #32b84a' }}></div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, marginTop: '28px', color: '#2b5a2b' }}>Bag</span>
            </Link>
            <Link href="/profile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#999', textDecoration: 'none', paddingTop: '4px' }}>
              <UserIcon size={24} strokeWidth={2.5} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Profile</span>
            </Link>
            <div style={{ position: 'absolute', bottom: '8px', width: '130px', height: '5px', background: '#000', borderRadius: '10px' }} />
          </div>
        </div>
      </div>
    </>
  )
}
