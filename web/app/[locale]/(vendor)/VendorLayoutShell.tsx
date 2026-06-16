'use client'

import React, { useState, useCallback } from 'react'
import VendorHeader from './VendorHeader'
import VendorSidebar from './VendorSidebar'

interface VendorLayoutShellProps {
  children: React.ReactNode
  role?: string
}

export default function VendorLayoutShell({ children, role }: VendorLayoutShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen(prev => !prev)
    } else {
      setIsCollapsed(prev => !prev)
    }
  }, [])

  const handleCloseMobile = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  return (
    <div className={`vendor-premium-body ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileOpen ? 'mobile-sidebar-open' : ''}`}>
      <VendorHeader role={role} toggleSidebar={toggleSidebar} />
      <div className="vp-layout">
        <VendorSidebar 
          isCollapsed={isCollapsed} 
          onCloseMobile={handleCloseMobile} 
        />
        {isMobileOpen && (
          <div 
            className="vp-sidebar-overlay" 
            onClick={handleCloseMobile}
          />
        )}
        <main className={`vp-main vp-fade-up ${isCollapsed ? 'expanded' : ''}`}>{children}</main>
      </div>
    </div>
  )
}

