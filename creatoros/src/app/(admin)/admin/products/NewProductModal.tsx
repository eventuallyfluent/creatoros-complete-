'use client'
import { useState, useEffect, useCallback } from 'react'
import { X, BookOpen, Package, FileText, ShoppingBag, Calendar, Users, AlertCircle, ChevronLeft } from 'lucide-react'

interface Course     { id: string; title: string; slug: string }
interface Instructor { id: string; displayName: string }

interface Props {
  courses:     Course[]
  instructors: Instructor[]
  onClose:     () => void
  onCreated:   (productId: string) => void
}

type ProductType = 'COURSE' | 'BUNDLE' | 'DIGITAL' | 'PHYSICAL' | 'EVENT' | '1ON1'

interface TypeDef {
  type:     ProductType
  icon:     React.ElementType
  label:    string
  desc:     string
  soon:     boolean
}

const TYPES: TypeDef[] = [
  { type: 'COURSE',   icon: BookOpen,    label: 'Course',          desc: 'A structured online course with modules and lessons.',           soon: false },
  { type: 'BUNDLE',   icon: Package,     label: 'Bundle',          desc: 'Multiple courses sold together at a single price.',              soon: false },
  { type: 'DIGITAL',  icon: FileText,    label: 'Digital Product', desc: 'A download — PDF, template, audio file, or similar.',           soon: true  },
  { type: 'PHYSICAL', icon: ShoppingBag, label: 'Physical Product',desc: 'A shipped item — book, card deck, or physical good.',            soon: true  },
  { type: 'EVENT',    icon: Calendar,    label: 'Event',           desc: 'A live workshop, webinar, or in-person event with a date.',      soon: true  },
  { type: '1ON1',     icon: Users,       label: '1-on-1 Session',  desc: 'A bookable session — coaching call, reading, or consultation.', soon: true  },
]

