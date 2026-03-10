'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Course { id: string; title: string }
interface CouponData {
  id?: string; code?: string; type?: string; value?: number
  maxUses?: number | null; expiresAt?: string | null
  startsAt?: string | null; minimumOrderAmount?: number | null
  isActive?: boolean; applicableCourseIds?: string[]
}

interface Props { coupon?: CouponData; courses: Course[] }

export default function CouponEditor({ coupon, courses }: Props) {
  const router = useRouter()
  const isNew  = !coupon?.id

  const [form, setForm] = useState({
    code:                coupon?.code ?? '',
    type:                coupon?.type ?? 'PERCENTAGE',
    value:               coupon?.value ?? 10,
    maxUses:             coupon?.maxUses ?? '',
    expiresAt:           coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
    startsAt:            coupon?.startsAt  ? coupon.startsAt.slice(0, 10) : '',
    minimumOrderAmount:  coupon?.minimumOrderAmount ?? '',
    isActive:            coupon?.isActive ?? true,
    applicableCourseIds: coupon?.applicableCourseIds ?? [] as string[],
  })

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const code  = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setForm(f => ({ ...f, code }))
  }

  const handleSave = async () => {
    if (!form.code.trim()) { setError('Code is required'); return }
    if (!form.value)       { setError('Value is required'); return }
    setSaving(true); setError(null)

    const url    = isNew ? '/api/coupons' : `/api/coupons/${coupon!.id}`
    const method = isNew ? 'POST' : 'PATCH'

    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, code: form.code.toUpperCase() }) })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    router.push('/admin/coupons')
    router.refresh()
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  )

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)', background: '#f9fafb' }

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', maxWidth: '640px' }}>
      <div style={{ padding: '28px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', marginBottom: '18px', alignItems: 'end' }}>
          <Field label="Coupon Code *">
            <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))} placeholder="ARCANE20" style={{ ...inp, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em' }} />
          </Field>
          <button type="button" onClick={generateCode} style={{ padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#7B2FBE', background: 'white', cursor: 'pointer', fontFamily: 'var(--font-ui)', marginBottom: '18px', whiteSpace: 'nowrap' }}>
            Generate
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Discount Type">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
              <option value="FREE">100% Free</option>
            </select>
          </Field>
          {form.type !== 'FREE' && (
            <Field label={form.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount ($)'}>
              <input type="number" min="0" step={form.type === 'PERCENTAGE' ? '1' : '0.01'} max={form.type === 'PERCENTAGE' ? '100' : undefined}
                value={form.value} onChange={e => setForm(f => ({ ...f, value: parseFloat(e.target.value) || 0 }))} style={inp} />
            </Field>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Max Uses (blank = unlimited)">
            <input type="number" min="1" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Unlimited" style={inp} />
          </Field>
          <Field label="Minimum Order ($)">
            <input type="number" min="0" step="0.01" value={form.minimumOrderAmount} onChange={e => setForm(f => ({ ...f, minimumOrderAmount: e.target.value }))} placeholder="No minimum" style={inp} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Start Date">
            <input type="date" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} style={inp} />
          </Field>
          <Field label="Expiry Date">
            <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} style={inp} />
          </Field>
        </div>

        {courses.length > 0 && (
          <Field label="Restrict to Courses (blank = all courses)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
              {courses.map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                  <input type="checkbox" checked={form.applicableCourseIds.includes(c.id)}
                    onChange={e => setForm(f => ({ ...f, applicableCourseIds: e.target.checked ? [...f.applicableCourseIds, c.id] : f.applicableCourseIds.filter(id => id !== c.id) }))} />
                  {c.title}
                </label>
              ))}
            </div>
          </Field>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Active</span>
        </label>
      </div>

      <div style={{ padding: '16px 28px', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>{error && <p style={{ fontSize: '14px', color: '#ef4444' }}>{error}</p>}</div>
        <button onClick={handleSave} disabled={saving} style={{ background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
          {saving ? 'Saving…' : isNew ? 'Create Coupon' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
