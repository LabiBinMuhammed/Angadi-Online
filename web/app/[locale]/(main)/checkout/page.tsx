'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { PaymentType } from '@/types'
import { ArrowLeft, MapPin, Calendar, CreditCard, Receipt, Sun, Moon, X, Check, Plus } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

function CheckoutForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentType, setPaymentType] = useState<PaymentType>('cod')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [address, setAddress]         = useState<any>(null)
  const [addresses, setAddresses]     = useState<any[]>([])
  
  // Modal states
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressView, setAddressView] = useState<'select' | 'add'>('select')
  const modalContentRef = useRef<HTMLDivElement>(null)

  // Focus trap + Escape key for address modal
  const handleModalKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsAddressModalOpen(false)
      // Inline form reset (avoids forward reference to resetForm)
      setFormLabel('')
      setFormLine1('')
      setFormLine2('')
      setFormLandmark('')
      setSaveToProfile(true)
      setFormError('')
      return
    }
    if (e.key === 'Tab' && modalContentRef.current) {
      const focusable = modalContentRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
  }, [])

  useEffect(() => {
    if (isAddressModalOpen) {
      document.addEventListener('keydown', handleModalKeyDown)
      // Move focus into the modal on open
      setTimeout(() => {
        const firstFocusable = modalContentRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled])'
        )
        firstFocusable?.focus()
      }, 50)
    } else {
      document.removeEventListener('keydown', handleModalKeyDown)
    }
    return () => document.removeEventListener('keydown', handleModalKeyDown)
  }, [isAddressModalOpen, handleModalKeyDown])
  
  // New address form fields
  const [formLabel, setFormLabel]       = useState('Home')
  const [formName, setFormName]         = useState('')
  const [formPhone, setFormPhone]       = useState('')
  const [formHouse, setFormHouse]       = useState('')
  const [formLine1, setFormLine1]       = useState('')
  const [formLine2, setFormLine2]       = useState('')
  const [formLandmark, setFormLandmark] = useState('')
  const [formVillage, setFormVillage]   = useState('')
  const [saveToProfile, setSaveToProfile] = useState(true)
  const [formError, setFormError]       = useState('')
  const [savingAddress, setSavingAddress] = useState(false)

  const [cartItems, setCartItems]     = useState<any[]>([])
  const [subtotal, setSubtotal]       = useState(0)

  const dateParam = searchParams.get('date')
  const modeParam = (searchParams.get('mode') || 'morning').toLowerCase()
  const capitalizedMode = modeParam === 'morning' ? t('checkout.morning') : t('checkout.evening')

  const formattedDate = dateParam
    ? dateParam.split('-').reverse().join('/')
    : new Date().toLocaleDateString('en-GB')

  useEffect(() => {
    const supabase = createClient()
    
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (user.user_metadata?.full_name) {
        setFormName(user.user_metadata.full_name)
      }
      if (user.phone || user.user_metadata?.phone) {
        setFormPhone(user.phone || user.user_metadata?.phone)
      }

      // Load all active addresses
      const { data: userAddrs } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        
      if (userAddrs && userAddrs.length > 0) {
        setAddresses(userAddrs)
        const def = userAddrs.find(a => a.is_default) || userAddrs[0]
        setAddress(def)
      }

      // Load cart summary
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          order_items (
            id, requested_value, estimated_price,
            items (name),
            item_variants (label)
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .is('payment_type', null)
        
      if (orders) {
        const items = orders.flatMap(o => o.order_items?.map((item: any) => ({ ...item, orderId: o.id })) || [])
        setCartItems(items)
        const total = items.reduce((acc, item) => acc + (item.requested_value * item.estimated_price), 0)
        setSubtotal(total)
      }
    }

    loadData()
  }, [])

  function resetForm() {
    setFormLabel('Home')
    setFormHouse('')
    setFormLine1('')
    setFormLine2('')
    setFormLandmark('')
    setFormVillage('')
    setSaveToProfile(true)
    setFormError('')
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!formLine1.trim() && !formHouse.trim()) {
      setFormError(t('checkout.err_fields_required') || 'Street address or House/Building name is required')
      return
    }

    if (saveToProfile) {
      setSavingAddress(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error(t('checkout.err_not_logged_in'))

        const name = formName.trim() || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer'
        const phone = formPhone.trim() || user.phone || user.user_metadata?.phone || '0000000000'

        let fullLine1 = formLine1.trim()
        if (formHouse.trim()) {
          fullLine1 = fullLine1 ? `${formHouse.trim()}, ${fullLine1}` : formHouse.trim()
        }
        let fullLine2 = formLine2.trim()
        if (formVillage.trim()) {
          fullLine2 = fullLine2 ? `${fullLine2}, ${formVillage.trim()}` : formVillage.trim()
        }

        const payload = {
          user_id: user.id,
          label: formLabel.trim() || 'Home',
          contact_name: name,
          contact_phone: phone,
          address_line_1: fullLine1 || null,
          address_line_2: fullLine2 || null,
          landmark: formLandmark.trim() || null,
          is_active: true,
          is_default: addresses.length === 0
        }

        const { data: newAddr, error: insertErr } = await supabase
          .from('user_addresses')
          .insert(payload)
          .select('*')
          .single()

        if (insertErr) throw insertErr

        setAddresses(prev => [...prev, newAddr])
        setAddress(newAddr)
        setIsAddressModalOpen(false)
        resetForm()
      } catch (err: any) {
        setFormError(err.message === 'Not logged in' || err.message === t('checkout.err_not_logged_in') ? t('checkout.err_not_logged_in') : (err.message || t('checkout.err_save_address')))
      } finally {
        setSavingAddress(false)
      }
    } else {
      let name = formName.trim() || 'Customer'
      let phone = formPhone.trim() || '0000000000'
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          name = formName.trim() || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer'
          phone = formPhone.trim() || user.phone || user.user_metadata?.phone || '0000000000'
        }
      } catch (_) {}

      const tempAddress = {
        id: `temp-${Date.now()}`,
        label: formLabel.trim() || 'Home',
        contact_name: name,
        contact_phone: phone,
        house_name: formHouse.trim() || null,
        address_line_1: formLine1.trim() || null,
        address_line_2: formLine2.trim() || null,
        landmark: formLandmark.trim() || null,
        village: formVillage.trim() || null,
        is_temp: true,
      }
      setAddress(tempAddress)
      setIsAddressModalOpen(false)
      resetForm()
    }
  }

  async function placeOrder() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(t('checkout.err_not_logged_in'))

      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .is('payment_type', null)

      if (!pendingOrders || pendingOrders.length === 0) {
        router.push('/orders')
        return
      }

      const activeAddress = address || {
        label: 'Home',
        contact_name: user.email?.split('@')[0] || 'Customer',
        contact_phone: '9999999999',
        address_line_1: 'Village Main Street',
        address_line_2: '',
        landmark: ''
      }

      const orderIds = pendingOrders.map(o => o.id)

      // Call transaction-safe checkout RPC
      let rpcErr: any = null
      const { error: primaryErr } = await supabase.rpc('place_checkout_orders', {
        p_order_ids: orderIds,
        p_payment_type: paymentType,
        p_delivery_date: dateParam || new Date().toISOString().split('T')[0],
        p_delivery_slot: modeParam || 'morning',
        p_contact_name: activeAddress.contact_name,
        p_contact_phone: activeAddress.contact_phone,
        p_address_line_1: activeAddress.address_line_1,
        p_address_line_2: activeAddress.address_line_2 || null,
        p_landmark: activeAddress.landmark || null,
        p_label: activeAddress.label || 'Home',
        p_house_name: (activeAddress as any).house_name || null,
        p_village: (activeAddress as any).village || null,
        p_delivery_note: (activeAddress as any).delivery_note || null,
        p_latitude: (activeAddress as any).latitude || null,
        p_longitude: (activeAddress as any).longitude || null
      })
      rpcErr = primaryErr

      if (primaryErr && (primaryErr.code === 'PGRST202' || primaryErr.message?.includes('place_checkout_orders'))) {
        const { error: fallbackErr } = await supabase.rpc('place_checkout_orders', {
          p_order_ids: orderIds,
          p_payment_type: paymentType,
          p_delivery_date: dateParam || new Date().toISOString().split('T')[0],
          p_delivery_slot: modeParam || 'morning',
          p_contact_name: activeAddress.contact_name,
          p_contact_phone: activeAddress.contact_phone,
          p_address_line_1: activeAddress.address_line_1,
          p_address_line_2: activeAddress.address_line_2 || null,
          p_landmark: activeAddress.landmark || null,
          p_label: activeAddress.label || 'Home'
        })
        rpcErr = fallbackErr

        if (!fallbackErr) {
          const updateData: any = {}
          if ((activeAddress as any).house_name) updateData.house_name = (activeAddress as any).house_name
          if ((activeAddress as any).village) updateData.village = (activeAddress as any).village
          if ((activeAddress as any).delivery_note) updateData.delivery_note = (activeAddress as any).delivery_note
          if ((activeAddress as any).latitude) updateData.latitude = (activeAddress as any).latitude
          if ((activeAddress as any).longitude) updateData.longitude = (activeAddress as any).longitude

          if (Object.keys(updateData).length > 0) {
            for (const oid of orderIds) {
              await supabase.from('order_addresses').update(updateData).eq('order_id', oid)
            }
          }
        }
      }

      if (rpcErr) throw rpcErr

      router.push('/orders')
    } catch (err: any) {
      if (paymentType === 'credit' && (
        err.message.includes('credit') ||
        err.message.includes('Credit') ||
        err.message.includes('limit') ||
        err.message.includes('blocked')
      )) {
        setError(err.message + " We have updated your payment method to Cash on Delivery (COD). Click 'Place Order' again to confirm.");
        setPaymentType('cod')
      } else {
        setError(err.message === 'Not logged in' || err.message === t('checkout.err_not_logged_in') ? t('checkout.err_not_logged_in') : (err.message || t('checkout.err_place_order')))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        main.page:has(.checkout-layout) {
          padding: 0 !important;
          max-width: 100% !important;
          height: 100vh !important;
          height: 100dvh !important;
          overflow: hidden !important;
        }
        main.page:has(.checkout-layout) footer {
          display: none !important;
        }
        @media (max-width: 767px) {
          .main-layout-wrapper:has(.checkout-layout) {
            height: 100vh !important;
            height: 100dvh !important;
            overflow: hidden !important;
          }
          .main-viewport:has(.checkout-layout) {
            height: 100vh !important;
            height: 100dvh !important;
            overflow: hidden !important;
          }
        }

        body { background: var(--bg-base); margin: 0; font-family: system-ui, -apple-system, sans-serif; overflow: hidden; }
        .checkout-layout { display: flex; width: 100%; height: 100dvh; background: var(--bg-base); justify-content: center; }
        .checkout-page { width: 100%; max-width: 600px; height: 100%; display: flex; flex-direction: column; position: relative; background: var(--bg-base); box-shadow: 0 0 40px rgba(0,0,0,0.02); }
        
        .checkout-header { padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); background: var(--bg-surface); z-index: 10; }
        .checkout-header-top { display: flex; align-items: center; gap: 10px; width: 100%; }
        .back-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; background: var(--bg-surface); color: var(--text-base); cursor: pointer; transition: background 0.2s; }
        .back-btn:hover { background: var(--bg-muted); }
        .checkout-title { font-size: 17px; font-weight: 800; color: var(--text-base); margin: 0; letter-spacing: -0.3px; flex: 1; }
        .checkout-count { font-size: 12px; color: var(--text-muted); font-weight: 600; }
        
        .checkout-sections { flex: 1; overflow-y: auto; padding: 12px 12px 24px; display: flex; flex-direction: column; gap: 10px; }
        .checkout-sections::-webkit-scrollbar { display: none; }
        
        .checkout-section-card { background: var(--bg-surface); border-radius: 24px; padding: 16px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 12px; }
        .checkout-section-title { font-size: 14px; font-weight: 800; color: var(--wa-green-dark); display: flex; align-items: center; gap: 8px; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .payment-toggle-row { display: flex; gap: 10px; }
        .payment-btn { flex: 1; padding: 12px; border-radius: 12px; background: var(--bg-surface); border: 1px solid var(--border); font-size: 13px; font-weight: 700; color: var(--text-muted); cursor: pointer; transition: all 0.2s ease; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .payment-btn:hover { background: var(--bg-muted); }
        .payment-btn.active { background: var(--wa-green-light); border: 1.5px solid var(--wa-green); color: var(--wa-green-dark); }
        
        .summary-item-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-base); }
        .summary-item-name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
        .summary-item-price { font-weight: 700; flex-shrink: 0; margin-left: 12px; }
        
        .checkout-footer { padding: 16px; border-top: 1px solid var(--border); background: var(--bg-surface); display: flex; flex-direction: column; gap: 10px; z-index: 10; }
        .checkout-footer-row { display: flex; justify-content: space-between; align-items: center; }
        .checkout-footer-label { font-size: 14px; color: var(--text-base); font-weight: 600; }
        .checkout-footer-val { font-size: 18px; font-weight: 800; color: var(--wa-green-dark); }

        .checkout-submit-btn { width: 100%; background: var(--wa-green); color: #fff; border: none; border-radius: 20px; padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(76,217,100,0.2); transition: opacity 0.2s; text-align: center; }
        .checkout-submit-btn:hover { opacity: 0.9; }
        .checkout-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .change-address-btn { background: var(--bg-muted); border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 700; color: var(--text-base); cursor: pointer; margin-top: 4px; transition: all 0.2s; align-self: flex-start; }
        .change-address-btn:hover { background: var(--border); }
        .form-error { color: #ff4757; font-size: 13px; font-weight: 600; margin: 4px 0 0; text-align: center; }

        /* Modal styling */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: var(--bg-surface);
          width: 90%;
          max-width: 480px;
          border-radius: 24px;
          border: 1px solid var(--border);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 85vh;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
        }
        .modal-title {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: var(--text-base);
        }
        .modal-close {
          border: none;
          background: transparent;
          font-size: 24px;
          cursor: pointer;
          color: var(--text-muted);
          transition: color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close:hover {
          color: var(--text-base);
        }
        .modal-body {
          padding: 16px 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .modal-body::-webkit-scrollbar {
          display: none;
        }
        .empty-state {
          text-align: center;
          padding: 24px 0;
          color: var(--text-muted);
        }
        .modal-btn-add-new {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px;
          border-radius: 16px;
          border: 1.5px dashed var(--border);
          background: transparent;
          color: var(--wa-green-dark);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal-btn-add-new:hover {
          border-color: var(--wa-green);
          background: var(--wa-green-light);
        }
        .address-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .address-item {
          padding: 12px 16px;
          border-radius: 16px;
          border: 1px solid var(--border);
          background: var(--bg-surface);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s;
          gap: 12px;
        }
        .address-item:hover {
          border-color: var(--wa-green);
          background: var(--bg-muted);
        }
        .address-item.active {
          border-color: var(--wa-green);
          background: var(--wa-green-light);
        }
        .address-item-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }
        .address-contact {
          margin: 0;
          font-weight: 700;
          font-size: 14px;
          color: var(--text-base);
        }
        .address-line {
          margin: 0;
          font-size: 12px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .address-landmark {
          margin: 0;
          font-size: 12px;
          color: var(--text-muted);
          font-style: italic;
        }
        .selected-indicator {
          color: var(--wa-green-dark);
          flex-shrink: 0;
        }

        /* Form styling inside modal */
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-base);
        }
        .form-input {
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg-surface);
          color: var(--text-base);
          font-size: 13px;
          width: 100%;
          box-sizing: border-box;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--wa-green);
        }
        .form-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: var(--text-base);
          margin-top: 4px;
        }
        .modal-action-row {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }
        .modal-btn-cancel {
          flex: 1;
          padding: 10px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .modal-btn-confirm {
          flex: 1;
          padding: 10px;
          border-radius: 12px;
          border: none;
          background: var(--wa-green);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .modal-btn-confirm:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .temp-badge {
          display: inline-block;
          font-size: 10px;
          background: #e0f2fe;
          color: #0369a1;
          padding: 2px 6px;
          border-radius: 6px;
          font-weight: 700;
          margin-top: 4px;
          align-self: flex-start;
        }
      `}} />

      <div className="checkout-layout">
        <div className="checkout-page">
          <div className="checkout-header">
            <div className="checkout-header-top">
              <button onClick={() => router.back()} className="back-btn">
                <ArrowLeft size={16} />
              </button>
              <h1 className="checkout-title">{t('checkout.title')}</h1>
              <span className="checkout-count">{cartItems.length} {cartItems.length === 1 ? t('checkout.item') : t('checkout.items')}</span>
            </div>
          </div>

          <div className="checkout-sections">
            {/* Delivery address section */}
            <div className="checkout-section-card">
              <h2 className="checkout-section-title">
                <MapPin size={16} />
                <span>{t('checkout.delivery_address')}</span>
              </h2>
              {address ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--text-base)' }}>
                    {address.contact_name} ({address.contact_phone})
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {address.address_line_1}
                  </p>
                  {address.address_line_2 && (
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                      {address.address_line_2}
                    </p>
                  )}
                  {address.landmark && (
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                      Near {address.landmark}
                    </p>
                  )}
                  {address.is_temp && (
                    <span className="temp-badge">{t('checkout.this_time_only')}</span>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{t('checkout.no_address_selected')}</p>
              )}
              <button 
                className="change-address-btn" 
                id="btn-select-address"
                onClick={() => {
                  setAddressView('select')
                  setIsAddressModalOpen(true)
                }}
              >
                {t('checkout.change_address')}
              </button>
            </div>

            {/* Delivery schedule section */}
            <div className="checkout-section-card">
              <h2 className="checkout-section-title">
                <Calendar size={16} />
                <span>{t('checkout.delivery_schedule')}</span>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: modeParam === 'morning' ? 'var(--wa-green-light)' : 'rgba(249,115,22,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: modeParam === 'morning' ? 'var(--wa-green-dark)' : '#f97316'
                }}>
                  {modeParam === 'morning' ? <Sun size={20} /> : <Moon size={20} />}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '14px', color: 'var(--text-base)' }}>
                    {capitalizedMode} Slot ({modeParam === 'morning' ? '7 AM - 12 PM' : '4 PM - 8 PM'})
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>On {formattedDate}</p>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="checkout-section-card">
              <h2 className="checkout-section-title">
                <CreditCard size={16} />
                <span>{t('checkout.payment_method')}</span>
              </h2>
              <div className="payment-toggle-row">
                {(['cod', 'credit'] as PaymentType[]).map((type) => {
                  const isCredit = type === 'credit';
                  return (
                    <button
                      key={type}
                      id={`payment-${type}`}
                      className={`payment-btn ${paymentType === type ? 'active' : ''}`}
                      onClick={() => {
                        if (!isCredit) {
                          setPaymentType(type);
                        }
                      }}
                      disabled={isCredit}
                      style={isCredit ? {
                        opacity: 0.6,
                        cursor: 'not-allowed',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '12px 8px'
                      } : {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '12px 8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{type === 'cod' ? '💵' : '🏦'}</span>
                        <span>{type === 'cod' ? t('checkout.cod') : t('checkout.credit')}</span>
                      </div>
                      {isCredit && (
                        <span style={{ 
                          fontSize: '9px', 
                          fontWeight: 800, 
                          color: '#fff', 
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                          padding: '2px 8px', 
                          borderRadius: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          boxShadow: '0 2px 4px rgba(217,119,6,0.2)'
                        }}>
                          Coming Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order summary */}
            <div className="checkout-section-card">
              <h2 className="checkout-section-title">
                <Receipt size={16} />
                <span>{t('checkout.order_summary')}</span>
              </h2>
              {cartItems.length === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{t('checkout.no_items_cart')}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="summary-item-row">
                      <span className="summary-item-name">
                        {item.items?.name} ({item.item_variants?.label || `${item.requested_value} ${t('checkout.unit')}`}) x {item.requested_value}
                      </span>
                      <span className="summary-item-price">
                        ₹ {(item.requested_value * item.estimated_price).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="checkout-footer">
            <div className="checkout-footer-row">
              <span className="checkout-footer-label">{t('checkout.total')}</span>
              <span className="checkout-footer-val">₹ {subtotal.toFixed(0)}</span>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              id="btn-place-order"
              className="checkout-submit-btn"
              onClick={placeOrder}
              disabled={loading || !address}
            >
              {loading ? t('checkout.placing_order') : t('checkout.place_order')}
            </button>
          </div>
        </div>
      </div>

      {/* Address Selection & Creation Modal */}
      {isAddressModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => { setIsAddressModalOpen(false); resetForm(); }}
          role="presentation"
        >
          <div 
            ref={modalContentRef}
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-modal-title"
          >
            <div className="modal-header">
              <h3 className="modal-title" id="address-modal-title">
                {addressView === 'select' ? t('checkout.select_address') : t('checkout.add_new_address')}
              </h3>
              <button 
                className="modal-close" 
                aria-label="Close address modal"
                onClick={() => { setIsAddressModalOpen(false); resetForm(); }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {addressView === 'select' ? (
                <>
                  <button 
                    type="button" 
                    className="modal-btn-add-new" 
                    onClick={() => setAddressView('add')}
                  >
                    <Plus size={16} />
                    <span>{t('checkout.add_new_address')}</span>
                  </button>

                  {addresses.length === 0 ? (
                    <div className="empty-state">
                      <p>{t('checkout.no_addresses_found')}</p>
                    </div>
                  ) : (
                    <div className="address-list">
                      {addresses.map((addr) => {
                        const isSelected = address?.id === addr.id && !address.is_temp
                        const l1 = [addr.house_name, addr.address_line_1].filter(Boolean).join(', ')
                        const l2 = [addr.address_line_2, addr.village].filter(Boolean).join(', ')
                        return (
                          <div 
                            key={addr.id} 
                            className={`address-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              setAddress(addr)
                              setIsAddressModalOpen(false)
                            }}
                          >
                            <div className="address-item-details">
                              <p className="address-contact">{addr.label || 'Home'} · {addr.contact_name} ({addr.contact_phone})</p>
                              {l1 && <p className="address-line">{l1}</p>}
                              {l2 && <p className="address-line">{l2}</p>}
                              {addr.landmark && <p className="address-landmark">Near {addr.landmark}</p>}
                            </div>
                            {isSelected && (
                              <div className="selected-indicator">
                                <Check size={20} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                // Add Address Form inside Modal
                <form onSubmit={handleAddAddress} className="modal-form">
                  {formError && <p className="form-error" role="alert">{formError}</p>}
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="addr-label">{t('checkout.address_label')} *</label>
                    <input 
                      id="addr-label"
                      type="text" 
                      className="form-input" 
                      placeholder={t('checkout.placeholder_address_label') || 'e.g. Home / Work'} 
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="addr-name">{t('address.contact_name_req') || 'Name'} *</label>
                      <input 
                        id="addr-name"
                        type="text" 
                        className="form-input" 
                        placeholder="Full Name" 
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="addr-phone">{t('address.contact_phone_req') || 'Phone'} *</label>
                      <input 
                        id="addr-phone"
                        type="tel" 
                        className="form-input" 
                        placeholder="Phone Number" 
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="addr-house">{t('address.house_name_label') || 'House / Villa / Building Name'}</label>
                    <input 
                      id="addr-house"
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Al Madeena Villa, Door #4" 
                      value={formHouse}
                      onChange={(e) => setFormHouse(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="addr-line1">{t('checkout.address_line_1')} *</label>
                    <input 
                      id="addr-line1"
                      type="text" 
                      className="form-input" 
                      placeholder={t('checkout.placeholder_street')} 
                      value={formLine1}
                      onChange={(e) => setFormLine1(e.target.value)}
                      autoComplete="address-line1"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="addr-line2">{t('checkout.address_line_2_opt')}</label>
                      <input 
                        id="addr-line2"
                        type="text" 
                        className="form-input" 
                        placeholder={t('checkout.placeholder_apt')} 
                        value={formLine2}
                        onChange={(e) => setFormLine2(e.target.value)}
                        autoComplete="address-line2"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="addr-landmark">{t('checkout.landmark_opt')}</label>
                      <input 
                        id="addr-landmark"
                        type="text" 
                        className="form-input" 
                        placeholder={t('checkout.placeholder_landmark')} 
                        value={formLandmark}
                        onChange={(e) => setFormLandmark(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="addr-village">{t('address.village_label') || 'Village / City / Area'}</label>
                    <input 
                      id="addr-village"
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Kizhisseri / Kondotty" 
                      value={formVillage}
                      onChange={(e) => setFormVillage(e.target.value)}
                    />
                  </div>

                  <label className="form-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={saveToProfile}
                      onChange={(e) => setSaveToProfile(e.target.checked)}
                      style={{ accentColor: 'var(--wa-green-dark)', width: 16, height: 16 }}
                    />
                    <span>{t('checkout.save_to_address_book')}</span>
                  </label>

                  <div className="modal-action-row">
                    <button 
                      type="button" 
                      className="modal-btn-cancel" 
                      onClick={() => { setAddressView('select'); setFormError(''); }}
                      disabled={savingAddress}
                    >
                      {t('checkout.back')}
                    </button>
                    <button 
                      type="submit" 
                      className="modal-btn-confirm"
                      disabled={savingAddress}
                    >
                      {savingAddress ? t('checkout.saving') : t('checkout.use_address')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function CheckoutPage() {
  const { t } = useTranslation()
  return (
    <Suspense fallback={<div>{t('checkout.loading')}</div>}>
      <CheckoutForm />
    </Suspense>
  )
}
