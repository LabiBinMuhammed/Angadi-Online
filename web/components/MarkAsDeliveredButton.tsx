'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function MarkAsDeliveredButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleMarkAsDelivered() {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId)
      
      if (error) throw error
      router.refresh()
    } catch (e: any) {
      alert('Error updating status: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleMarkAsDelivered}
      disabled={loading}
      className="submit-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        padding: '12px',
        background: 'var(--wa-green-dark)',
        color: '#fff',
        border: 'none',
        borderRadius: '16px',
        fontWeight: 700,
        fontSize: '15px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(18, 140, 126, 0.2)',
        transition: 'all 0.2s'
      }}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={20} />
      ) : (
        <>
          <CheckCircle2 size={20} />
          Confirm Delivery (Mark as Delivered)
        </>
      )}
    </button>
  )
}
