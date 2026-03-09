'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Plus, Check, X, Trash2, Edit2, ExternalLink } from 'lucide-react'

interface Testimonial {
  id:              string
  authorName:      string
  authorRole:      string | null
  quote:           string
  status:          'PENDING' | 'APPROVED' | 'REJECTED'
  isFeatured:      boolean
  publicUseConsent: boolean
  source:          string
  createdAt:       string
  course:          { id: string; title: string; slug: string } | null
  user:            { id: string; name: string | null; email: string } | null
}

interface Course { id: string; title: string }

type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FEATURED'

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:  { bg: '#fef9c3', color: '#92400e', label: 'Pending'  },
  APPROVED: { bg: '#f0fdf4', color: '#065f46', label: 'Approved' },
  REJECTED: { bg: '#fef2f2', color: '#991b1b', label: 'Rejected' },
}

export default function TestimonialsClient({ testimonials: initial, courses }: { testimonials: Testimonial[]; courses: Course[] }) {
  const router   = useRouter()
  const [items,   setItems]   = useState<Testimonial[]>(initial)
  const [filter,  setFilter]  = useState<Filter>('ALL')
  const [loading, setLoading] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editId,  setEditId]  = useState<string | null>(null)

  // New / edit form state
  const blank = { authorName: '', authorRole: '', quote: '', courseId: '', isFeatured: false, publicUseConsent: true }
  const [form, setForm] = useState(blank)
  const [saving, setSaving]   = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  const patch = async (id: string, data: Partial<Testimonial>) => {
    setLoading(id)
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      setItems(ts => ts.map(t => t.id === id ? { ...t, ...updated } : t))
    }
    setLoading(null)
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return
    setLoading(id)
    await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' })
    setItems(ts => ts.filter(t => t.id !== id))
    setLoading(null)
  }

  const handleSave = async () => {
    if (!form.authorName.trim()) { setFormErr('Author name required'); return }
    if (!form.quote.trim())      { setFormErr('Quote required');        return }
    setSaving(true); setFormErr(null)

    const isEdit = !!editId
    const url    = isEdit ? `/api/admin/testimonials/${editId}` : '/api/admin/testimonials'
    const res    = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorName:       form.authorName,
        authorRole:       form.authorRole || null,
        quote:            form.quote,
        courseId:         form.courseId   || null,
        isFeatured:       form.isFeatured,
        publicUseConsent: form.publicUseConsent,
        status:           'APPROVED',
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setFormErr(data.error ?? 'Save failed'); return }

    if (isEdit) {
      setItems(ts => ts.map(t => t.id === editId ? { ...t, ...data } : t))
    } else {
      setItems(ts => [data, ...ts])
    }
    setForm(blank); setShowAdd(false); setEditId(null)
  }

  const startEdit = (t: Testimonial) => {
    setForm({ authorName: t.authorName, authorRole: t.authorRole ?? '', quote: t.quote, courseId: t.course?.id ?? '', isFeatured: t.isFeatured, publicUseConsent: t.publicUseConsent })
    setEditId(t.id); setShowAdd(true)
  }

  const counts = {
    ALL:      items.length,
    PENDING:  items.filter(t => t.status === 'PENDING').length,
    APPROVED: items.filter(t => t.status === 'APPROVED').length,
    REJECTED: items.filter(t => t.status === 'REJECTED').length,
    FEATURED: items.filter(t => t.isFeatured && t.status === 'APPROVED').length,
  }

  const visible = filter === 'ALL'      ? items
    : filter === 'FEATURED'             ? items.filter(t => t.isFeatured && t.status === 'APPROVED')
    : items.filter(t => t.status === filter)

  const featuredCount = counts.FEATURED
  const inp: React.CSSProperties = { width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)' }

  return (
    <div>
      {/* Homepage status banner */}
      <div style={{ background: featuredCount > 0 ? '#f0fdf4' : '#fffbeb', border: `1px solid ${featuredCount > 0 ? '#86efac' : '#fcd34d'}`, borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>{featuredCount > 0 ? '✅' : '⚠️'}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>
            {featuredCount > 0
              ? `${featuredCount} featured testimonial${featuredCount !== 1 ? 's' : ''} will appear on the homepage`
              : 'No featured testimonials — homepage testimonials section will be empty'}
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
            Approve a testimonial and toggle the ★ Featured star to show it on the homepage.
          </p>
        </div>
        <button
          onClick={() => { setForm(blank); setEditId(null); setShowAdd(s => !s) }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#7B2FBE', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' }}>
          <Plus size={14} /> Add Testimonial
        </button>
      </div>

      {/* Add / Edit form */}
      {showAdd && (
        <div style={{ background: 'white', border: '2px solid #7B2FBE', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
            {editId ? 'Edit Testimonial' : 'Add New Testimonial'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Name *</label>
              <input value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} placeholder="e.g. John Smith" style={inp} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Title / Role</label>
              <input value={form.authorRole} onChange={e => setForm(f => ({ ...f, authorRole: e.target.value }))} placeholder="e.g. Student, Practitioner" style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Quote *</label>
            <textarea value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} rows={4} placeholder="The student's testimonial in their own words…" style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Related Course (optional)</label>
              <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))} style={{ ...inp }}>
                <option value="">— No specific course —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} style={{ width: '15px', height: '15px', accentColor: '#7B2FBE' }} />
                ★ Feature on homepage
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                <input type="checkbox" checked={form.publicUseConsent} onChange={e => setForm(f => ({ ...f, publicUseConsent: e.target.checked }))} style={{ width: '15px', height: '15px', accentColor: '#7B2FBE' }} />
                Has given public use consent
              </label>
            </div>
          </div>
          {formErr && <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '12px' }}>{formErr}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '10px 24px', background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
              {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Testimonial'}
            </button>
            <button onClick={() => { setShowAdd(false); setEditId(null); setForm(blank) }}
              style={{ padding: '10px 16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#6b7280', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {(['ALL', 'FEATURED', 'PENDING', 'APPROVED', 'REJECTED'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 14px', borderRadius: '8px', border: filter === f ? '2px solid #7B2FBE' : '1px solid #e5e7eb', background: filter === f ? 'rgba(123,47,190,0.06)' : 'white', color: filter === f ? '#7B2FBE' : '#6b7280', fontWeight: filter === f ? 700 : 400, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {f === 'FEATURED' ? '★ ' : ''}{f.charAt(0) + f.slice(1).toLowerCase()} <span style={{ color: '#9ca3af' }}>({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Testimonial list */}
      {visible.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No {filter.toLowerCase()} testimonials.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visible.map(t => {
            const s = STATUS_STYLE[t.status]
            const isLoading = loading === t.id
            return (
              <div key={t.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.15s' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>

                  {/* Quote */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '10px' }}>
                      "{t.quote}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>{t.authorName}</p>
                      {t.authorRole && <p style={{ fontSize: '13px', color: '#7B2FBE', margin: 0 }}>{t.authorRole}</p>}
                      {t.course && <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>re: {t.course.title}</p>}
                      {t.source === 'STUDENT_SUBMITTED' && <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', padding: '2px 7px', borderRadius: '20px', fontWeight: 600 }}>Student submitted</span>}
                      {!t.publicUseConsent && <span style={{ fontSize: '11px', background: '#fff7ed', color: '#c2410c', padding: '2px 7px', borderRadius: '20px', fontWeight: 600 }}>⚠ No consent</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                    {/* Status badge + approve/reject */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: s.bg, color: s.color }}>{s.label}</span>
                      {t.status !== 'APPROVED' && (
                        <button onClick={() => patch(t.id, { status: 'APPROVED' } as any)} title="Approve" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #86efac', background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={13} />
                        </button>
                      )}
                      {t.status !== 'REJECTED' && (
                        <button onClick={() => patch(t.id, { status: 'REJECTED' } as any)} title="Reject" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Feature toggle */}
                    <button
                      onClick={() => patch(t.id, { isFeatured: !t.isFeatured } as any)}
                      title={t.isFeatured ? 'Remove from homepage' : 'Feature on homepage'}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', border: `1px solid ${t.isFeatured ? '#fbbf24' : '#e5e7eb'}`, background: t.isFeatured ? '#fffbeb' : 'white', color: t.isFeatured ? '#d97706' : '#9ca3af', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                      <Star size={12} fill={t.isFeatured ? '#d97706' : 'none'} />
                      {t.isFeatured ? 'Featured' : 'Feature'}
                    </button>

                    {/* Edit / delete */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => startEdit(t)} title="Edit" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => remove(t.id)} title="Delete" style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
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
