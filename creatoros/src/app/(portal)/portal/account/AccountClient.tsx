'use client'
import { useState } from 'react'
import Link from 'next/link'

interface User    { id: string; email: string; name: string | null; image: string | null; createdAt: Date }
interface Order   { id: string; total: number; currency: string; createdAt: Date; items: { product: { title: string; slug: string } | null }[] }
interface Enrollment {
  course:            { id: string; title: string; slug: string; thumbnailUrl: string | null }
  enrolledAt:        Date
  completedAt:       Date | null
  lessonsCompleted:  number
  totalLessons:      number
}

interface Props { user: User; orders: Order[]; enrollments: Enrollment[] }

type Tab = 'profile' | 'billing' | 'certificates'

export default function AccountClient({ user, orders, enrollments }: Props) {
  const [tab,      setTab]      = useState<Tab>('profile')
  const [name,     setName]     = useState(user.name ?? '')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const completedCourses = enrollments.filter(e => e.completedAt !== null)

  const handleSaveName = async () => {
    setSaving(true); setError(null)
    const res  = await fetch('/api/account/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name }),
    })
    setSaving(false)
    if (!res.ok) { setError('Save failed'); return }
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profile',      label: 'Profile'       },
    { id: 'billing',      label: 'Billing'        },
    { id: 'certificates', label: `Certificates (${completedCourses.length})` },
  ]

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-ui)', background: 'var(--bg-elevated)' }

  return (
    <div style={{ padding: 'var(--s7) var(--s6)', maxWidth: '680px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--s6)' }}>
        My Account
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-pill)', padding: '4px', width: 'fit-content', marginBottom: 'var(--s6)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 20px', borderRadius: 'var(--r-pill)', border: 'none', background: tab === t.id ? 'var(--brand)' : 'none', color: tab === t.id ? 'white' : 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inp} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email</label>
            <input value={user.email} readOnly style={{ ...inp, opacity: 0.6, cursor: 'default' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Email cannot be changed. Contact support if needed.</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Member Since</label>
            <p style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>
              {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleSaveName} disabled={saving} style={{ padding: '10px 24px', background: saved ? '#10b981' : 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Changes'}
            </button>
            {error && <p style={{ fontSize: '13px', color: 'var(--danger)', margin: 0 }}>{error}</p>}
          </div>
        </div>
      )}

      {/* Billing tab */}
      {tab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.length === 0 ? (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 'var(--s8)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>No purchases yet.</p>
              <Link href="/courses" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '14px' }}>Browse Courses →</Link>
            </div>
          ) : orders.map(order => (
            <div key={order.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 'var(--s5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{order.id.slice(0, 8)}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              {order.items.map((item, i) => (
                <p key={i} style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>{item.product?.title ?? 'Course'}</p>
              ))}
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)', margin: '8px 0 0' }}>
                {order.currency} {Number(order.total).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Certificates tab */}
      {tab === 'certificates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {completedCourses.length === 0 ? (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 'var(--s8)', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏆</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '6px' }}>No certificates yet.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Complete all lessons in a course to earn your certificate.</p>
            </div>
          ) : completedCourses.map(e => (
            <div key={e.course.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 'var(--s5)', display: 'flex', alignItems: 'center', gap: 'var(--s4)' }}>
              <span style={{ fontSize: '32px', flexShrink: 0 }}>🏆</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.course.title}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Completed {new Date(e.completedAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <a
                href={`/api/certificates/${e.course.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '9px 18px', background: 'var(--brand)', color: 'white', borderRadius: 'var(--r-md)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}
              >
                Download PDF
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
