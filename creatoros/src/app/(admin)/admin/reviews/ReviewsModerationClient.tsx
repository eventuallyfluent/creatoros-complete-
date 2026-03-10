'use client'
import { useState, useRef } from 'react'
import { Star, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'

interface Review {
  id:        string
  rating:    number
  comment:   string | null
  status:    'PENDING' | 'APPROVED' | 'REJECTED'
  isFeatured: boolean
  createdAt: string
  user:      { name: string | null; email: string }
  course:    { id: string; title: string; slug: string }
}

interface Course { id: string; title: string }

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING:  { bg: '#FEF9C3', color: '#92400E' },
  APPROVED: { bg: 'rgba(52,211,153,0.1)', color: '#065F46' },
  REJECTED: { bg: '#FEE2E2', color: '#991B1B' },
}

function Stars({ rating }: { rating: number }) {
  return <span style={{ color: '#F59E0B', letterSpacing: '1px', fontSize: '14px' }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
}

export default function ReviewsModerationClient({ reviews: initial, courses }: { reviews: Review[]; courses: Course[] }) {
  const [reviews,   setReviews]   = useState<Review[]>(initial)
  const [filter,       setFilter]      = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FEATURED'>('PENDING')
  const [courseFilter, setCourseFilter] = useState<string>('ALL')
  const [loading,      setLoading]      = useState<string | null>(null)
  const [showImport,   setShowImport]   = useState(false)

  const setStatus = async (id: string, status: string) => {
    setLoading(id + status)
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(null)
    if (res.ok) setReviews(rs => rs.map(r => r.id === id ? { ...r, status: status as any } : r))
  }

  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    setLoading(id + 'feat')
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFeatured: !isFeatured }),
    })
    setLoading(null)
    if (res.ok) setReviews(rs => rs.map(r => r.id === id ? { ...r, isFeatured: !isFeatured } : r))
  }

  const counts = {
    ALL:      reviews.length,
    PENDING:  reviews.filter(r => r.status === 'PENDING').length,
    APPROVED: reviews.filter(r => r.status === 'APPROVED').length,
    REJECTED: reviews.filter(r => r.status === 'REJECTED').length,
    FEATURED: reviews.filter(r => r.isFeatured && r.status === 'APPROVED').length,
  }

  const courseFiltered = courseFilter === 'ALL' ? reviews : reviews.filter(r => r.course.id === courseFilter)
  const visible = (filter === 'FEATURED'
    ? courseFiltered.filter(r => r.isFeatured && r.status === 'APPROVED')
    : filter === 'ALL' ? courseFiltered : courseFiltered.filter(r => r.status === filter))

  return (
    <div>
      {/* Filter tabs + Import button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', flex: 1, flexWrap: 'wrap' }}>
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'FEATURED'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 14px', borderRadius: '8px', border: filter === f ? '2px solid #7B2FBE' : '1px solid #e5e7eb', background: filter === f ? 'rgba(123,47,190,0.06)' : 'white', color: filter === f ? '#7B2FBE' : '#6b7280', fontWeight: filter === f ? 700 : 400, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {f.charAt(0) + f.slice(1).toLowerCase()} <span style={{ color: '#9ca3af' }}>({counts[f]})</span>
            </button>
          ))}
        </div>
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', fontFamily: 'inherit', background: 'white', cursor: 'pointer' }}>
          <option value="ALL">All courses</option>
          {courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select>
        <button onClick={() => setShowImport(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: showImport ? '#7B2FBE' : 'white', color: showImport ? 'white' : '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          <Upload size={13} /> Import from Payhip
        </button>
      </div>

      {/* Import panel */}
      {showImport && <ImportPanel courses={courses} onImported={newReviews => setReviews(rs => [...newReviews, ...rs])} />}

      {/* Reviews list */}
      {visible.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No {filter.toLowerCase()} reviews.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visible.map(review => {
            const sc = STATUS_COLORS[review.status]
            const isLoading = loading?.startsWith(review.id)
            return (
              <div key={review.id} style={{ background: 'white', border: `1px solid ${review.isFeatured ? '#c4b5fd' : '#e5e7eb'}`, borderRadius: '12px', padding: '18px 20px', position: 'relative' }}>
                {review.isFeatured && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#7B2FBE', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>★ FEATURED</div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <Stars rating={review.rating} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
                        {review.user.name || review.user.email}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>on {review.course.title}</span>
                    </div>
                    {review.comment && (
                      <p style={{ fontSize: '14px', color: '#374151', margin: '8px 0 0', lineHeight: 1.6 }}>{review.comment}</p>
                    )}
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '8px 0 0' }}>
                      {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                    {/* Status badge */}
                    <span style={{ fontSize: '11px', fontWeight: 700, background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {review.status}
                    </span>

                    {/* Approve/Reject */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {review.status !== 'APPROVED' && (
                        <button onClick={() => setStatus(review.id, 'APPROVED')} disabled={!!isLoading}
                          style={{ padding: '5px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', color: '#166534', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Approve
                        </button>
                      )}
                      {review.status !== 'REJECTED' && (
                        <button onClick={() => setStatus(review.id, 'REJECTED')} disabled={!!isLoading}
                          style={{ padding: '5px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Reject
                        </button>
                      )}
                    </div>

                    {/* Feature toggle — only on approved */}
                    {review.status === 'APPROVED' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#374151', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={review.isFeatured}
                          onChange={() => toggleFeatured(review.id, review.isFeatured)}
                          disabled={!!isLoading}
                          style={{ width: '14px', height: '14px', accentColor: '#7B2FBE' }}
                        />
                        Feature on sales page
                      </label>
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

// ── Payhip Import Panel ───────────────────────────────────────────────────────

function ImportPanel({ courses, onImported }: { courses: Course[]; onImported: (r: Review[]) => void }) {
  const fileRef  = useRef<HTMLInputElement>(null)
  const [courseId, setCourseId] = useState('')
  const [rows,     setRows]     = useState<any[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result,   setResult]   = useState<{ imported: number; skipped: number } | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
    return lines.slice(1).map(line => {
      // Handle quoted commas
      const cols: string[] = []
      let cur = '', inQuote = false
      for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote }
        else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = '' }
        else cur += ch
      }
      cols.push(cur.trim())
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = (cols[i] || '').replace(/^"|"$/g, '') })
      return obj
    }).filter(r => r.email || r['buyer email'] || r['customer email'])
  }

  const handleFile = (file: File) => {
    setFileName(file.name)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!courseId || rows.length === 0) return
    setImporting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/reviews/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, rows }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Import failed'); return }
      setResult({ imported: data.imported, skipped: data.skipped })
      if (data.reviews?.length) onImported(data.reviews)
      setRows([])
      setFileName('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Import Reviews from Payhip</h3>
      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 20px', lineHeight: 1.6 }}>
        Export your Payhip reviews CSV (Product dashboard → Reviews → Export) and upload it here. Reviews are imported as Approved and tagged to the course you select. Duplicates are skipped.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Tag to Course</label>
          <select value={courseId} onChange={e => setCourseId(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', fontFamily: 'inherit' }}>
            <option value="">— Select a course —</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Payhip Reviews CSV</label>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', border: '1px dashed #d1d5db', borderRadius: '8px', cursor: 'pointer', background: '#f9fafb', fontSize: '13px', color: fileName ? '#111827' : '#9ca3af' }}>
            <Upload size={14} color="#6b7280" />
            {fileName || 'Click to select CSV file'}
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      </div>

      {rows.length > 0 && (
        <p style={{ fontSize: '13px', color: '#374151', marginBottom: '16px' }}>
          <strong>{rows.length}</strong> rows found in CSV
          {!courseId && <span style={{ color: '#f59e0b', marginLeft: '8px' }}>— select a course first</span>}
        </p>
      )}

      {error && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
          <AlertCircle size={14} color="#ef4444" />
          <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
          <CheckCircle size={14} color="#16a34a" />
          <p style={{ fontSize: '13px', color: '#166534', margin: 0 }}>
            Imported <strong>{result.imported}</strong> reviews. {result.skipped > 0 && `${result.skipped} skipped (already exist or missing data).`}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleImport} disabled={!courseId || rows.length === 0 || importing}
          style={{ padding: '10px 24px', background: (!courseId || rows.length === 0 || importing) ? '#e5e7eb' : '#7B2FBE', color: (!courseId || rows.length === 0 || importing) ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: (!courseId || rows.length === 0 || importing) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {importing ? 'Importing…' : `Import ${rows.length > 0 ? rows.length + ' ' : ''}Reviews`}
        </button>
      </div>
    </div>
  )
}
