import type { Metadata } from 'next'
import './globals.css'
import SessionListener from './SessionListener'

export const metadata: Metadata = {
  title: { default: 'Village Market', template: '%s | Village Market' },
  description: 'Your local multi-shop marketplace — fresh items from shops near you.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionListener />
        {children}
      </body>
    </html>
  )
}
