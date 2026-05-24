'use client'

import type { Metadata } from 'next'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PaymentType } from '@/types'

export default function CheckoutPage() {
  const router  = useRouter()
  const [paymentType, setPaymentType] = useState<PaymentType>('cod')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  async function placeOrder() {
    setLoading(true)
    setError('')
    try {
      // TODO: build order payload from cart context + selected address
      // const supabase = createClient()
      // const { data, error } = await supabase.from('orders').insert({...})
      router.push('/orders')
    } catch {
      setError('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold" style={{ marginBottom: '1.5rem' }}>Checkout</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 540 }}>
        {/* Delivery address section */}
        <div className="card card-body">
          <h2 className="font-semibold" style={{ marginBottom: '.75rem' }}>📍 Delivery Address</h2>
          <p className="text-muted text-sm">No address selected.</p>
          {/* TODO: address picker */}
          <button className="btn btn-outline btn-sm" style={{ marginTop: '.75rem' }} id="btn-select-address">
            Select Address
          </button>
        </div>

        {/* Payment method */}
        <div className="card card-body">
          <h2 className="font-semibold" style={{ marginBottom: '.75rem' }}>💳 Payment Method</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {(['cod', 'credit'] as PaymentType[]).map((type) => (
              <button
                key={type}
                id={`payment-${type}`}
                className={`btn btn-sm ${paymentType === type ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPaymentType(type)}
              >
                {type === 'cod' ? '💵 Cash on Delivery' : '🏦 Pay Later'}
              </button>
            ))}
          </div>
        </div>

        {/* Order summary placeholder */}
        <div className="card card-body">
          <h2 className="font-semibold" style={{ marginBottom: '.75rem' }}>🧾 Order Summary</h2>
          <p className="text-muted text-sm">Items will appear here.</p>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          id="btn-place-order"
          className="btn btn-primary btn-full btn-lg"
          onClick={placeOrder}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : 'Place Order'}
        </button>
      </div>
    </>
  )
}
