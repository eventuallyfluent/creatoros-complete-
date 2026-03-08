'use client'
import { useState } from 'react'
import { Save, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react'

interface CheckoutPageData {
  id:                  string
  label:               string
  isDefault:           boolean
  headline:            string | null
  subtext:             string | null
  guaranteeText:       string | null
  showCouponField:     boolean
  thankYouHeadline:    string | null
  thankYouUrl:         string | null
  orderBumpProductId:  string | null
  orderBumpHeadline:   string | null
  orderBumpDescription:string | null
  orderBumpPrice:      number | null
}

interface Product {
  id:            string
  type:          string
  status:        string
  slug:          string
  title:         string
  subtitle:      string | null
  price:         number
  compareAtPrice:number | null
  currency:      string
  affiliateEnabled: boolean
  instructorId:  string | null
  checkoutPages: CheckoutPageData[]
}

interface SimpleProduct { id: string; title: string; price: number; currency: string }
interface Instructor    { id: string; displayName: string }

interface Props {
  product:     Product
  instructors: Instructor[]
  allProducts: SimpleProduct[]
}

const TABS = ['Details', 'Checkout Pages', 'Danger Zone'] as const
type Tab = typeof TABS[number]

export default function ProductEditorClient({ product, instructors, allProducts }: Props) {
  const [tab, setTab] = useState<Tab>('Details')

  const inp: React.CSSProperties = {
    width: '100%', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
    padding: '10px 14px', fontSize: '14px', color: '#111827', fontFamily: 'var(--font-ui)',
    outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }
  const card: React.CSSProperties = { background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '16px' }
  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '2px', background: '#f3f4f6', borderRadius: '10px', padding: '4px', width: 'fit-content', marginBottom: '24px' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: tab === t ? 'white' : 'none', color: tab === t ? '#111827' : '#6b7280', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Details'         && <DetailsTab         product={product} instructors={instructors} inp={inp} lbl={lbl} card={card} row2={row2} />}
      {tab === 'Checkout Pages'  && <CheckoutTab        product={product} allProducts={allProducts} inp={inp} lbl={lbl} card={card} row2={row2} />}
      {tab === 'Danger Zone'     && <DangerTab          product={product} />}
    </div>
  )
}

// ── Details Tab ───────────────────────────────────────────────────────────────

