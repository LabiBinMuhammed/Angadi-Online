'use client'

import React, { useState } from 'react'
import { Calendar, RefreshCw, ChevronDown, Check } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { DatePreset, getDateRangeFromPreset } from '../utils'
export type { DatePreset }
export { getDateRangeFromPreset }

interface ReportDateFilterProps {
  startDate: string
  endDate: string
  preset: DatePreset
  loading: boolean
  onApplyRange: (start: string, end: string, preset: DatePreset) => void
  onRefresh: () => void
}

export default function ReportDateFilter({
  startDate,
  endDate,
  preset,
  loading,
  onApplyRange,
  onRefresh
}: ReportDateFilterProps) {
  const { t } = useTranslation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(preset === 'custom')
  const [customStart, setCustomStart] = useState(startDate)
  const [customEnd, setCustomEnd] = useState(endDate)

  const PRESETS: { key: DatePreset; label: string }[] = [
    { key: 'today', label: t('vendor_reports.filter_today') },
    { key: 'yesterday', label: t('vendor_reports.filter_yesterday') },
    { key: 'last_7_days', label: t('vendor_reports.filter_last_7_days') },
    { key: 'this_month', label: t('vendor_reports.filter_this_month') },
    { key: 'last_month', label: t('vendor_reports.filter_last_month') },
    { key: 'custom', label: t('vendor_reports.filter_custom') }
  ]

  const handleSelectPreset = (p: DatePreset) => {
    if (p === 'custom') {
      setCustomOpen(true)
      setDropdownOpen(false)
      return
    }
    setCustomOpen(false)
    setDropdownOpen(false)
    const { start, end } = getDateRangeFromPreset(p)
    onApplyRange(start, end, p)
  }

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customStart || !customEnd) return
    onApplyRange(customStart, customEnd, 'custom')
    setDropdownOpen(false)
  }

  const currentLabel = PRESETS.find(p => p.key === preset)?.label || 'Date Range'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      {/* Date Preset Dropdown Trigger */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="vp-btn vp-btn-outline"
          style={{
            padding: '0.65rem 1.1rem',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '12px',
            minWidth: '160px',
            justifyContent: 'space-between'
          }}
          id="report-date-filter-trigger"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} style={{ color: '#60a5fa' }} />
            <span style={{ fontWeight: 600 }}>{currentLabel}</span>
          </div>
          <ChevronDown size={14} style={{ opacity: 0.6, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: '220px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
              padding: '0.5rem',
              zIndex: 100,
              backdropFilter: 'blur(16px)'
            }}
          >
            {PRESETS.map(p => {
              const active = preset === p.key
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleSelectPreset(p.key)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    background: active ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                    color: active ? '#60a5fa' : 'var(--text-base)',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>{p.label}</span>
                  {active && <Check size={14} />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Custom Range Inputs if custom preset selected */}
      {customOpen && (
        <form onSubmit={handleApplyCustom} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="date"
            className="vp-input"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            style={{ width: '135px', padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
            required
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>to</span>
          <input
            type="date"
            className="vp-input"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            style={{ width: '135px', padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
            required
          />
          <button
            type="submit"
            className="vp-btn vp-btn-primary vp-btn-sm"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            Apply
          </button>
        </form>
      )}

      {/* Date Range Display Pill */}
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        {new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>

      {/* Refresh Button */}
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="vp-btn vp-btn-outline"
        style={{
          padding: '0.65rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Refresh Report Data"
        id="report-refresh-btn"
      >
        <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  )
}
