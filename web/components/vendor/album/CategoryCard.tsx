'use client'

import React from 'react'
import Link from 'next/link'
import { getCategoryIcon } from './categoryIcons'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

interface CategoryCardProps {
  id: string
  name: string
  totalProducts: number
  addedProducts: number
  locale?: string
}

export default function CategoryCard({
  id,
  name,
  totalProducts,
  addedProducts,
  locale = 'en'
}: CategoryCardProps) {
  const percent = totalProducts > 0 ? Math.round((addedProducts / totalProducts) * 100) : 0
  const isComplete = totalProducts > 0 && addedProducts >= totalProducts

  return (
    <Link
      href={`/${locale}/vendor/catalog/${id}`}
      className="vp-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem',
        borderRadius: '18px',
        background: 'var(--bg-surface)',
        border: `1px solid ${isComplete ? 'rgba(34, 197, 94, 0.4)' : 'var(--border)'}`,
        textDecoration: 'none',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.borderColor = isComplete ? 'rgba(34, 197, 94, 0.6)' : 'rgba(59, 130, 246, 0.5)'
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.borderColor = isComplete ? 'rgba(34, 197, 94, 0.4)' : 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      id={`cat-card-${id}`}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'var(--bg-muted)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {getCategoryIcon(name, 26)}
          </div>
          {isComplete ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#22c55e',
                background: 'rgba(34, 197, 94, 0.12)',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px'
              }}
            >
              <CheckCircle2 size={13} /> Complete
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: percent > 0 ? '#3b82f6' : 'var(--text-muted)'
              }}
            >
              {percent}%
            </span>
          )}
        </div>

        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-base)',
            margin: '0 0 0.5rem 0',
            lineHeight: 1.3
          }}
        >
          {name}
        </h3>

        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            margin: '0 0 1rem 0',
            fontWeight: 500
          }}
        >
          <strong style={{ color: 'var(--text-base)' }}>{addedProducts}</strong> / {totalProducts} added
        </p>
      </div>

      <div>
        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '999px',
            background: 'var(--bg-muted)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            marginBottom: '0.75rem'
          }}
        >
          <div
            style={{
              width: `${Math.min(100, percent)}%`,
              height: '100%',
              borderRadius: '999px',
              background: isComplete
                ? 'linear-gradient(90deg, #22c55e, #10b981)'
                : 'linear-gradient(90deg, #3b82f6, #6366f1)',
              transition: 'width 0.4s ease'
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#3b82f6',
            gap: '0.25rem'
          }}
        >
          <span>Open Album</span>
          <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  )
}
