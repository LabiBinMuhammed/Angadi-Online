'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  fallbackHref?: string
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  ariaLabel?: string
  id?: string
}

export default function BackButton({
  fallbackHref = '/home',
  className = 'back-btn',
  style,
  children,
  ariaLabel = 'Go back',
  id
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault()
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <button
      type="button"
      id={id}
      onClick={handleBack}
      className={className}
      style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, ...style }}
      aria-label={ariaLabel}
    >
      {children || <ArrowLeft size={20} />}
    </button>
  )
}
