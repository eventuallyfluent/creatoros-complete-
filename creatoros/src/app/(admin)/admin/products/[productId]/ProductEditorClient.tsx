'use client'
import { useState } from 'react'
import { Save, Plus, Trash2, AlertCircle, CheckCircle, BookOpen, FileText, ShoppingCart, AlertTriangle, Users } from 'lucide-react'
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
    price:          String(product.price),
    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
    currency:       product.currency,
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

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
            <label style={lbl}>Compare-at <span style={{ fontWeight: 400, color: '#9ca3af' }}>(strike-through, optional)</span></label>
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

      {error && <Alert type="error" message={error} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
          {saved ? <><CheckCircle size={15} /> Saved</> : <><Save size={15} /> {saving ? 'Saving\u2026' : 'Save Changes'}</>}
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
  const [pages,   setPages]   = useState<CheckoutPageData[]>(product.checkoutPages)
  const [active,  setActive]  = useState<string | null>(pages[0]?.id ?? null)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [saved,   setSaved]   = useState(false)

  const current = pages.find(p => p.id === active)
  const updateCurrent = (key: string, val: any) =>
    setPages(ps => ps.map(p => p.id === active ? { ...p, [key]: val } : p))

  const addPage = async () => {
    const res  = await fetch(`/api/admin/products/${product.id}/checkout-pages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'New Checkout', isDefault: false }),
    })
    const data = await res.json()
    if (res.ok) { setPages(ps => [...ps, data]); setActive(data.id) }
  }

  const savePage = async () => {
    if (!current) return
    setSaving(true); setError(null); setSaved(false)
    const res = await fetch(`/api/admin/products/${product.id}/checkout-pages/${current.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(current),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    setPages(ps => ps.map(p => p.id === data.id ? data : p))
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const deletePage = async (id: string) => {
    if (!confirm('Delete this checkout page?')) return
    await fetch(`/api/admin/products/${product.id}/checkout-pages/${id}`, { method: 'DELETE' })
    const remaining = pages.filter(p => p.id !== id)
    setPages(remaining); setActive(remaining[0]?.id ?? null)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
          {pages.map(p => (
            <button key={p.id} onClick={() => setActive(p.id)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid ${active === p.id ? '#7B2FBE' : '#e5e7eb'}`, background: active === p.id ? 'rgba(123,47,190,0.06)' : 'white', color: '#111827', fontSize: '13px', fontWeight: active === p.id ? 700 : 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)' }}>
              {p.label}{p.isDefault && <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '6px' }}>default</span>}
            </button>
          ))}
        </div>
        <button onClick={addPage}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'none', border: '1px dashed #d1d5db', borderRadius: '8px', color: '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)', width: '100%' }}>
          <Plus size={13} /> Add variant
        </button>
        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', lineHeight: 1.4 }}>Add variants for payment plans or early bird pricing.</p>
      </div>

      {current ? (
        <div>
          <div style={card}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Checkout Page</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>Label <span style={{ fontWeight: 400, color: '#9ca3af' }}>(admin only)</span></label>
              <input value={current.label} onChange={e => updateCurrent('label', e.target.value)} style={inp} />
            </div>
            <div style={row2}>
              <div><label style={lbl}>Headline</label><input value={current.headline ?? ''} onChange={e => updateCurrent('headline', e.target.value)} style={inp} placeholder="Complete your enrolment" /></div>
              <div><label style={lbl}>Subtext</label><input value={current.subtext ?? ''} onChange={e => updateCurrent('subtext', e.target.value)} style={inp} placeholder="You're one step away…" /></div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={lbl}>Guarantee text</label>
              <input value={current.guaranteeText ?? ''} onChange={e => updateCurrent('guaranteeText', e.target.value)} style={inp} placeholder="30-day money-back guarantee" />
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: 600 }}>
                <input type="checkbox" checked={current.showCouponField} onChange={e => updateCurrent('showCouponField', e.target.checked)} style={{ accentColor: '#7B2FBE' }} />
                Show coupon code field
              </label>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Thank You Page</h3>
            <div style={row2}>
              <div><label style={lbl}>Headline</label><input value={current.thankYouHeadline ?? ''} onChange={e => updateCurrent('thankYouHeadline', e.target.value)} style={inp} placeholder="You're in! Welcome." /></div>
              <div><label style={lbl}>Redirect URL <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label><input value={current.thankYouUrl ?? ''} onChange={e => updateCurrent('thankYouUrl', e.target.value)} style={inp} placeholder="Leave blank for default" /></div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Order Bump</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }}>A one-click add-on shown at checkout.</p>
            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>Bump Product</label>
              <select value={current.orderBumpProductId ?? ''} onChange={e => updateCurrent('orderBumpProductId', e.target.value || null)} style={inp}>
                <option value="">— No order bump —</option>
                {allProducts.map((p: SimpleProduct) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.currency} {Number(p.price).toFixed(2)})</option>
                ))}
              </select>
            </div>
            {current.orderBumpProductId && (
              <>
                <div style={{ marginBottom: '16px' }}><label style={lbl}>Bump Headline</label><input value={current.orderBumpHeadline ?? ''} onChange={e => updateCurrent('orderBumpHeadline', e.target.value)} style={inp} placeholder="Add this to your order" /></div>
                <div style={{ marginBottom: '16px' }}><label style={lbl}>Bump Description</label><textarea value={current.orderBumpDescription ?? ''} onChange={e => updateCurrent('orderBumpDescription', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} /></div>
                <div><label style={lbl}>Override Price</label><input type="number" min="0" step="0.01" value={current.orderBumpPrice ?? ''} onChange={e => updateCurrent('orderBumpPrice', e.target.value ? parseFloat(e.target.value) : null)} style={{ ...inp, width: '160px' }} /></div>
              </>
            )}
          </div>

          {error && <Alert type="error" message={error} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {!current.isDefault && (
              <button onClick={() => deletePage(current.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'none', border: '1px solid #fca5a5', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                <Trash2 size={13} /> Delete variant
              </button>
            )}
            <div style={{ marginLeft: 'auto' }}>
              <button onClick={savePage} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
                {saved ? <><CheckCircle size={15} /> Saved</> : <><Save size={15} /> {saving ? 'Saving…' : 'Save'}</>}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Select or create a checkout page.</p>
      )}
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
