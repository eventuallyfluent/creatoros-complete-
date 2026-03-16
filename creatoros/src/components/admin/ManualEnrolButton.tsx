'use client'
import { useState } from 'react'

interface Course { id: string; title: string }

export default function ManualEnrolButton({ userId, courses, enrolledIds }: {
  userId:      string
  courses:     Course[]
  enrolledIds: string[]
}) {
  const [courseId,  setCourseId]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [msg,       setMsg]       = useState<{ text: string; ok: boolean } | null>(null)

  const unenrolledCourses = courses.filter(c => !enrolledIds.includes(c.id))

  const handleEnrol = async () => {
    if (!courseId) return
    setLoading(true); setMsg(null)
    const res  = await fetch('/api/admin/enrollments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setMsg({ text: `✓ ${data.message}`, ok: true })
      setCourseId('')
      setTimeout(() => window.location.reload(), 1000)
    } else {
      setMsg({ text: data.error ?? 'Failed', ok: false })
    }
  }

  const handleRevoke = async (cId: string, cTitle: string) => {
    if (!confirm(`Revoke access to "${cTitle}"?`)) return
    setLoading(true); setMsg(null)
    const res  = await fetch('/api/admin/enrollments', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId: cId }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setMsg({ text: '✓ Access revoked', ok: true })
      setTimeout(() => window.location.reload(), 800)
    } else {
      setMsg({ text: data.error ?? 'Failed', ok: false })
    }
  }

  return (
    <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', background: '#fafafa', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Manually enrol:</span>
      {unenrolledCourses.length === 0 ? (
        <span style={{ fontSize: '13px', color: '#9ca3af' }}>Enrolled in all courses</span>
      ) : (
        <>
          <select
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
            style={{ fontSize: '13px', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', color: '#374151', flex: 1, minWidth: '200px', maxWidth: '360px' }}
          >
            <option value="">— Select course —</option>
            {unenrolledCourses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <button
            onClick={handleEnrol}
            disabled={!courseId || loading}
            style={{ padding: '7px 18px', background: courseId && !loading ? '#7B2FBE' : '#e5e7eb', color: courseId && !loading ? 'white' : '#9ca3af', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: courseId && !loading ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
          >
            {loading ? 'Enrolling…' : 'Enrol Now'}
          </button>
        </>
      )}
      {msg && (
        <span style={{ fontSize: '13px', color: msg.ok ? '#10b981' : '#ef4444', fontWeight: 600 }}>
          {msg.text}
        </span>
      )}
    </div>
  )
}

export function RevokeEnrolButton({ userId, courseId, courseTitle }: {
  userId: string; courseId: string; courseTitle: string
}) {
  const [loading, setLoading] = useState(false)

  const handleRevoke = async () => {
    if (!confirm(`Revoke "${courseTitle}" access?`)) return
    setLoading(true)
    const res = await fetch('/api/admin/enrollments', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId }),
    })
    if (res.ok) setTimeout(() => window.location.reload(), 500)
    else setLoading(false)
  }

  return (
    <button onClick={handleRevoke} disabled={loading}
      style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', padding: '2px 6px', opacity: loading ? 0.5 : 1 }}>
      {loading ? '…' : 'Revoke'}
    </button>
  )
}
