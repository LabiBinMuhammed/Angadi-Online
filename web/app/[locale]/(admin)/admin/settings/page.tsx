import type { Metadata } from 'next'
import { Coins, Package, Bell, Globe } from 'lucide-react'

export const metadata: Metadata = { title: 'Global Settings (Admin)' }

export default function AdminSettingsPage() {
  const items = [
    { icon: <Coins size={20} />, label: 'Default credit limit', value: '₹500', desc: 'Applied when credit is first enabled for a user' },
    { icon: <Package size={20} />, label: 'Max order items', value: '50', desc: 'Maximum number of items per order' },
    { icon: <Bell size={20} />, label: 'Low stock threshold', value: '5 units', desc: 'Alert when stock falls below this' },
    { icon: <Globe size={20} />, label: 'Default language', value: 'English', desc: 'Fallback language for new users' },
  ]

  return (
    <>
      <h1 className="panel-page-title">Global Settings</h1>
      <div style={{ maxWidth: 600 }}>
        <div className="wa-list">
          {items.map(s => (
            <div key={s.label} className="wa-list-item" style={{ cursor: 'default' }}>
              <div className="wa-avatar" style={{ background: 'var(--neutral-100)', color: 'var(--wa-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <div className="wa-item-body">
                <p className="wa-item-title">{s.label}</p>
                <p className="wa-item-sub">{s.desc}</p>
              </div>
              <span className="font-semibold text-sm" style={{ color: 'var(--wa-green-dark)' }}>{s.value}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted" style={{ marginTop: '1rem' }}>
          Full settings configuration coming in a future update. These values are currently managed via the database directly.
        </p>
      </div>
    </>
  )
}
