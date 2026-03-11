'use client'
import React, { useState } from 'react'
import { Save, Trash2, AlertCircle, CheckCircle, BookOpen, FileText, ShoppingCart, AlertTriangle, Users } from 'lucide-react'
import CourseEditor from '@/components/admin/CourseEditor'
import CurriculumBuilder from '@/components/admin/CurriculumBuilder'
import SalesPageEditor from './sales-page/SalesPageEditor'
import Link from 'next/link'

interface CheckoutPageData {
  id: string; label: string; isDefault: boolean
  headline: string | null; subtext: string | null; guaranteeText: string | null
  showCouponField: boolean; thankYouHeadline: string | null; thankYouUrl: string | null
  orderBumpProductId: string | null; orderBumpHeadline: string | null
  orderBumpDescription: string | null; orderBumpPrice: number | null
}

interface CourseData {
  id: string; title: string; slug: string; subtitle: string | null
  description: string | null; thumbnailUrl: string | null; status: string
  instructorId: string | null; certificateEnabled: boolean
  metaTitle: string | null; metaDescription: string | null
  instructor: any; modules: any[]
}

interface Product {
  id: string; type: string; status: string; slug: string
  title: string; subtitle: string | null; price: number; compareAtPrice: number | null
  currency: string; instructorId: string | null; checkoutPages: CheckoutPageData[]
  courses: { course: CourseData }[]
}

interface SimpleProduct { id: string; title: string; price: number; currency: string }
interface Instructor    { id: string; displayName: string }

interface Props {
  product:     Product
  instructors: Instructor[]
  allProducts: SimpleProduct[]
}

const TABS = [
  { id: 'content',   label: 'Content',    icon: FileText },
  { id: 'billing',   label: 'Billing',    icon: ShoppingCart },
  { id: 'sales',     label: 'Sales Page', icon: FileText },
  { id: 'checkout',  label: 'Checkout',   icon: ShoppingCart },
  { id: 'danger',    label: 'Danger Zone',icon: AlertTriangle },
] as const
type TabId = typeof TABS[number]['id']

