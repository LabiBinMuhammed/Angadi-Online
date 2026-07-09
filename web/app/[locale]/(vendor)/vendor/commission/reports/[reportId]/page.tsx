import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Monthly billing report (Vendor)' }

export default async function BillingReportPage({
  params
}: {
  params: Promise<{ reportId: string; locale: string }>
}) {
  const { reportId, locale } = await params
  const supabase = await createClient()

  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages: any = {}
  try {
    messages = require(`@/messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('@/messages/en.json')
  }

  const t = (key: string): string => {
    const parts = key.split('.')
    let current = messages
    for (const part of parts) {
      if (current == null) break
      current = current[part]
    }
    if (typeof current === 'string') return current
    
    try {
      const enMessages = require('@/messages/en.json')
      let enCurrent = enMessages
      for (const part of parts) {
        if (enCurrent == null) return key
        enCurrent = enCurrent[part]
      }
      if (typeof enCurrent === 'string') return enCurrent
    } catch (e) {}
    return key
  }

  // Fetch report details
  const { data: report, error } = await supabase
    .from('monthly_commission_reports')
    .select('*, shops(name, created_at, shop_owners(users(name, phone)))')
    .eq('id', reportId)
    .single()

  if (error || !report) {
    notFound()
  }

  const shop = (report as any).shops
  const owner = shop?.shop_owners?.[0]?.users
  const monthNames = [
    t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
    t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
    t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec')
  ]
  const billingPeriod = `${monthNames[report.month - 1]} ${report.year}`

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Back Button & Print Actions (Hidden in Print) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }} className="no-print">
        <Link href={`/${locale}/vendor/commission`} className="vp-btn vp-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> {t('vendor_report.back_dashboard')}
        </Link>
        <button 
          onClick={() => {
            if (typeof window !== 'undefined') window.print()
          }}
          className="vp-btn vp-btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--wa-green-dark)' }}
        >
          <Printer size={16} /> {t('vendor_report.print_pdf')}
        </button>
      </div>

      {/* Invoice Layout */}
      <div 
        className="card" 
        style={{ 
          background: '#fff', 
          color: '#1e293b', 
          border: '1px solid #e2e8f0', 
          borderRadius: '24px', 
          padding: '2.5rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
        }}
        id="invoice-print-area"
      >
        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '2rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={28} color="#128c7e" />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#128c7e', letterSpacing: '-0.02em' }}>Angadi Online</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{t('vendor_report.central_system')}</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>support@angadionline.com</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a' }}>{t('vendor_report.invoice_title')}</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>{t('vendor_report.billing_period')}: {billingPeriod}</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>ID: {report.id.slice(0, 18).toUpperCase()}</p>
          </div>
        </div>

        {/* Billing Details Block */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 0.5rem' }}>{t('vendor_report.billed_to')}</h3>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#0f172a' }}>{shop?.name || 'Shop Name'}</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>{t('vendor_report.owner')}: {owner?.name || '—'}</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>{t('vendor_report.phone')}: {owner?.phone || '—'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 0.5rem' }}>{t('vendor_report.details')}</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>{t('vendor_report.issue_date')}: {new Date(report.generated_at).toLocaleDateString('en-GB')}</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#475569' }}>
              {t('vendor_report.status')}: <span style={{ 
                fontWeight: 700,
                color: report.payment_status === 'paid' ? '#16a34a' : report.payment_status === 'partially_paid' ? '#d97706' : '#dc2626',
                textTransform: 'uppercase'
              }}>{report.payment_status}</span>
            </p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div style={{ marginBottom: '2.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{t('vendor_report.description')}</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>{t('vendor_report.qty_rate')}</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>{t('vendor_report.total_sales')}</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>{t('vendor_report.commission_amount')}</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem', fontSize: '0.95rem' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{t('vendor_report.delivered_orders')}</p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>{t('vendor_report.charges_compiled')} {billingPeriod}</p>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.9rem', color: '#475569' }}>
                  <p style={{ margin: 0 }}>{report.total_orders} {t('vendor_report.orders_count')}</p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>@ {report.commission_rate}% {t('vendor_report.rate_at')}</p>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: 500, color: '#0f172a' }}>
                  ₹{Number(report.total_sales).toFixed(2)}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  ₹{Number(report.total_commission).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pricing Summary Block */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <div style={{ width: '100%', maxWidth: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem', color: '#475569' }}>
              <span>{t('vendor_report.total_commission')}:</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{Number(report.total_commission).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem', color: '#475569', borderBottom: '1px solid #cbd5e1' }}>
              <span>{t('vendor_report.amount_settled')}:</span>
              <span style={{ fontWeight: 600, color: '#16a34a' }}>- ₹{Number(report.amount_paid).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', fontSize: '1.15rem', color: '#0f172a' }}>
              <span style={{ fontWeight: 700 }}>{t('vendor_report.balance_due')}:</span>
              <span style={{ fontWeight: 800, color: '#ef4444' }}>₹{Number(report.balance_due).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer Note */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
          <p style={{ margin: '0 0 0.25rem' }}>{t('vendor_report.footer_note_1')}</p>
          <p style={{ margin: 0 }}>{t('vendor_report.footer_note_2')}</p>
        </div>

      </div>
      
    </div>
  )
}
