'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { XCircle, Loader2 } from 'lucide-react'

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCancelOrder() {
    if (!confirm('Are you sure you want to cancel this order?')) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
      
      if (error) throw error
      router.refresh()
    } catch (e: any) {
      alert('Error cancelling order: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCancelOrder}
      disabled={loading}
      className="submit-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        padding: '12px',
        background: '#ef4444',
        color: '#fff',
        border: 'none',
        borderRadius: '16px',
        fontWeight: 700,
        fontSize: '15px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
        transition: 'all 0.2s'
      }}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={20} />
      ) : (
        <>
          <XCircle size={20} />
          Cancel Order
        </>
      )}
    </button>
  )
}
