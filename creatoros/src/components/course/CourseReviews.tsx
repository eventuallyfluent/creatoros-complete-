'use client'
import { useState, useEffect, useRef } from 'react'

interface Review {
  id:        string
  rating:    number
  comment:   string | null
  createdAt: string
  user:      { firstName: string }
}

function Stars({ rating, size = 16, interactive = false, onChange }: {
  rating:      number
  size?:       number
  interactive?: boolean
  onChange?:   (r: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={interactive ? () => onChange?.(n) : undefined}
          onMouseEnter={interactive ? () => setHover(n) : undefined}
          onMouseLeave={interactive ? () => setHover(0) : undefined}
          style={{
            fontSize:   `${size}px`,
            cursor:     interactive ? 'pointer' : 'default',
            color:      n <= (hover || rating) ? '#F59E0B' : '#D1D5DB',
            transition: 'color 0.1s',
            userSelect: 'none',
          }}
        >★</span>
      ))}
    </div>
  )
}

export default function CourseReviews({ courseId, isEnrolled, focusForm = false, existingRating = null }: { courseId: string; isEnrolled: boolean; focusForm?: boolean; existingRating?: number | null }) {
  const [reviews, setReviews]     = useState<Review[]>([])
  const [avg,     setAvg]         = useState<number | null>(null)
  const [total,   setTotal]       = useState(0)
  const [loading, setLoading]     = useState(true)

  // Form state
  const [rating,    setRating]    = useState(existingRating ?? 0)
  const [comment,   setComment]   = useState('')
  const [submitting,setSubmitting]= useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/courses/${courseId}/reviews`)
      .then(r => r.json())
      .then(d => { setReviews(d.reviews ?? []); setAvg(d.averageRating); setTotal(d.total); setLoading(false) })
      .catch(() => setLoading(false))
  }, [courseId])

  // Scroll form into view when directed from email
  useEffect(() => {
    if (focusForm && formRef.current && isEnrolled) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)
    }
  }, [focusForm, isEnrolled])

  const handleSubmit = async () => {
    if (!rating) { setFormError('Please select a star rating'); return }
    setSubmitting(true); setFormError(null)
    const res  = await fetch(`/api/courses/${courseId}/reviews`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rating, comment }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setFormError(data.error ?? 'Submission failed'); return }
    setSubmitted(true)
  }

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <section style={{ padding: '64px 0' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 32px' }}>

        {/* Heading + average + Leave a Review CTA */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              Student Reviews
            </h2>
            {avg !== null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: '#F59E0B', lineHeight: 1 }}>{avg.toFixed(1)}</span>
                <div>
                  <Stars rating={Math.round(avg)} size={18} />
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '3px 0 0' }}>{total} review{total !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>No reviews yet — be the first!</p>
            )}
          </div>
          {isEnrolled && !submitted && (
            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-ui)', marginTop: '4px' }}>
              ★ Leave a Review
            </button>
          )}
          {!isEnrolled && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 18px', fontSize: '13px', color: 'var(--text-secondary)', flexShrink: 0 }}>
              Enrol to leave a review
            </div>
          )}
        </div>

        {/* Submit form (enrolled students only) */}
        {isEnrolled && !submitted && (
          <div ref={formRef} style={{ background: 'var(--bg-surface)', border: '2px solid var(--brand)', borderRadius: 'var(--r-xl)', padding: '28px', marginBottom: '32px', boxShadow: '0 0 0 4px rgba(123,47,190,0.08)' }}>
            <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>★ Leave a Review</p>

            <div style={{ marginBottom: '14px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Your rating</p>
              <Stars rating={rating} size={28} interactive onChange={setRating} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Your review <span style={{ color: 'var(--text-muted)' }}>(optional)</span></p>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your experience with this course…"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-ui)', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
              />
            </div>

            {formError && <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '10px' }}>{formError}</p>}

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              🔒 Only your first name will be shown publicly with your review.
            </p>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ padding: '13px 32px', background: submitting ? '#e5e7eb' : 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', fontSize: '15px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        )}

        {isEnrolled && submitted && (
          <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--r-xl)', padding: '20px 24px', marginBottom: '32px' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--success)', margin: 0 }}>✓ Review submitted — thank you!</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Your review will appear here once approved.</p>
          </div>
        )}

        {/* Reviews list */}
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No reviews yet. {isEnrolled ? 'Be the first!' : ''}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.map(review => (
              <div key={review.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {(review.user.firstName ?? 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{review.user.firstName}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <Stars rating={review.rating} size={13} />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 0 48px' }}>{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
