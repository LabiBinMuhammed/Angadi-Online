import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notification Control (Admin)' }

export default function NotificationControlPage() {
  const configs = [
    { key: 'order_placed',   label: 'Order Placed',    icon: '🛍️', enabled: true,  target: 'Customer + Shop' },
    { key: 'order_packing',  label: 'Order Packing',   icon: '📦', enabled: true,  target: 'Customer' },
    { key: 'order_delivery', label: 'Out for Delivery', icon: '🚴', enabled: true,  target: 'Customer' },
    { key: 'order_done',     label: 'Order Delivered',  icon: '✅', enabled: true,  target: 'Customer' },
    { key: 'credit_low',     label: 'Credit Alert',     icon: '💳', enabled: false, target: 'Customer' },
    { key: 'new_order',      label: 'New Order (Shop)', icon: '🔔', enabled: true,  target: 'Shop Owner' },
  ]

  return (
    <>
      <h1 className="panel-page-title">Notification Control</h1>
      <div className="wa-list" style={{ maxWidth: 600 }}>
        {configs.map(c => (
          <div key={c.key} id={`notif-ctrl-${c.key}`} className="wa-list-item" style={{ cursor: 'default' }}>
            <div className="wa-avatar" style={{ background: 'var(--neutral-100)', color: 'var(--text-base)', fontSize: '1.2rem' }}>{c.icon}</div>
            <div className="wa-item-body">
              <p className="wa-item-title">{c.label}</p>
              <p className="wa-item-sub">Target: {c.target}</p>
            </div>
            <span className={`badge ${c.enabled ? 'badge-success' : 'badge-danger'}`}>{c.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted" style={{ marginTop: '1rem' }}>
        Notification toggle controls will connect to your notification provider in a future update.
      </p>
    </>
  )
}
