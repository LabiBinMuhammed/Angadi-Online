import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Activity Logs' }

export default function ActivityLogsPage() {
  return (
    <>
      <h1 className="panel-page-title">Activity Logs</h1>
      <div className="card card-body" style={{ maxWidth: 640 }}>
        <p className="text-muted">
          System activity logs will be streamed here. Connect a logging service (e.g. Supabase Realtime or PostHog) to populate this page.
        </p>
        <div className="empty-state" style={{ paddingTop: '2rem' }}>
          <span className="empty-state-icon">🗒️</span>
          <p className="font-semibold">No logs yet</p>
          <p className="text-sm">Activity will be tracked here in a future update</p>
        </div>
      </div>
    </>
  )
}
