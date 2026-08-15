'use client'

import { useState } from 'react'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import { confirmReplacementReceivedAction } from '@/app/actions/replacements'
import { useRouter } from 'next/navigation'

interface Props {
  requestId: string
}

export default function ConfirmReplacementButton({ requestId }: Props) {
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleConfirm = async () => {
    if (!confirm('Have you received your replacement items in good condition?')) return
    setLoading(true)
    setError('')

    try {
      const res = await confirmReplacementReceivedAction(requestId)
      if (res.error) {
        setError(res.error)
      } else {
        setConfirmed(true)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm replacement')
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <div style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px', 
        color: '#22c55e', 
        fontWeight: 700, 
        fontSize: '13px',
        background: 'rgba(34, 197, 94, 0.1)',
        padding: '6px 12px',
        borderRadius: '10px'
      }}>
        <CheckCircle2 size={16} />
        Replacement Confirmed Received 🎉
      </div>
    )
  }

  return (
    <div style={{ marginTop: '12px' }}>
      <button
        onClick={handleConfirm}
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          fontWeight: 800,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        {loading ? (
          <>
            <RefreshCw size={16} className="spinner" />
            <span>Confirming...</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={16} />
            <span>Confirm Replacement Received (Complete)</span>
          </>
        )}
      </button>
      {error && (
        <p style={{ margin: '6px 0 0', color: '#ef4444', fontSize: '12px', fontWeight: 600 }}>
          {error}
        </p>
      )}
    </div>
  )
}
