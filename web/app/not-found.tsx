import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Page Not Found' }

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '1rem', textAlign: 'center', padding: '2rem',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <span style={{ fontSize: '4rem' }}>🔍</span>
      <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>404 — Not Found</h1>
      <p style={{ color: '#64748b' }}>The page you're looking for doesn't exist.</p>
      <Link
        href="/home"
        style={{
          marginTop: '.5rem', padding: '.65rem 1.5rem',
          background: '#0ea5e9', color: '#fff', borderRadius: 10,
          fontWeight: 600, fontSize: '.95rem', textDecoration: 'none',
        }}
      >
        Go Home
      </Link>
    </div>
  )
}