function DetailsTab({ product, instructors, inp, lbl, card, row2 }: any) {
  const [form,   setForm]   = useState({
    title:           product.title,
    subtitle:        product.subtitle ?? '',
    status:          product.status,
    price:           String(product.price),
    compareAtPrice:  product.compareAtPrice ? String(product.compareAtPrice) : '',
    currency:        product.currency,
    affiliateEnabled:product.affiliateEnabled,
    instructorId:    product.instructorId ?? '',
  })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true); setError(null); setSaved(false)
    const res  = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:           form.title,
        subtitle:        form.subtitle || null,
        status:          form.status,
        price:           parseFloat(form.price) || 0,
        compareAtPrice:  parseFloat(form.compareAtPrice) || null,
        currency:        form.currency,
        affiliateEnabled:form.affiliateEnabled,
        instructorId:    form.instructorId || null,
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
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Pricing</h3>
        <div style={row2}>
          <div>
            <label style={lbl}>Price</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Compare-at <span style={{ fontWeight: 400, color: '#9ca3af' }}>(strike-through)</span></label>
            <input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={e => set('compareAtPrice', e.target.value)} style={inp} placeholder="Leave blank to hide" />
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={lbl}>Currency</label>
          <select value={form.currency} onChange={e => set('currency', e.target.value)} style={{ ...inp, width: '120px' }}>
            {['USD','GBP','EUR','AUD','CAD'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={card}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Instructor</h3>
        <select value={form.instructorId} onChange={e => set('instructorId', e.target.value)} style={inp}>
          <option value="">— Brand / Academy (no individual instructor) —</option>
          {instructors.map((i: any) => <option key={i.id} value={i.id}>{i.displayName}</option>)}
        </select>
      </div>

      <div style={card}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Affiliates</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.affiliateEnabled} onChange={e => set('affiliateEnabled', e.target.checked)}
            style={{ width: '15px', height: '15px', accentColor: '#7B2FBE' }} />
          <span style={{ fontSize: '14px', color: '#374151' }}>Enable affiliate programme for this product</span>
        </label>
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

// ── Checkout Pages Tab ────────────────────────────────────────────────────────

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
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(current),
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
    setPages(remaining)
    setActive(remaining[0]?.id ?? null)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'start' }}>
      {/* Sidebar */}
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
          {pages.map(p => (
            <button key={p.id} onClick={() => setActive(p.id)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid ${active === p.id ? '#7B2FBE' : '#e5e7eb'}`, background: active === p.id ? 'rgba(123,47,190,0.06)' : 'white', color: '#111827', fontSize: '13px', fontWeight: active === p.id ? 700 : 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)' }}>
              {p.label}
              {p.isDefault && <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '6px' }}>default</span>}
            </button>
          ))}
        </div>
        <button onClick={addPage}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'none', border: '1px dashed #d1d5db', borderRadius: '8px', color: '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)', width: '100%' }}>
          <Plus size={13} /> Add variant
        </button>
        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', lineHeight: 1.4 }}>
          Add variants for payment plans, early bird pricing, or separate checkout flows.
        </p>
      </div>

      {/* Editor */}
      {current ? (
        <div>
          <div style={card}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Checkout Page Settings</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>Label <span style={{ fontWeight: 400, color: '#9ca3af' }}>(admin only)</span></label>
              <input value={current.label} onChange={e => updateCurrent('label', e.target.value)} style={inp} placeholder="e.g. One-time, Payment Plan, Early Bird" />
            </div>
            <div style={row2}>
              <div>
                <label style={lbl}>Headline</label>
                <input value={current.headline ?? ''} onChange={e => updateCurrent('headline', e.target.value)} style={inp} placeholder="Complete your enrolment" />
              </div>
              <div>
                <label style={lbl}>Subtext</label>
                <input value={current.subtext ?? ''} onChange={e => updateCurrent('subtext', e.target.value)} style={inp} placeholder="You're one step away…" />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={lbl}>Guarantee text <span style={{ fontWeight: 400, color: '#9ca3af' }}>(shown below button)</span></label>
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
              <div>
                <label style={lbl}>Headline</label>
                <input value={current.thankYouHeadline ?? ''} onChange={e => updateCurrent('thankYouHeadline', e.target.value)} style={inp} placeholder="You're in! Welcome." />
              </div>
              <div>
                <label style={lbl}>Redirect URL <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                <input value={current.thankYouUrl ?? ''} onChange={e => updateCurrent('thankYouUrl', e.target.value)} style={inp} placeholder="Leave blank for default" />
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Order Bump</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }}>
              A one-click add-on shown at checkout. Picks a published product to offer.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>Bump Product</label>
              <select value={current.orderBumpProductId ?? ''} onChange={e => updateCurrent('orderBumpProductId', e.target.value || null)} style={inp}>
                <option value="">— No order bump —</option>
                {allProducts.map((p: SimpleProduct) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.currency} {Number(p.price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            {current.orderBumpProductId && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={lbl}>Bump Headline</label>
                  <input value={current.orderBumpHeadline ?? ''} onChange={e => updateCurrent('orderBumpHeadline', e.target.value)} style={inp} placeholder="Add this to your order — one time offer" />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={lbl}>Bump Description</label>
                  <textarea value={current.orderBumpDescription ?? ''} onChange={e => updateCurrent('orderBumpDescription', e.target.value)} rows={3}
                    style={{ ...inp, resize: 'vertical' }} placeholder="A short reason why they should add this…" />
                </div>
                <div>
                  <label style={lbl}>Override Price <span style={{ fontWeight: 400, color: '#9ca3af' }}>(leave blank to use product price)</span></label>
                  <input type="number" min="0" step="0.01" value={current.orderBumpPrice ?? ''} onChange={e => updateCurrent('orderBumpPrice', e.target.value ? parseFloat(e.target.value) : null)} style={{ ...inp, width: '160px' }} placeholder="e.g. 27" />
                </div>
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
  const [confirm, setConfirm] = useState('')
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
          This deletes the product, its sales page, and all checkout page variants. It does <strong>not</strong> delete the underlying course content or existing student enrolments.
        </p>
        <p style={{ fontSize: '13px', color: '#991b1b', margin: '0 0 10px', fontWeight: 600 }}>
          Type the product title to confirm:
        </p>
        <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={product.title}
          style={{ width: '100%', background: 'white', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#111827', marginBottom: '14px', boxSizing: 'border-box', fontFamily: 'var(--font-ui)' }} />
        <button onClick={doDelete} disabled={confirm !== product.title || deleting}
          style={{ padding: '10px 20px', background: confirm === product.title && !deleting ? '#ef4444' : '#fca5a5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: confirm === product.title && !deleting ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-ui)' }}>
          {deleting ? 'Deleting…' : 'Delete Product'}
        </button>
      </div>
    </div>
  )
}

// ── Shared ────────────────────────────────────────────────────────────────────

function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${type === 'error' ? '#fca5a5' : '#86efac'}`, borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
      <AlertCircle size={15} color={type === 'error' ? '#ef4444' : '#16a34a'} />
      <p style={{ fontSize: '13px', color: type === 'error' ? '#991b1b' : '#166534', margin: 0 }}>{message}</p>
    </div>
  )
}
