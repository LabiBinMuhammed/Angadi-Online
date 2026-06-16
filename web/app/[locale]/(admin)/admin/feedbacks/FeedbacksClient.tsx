'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Star, User, Calendar, Phone, AlertCircle, CheckCircle } from 'lucide-react'

type FeedbackRow = {
  id: string
  type: string
  rating: number | null
  message: string
  status: string
  created_at: string
  users: { name: string; phone: string } | null
}

export default function FeedbacksClient({ initialFeedbacks }: { initialFeedbacks: FeedbackRow[] }) {
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>(initialFeedbacks)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filtered = feedbacks.filter(fb => {
    if (filterStatus === 'all') return true
    return fb.status === filterStatus
  })

  async function handleStatusChange(id: string, newStatus: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('feedbacks')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      setFeedbacks(prev => prev.map(fb => fb.id === id ? { ...fb, status: newStatus } : fb))
    } else {
      alert('Failed to update status: ' + error.message)
    }
  }

  const statusBadges: Record<string, string> = {
    new:       'badge-primary',
    in_review: 'badge-warning',
    resolved:  'badge-success',
    closed:    'badge-danger'
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .filter-bar { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .filter-btn { padding: 8px 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-base); font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .filter-btn.active { background: var(--wa-green-dark); color: #fff; border-color: var(--wa-green-dark); }
        
        .fb-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media(min-width: 768px) {
          .fb-grid { grid-template-columns: 1fr 1fr; }
        }
        
        .fb-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 20px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 12px; }
        .fb-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .fb-user-section { display: flex; flex-direction: column; gap: 4px; }
        .fb-user-name { font-size: 15px; font-weight: 800; color: var(--text-base); margin: 0; }
        .fb-user-phone { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; font-weight: 500; }
        
        .fb-meta-line { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .fb-type-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; background: var(--bg-muted); color: var(--text-muted); padding: 4px 8px; border-radius: 8px; }
        .fb-date { font-size: 12px; color: var(--text-light); font-weight: 500; display: flex; align-items: center; gap: 4px; }
        
        .fb-message { font-size: 14px; color: var(--text-base); line-height: 1.5; white-space: pre-wrap; margin: 0; padding: 12px; background: var(--bg-base); border-radius: 12px; border: 1px solid var(--border); }
        
        .fb-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 12px; margin-top: 4px; }
        
        .status-select { padding: 6px 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-base); font-size: 13px; font-weight: 700; outline: none; cursor: pointer; }
        .status-select:focus { border-color: var(--wa-green); }
      `}} />

      <div className="filter-bar">
        {['all', 'new', 'in_review', 'resolved', 'closed'].map(s => (
          <button
            key={s}
            id={`filter-btn-${s}`}
            className={`filter-btn ${filterStatus === s ? 'active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s === 'all' ? 'All Feedback' : s.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '24px' }}>
          <MessageSquare size={48} style={{ margin: '0 auto 12px', color: 'var(--text-muted)', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--text-base)', margin: 0 }}>No feedbacks found</p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Feedbacks with the selected status will appear here.</p>
        </div>
      ) : (
        <div className="fb-grid">
          {filtered.map(fb => (
            <div key={fb.id} className="fb-card" id={`fb-card-${fb.id}`}>
              <div className="fb-card-header">
                <div className="fb-user-section">
                  <h3 className="fb-user-name">{fb.users?.name ?? 'Anonymous User'}</h3>
                  {fb.users?.phone && (
                    <span className="fb-user-phone">
                      <Phone size={12} /> {fb.users.phone}
                    </span>
                  )}
                </div>
                <div>
                  <span className={`badge ${statusBadges[fb.status] ?? 'badge-outline'}`}>
                    {fb.status.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="fb-meta-line">
                <span className="fb-type-badge">{fb.type.replace('_', ' ')}</span>
                <span className="fb-date">
                  <Calendar size={12} />
                  {new Date(fb.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {fb.rating && (
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginLeft: 'auto' }}>
                    {[1, 2, 3, 4, 5].map(v => (
                      <Star
                        key={v}
                        size={12}
                        color={v <= fb.rating! ? '#f59e0b' : '#cbd5e1'}
                        fill={v <= fb.rating! ? '#f59e0b' : 'transparent'}
                      />
                    ))}
                  </div>
                )}
              </div>

              <p className="fb-message">{fb.message}</p>

              <div className="fb-footer">
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Change Status</span>
                <select
                  id={`status-select-${fb.id}`}
                  className="status-select"
                  value={fb.status}
                  onChange={(e) => handleStatusChange(fb.id, e.target.value)}
                >
                  <option value="new">New</option>
                  <option value="in_review">In Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
