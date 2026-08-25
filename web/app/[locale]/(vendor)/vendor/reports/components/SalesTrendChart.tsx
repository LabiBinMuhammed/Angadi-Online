'use client'

import React, { useState } from 'react'
import { SalesTrendPoint } from '../actions'
import { TrendingUp, ShoppingBag } from 'lucide-react'

interface SalesTrendChartProps {
  data: SalesTrendPoint[]
  currencySymbol?: string
}

export default function SalesTrendChart({ data, currencySymbol = '₹' }: SalesTrendChartProps) {
  const [metric, setMetric] = useState<'sales' | 'orders'>('sales')
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No trend data available for this period.
      </div>
    )
  }

  const values = data.map(d => metric === 'sales' ? d.sales : d.orders)
  const maxVal = Math.max(...values, metric === 'sales' ? 100 : 5)
  const totalVal = values.reduce((acc, v) => acc + v, 0)

  // Chart Dimensions
  const svgWidth = 800
  const svgHeight = 260
  const paddingX = 40
  const paddingTop = 25
  const paddingBottom = 40

  const chartWidth = svgWidth - paddingX * 2
  const chartHeight = svgHeight - paddingTop - paddingBottom

  // Coordinates calculation
  const points = data.map((d, index) => {
    const x = paddingX + (index / Math.max(1, data.length - 1)) * chartWidth
    const val = metric === 'sales' ? d.sales : d.orders
    const y = paddingTop + chartHeight - (val / (maxVal || 1)) * chartHeight
    return { x, y, data: d, val }
  })

  // Generate SVG Path
  const linePath = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`
    // Smooth bezier curve
    const prev = points[i - 1]
    const cx = (prev.x + pt.x) / 2
    return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`
  }, '')

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},${paddingTop + chartHeight} L ${points[0].x},${paddingTop + chartHeight} Z`
    : ''

  // Format currency
  const formatValue = (v: number) => {
    if (metric === 'sales') {
      return `${currencySymbol}${v.toLocaleString('en-IN')}`
    }
    return `${v} ${v === 1 ? 'order' : 'orders'}`
  }

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null

  // Determine grid lines (4 horizontal lines)
  const gridTicks = [0, 0.33, 0.66, 1].map(ratio => {
    const val = maxVal * ratio
    const y = paddingTop + chartHeight - ratio * chartHeight
    return { val, y }
  })

  // X-axis label step interval to prevent clutter on long date ranges
  const labelInterval = Math.ceil(data.length / 8)

  return (
    <div className="vp-card" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
      {/* Header with Title and Metric Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 className="vp-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            {metric === 'sales' ? <TrendingUp size={20} style={{ color: '#60a5fa' }} /> : <ShoppingBag size={20} style={{ color: '#c084fc' }} />}
            <span>Sales & Order Trend</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Total {metric === 'sales' ? 'Revenue' : 'Orders'}: <strong style={{ color: 'var(--text-base)' }}>{formatValue(totalVal)}</strong>
          </p>
        </div>

        {/* Toggle Pill */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-muted)',
            border: '1px solid var(--border)',
            padding: '3px',
            borderRadius: '10px'
          }}
        >
          <button
            type="button"
            onClick={() => { setMetric('sales'); setHoverIndex(null); }}
            style={{
              padding: '0.4rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: metric === 'sales' ? 700 : 500,
              background: metric === 'sales' ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'transparent',
              color: metric === 'sales' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '7px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: metric === 'sales' ? '0 2px 8px rgba(59,130,246,0.3)' : 'none'
            }}
          >
            Sales (₹)
          </button>
          <button
            type="button"
            onClick={() => { setMetric('orders'); setHoverIndex(null); }}
            style={{
              padding: '0.4rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: metric === 'orders' ? 700 : 500,
              background: metric === 'orders' ? 'linear-gradient(135deg, #8b5cf6, #c084fc)' : 'transparent',
              color: metric === 'orders' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '7px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: metric === 'orders' ? '0 2px 8px rgba(139,92,246,0.3)' : 'none'
            }}
          >
            Orders
          </button>
        </div>
      </div>

      {/* SVG Container */}
      <div style={{ width: '100%', position: 'relative', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', minWidth: '500px', display: 'block' }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineStrokeSales" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="lineStrokeOrders" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={tick.y}
                x2={svgWidth - paddingX}
                y2={tick.y}
                stroke="var(--border)"
                strokeDasharray="4 4"
                strokeWidth="1"
                opacity="0.6"
              />
              <text
                x={paddingX - 8}
                y={tick.y + 4}
                fill="var(--text-muted)"
                fontSize="10"
                textAnchor="end"
                fontFamily="sans-serif"
              >
                {metric === 'sales'
                  ? tick.val >= 1000
                    ? `₹${(tick.val / 1000).toFixed(1)}k`
                    : `₹${Math.round(tick.val)}`
                  : Math.round(tick.val)}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          <path
            d={areaPath}
            fill={metric === 'sales' ? 'url(#salesGradient)' : 'url(#ordersGradient)'}
          />

          {/* Main Trend Line */}
          <path
            d={linePath}
            fill="none"
            stroke={metric === 'sales' ? 'url(#lineStrokeSales)' : 'url(#lineStrokeOrders)'}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X Axis Date Labels */}
          {points.map((pt, idx) => {
            if (idx % labelInterval !== 0 && idx !== points.length - 1) return null
            return (
              <text
                key={idx}
                x={pt.x}
                y={svgHeight - 12}
                fill="var(--text-muted)"
                fontSize="11"
                textAnchor="middle"
                fontWeight="500"
              >
                {pt.data.label}
              </text>
            )
          })}

          {/* Interactive Hover Areas */}
          {points.map((pt, idx) => (
            <rect
              key={idx}
              x={pt.x - (chartWidth / Math.max(1, points.length)) / 2}
              y={paddingTop}
              width={chartWidth / Math.max(1, points.length)}
              height={chartHeight}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoverIndex(idx)}
            />
          ))}

          {/* Active Highlight Dot & Crosshair */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={paddingTop}
                x2={activePoint.x}
                y2={paddingTop + chartHeight}
                stroke={metric === 'sales' ? '#3b82f6' : '#8b5cf6'}
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.8"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="7"
                fill={metric === 'sales' ? '#3b82f6' : '#8b5cf6'}
                stroke="#fff"
                strokeWidth="2.5"
                style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
              />
            </g>
          )}
        </svg>

        {/* Dynamic Tooltip Overlay */}
        {activePoint && (
          <div
            style={{
              position: 'absolute',
              top: `${(activePoint.y / svgHeight) * 100}%`,
              left: `${(activePoint.x / svgWidth) * 100}%`,
              transform: 'translate(-50%, -120%)',
              background: 'var(--bg-surface)',
              border: `1px solid ${metric === 'sales' ? '#3b82f6' : '#8b5cf6'}`,
              borderRadius: '10px',
              padding: '0.5rem 0.85rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              pointerEvents: 'none',
              zIndex: 20,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(12px)'
            }}
          >
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {activePoint.data.date}
            </p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-base)' }}>
              {formatValue(activePoint.val)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
