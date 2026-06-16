'use client'

import Link from 'next/link'
import { Clock, Package, Truck, CheckCircle2, XCircle } from 'lucide-react'

type OrderRow = {
  id: string
  status: string
  created_at: string
  shops: { name: string } | null
}

const STATUS_MAP: Record<string, { bg: string; color: string; label: string; Icon: any }> = {
  pending:    { bg: 'var(--status-pending-bg)', color: '#f59e0b', label: 'Order Placed', Icon: Clock },
  packing:    { bg: 'var(--status-packing-bg)', color: '#0ea5e9', label: 'Preparing',    Icon: Package },
  delivering: { bg: 'var(--status-packing-bg)', color: '#0ea5e9', label: 'On the way', Icon: Truck },
  delivered:  { bg: 'var(--status-delivered-bg)', color: '#22c55e', label: 'Delivered',  Icon: CheckCircle2 },
  cancelled:  { bg: 'var(--status-cancelled-bg)', color: '#ef4444', label: 'Cancelled',  Icon: XCircle },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationsClient({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔔</div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-base)', margin: '0 0 8px' }}>No notifications</h2>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>You're all caught up!</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {orders.map((order) => {
        const isUnread = order.status === 'delivering' || order.status === 'pending'
        const st = STATUS_MAP[order.status] ?? { bg: 'var(--bg-muted)', color: 'var(--text-muted)', label: order.status, Icon: Package }
        const StatusIcon = st.Icon

        return (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            style={{ 
              background: 'var(--bg-surface)', 
              borderRadius: '24px', 
              padding: '20px', 
              display: 'flex', 
              gap: '16px',
              textDecoration: 'none',
              boxShadow: isUnread ? '0 8px 24px rgba(76,217,100,0.15)' : '0 4px 20px rgba(0,0,0,0.03)',
              border: isUnread ? '2px solid var(--wa-green)' : '2px solid transparent',
              transition: 'transform 0.2s',
              position: 'relative'
            }}
          >
            {isUnread && <div style={{ position: 'absolute', top: '24px', right: '24px', width: '8px', height: '8px', borderRadius: '50%', background: '#ff4757' }}></div>}
            <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: st.bg, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <StatusIcon size={28} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1, paddingTop: '4px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-base)', margin: '0 0 4px' }}>{order.shops?.name ?? 'Shop'}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 8px', fontWeight: 500 }}>{st.label}</p>
              <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 600 }}>{timeAgo(order.created_at)}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
