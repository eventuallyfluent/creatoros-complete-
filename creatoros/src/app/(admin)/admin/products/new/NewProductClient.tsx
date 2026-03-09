'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, Package, Plus, ChevronRight, AlertCircle } from 'lucide-react'

interface Course      { id: string; title: string; slug: string }
interface Instructor  { id: string; displayName: string }
interface Props { courses: Course[]; instructors: Instructor[] }

export default function NewProductClient({ courses, instructors }: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [type,    setType]    = useState<'COURSE' | 'BUNDLE' | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // COURSE form
  const [courseMode,    setCourseMode]    = useState<'existing' | 'new'>('existing')
  const [courseId,      setCourseId]      = useState('')
  const [newTitle,      setNewTitle]      = useState('')
  const [newSlug,       setNewSlug]       = useState('')
  const [instructorId,  setInstructorId]  = useState('')
  const [price,         setPrice]         = useState('')
  const [compareAt,     setCompareAt]     = useState('')
  const [currency,      setCurrency]      = useState('USD')
  const [billingType,   setBillingType]   = useState<'ONE_TIME' | 'SUBSCRIPTION'>('ONE_TIME')
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY')
  const [trialDays,     setTrialDays]     = useState('')

  // BUNDLE form
  const [bundleTitle,       setBundleTitle]       = useState('')
  const [bundleSlug,        setBundleSlug]        = useState('')
  const [bundlePrice,       setBundlePrice]       = useState('')
  const [bundleCompare,     setBundleCompare]     = useState('')
  const [selectedIds,       setSelectedIds]       = useState<string[]>([])
  const [bundleInstructor,  setBundleInstructor]  = useState('')

  // If redirected from "Create new course" with courseId param — auto-select it
  useEffect(() => {
    const cid = searchParams.get('courseId')
    if (cid) {
      setType('COURSE')
      setCourseMode('existing')
      setCourseId(cid)
    }
  }, [searchParams])

  const inp: React.CSSProperties = {
    width: '100%', background: 'white', border: '1px solid #e5e7eb',
    borderRadius: '8px', padding: '10px 14px', fontSize: '14px',
    color: '#111827', fontFamily: 'var(--font-ui)', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }
  const card: React.CSSProperties = { background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '16px' }
  const row: React.CSSProperties  = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }

  const toggleCourse = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSubmit = async () => {
    setError(null)
    setSaving(true)
    try {
      let body: any

      if (type === 'COURSE' && courseMode === 'new') {
        // Step 1: create course first, then wrap in product
        const courseRes = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle, slug: newSlug, status: 'DRAFT', instructorId: instructorId || null }),
        })
        const courseData = await courseRes.json()
        if (!courseRes.ok) { setError(courseData.error ?? 'Failed to create course'); return }
        body = {
          type: 'COURSE', courseId: courseData.id, instructorId: instructorId || null,
          price: parseFloat(price) || 0, compareAtPrice: parseFloat(compareAt) || null,
          currency, billingType,
          billingInterval: billingType === 'SUBSCRIPTION' ? billingInterval : null,
          trialDays: billingType === 'SUBSCRIPTION' && trialDays ? parseInt(trialDays) : null,
        }
      } else if (type === 'COURSE') {
        body = {
          type: 'COURSE', courseId, instructorId: instructorId || null,
          price: parseFloat(price) || 0, compareAtPrice: parseFloat(compareAt) || null,
          currency, billingType,
          billingInterval: billingType === 'SUBSCRIPTION' ? billingInterval : null,
          trialDays: billingType === 'SUBSCRIPTION' && trialDays ? parseInt(trialDays) : null,
        }
      } else {
        body = {
          type: 'BUNDLE', title: bundleTitle, slug: bundleSlug,
          price: parseFloat(bundlePrice) || 0, compareAtPrice: parseFloat(bundleCompare) || null,
          currency, courseIds: selectedIds, instructorId: bundleInstructor || null,
        }
      }

      const res  = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create product'); return }
      router.push(`/admin/products/${data.id}`)
    } finally {
      setSaving(false)
    }
  }

  // ── Step 1: choose type ──────────────────────────────────────────────────────
  if (!type) {
    return (
      <div style={{ maxWidth: '600px' }}>
        <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '24px' }}>
          What kind of product do you want to create?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { t: 'COURSE' as const, icon: BookOpen, title: 'Course',  desc: 'A single course — its own price, sales page, and checkout. You can create a new course or wrap an existing one.' },
            { t: 'BUNDLE' as const, icon: Package,  title: 'Bundle',  desc: 'Multiple courses sold together at a single price. Students get access to all included courses.' },
          ].map(({ t, icon: Icon, title, desc }) => (
            <button key={t} onClick={() => setType(t)}
              style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', transition: 'border-color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#7B2FBE'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(123,47,190,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(123,47,190,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color="#7B2FBE" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 3px' }}>{title}</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{desc}</p>
              </div>
              <ChevronRight size={18} color="#9ca3af" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── COURSE type ──────────────────────────────────────────────────────────────
  if (type === 'COURSE') {
    const canSubmit = courseMode === 'existing' ? !!courseId : (!!newTitle && !!newSlug)
    return (
      <div style={{ maxWidth: '640px' }}>
        <button onClick={() => setType(null)} style={{ fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', padding: 0, fontFamily: 'var(--font-ui)' }}>
          ← Back
        </button>

        {/* Course source */}
        <div style={card}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Course</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(['existing', 'new'] as const).map(m => (
              <button key={m} onClick={() => setCourseMode(m)}
                style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: courseMode === m ? '#7B2FBE' : '#f3f4f6', color: courseMode === m ? 'white' : '#374151' }}>
                {m === 'existing' ? 'Link existing course' : '+ Create new course'}
              </button>
            ))}
          </div>

          {courseMode === 'existing' ? (
            <select value={courseId} onChange={e => setCourseId(e.target.value)} style={inp}>
              <option value="">— Select a course —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={lbl}>Course Title</label>
                <input value={newTitle} onChange={e => { setNewTitle(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')) }} style={inp} placeholder="e.g. Advanced Tarot Reading" />
              </div>
              <div>
                <label style={lbl}>URL Slug</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#9ca3af', whiteSpace: 'nowrap' }}>/courses/</span>
                  <input value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} style={inp} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div style={card}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Pricing</h3>

          {/* Billing type toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(['ONE_TIME', 'SUBSCRIPTION'] as const).map(bt => (
              <button key={bt} onClick={() => setBillingType(bt)}
                style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: billingType === bt ? '#7B2FBE' : '#f3f4f6', color: billingType === bt ? 'white' : '#374151' }}>
                {bt === 'ONE_TIME' ? 'One-time payment' : 'Subscription'}
              </button>
            ))}
          </div>

          <div style={row}>
            <div>
              <label style={lbl}>{billingType === 'SUBSCRIPTION' ? 'Price per period' : 'Price'}</label>
              <input type="number" min="0" step="0.01" placeholder="97.00" value={price} onChange={e => setPrice(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Compare-at <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
              <input type="number" min="0" step="0.01" placeholder="147.00" value={compareAt} onChange={e => setCompareAt(e.target.value)} style={inp} />
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: billingType === 'SUBSCRIPTION' ? '1fr 1fr 1fr' : '1fr', gap: '16px' }}>
            <div>
              <label style={lbl}>Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={inp}>
                {['USD','GBP','EUR','AUD','CAD'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {billingType === 'SUBSCRIPTION' && (
              <>
                <div>
                  <label style={lbl}>Billing interval</label>
                  <select value={billingInterval} onChange={e => setBillingInterval(e.target.value as any)} style={inp}>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Free trial days <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                  <input type="number" min="0" placeholder="0" value={trialDays} onChange={e => setTrialDays(e.target.value)} style={inp} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Instructor */}
        <div style={card}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Instructor <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '13px' }}>(optional)</span></h3>
          <select value={instructorId} onChange={e => setInstructorId(e.target.value)} style={inp}>
            <option value="">— None —</option>
            {instructors.map(i => <option key={i.id} value={i.id}>{i.displayName}</option>)}
          </select>
        </div>

        {error && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}><AlertCircle size={16} color="#ef4444" /><p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p></div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSubmit} disabled={!canSubmit || saving}
            style={{ padding: '11px 28px', background: !canSubmit || saving ? '#e5e7eb' : '#7B2FBE', color: !canSubmit || saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: !canSubmit || saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
            {saving ? 'Creating…' : 'Create Product →'}
          </button>
        </div>
      </div>
    )
  }

  // ── BUNDLE type ──────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '680px' }}>
      <button onClick={() => setType(null)} style={{ fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', padding: 0, fontFamily: 'var(--font-ui)' }}>
        ← Back
      </button>

      <div style={card}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Bundle Details</h3>
        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Bundle Name</label>
          <input value={bundleTitle} onChange={e => { setBundleTitle(e.target.value); if (!bundleSlug) setBundleSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').slice(0,80)) }} style={inp} placeholder="e.g. The Master Collection" />
        </div>
        <div>
          <label style={lbl}>URL Slug</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#9ca3af', whiteSpace: 'nowrap' }}>/courses/</span>
            <input value={bundleSlug} onChange={e => setBundleSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} style={inp} />
          </div>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Pricing</h3>
        <div style={row}>
          <div><label style={lbl}>Price</label><input type="number" min="0" step="0.01" placeholder="297.00" value={bundlePrice} onChange={e => setBundlePrice(e.target.value)} style={inp} /></div>
          <div><label style={lbl}>Compare-at</label><input type="number" min="0" step="0.01" placeholder="597.00" value={bundleCompare} onChange={e => setBundleCompare(e.target.value)} style={inp} /></div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={lbl}>Currency</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inp, width: '120px' }}>
            {['USD','GBP','EUR','AUD','CAD'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Included Courses</h3>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }}>{selectedIds.length === 0 ? 'Select at least one course.' : `${selectedIds.length} course${selectedIds.length !== 1 ? 's' : ''} selected`}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
          {courses.map(c => {
            const checked = selectedIds.includes(c.id)
            return (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: `1px solid ${checked ? '#7B2FBE' : '#e5e7eb'}`, borderRadius: '8px', cursor: 'pointer', background: checked ? 'rgba(123,47,190,0.04)' : 'white' }}>
                <input type="checkbox" checked={checked} onChange={() => toggleCourse(c.id)} style={{ width: '15px', height: '15px', accentColor: '#7B2FBE', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', color: '#111827', fontWeight: checked ? 600 : 400 }}>{c.title}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div style={card}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Instructor <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '13px' }}>(optional)</span></h3>
        <select value={bundleInstructor} onChange={e => setBundleInstructor(e.target.value)} style={inp}>
          <option value="">— Brand / Academy —</option>
          {instructors.map(i => <option key={i.id} value={i.id}>{i.displayName}</option>)}
        </select>
      </div>

      {error && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}><AlertCircle size={16} color="#ef4444" /><p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p></div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSubmit} disabled={!bundleTitle || !bundleSlug || selectedIds.length === 0 || saving}
          style={{ padding: '11px 28px', background: (!bundleTitle || !bundleSlug || selectedIds.length === 0 || saving) ? '#e5e7eb' : '#7B2FBE', color: (!bundleTitle || !bundleSlug || selectedIds.length === 0 || saving) ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'not-allowed', fontFamily: 'var(--font-ui)' }}>
          {saving ? 'Creating…' : 'Create Bundle →'}
        </button>
      </div>
    </div>
  )
}
