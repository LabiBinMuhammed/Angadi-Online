import type { Metadata } from 'next'
import { ShoppingBag, Package, Bike, CheckCircle, CreditCard, Bell } from 'lucide-react'

export const metadata: Metadata = { title: 'Notification Control (Admin)' }

export default function NotificationControlPage() {
  const configs = [
    { key: 'order_placed',   label: 'Order Placed',    icon: <ShoppingBag size={20} />, enabled: true,  target: 'Customer + Shop' },
    { key: 'order_packing',  label: 'Order Packing',   icon: <Package size={20} />, enabled: true,  target: 'Customer' },
    { key: 'order_delivery', label: 'Out for Delivery', icon: <Bike size={20} />, enabled: true,  target: 'Customer' },
    { key: 'order_done',     label: 'Order Delivered',  icon: <CheckCircle size={20} />, enabled: true,  target: 'Customer' },
    { key: 'credit_low',     label: 'Credit Alert',     icon: <CreditCard size={20} />, enabled: false, target: 'Customer' },
    { key: 'new_order',      label: 'New Order (Shop)', icon: <Bell size={20} />, enabled: true,  target: 'Shop Owner' },
  ]

  return (
    <>
      <h1 className="panel-page-title">Notification Control</h1>
      <div className="wa-list" style={{ maxWidth: 600 }}>
        {configs.map(c => (
          <div key={c.key} id={`notif-ctrl-${c.key}`} className="wa-list-item" style={{ cursor: 'default' }}>
            <div className="wa-avatar" style={{ background: 'var(--neutral-100)', color: 'var(--wa-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {c.icon}
            </div>
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
