'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ShieldCheck, ArrowLeft } from 'lucide-react'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Admin Header */}
      <header style={{
        height: '56px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              marginRight: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-base)',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            className="sidebar-toggle-btn"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Brand name */}
          <Link href="/admin/dashboard" style={{ textDecoration: 'none', color: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <ShieldCheck size={20} color="var(--wa-green-dark)" />
            <span>Admin Console</span>
          </Link>
        </div>

        <Link 
          href="/home" 
          title="Back to Shop"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            color: 'var(--text-base)',
            transition: 'background 0.2s',
            textDecoration: 'none'
          }}
          className="hover-bg-muted"
        >
          <ArrowLeft size={20} />
        </Link>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Sidebar wrapper */}
        <div 
          className={`admin-sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}
        >
          <AdminSidebar />
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="sidebar-overlay"
          />
        )}

        {/* Main Content */}
        <main className="panel-main fade-up" style={{ flex: 1, padding: '2rem 1.5rem', zIndex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
