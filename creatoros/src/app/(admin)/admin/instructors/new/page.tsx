export const dynamic = 'force-dynamic'
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

export default function NewInstructorPage() {
  const router = useRouter()
  const [form, setForm] = useState({ displayName: '', slug: '', title: '' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const handleNameChange = (name: string) => {
    setForm(f => ({
      ...f,
      displayName: name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }))
  }

  const handleCreate = async () => {
    if (!form.displayName.trim()) { setError('Name is required'); return }
    if (!form.slug.trim())        { setError('Slug is required'); return }
    setSaving(true); setError(null)
    const res  = await fetch('/api/admin/instructors', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Create failed'); return }
    router.push(`/admin/instructors/${data.id}`)
  }

  const inp: React.CSSProperties = { width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title="New Instructor" backHref="/admin/instructors" backLabel="All Instructors" />
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px', maxWidth: '520px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={lbl}>Display Name *</label>
          <input value={form.displayName} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Sifu Mark Rasmus" style={inp} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={lbl}>URL Slug *</label>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <span style={{ padding: '10px 12px', fontSize: '12px', color: '#9ca3af', borderRight: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>/instructors/</span>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} style={{ ...inp, border: 'none', background: 'transparent', borderRadius: '0' }} />
          </div>
        </div>
        <div style={{ marginBottom: '28px' }}>
          <label style={lbl}>Title / Role (optional)</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Martial Arts & Esoteric Teacher" style={inp} />
        </div>
        {error && <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '12px' }}>{error}</p>}
        <button onClick={handleCreate} disabled={saving} style={{ background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', padding: '11px 28px', fontSize: '15px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
          {saving ? 'Creating…' : 'Create Instructor →'}
        </button>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
          You can add the full bio, photos, and social links after creating.
        </p>
      </div>
    </div>
  )
}