export default function NewProductModal({ courses, instructors, onClose, onCreated }: Props) {
  const [selected, setSelected] = useState<ProductType | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Close on Escape
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])
  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // ── COURSE form state ──────────────────────────────────────────────────────
  const [newTitle,     setNewTitle]     = useState('')
  const [newSlug,      setNewSlug]      = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [price,        setPrice]        = useState('')
  const [compareAt,    setCompareAt]    = useState('')
  const [currency,     setCurrency]     = useState('USD')

  // ── BUNDLE form state ──────────────────────────────────────────────────────
  const [bundleTitle,      setBundleTitle]      = useState('')
  const [bundleSlug,       setBundleSlug]       = useState('')
  const [bundlePrice,      setBundlePrice]      = useState('')
  const [bundleCompare,    setBundleCompare]    = useState('')
  const [selectedIds,      setSelectedIds]      = useState<string[]>([])
  const [bundleInstructor, setBundleInstructor] = useState('')

  const toggleCourse = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSubmit = async () => {
    setError(null); setSaving(true)
    try {
      if (selected === 'COURSE') {
        const courseRes = await fetch('/api/courses', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle, slug: newSlug, status: 'DRAFT',
            instructorId: instructorId || null,
            price:          parseFloat(price) || 0,
            compareAtPrice: parseFloat(compareAt) || null,
            currency,
          }),
        })
        const courseData = await courseRes.json()
        if (!courseRes.ok) { setError(courseData.error ?? 'Failed to create course'); setSaving(false); return }
        onCreated(courseData.productId)
      } else {
        const body = { type: 'BUNDLE', title: bundleTitle, slug: bundleSlug,
          price: parseFloat(bundlePrice) || 0, compareAtPrice: parseFloat(bundleCompare) || null,
          currency, courseIds: selectedIds, instructorId: bundleInstructor || null }
        const res  = await fetch('/api/admin/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Failed to create product'); return }
        onCreated(data.id)
      }
    } finally {
      setSaving(false)
    }
  }

  const canSubmitCourse = !!newTitle && !!newSlug
  const canSubmitBundle = !!bundleTitle && !!bundleSlug && selectedIds.length > 0

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
    padding: '10px 14px', fontSize: '14px', color: '#111827',
    fontFamily: 'var(--font-ui)', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px',
  }
  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }
  const section: React.CSSProperties = { marginBottom: '20px' }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, backdropFilter: 'blur(2px)' }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 201, background: 'white', borderRadius: '16px',
        width: '100%', maxWidth: selected ? '580px' : '640px',
        maxHeight: '90vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        transition: 'max-width 0.2s',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selected && (
              <button onClick={() => { setSelected(null); setError(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={18} />
              </button>
            )}
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>
              {selected ? `New ${TYPES.find(t => t.type === selected)?.label}` : 'New Product'}
            </h2>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px', display: 'flex', alignItems: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>

          {/* ── Step 1: type grid ── */}
          {!selected && (
            <>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px' }}>
                What do you want to sell?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {TYPES.map(({ type, icon: Icon, label, desc, soon }) => (
                  <button
                    key={type}
                    onClick={() => !soon && setSelected(type)}
                    disabled={soon}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px',
                      padding: '16px', borderRadius: '10px', textAlign: 'left',
                      border: '1px solid #e5e7eb',
                      background: soon ? '#fafafa' : 'white',
                      cursor: soon ? 'default' : 'pointer',
                      opacity: soon ? 0.6 : 1,
                      fontFamily: 'var(--font-ui)',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (!soon) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#7B2FBE'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(123,47,190,0.08)' } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none' }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: soon ? '#f3f4f6' : 'rgba(123,47,190,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <Icon size={18} color={soon ? '#9ca3af' : '#7B2FBE'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: soon ? '#9ca3af' : '#111827', margin: 0 }}>{label}</p>
                        {soon && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', background: '#f3f4f6', padding: '1px 7px', borderRadius: '999px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Soon
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Step 2a: COURSE form ── */}
          {selected === 'COURSE' && (
            <>
              <div style={section}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={lbl}>Course Title</label>
                    <input value={newTitle} onChange={e => { setNewTitle(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')) }}
                      placeholder="e.g. Advanced Tarot Reading" style={inp} autoFocus />
                  </div>
                  <div>
                    <label style={lbl}>URL Slug</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#9ca3af', whiteSpace: 'nowrap' }}>/courses/</span>
                      <input value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} style={inp} />
                    </div>
                  </div>
                </div>
              </div>
              <div style={section}>
                <div style={row2}>
                  <div>
                    <label style={lbl}>Price</label>
                    <input type="number" min="0" step="0.01" placeholder="97.00" value={price}
                      onChange={e => setPrice(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Compare-at <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                    <input type="number" min="0" step="0.01" placeholder="147.00" value={compareAt}
                      onChange={e => setCompareAt(e.target.value)} style={inp} />
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <label style={lbl}>Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inp, width: '110px' }}>
                    {['USD','GBP','EUR','AUD','CAD'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={section}>
                <label style={lbl}>Instructor <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                <select value={instructorId} onChange={e => setInstructorId(e.target.value)} style={inp}>
                  <option value="">— Use course instructor —</option>
                  {instructors.map(i => <option key={i.id} value={i.id}>{i.displayName}</option>)}
                </select>
              </div>
            </>
          )}

          {/* ── Step 2b: BUNDLE form ── */}
          {selected === 'BUNDLE' && (
            <>
              <div style={section}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={lbl}>Bundle Name</label>
                  <input type="text" placeholder="e.g. The Master Course" value={bundleTitle}
                    onChange={e => {
                      setBundleTitle(e.target.value)
                      if (!bundleSlug || bundleSlug === bundleTitle.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').slice(0,80))
                        setBundleSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').slice(0,80))
                    }}
                    style={inp} />
                </div>
                <div>
                  <label style={lbl}>URL Slug</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#9ca3af', whiteSpace: 'nowrap' }}>/courses/</span>
                    <input value={bundleSlug} onChange={e => setBundleSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} style={inp} />
                  </div>
                </div>
              </div>
              <div style={section}>
                <div style={row2}>
                  <div>
                    <label style={lbl}>Bundle Price</label>
                    <input type="number" min="0" step="0.01" placeholder="297.00" value={bundlePrice}
                      onChange={e => setBundlePrice(e.target.value)} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Compare-at <span style={{ fontWeight: 400, color: '#9ca3af' }}>(combined total)</span></label>
                    <input type="number" min="0" step="0.01" placeholder="597.00" value={bundleCompare}
                      onChange={e => setBundleCompare(e.target.value)} style={inp} />
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <label style={lbl}>Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inp, width: '110px' }}>
                    {['USD','GBP','EUR','AUD','CAD'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={section}>
                <label style={lbl}>
                  Included Courses
                  {selectedIds.length > 0 && <span style={{ fontWeight: 400, color: '#7B2FBE', marginLeft: '6px' }}>{selectedIds.length} selected</span>}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '220px', overflowY: 'auto', padding: '2px' }}>
                  {courses.map(c => {
                    const checked = selectedIds.includes(c.id)
                    return (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', border: `1px solid ${checked ? '#7B2FBE' : '#e5e7eb'}`, borderRadius: '8px', cursor: 'pointer', background: checked ? 'rgba(123,47,190,0.04)' : 'white', transition: 'all 0.1s' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCourse(c.id)}
                          style={{ width: '15px', height: '15px', accentColor: '#7B2FBE', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: '#111827', fontWeight: checked ? 600 : 400 }}>{c.title}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              <div style={section}>
                <label style={lbl}>Instructor <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional — leave blank for brand/academy name)</span></label>
                <select value={bundleInstructor} onChange={e => setBundleInstructor(e.target.value)} style={inp}>
                  <option value="">— Brand / Academy —</option>
                  {instructors.map(i => <option key={i.id} value={i.id}>{i.displayName}</option>)}
                </select>
              </div>
            </>
          )}

          {error && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginTop: '4px' }}>
              <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {selected && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
            <button onClick={onClose}
              style={{ padding: '10px 20px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || (selected === 'COURSE' ? !canSubmitCourse : !canSubmitBundle)}
              style={{
                padding: '10px 24px', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-ui)',
                background: (saving || (selected === 'COURSE' ? !canSubmitCourse : !canSubmitBundle)) ? '#e5e7eb' : '#7B2FBE',
                color:      (saving || (selected === 'COURSE' ? !canSubmitCourse : !canSubmitBundle)) ? '#9ca3af' : 'white',
                cursor:     (saving || (selected === 'COURSE' ? !canSubmitCourse : !canSubmitBundle)) ? 'not-allowed' : 'pointer',
              }}>
              {saving ? 'Creating…' : `Create ${TYPES.find(t => t.type === selected)?.label} →`}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