export default function ProductEditorClient({ product, instructors, allProducts }: Props) {
  const [tab,    setTab]    = useState<TabId>('content')
  const [status, setStatus] = useState(product.status)
  const [savingStatus, setSavingStatus] = useState(false)
  const [savedStatus,  setSavedStatus]  = useState(false)
  const course = product.courses[0]?.course ?? null

  const inp: React.CSSProperties  = { width: '100%', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#111827', fontFamily: 'var(--font-ui)', outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties  = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }
  const card: React.CSSProperties = { background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '16px' }
  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }

  const saveStatus = async (newStatus: string) => {
    setStatus(newStatus)
    setSavingStatus(true)
    await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setSavingStatus(false)
    setSavedStatus(true); setTimeout(() => setSavedStatus(false), 2000)
  }

  const statusColour = status === 'PUBLISHED' ? '#10b981' : status === 'ARCHIVED' ? '#9ca3af' : '#f59e0b'

  return (
    <div>
      {/* Tab bar + global status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '2px', background: '#f3f4f6', borderRadius: '10px', padding: '4px', flexWrap: 'wrap' }}>
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: tab === id ? 'white' : 'none', color: tab === id ? (id === 'danger' ? '#ef4444' : '#111827') : '#6b7280', boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>
        {/* Global status — always visible */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '8px 14px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColour, flexShrink: 0 }} />
          <select value={status} onChange={e => saveStatus(e.target.value)}
            style={{ border: 'none', fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: 600, color: '#111827', cursor: 'pointer', outline: 'none', background: 'transparent', paddingRight: '4px' }}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          {savingStatus && <span style={{ fontSize: '11px', color: '#9ca3af' }}>saving…</span>}
          {savedStatus  && <span style={{ fontSize: '11px', color: '#10b981' }}>✓</span>}
        </div>
      </div>

      {tab === 'billing'  && <BillingTab  product={product} inp={inp} lbl={lbl} card={card} row2={row2} />}
      {tab === 'content'  && <ContentTab  product={{...product, status}} course={course} instructors={instructors} inp={inp} lbl={lbl} card={card} row2={row2} />}
      {tab === 'sales'    && <SalesTab    product={product} />}
      {tab === 'checkout' && <CheckoutTab product={product} allProducts={allProducts} inp={inp} lbl={lbl} card={card} row2={row2} />}
      {tab === 'danger'   && <DangerTab   product={product} />}
    </div>
  )
}

// ── Quick Sales Page Generator ────────────────────────────────────────────────

function QuickSalesPageGenerator({ product, form }: { product: any; form: any }) {
  const [generating, setGenerating] = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const generate = async () => {
    setGenerating(true); setError(null); setDone(false)
    const prompts = {
      headline:    form.title    || product.title,
      subheadline: form.subtitle || product.subtitle || '',
      problem:'', whoIsItFor:'', benefits:'', transformation:'',
      whatsIncluded:'', curriculumSummary:'', instructorBio:'',
      ctaText:'Enrol Now', ctaSubtext:'',
      q_headline:'What is the headline for this course?',
      q_subheadline:'What is the supporting statement?',
      q_problem:'What problem does this course solve?',
      q_whoIsItFor:'Who is this course for?',
      q_benefits:'What are the main benefits?',
      q_transformation:'What outcome will students experience?',
      q_whatsIncluded:'What is included?',
      q_curriculumSummary:'Briefly describe the curriculum',
      q_instructorBio:'Why are you the right person to teach this?',
      q_ctaText:'What should the CTA button say?',
      q_ctaSubtext:'Any supporting text below the button?',
    }
    try {
      const res  = await fetch(`/api/admin/products/${product.id}/sales-page/prompts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prompts),
      })
      const data = await res.json()
      setGenerating(false)
      if (!res.ok) { setError(data.error ?? 'Generation failed'); return }
      setDone(true)
    } catch (err: any) { setGenerating(false); setError(err.message ?? 'Network error') }
  }

  return (
    <div style={{ marginTop: '20px', background: 'linear-gradient(135deg, rgba(123,47,190,0.05), rgba(52,211,153,0.05))', border: '1px solid rgba(123,47,190,0.2)', borderRadius: '12px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>⚡ Quick Sales Page</p>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
            Instantly generate a basic sales page using your product title &amp; subtitle.
            You can then edit the Sales Page tab to flesh it out further.
          </p>
          {error && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{error}</p>}
          {done && (
            <p style={{ fontSize: '12px', color: '#10b981', marginTop: '6px', fontWeight: 600 }}>
              ✓ Sales page created! Switch to the &ldquo;Sales Page&rdquo; tab to customise it.
            </p>
          )}
        </div>
        <button onClick={generate} disabled={generating || done}
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', background: done ? '#10b981' : '#7B2FBE', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: generating || done ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', opacity: generating ? 0.7 : 1 }}>
          {done ? '✓ Done' : generating ? 'Generating…' : 'Generate Sales Page'}
        </button>
      </div>
    </div>
  )
}

// ── Billing Tab ───────────────────────────────────────────────────────────────

function BillingTab({ product, inp, lbl, card, row2 }: any) {
  const [form, setForm] = useState({
    price:           String(product.price ?? 0),
    compareAtPrice:  product.compareAtPrice ? String(product.compareAtPrice) : '',
    currency:        product.currency ?? 'USD',
    billingType:     'ONE_TIME',   // ONE_TIME | SUBSCRIPTION | PAYMENT_PLAN
    interval:        'MONTHLY',    // MONTHLY | QUARTERLY | YEARLY
    planPayments:    '3',          // number of payments for PAYMENT_PLAN
    planInterval:    'MONTHLY',    // interval between payments
  })
  const [gateways,  setGateways]  = useState<any[]>([])
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Load active gateways to know what's supported
  React.useEffect(() => {
    fetch('/api/admin/gateways').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setGateways(data.filter((g: any) => g.isActive))
    }).catch(() => {})
  }, [])

  const hasGateway = gateways.length > 0
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true); setError(null); setSaved(false)
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price:          parseFloat(form.price) || 0,
        compareAtPrice: parseFloat(form.compareAtPrice) || null,
        currency:       form.currency,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }


  return (
    <>
      <div style={card}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Price</h3>
        <div style={row2}>
          <div>
            <label style={lbl}>Price</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} style={inp} placeholder="97.00" />
          </div>
          <div>
            <label style={lbl}>Compare-at <span style={{ fontWeight: 400, color: '#9ca3af' }}>(strike-through)</span></label>
            <input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={e => set('compareAtPrice', e.target.value)} style={inp} placeholder="Leave blank to hide" />
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={lbl}>Currency</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)} style={{ ...inp, width: '140px' }}>
            {['USD','GBP','EUR','AUD','CAD'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Billing Type</h3>
            {form.billingType !== 'ONE_TIME' && !hasGateway && (
            <span style={{ fontSize: '11px', color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '3px 8px', fontWeight: 600 }}>
              ⚠ No gateway connected yet
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* One-time */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', border: `2px solid ${form.billingType === 'ONE_TIME' ? '#7B2FBE' : '#e5e7eb'}`, borderRadius: '10px', cursor: 'pointer', background: form.billingType === 'ONE_TIME' ? 'rgba(123,47,190,0.04)' : 'white' }}>
            <input type="radio" name="billingType" value="ONE_TIME" checked={form.billingType === 'ONE_TIME'} onChange={() => set('billingType', 'ONE_TIME')} style={{ marginTop: '2px', accentColor: '#7B2FBE' }} />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>One-time payment</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Student pays once and gets lifetime access.</p>
            </div>
          </label>

          {/* Subscription */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', border: `2px solid ${form.billingType === 'SUBSCRIPTION' ? '#7B2FBE' : '#e5e7eb'}`, borderRadius: '10px', cursor: 'pointer', background: form.billingType === 'SUBSCRIPTION' ? 'rgba(123,47,190,0.04)' : 'white',  }}>
            <input type="radio" name="billingType" value="SUBSCRIPTION" checked={form.billingType === 'SUBSCRIPTION'} onChange={() => set('billingType', 'SUBSCRIPTION')} style={{ marginTop: '2px', accentColor: '#7B2FBE' }}  />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>Ongoing subscription</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 10px' }}>Student is billed every period until they cancel. Only available if your payment gateway supports recurring billing.</p>
              {form.billingType === 'SUBSCRIPTION' && (
                <div>
                  <label style={lbl}>Billing interval</label>
                  <select value={form.interval} onChange={e => set('interval', e.target.value)} style={{ ...inp, width: '200px' }}>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly (every 3 months)</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              )}
            </div>
          </label>

          {/* Payment plan */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', border: `2px solid ${form.billingType === 'PAYMENT_PLAN' ? '#7B2FBE' : '#e5e7eb'}`, borderRadius: '10px', cursor: 'pointer', background: form.billingType === 'PAYMENT_PLAN' ? 'rgba(123,47,190,0.04)' : 'white',  }}>
            <input type="radio" name="billingType" value="PAYMENT_PLAN" checked={form.billingType === 'PAYMENT_PLAN'} onChange={() => set('billingType', 'PAYMENT_PLAN')} style={{ marginTop: '2px', accentColor: '#7B2FBE' }}  />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>Payment plan</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 10px' }}>Student pays in fixed instalments then access continues. Only available if your payment gateway supports recurring billing.</p>
              {form.billingType === 'PAYMENT_PLAN' && (
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <label style={lbl}>Number of payments</label>
                    <input type="number" min="2" max="24" value={form.planPayments} onChange={e => set('planPayments', e.target.value)} style={{ ...inp, width: '120px' }} placeholder="3" />
                  </div>
                  <div>
                    <label style={lbl}>Interval</label>
                    <select value={form.planInterval} onChange={e => set('planInterval', e.target.value)} style={{ ...inp, width: '160px' }}>
                      <option value="MONTHLY">Monthly</option>
                      <option value="WEEKLY">Weekly</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </label>
        </div>


      </div>

      {error && <Alert type="error" message={error} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
          {saved ? <><CheckCircle size={15} /> Saved</> : <><Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}</>}
        </button>
      </div>
    </>
  )
}

// ── Content Tab ───────────────────────────────────────────────────────────────

function ContentTab({ product, course, instructors, inp, lbl, card, row2 }: any) {

  // ── Identity form (merged from Overview) ─────────────────────────────────
  const [form,   setForm]   = useState({ title: product.title, subtitle: product.subtitle ?? '', instructorId: product.instructorId ?? '' })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [idError, setIdError] = useState<string | null>(null)
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const saveIdentity = async () => {
    setSaving(true); setIdError(null); setSaved(false)
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: form.title, subtitle: form.subtitle || null, instructorId: form.instructorId || null }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setIdError(data.error ?? 'Save failed'); return }
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  if (product.type === 'BUNDLE') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {product.courses.map(({ course: c }: any) => (
          <div key={c.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{c.title}</p>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>{c.modules?.length ?? 0} modules</p>
            </div>
            <a href={`/admin/products/${product.id}?course=${c.id}`} style={{ fontSize: '13px', color: '#7B2FBE', fontWeight: 600, textDecoration: 'none' }}>
              Edit curriculum →
            </a>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Identity (was Overview) ─────────────────────────────────────── */}
      <section>
        <SectionHeading>Product Identity</SectionHeading>
        <div style={card}>
          <div style={{ ...row2, marginBottom: '16px' }}>
            <div>
              <label style={lbl}>Product Name</label>
              <input value={form.title} onChange={e => setF('title', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Subtitle <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
              <input value={form.subtitle} onChange={e => setF('subtitle', e.target.value)} style={inp} placeholder="A short supporting description" />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>Instructor</label>
            <select value={form.instructorId} onChange={e => setF('instructorId', e.target.value)} style={{ ...inp, width: '260px' }}>
              <option value="">— Brand / Academy —</option>
              {(instructors ?? []).map((i: any) => <option key={i.id} value={i.id}>{i.displayName}</option>)}
            </select>
          </div>
          {idError && <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '10px' }}>{idError}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={saveIdentity} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 22px', background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
              {saved ? <><CheckCircle size={14} /> Saved</> : <><Save size={14} /> {saving ? 'Saving…' : 'Save'}</>}
            </button>
          </div>
        </div>
        {/* Quick Sales Page — lives here now */}
        <QuickSalesPageGenerator product={product} form={form} />
      </section>

      {!course ? (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '15px', color: '#6b7280' }}>No linked course yet. Save the product first or link a course.</p>
        </div>
      ) : (<>

      {/* ── Course Details ─────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Course Details</SectionHeading>
        <CourseEditor course={course as any} instructors={instructors} productId={product.id} />
      </section>

      {/* ── Curriculum ────────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Curriculum</SectionHeading>
        <CurriculumBuilder courseId={course.id} modules={course.modules as any} />
      </section>

      {/* ── Students ──────────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Import Students</SectionHeading>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Bulk enrol students from CSV</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Import from Payhip or any CSV export. Existing students won&apos;t be duplicated.</p>
          </div>
          <Link href={`/admin/students/import?courseId=${course.id}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Users size={16} /> Import Students →
          </Link>
        </div>
      </section>

      {/* ── Re-import CSV ─────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Re-import Course Content</SectionHeading>
        <CourseImportPanel courseSlug={course.slug} courseTitle={course.title} />
      </section>

      </>)}
    </div>
  )
}

// ── Course Import Panel (inline in Content tab) ────────────────────────────────

function CourseImportPanel({ courseSlug, courseTitle }: { courseSlug: string; courseTitle: string }) {
  const [open,      setOpen]      = useState(false)
  const [file,      setFile]      = useState<File | null>(null)
  const [overwrite, setOverwrite] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [result,    setResult]    = useState<any | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const handleImport = async () => {
    if (!file) return
    setUploading(true); setError(null); setResult(null)
    const form = new FormData()
    form.append('file', file)
    form.append('overwrite', String(overwrite))
    const res  = await fetch('/api/admin/import', { method: 'POST', body: form })
    const data = await res.json()
    setUploading(false)
    if (!res.ok) { setError(data.error ?? 'Import failed'); return }
    setResult(data)
  }

  if (!open) {
    return (
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Replace content from CSV</p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Upload a course CSV to replace modules and lessons for <strong>{courseTitle}</strong>. The CSV slug must match <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>{courseSlug}</code>.</p>
        </div>
        <button onClick={() => setOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Upload CSV →
        </button>
      </div>
    )
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
      {result ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '20px' }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#14532d', margin: '0 0 8px' }}>✓ Import successful</p>
          <p style={{ fontSize: '13px', color: '#166534', margin: 0 }}>{result.modules} modules · {result.lessons} lessons imported</p>
          {result.warnings?.map((w: string, i: number) => <p key={i} style={{ fontSize: '12px', color: '#92400e', margin: '4px 0 0' }}>⚠ {w}</p>)}
          <button onClick={() => { setResult(null); setFile(null); setOpen(false) }} style={{ marginTop: '14px', padding: '8px 18px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Done</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', border: '2px dashed #d1d5db', borderRadius: '10px', cursor: 'pointer', background: '#f9fafb' }}>
              <span style={{ fontSize: '14px', color: file ? '#111827' : '#9ca3af', fontWeight: file ? 600 : 400 }}>
                {file ? `✓ ${file.name}` : 'Click to select CSV file'}
              </span>
            </div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151', marginBottom: '16px' }}>
            <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} style={{ accentColor: '#7B2FBE' }} />
            Replace existing modules &amp; lessons (recommended)
          </label>
          {error && <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '12px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleImport} disabled={!file || uploading}
              style={{ padding: '10px 24px', background: !file || uploading ? '#e5e7eb' : '#7B2FBE', color: !file || uploading ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: !file || uploading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
              {uploading ? 'Importing…' : 'Import'}
            </button>
            <button onClick={() => { setOpen(false); setFile(null); setError(null) }}
              style={{ padding: '10px 18px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#6b7280', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Sales Page Tab ────────────────────────────────────────────────────────────

function SalesTab({ product }: { product: Product }) {
  const allModules = (product as any).courses?.flatMap((pc: any) =>
    pc.course?.modules ?? []
  ) ?? []
  return <SalesPageEditor product={product as any} allModules={allModules} />
}

// ── Checkout Tab ──────────────────────────────────────────────────────────────

function CheckoutTab({ product, allProducts, inp, lbl, card, row2 }: any) {
  const defaultPage = product.checkoutPages?.find((p: any) => p.isDefault) ?? product.checkoutPages?.[0]
  const [current, setCurrent] = useState<any>(defaultPage ?? {
    label: 'Default', isDefault: true, showCouponField: true,
    headline: '', subtext: '', guaranteeText: '', thankYouUrl: '', thankYouHeadline: '',
    orderBumpProductId: null, orderBumpHeadline: '', orderBumpDescription: '', orderBumpPrice: null,
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const set = (key: string, val: any) => setCurrent((p: any) => ({ ...p, [key]: val }))

  const save = async () => {
    setSaving(true); setError(null); setSaved(false)
    const method = current.id ? 'PATCH' : 'POST'
    const url    = current.id
      ? `/api/admin/products/${product.id}/checkout-pages/${current.id}`
      : `/api/admin/products/${product.id}/checkout-pages`
    const res  = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...current, isDefault: true }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    setCurrent(data)
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <div style={card}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Checkout Page</h3>
        <div style={row2}>
          <div><label style={lbl}>Headline</label><input value={current.headline ?? ''} onChange={e => set('headline', e.target.value)} style={inp} placeholder="Complete your enrolment" /></div>
          <div><label style={lbl}>Subtext</label><input value={current.subtext ?? ''} onChange={e => set('subtext', e.target.value)} style={inp} placeholder="You're one step away…" /></div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={lbl}>Guarantee text</label>
          <input value={current.guaranteeText ?? ''} onChange={e => set('guaranteeText', e.target.value)} style={inp} placeholder="30-day money-back guarantee" />
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: 600 }}>
            <input type="checkbox" checked={current.showCouponField ?? true} onChange={e => set('showCouponField', e.target.checked)} style={{ accentColor: '#7B2FBE' }} />
            Show coupon code field
          </label>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Thank You Page</h3>
        <div style={row2}>
          <div><label style={lbl}>Headline</label><input value={current.thankYouHeadline ?? ''} onChange={e => set('thankYouHeadline', e.target.value)} style={inp} placeholder="You're in! Welcome." /></div>
          <div><label style={lbl}>Redirect URL <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label><input value={current.thankYouUrl ?? ''} onChange={e => set('thankYouUrl', e.target.value)} style={inp} placeholder="Leave blank for default" /></div>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Order Bump</h3>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }}>A one-click add-on shown at checkout.</p>
        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Bump Product</label>
          <select value={current.orderBumpProductId ?? ''} onChange={e => set('orderBumpProductId', e.target.value || null)} style={inp}>
            <option value="">— No order bump —</option>
            {allProducts.map((p: SimpleProduct) => (
              <option key={p.id} value={p.id}>{p.title} ({p.currency} {Number(p.price).toFixed(2)})</option>
            ))}
          </select>
        </div>
        {current.orderBumpProductId && (
          <>
            <div style={{ marginBottom: '16px' }}><label style={lbl}>Bump Headline</label><input value={current.orderBumpHeadline ?? ''} onChange={e => set('orderBumpHeadline', e.target.value)} style={inp} placeholder="Add this to your order" /></div>
            <div style={{ marginBottom: '16px' }}><label style={lbl}>Bump Description</label><textarea value={current.orderBumpDescription ?? ''} onChange={e => set('orderBumpDescription', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} /></div>
            <div><label style={lbl}>Override Price</label><input type="number" min="0" step="0.01" value={current.orderBumpPrice ?? ''} onChange={e => set('orderBumpPrice', e.target.value ? parseFloat(e.target.value) : null)} style={{ ...inp, width: '160px' }} /></div>
          </>
        )}
      </div>

      {error && <Alert type="error" message={error} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
          {saved ? <><CheckCircle size={15} /> Saved</> : <><Save size={15} /> {saving ? 'Saving…' : 'Save'}</>}
        </button>
      </div>
    </div>
  )
}

// ── Danger Zone ───────────────────────────────────────────────────────────────

function DangerTab({ product }: { product: Product }) {
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const doDelete = async () => {
    setDeleting(true)
    const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
    if (res.ok) window.location.href = '/admin/products'
    else setDeleting(false)
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#991b1b', margin: '0 0 8px' }}>Delete Product</h3>
        <p style={{ fontSize: '14px', color: '#7f1d1d', margin: '0 0 16px', lineHeight: 1.6 }}>
          This deletes the product, its sales page, and checkout pages. It does <strong>not</strong> delete the underlying course content or existing student enrolments.
        </p>
        <p style={{ fontSize: '13px', color: '#991b1b', margin: '0 0 10px', fontWeight: 600 }}>Type the product title to confirm:</p>
        <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder={product.title}
          style={{ width: '100%', background: 'white', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#111827', marginBottom: '14px', boxSizing: 'border-box', fontFamily: 'var(--font-ui)' }} />
        <button onClick={doDelete} disabled={confirmText !== product.title || deleting}
          style={{ padding: '10px 20px', background: confirmText === product.title && !deleting ? '#ef4444' : '#fca5a5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: confirmText === product.title && !deleting ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-ui)' }}>
          {deleting ? 'Deleting…' : 'Delete Product'}
        </button>
      </div>
    </div>
  )
}

// ── Shared ────────────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>{children}</h2>
}

function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${type === 'error' ? '#fca5a5' : '#86efac'}`, borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
      <AlertCircle size={15} color={type === 'error' ? '#ef4444' : '#16a34a'} />
      <p style={{ fontSize: '13px', color: type === 'error' ? '#991b1b' : '#166534', margin: 0 }}>{message}</p>
    </div>
  )
}
