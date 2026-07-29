'use client'

import { useState, useTransition } from 'react'
import { createDeliveryBatch, updateBatchStatus } from './actions'
import { Sun, Moon, Calendar, Truck, CheckCircle2, ChevronRight, Loader2, Play } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface RunItem {
  date: string
  label: string
  slot: 'morning' | 'evening'
  batch: { id: string; status: 'pending' | 'delivering' | 'completed' } | null
  orderCount: number
  totalValue: number
}

export default function VendorDeliveryRuns({
  shopId,
  todayStr,
  tomorrowStr,
  initialRuns
}: {
  shopId: string
  todayStr: string
  tomorrowStr: string
  initialRuns: RunItem[]
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [runs, setRuns] = useState<RunItem[]>(initialRuns)
  const [isPending, startTransition] = useTransition()
  const [loadingRunKey, setLoadingRunKey] = useState<string | null>(null)

  const handleAction = async (run: RunItem) => {
    if (!run.batch) {
      router.push(`/vendor/orders?date=${run.date}&slot=${run.slot}`)
      return
    }
    const runKey = `${run.date}-${run.slot}`
    setLoadingRunKey(runKey)

    startTransition(async () => {
      try {
        if (!run.batch) {
          // 1. Create batch (fallback, though bypassed above)
          const batchId = await createDeliveryBatch(shopId, run.date, run.slot)
          // Update local state
          setRuns(prev => prev.map(r => {
            if (r.date === run.date && r.slot === run.slot) {
              return {
                ...r,
                batch: { id: batchId, status: 'pending' }
              }
            }
            return r
          }))
        } else if (run.batch.status === 'pending') {
          // 2. Mark Out for Delivery
          await updateBatchStatus(run.batch.id, 'delivering')
          setRuns(prev => prev.map(r => {
            if (r.date === run.date && r.slot === run.slot && r.batch) {
              return {
                ...r,
                batch: { ...r.batch, status: 'delivering' }
              }
            }
            return r
          }))
        } else if (run.batch.status === 'delivering') {
          // 3. Complete batch
          await updateBatchStatus(run.batch.id, 'completed')
          setRuns(prev => prev.map(r => {
            if (r.date === run.date && r.slot === run.slot && r.batch) {
              return {
                ...r,
                batch: { ...r.batch, status: 'completed' }
              }
            }
            return r
          }))
        }
      } catch (err: any) {
        alert(err.message || 'Operation failed. Please verify that the database migration is applied.')
      } finally {
        setLoadingRunKey(null)
      }
    })
  }

  // Group by date
  const todayRuns = runs.filter(r => r.date === todayStr)
  const tomorrowRuns = runs.filter(r => r.date === tomorrowStr)

  const renderRunCard = (run: RunItem) => {
    const isMorning = run.slot === 'morning'
    const Icon = isMorning ? Sun : Moon
    const runKey = `${run.date}-${run.slot}`
    const isLoading = loadingRunKey === runKey

    let statusText = t('vendor_dashboard.run_not_started') || 'Not Started'
    let statusColor = 'var(--text-muted)'
    let statusBg = 'var(--bg-muted)'
    let actionLabel = t('vendor_dashboard.run_prepare') || 'Prepare Run'
    let actionClass = 'run-btn-start'

    if (run.batch) {
      if (run.batch.status === 'pending') {
        statusText = t('vendor_dashboard.run_packing') || 'Packing'
        statusColor = '#d97706'
        statusBg = '#fef3c7'
        actionLabel = t('vendor_dashboard.run_start_delivery') || 'Start Delivery'
        actionClass = 'run-btn-deliver'
      } else if (run.batch.status === 'delivering') {
        statusText = t('vendor_dashboard.run_out_for_delivery') || 'Out for Delivery'
        statusColor = '#2563eb'
        statusBg = '#dbeafe'
        actionLabel = t('vendor_dashboard.run_complete') || 'Complete Run'
        actionClass = 'run-btn-complete'
      } else if (run.batch.status === 'completed') {
        statusText = t('vendor_dashboard.run_completed') || 'Completed'
        statusColor = '#16a34a'
        statusBg = '#dcfce7'
        actionLabel = ''
      }
    }

    const hasOrders = run.orderCount > 0

    return (
      <div key={run.slot} className="run-card" style={{ opacity: isPending && !isLoading ? 0.7 : 1 }}>
        <div className="run-card-header">
          <div className="run-slot-info">
            <div className={`run-slot-icon-wrap ${isMorning ? 'morning' : 'evening'}`}>
              <Icon size={18} />
            </div>
            <div>
              <h4 className="run-slot-title">{isMorning ? (t('vendor_dashboard.morning_run') || 'Morning Run') : (t('vendor_dashboard.evening_run') || 'Evening Run')}</h4>
              <span className="run-slot-time">{isMorning ? '7 AM - 12 PM' : '4 PM - 8 PM'}</span>
            </div>
          </div>
          <span className="run-status-badge" style={{ backgroundColor: statusBg, color: statusColor }}>
            {statusText}
          </span>
        </div>

        <div className="run-card-body">
          <div className="run-stat">
            <span className="run-stat-val">{run.orderCount}</span>
            <span className="run-stat-lbl">{t('vendor_dashboard.orders_count_label') || 'Orders'}</span>
          </div>
          <div className="run-stat">
            <span className="run-stat-val">₹ {run.totalValue.toFixed(0)}</span>
            <span className="run-stat-lbl">{t('vendor_dashboard.run_value_label') || 'Value'}</span>
          </div>
        </div>

        <div className="run-card-footer">
          {run.batch && (
            <Link 
              href={`/vendor/orders?date=${run.date}&slot=${run.slot}`}
              className="run-view-link"
            >
              {t('vendor_dashboard.view_orders_button') || 'View Orders'} <ChevronRight size={14} />
            </Link>
          )}
          
          {actionLabel && (
            <button
              onClick={() => handleAction(run)}
              disabled={isLoading || (!run.batch && !hasOrders)}
              className={`run-action-btn ${actionClass}`}
              style={{ marginLeft: 'auto' }}
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                actionLabel
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="delivery-runs-section">
      <style dangerouslySetInnerHTML={{ __html: `
        .delivery-runs-section { margin: 2rem 0; }
        .runs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1rem; }
        .runs-group-title { font-size: 1.1rem; font-weight: 700; color: var(--text-base); margin: 1.5rem 0 0.5rem; display: flex; align-items: center; gap: 8px; }
        .run-card { background: var(--bg-surface); border-radius: 20px; border: 1px solid var(--border); padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; box-shadow: 0 4px 12px rgba(0,0,0,0.01); transition: transform 0.2s; }
        .run-card:hover { transform: translateY(-2px); }
        .run-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .run-slot-info { display: flex; align-items: center; gap: 10px; }
        .run-slot-icon-wrap { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .run-slot-icon-wrap.morning { background: var(--wa-green-light); color: var(--wa-green-dark); }
        .run-slot-icon-wrap.evening { background: #fff7ed; color: #ea580c; }
        .run-slot-title { font-size: 0.95rem; font-weight: 700; margin: 0; color: var(--text-base); }
        .run-slot-time { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }
        .run-status-badge { font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.2px; }
        
        .run-card-body { display: flex; gap: 2rem; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 0.75rem 0; }
        .run-stat { display: flex; flex-direction: column; gap: 2px; }
        .run-stat-val { font-size: 1.1rem; font-weight: 800; color: var(--text-base); }
        .run-stat-lbl { font-size: 0.75rem; color: var(--text-light); font-weight: 500; }
        
        .run-card-footer { display: flex; align-items: center; justify-content: space-between; }
        .run-view-link { display: inline-flex; align-items: center; gap: 4px; font-size: 0.8rem; font-weight: 600; color: var(--wa-green); text-decoration: none; }
        .run-view-link:hover { text-decoration: underline; }
        
        .run-action-btn { border: none; border-radius: 12px; padding: 8px 16px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s; display: inline-flex; align-items: center; justify-content: center; min-width: 100px; height: 32px; }
        .run-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .run-btn-start { background: var(--wa-green); color: #fff; }
        .run-btn-deliver { background: #ea580c; color: #fff; }
        .run-btn-complete { background: #2563eb; color: #fff; }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}} />

      <h2 className="vp-title" style={{ fontSize: '1.5rem', marginBottom: '0' }}>{t('vendor_dashboard.delivery_runs_management_title') || 'Delivery Runs Management'}</h2>
      
      <div className="runs-group-title">
        <Calendar size={16} /> {t('vendor_dashboard.today_runs') || "Today's Runs"}
      </div>
      <div className="runs-grid">
        {todayRuns.map(renderRunCard)}
      </div>

      <div className="runs-group-title">
        <Calendar size={16} /> {t('vendor_dashboard.tomorrow_runs') || "Tomorrow's Runs"}
      </div>
      <div className="runs-grid">
        {tomorrowRuns.map(renderRunCard)}
      </div>
    </div>
  )
}
