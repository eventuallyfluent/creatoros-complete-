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
  { id: 'overview',  label: 'Overview',   icon: BookOpen },
  { id: 'billing',   label: 'Billing',    icon: ShoppingCart },
  { id: 'content',   label: 'Content',    icon: FileText },
  { id: 'sales',     label: 'Sales Page', icon: FileText },
  { id: 'checkout',  label: 'Checkout',   icon: ShoppingCart },
  { id: 'danger',    label: 'Danger Zone',icon: AlertTriangle },
] as const
type TabId = typeof TABS[number]['id']

export default function ProductEditorClient({ product, instructors, allProducts }: Props) {
  const [tab, setTab] = useState<TabId>('overview')
  const course = product.courses[0]?.course ?? null

  const inp: React.CSSProperties  = { width: '100%', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#111827', fontFamily: 'var(--font-ui)', outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties  = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }
  const card: React.CSSProperties = { background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '16px' }
  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '2px', background: '#f3f4f6', borderRadius: '10px', padding: '4px', width: 'fit-content', marginBottom: '28px', flexWrap: 'wrap' }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: tab === id ? 'white' : 'none', color: tab === id ? (id === 'danger' ? '#ef4444' : '#111827') : '#6b7280', boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab product={product} instructors={instructors} inp={inp} lbl={lbl} card={card} row2={row2} />}
      {tab === 'billing'  && <BillingTab  product={product} inp={inp} lbl={lbl} card={card} row2={row2} />}
      {tab === 'content'  && <ContentTab  product={product} course={course} instructors={instructors} />}
      {tab === 'sales'    && <SalesTab    product={product} />}
      {tab === 'checkout' && <CheckoutTab product={product} allProducts={allProducts} inp={inp} lbl={lbl} card={card} row2={row2} />}
      {tab === 'danger'   && <DangerTab   product={product} />}
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ product, instructors, inp, lbl, card, row2 }: any) {
  const [form, setForm] = useState({
    title:        product.title,
    subtitle:     product.subtitle ?? '',
    status:       product.status,
    instructorId: product.instructorId ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true); setError(null); setSaved(false)
    const res  = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:        form.title,
        subtitle:     form.subtitle || null,
        status:       form.status,
        instructorId: form.instructorId || null,
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
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Identity</h3>
        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Product Name</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} style={inp} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Subtitle <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
          <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} style={inp} placeholder="A short supporting description" />
        </div>
        <div>
          <label style={lbl}>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inp, width: '180px' }}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Instructor</h3>
        <select value={form.instructorId} onChange={e => set('instructorId', e.target.value)} style={inp}>
          <option value="">— Brand / Academy —</option>
          {instructors.map((i: any) => <option key={i.id} value={i.id}>{i.displayName}</option>)}
        </select>
      </div>

      <div style={{ ...card, opacity: 0.6 }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          Affiliates <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', background: '#f3f4f6', padding: '2px 8px', borderRadius: '999px', marginLeft: '6px', verticalAlign: 'middle' }}>COMING SOON</span>
        </h3>
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Affiliate tracking and commission management will be available in a future update.</p>
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

  const supportsRecurring = gateways.length > 0
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

  const disabledStyle = { opacity: 0.4, pointerEvents: 'none' as const }

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
          {!supportsRecurring && gateways.length > 0 && (
            <span style={{ fontSize: '11px', color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '3px 8px', fontWeight: 600 }}>
              Recurring requires a connected payment gateway
            </span>
          )}
          {gateways.length === 0 && (
            <span style={{ fontSize: '11px', color: '#9ca3af', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '3px 8px' }}>
              No gateway connected yet
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
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', border: `2px solid ${form.billingType === 'SUBSCRIPTION' ? '#7B2FBE' : '#e5e7eb'}`, borderRadius: '10px', cursor: supportsRecurring ? 'pointer' : 'not-allowed', background: form.billingType === 'SUBSCRIPTION' ? 'rgba(123,47,190,0.04)' : 'white', ...(supportsRecurring ? {} : disabledStyle) }}>
            <input type="radio" name="billingType" value="SUBSCRIPTION" checked={form.billingType === 'SUBSCRIPTION'} onChange={() => supportsRecurring && set('billingType', 'SUBSCRIPTION')} style={{ marginTop: '2px', accentColor: '#7B2FBE' }} disabled={!supportsRecurring} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>Ongoing subscription</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 10px' }}>Student is billed every period until they cancel.</p>
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
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', border: `2px solid ${form.billingType === 'PAYMENT_PLAN' ? '#7B2FBE' : '#e5e7eb'}`, borderRadius: '10px', cursor: supportsRecurring ? 'pointer' : 'not-allowed', background: form.billingType === 'PAYMENT_PLAN' ? 'rgba(123,47,190,0.04)' : 'white', ...(supportsRecurring ? {} : disabledStyle) }}>
            <input type="radio" name="billingType" value="PAYMENT_PLAN" checked={form.billingType === 'PAYMENT_PLAN'} onChange={() => supportsRecurring && set('billingType', 'PAYMENT_PLAN')} style={{ marginTop: '2px', accentColor: '#7B2FBE' }} disabled={!supportsRecurring} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>Payment plan</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 10px' }}>Student pays in fixed instalments then access continues.</p>
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

function ContentTab({ product, course, instructors }: { product: Product; course: CourseData | null; instructors: Instructor[] }) {
  if (!course) {
    return (
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
        <p style={{ fontSize: '15px', color: '#6b7280' }}>This product has no linked course yet. Edit the product to link or create one.</p>
      </div>
    )
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <section>
        <SectionHeading>Course Details</SectionHeading>
        <CourseEditor course={course as any} instructors={instructors} productId={product.id} />
      </section>

      <section>
        <SectionHeading>Curriculum</SectionHeading>
        <CurriculumBuilder courseId={course.id} modules={course.modules as any} />
      </section>

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
