'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function CapacitorInit() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Dynamic import to avoid SSR errors
    import('@capacitor/core').then(({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return

      // 1. Hide Splash Screen smoothly
      import('@capacitor/splash-screen').then(({ SplashScreen }) => {
        SplashScreen.hide().catch(() => {})
      })

      // 2. Configure Status Bar
      import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
        StatusBar.setBackgroundColor({ color: '#25D366' }).catch(() => {})
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
      })

      // 3. Hardware Back Button handling for Android
      import('@capacitor/app').then(({ App }) => {
        App.addListener('backButton', ({ canGoBack }) => {
          if (window.location.pathname.includes('/home') || window.location.pathname.includes('/login')) {
            App.minimizeApp()
          } else if (canGoBack) {
            window.history.back()
          } else {
            router.push('/en/home')
          }
        })

        // 4. Handle Deep Links & OAuth Callback URLs
        App.addListener('appUrlOpen', (event) => {
          try {
            const url = new URL(event.url)
            const path = url.pathname + url.search + url.hash
            if (path) {
              router.push(path)
            }
          } catch (_) {}
        })
      })

      // 5. Network status monitoring
      import('@capacitor/network').then(({ Network }) => {
        Network.getStatus().then((status) => {
          setIsOffline(!status.connected)
        })

        Network.addListener('networkStatusChange', (status) => {
          setIsOffline(!status.connected)
        })
      })
    })
  }, [router, pathname])

  if (!isOffline) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        backgroundColor: '#ef4444',
        color: '#ffffff',
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: 'bold',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
    >
      <span>⚠️ No Internet Connection. You are currently offline.</span>
    </div>
  )
}
