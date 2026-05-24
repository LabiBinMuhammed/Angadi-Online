import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Global Settings (Admin)' }

export default function AdminSettingsPage() {
  return (
    <>
      <h1 className="panel-page-title">Global Settings</h1>
      <div style={{ maxWidth: 600 }}>
        <div className="wa-list">
          {[
            { icon: '💰', label: 'Default credit limit', value: '₹500', desc: 'Applied when credit is first enabled for a user' },
            { icon: '📦', label: 'Max order items', value: '50', desc: 'Maximum number of items per order' },
            { icon: '🔔', label: 'Low stock threshold', value: '5 units', desc: 'Alert when stock falls below this' },
            { icon: '🌐', label: 'Default language', value: 'English', desc: 'Fallback language for new users' },
          ].map(s => (
            <div key={s.label} className="wa-list-item" style={{ cursor: 'default' }}>
              <div className="wa-avatar" style={{ background: 'var(--neutral-100)', color: 'var(--text-base)', fontSize: '1.2rem' }}>{s.icon}</div>
              <div className="wa-item-body">
                <p className="wa-item-title">{s.label}</p>
                <p className="wa-item-sub">{s.desc}</p>
              </div>
              <span className="font-semibold text-sm" style={{ color: 'var(--wa-teal)' }}>{s.value}</span>
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
