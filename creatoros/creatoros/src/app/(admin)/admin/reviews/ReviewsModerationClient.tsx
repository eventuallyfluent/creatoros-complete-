'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:  { bg: '#FEF9C3', color: '#92400E', label: 'Pending' },
  APPROVED: { bg: 'rgba(52,211,153,0.1)', color: '#065F46', label: 'Approved' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' },
}

function Stars({ rating }: { rating: number }) {
  return <span style={{ color: '#F59E0B', letterSpacing: '1px' }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
}

export default function ReviewsModerationClient({ reviews: initial }: { reviews: any[] }) {
  const router   = useRouter()
  const [reviews, setReviews]   = useState(initial)
  const [filter,  setFilter]    = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [loading, setLoading]   = useState<string | null>(null)

  const setStatus = async (id: string, status: string) => {
    setLoading(id)
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    setLoading(null)
    if (res.ok) {
      setReviews(rs => rs.map(r => r.id === id ? { ...r, status } : r))
    }
  }

  const visible = filter === 'ALL' ? reviews : reviews.filter(r => r.status === filter)
  const counts  = { ALL: reviews.length, PENDING: reviews.filter(r => r.status === 'PENDING').length, APPROVED: reviews.filter(r => r.status === 'APPROVED').length, REJECTED: reviews.filter(r => r.status === 'REJECTED').length }

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: '8px', border: filter === f ? '2px solid #7B2FBE' : '1px solid #e5e7eb', background: filter === f ? 'rgba(123,47,190,0.06)' : 'white', color: filter === f ? '#7B2FBE' : '#6b7280', fontWeight: filter === f ? 700 : 400, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {f.charAt(0) + f.slice(1).toLowerCase()} <span style={{ color: '#9ca3af' }}>({counts[f]})</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No {filter.toLowerCase()} reviews.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visible.map(review => {
            const sc = STATUS_COLORS[review.status]
            return (
              <div key={review.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{review.user.name ?? review.user.email}</span>
                      <Stars rating={review.rating} />
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 6px' }}>
                      <a href={`/courses/${review.course.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#7B2FBE', textDecoration: 'none' }}>{review.course.title}</a>
                      {' · '}{new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {review.comment && <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6, margin: 0 }}>{review.comment}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '7px', flexShrink: 0 }}>
                    {review.status !== 'APPROVED' && (
                      <button onClick={() => setStatus(review.id, 'APPROVED')} disabled={loading === review.id} style={{ padding: '7px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#065F46', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Approve
                      </button>
                    )}
                    {review.status !== 'REJECTED' && (
                      <button onClick={() => setStatus(review.id, 'REJECTED')} disabled={loading === review.id} style={{ padding: '7px 16px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#991B1B', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
