import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Disputes & Issues' }

export default async function DisputesPage() {
  // Future: load from a disputes/complaints table
  return (
    <>
      <h1 className="panel-page-title">Disputes & Issues</h1>
      <div className="empty-state">
        <span className="empty-state-icon">🚨</span>
        <p className="font-semibold">No disputes reported</p>
        <p className="text-sm">Customer complaints and disputes will appear here</p>
      </div>
    </>
  )
}
