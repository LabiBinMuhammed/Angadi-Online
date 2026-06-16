import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Save, HelpCircle } from 'lucide-react'
import { getCommissionSettings } from '@/lib/supabase/commission'
import { saveSettingsAction } from '@/app/actions/commission'

export const metadata: Metadata = { title: 'Admin - Commission Settings' }

export default async function CommissionSettingsPage() {
  const settings = await getCommissionSettings()

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin/commission" className="btn btn-ghost" style={{ padding: '.5rem', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="panel-page-title" style={{ margin: 0 }}>General Commission Settings</h1>
          <p className="text-sm text-muted" style={{ margin: 0 }}>Configure platform-wide rules and parameters</p>
        </div>
      </div>

      <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', boxShadow: 'var(--shadow-sm)' }}>
        <form action={saveSettingsAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Default Rate */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Default Commission Rate (%)
              <span title="The percentage of order total charged to shops after their trial expires." style={{ cursor: 'help', color: 'var(--text-muted)' }}>
                <HelpCircle size={14} />
              </span>
            </label>
            <input 
              name="default_commission_rate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              defaultValue={settings.default_commission_rate}
              className="form-input"
              style={{ width: '100%' }}
              required
            />
          </div>

          {/* Trial Duration */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Free Trial Duration (Days)
              <span title="Number of days a newly approved shop receives at 0% commission." style={{ cursor: 'help', color: 'var(--text-muted)' }}>
                <HelpCircle size={14} />
              </span>
            </label>
            <input 
              name="free_trial_duration"
              type="number"
              min="0"
              defaultValue={settings.free_trial_duration}
              className="form-input"
              style={{ width: '100%' }}
              required
            />
          </div>

          {/* Trigger Option */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Commission Calculation Trigger</label>
            <select 
              name="calculation_trigger"
              defaultValue={settings.calculation_trigger}
              className="form-input"
              style={{ width: '100%' }}
            >
              <option value="delivered">Delivered Order</option>
              <option value="completed">Completed Order</option>
            </select>
            <span className="text-sm text-muted" style={{ marginTop: '0.25rem', display: 'block' }}>
              Commission is calculated when the order status reaches this value.
            </span>
          </div>

          {/* Auto Reports */}
          <div style={{ padding: '1rem', background: 'var(--neutral-50)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>Auto Generate Monthly Reports</p>
                <p className="text-xs text-muted" style={{ margin: 0 }}>Automatically aggregate commission transactions monthly</p>
              </div>
              <input 
                name="auto_generate_reports"
                type="checkbox"
                defaultChecked={settings.auto_generate_reports}
                value="true"
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            {/* Report Generation Day */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Report Generation Day</label>
              <input 
                name="report_generation_day"
                type="number"
                min="1"
                max="28"
                defaultValue={settings.report_generation_day}
                className="form-input"
                style={{ width: '100%' }}
                required
              />
              <span className="text-xs text-muted" style={{ marginTop: '0.25rem', display: 'block' }}>
                Day of month to generate billing summaries (e.g. 1 = 1st of every month).
              </span>
            </div>
          </div>

          {/* Overdue/Grace Periods */}
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.5rem 0 0', borderBottom: '1px solid var(--wa-separator)', paddingBottom: '0.5rem' }}>
            Shop Overdue & Restriction Rules
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {/* Warning Grace */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Grace Period - Warning (Days)
              </label>
              <input 
                name="grace_period_warning"
                type="number"
                min="0"
                defaultValue={settings.grace_period_warning}
                className="form-input"
                style={{ width: '100%' }}
                required
              />
              <span className="text-xs text-muted" style={{ marginTop: '0.25rem', display: 'block' }}>
                Level 1: Warn shop owner
              </span>
            </div>

            {/* Restriction Grace */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Grace Period - Restriction (Days)
              </label>
              <input 
                name="grace_period_restriction"
                type="number"
                min="0"
                defaultValue={settings.grace_period_restriction}
                className="form-input"
                style={{ width: '100%' }}
                required
              />
              <span className="text-xs text-muted" style={{ marginTop: '0.25rem', display: 'block' }}>
                Level 2: Reduce shop visibility
              </span>
            </div>

            {/* Block Grace */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Grace Period - Block (Days)
              </label>
              <input 
                name="grace_period_block"
                type="number"
                min="0"
                defaultValue={settings.grace_period_block}
                className="form-input"
                style={{ width: '100%' }}
                required
              />
              <span className="text-xs text-muted" style={{ marginTop: '0.25rem', display: 'block' }}>
                Level 3: Block new orders
              </span>
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ 
              background: 'var(--wa-green-dark)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              marginTop: '1rem'
            }}
          >
            <Save size={18} /> Save Settings
          </button>
        </form>
      </div>
    </div>
  )
}
