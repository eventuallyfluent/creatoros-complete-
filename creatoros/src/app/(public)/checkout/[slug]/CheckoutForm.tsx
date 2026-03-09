'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Gateway {
  id: string; name: string; provider: string; isDefault: boolean
}
interface BumpProduct {
  id: string; title: string; price: number; currency: string; thumbnailUrl: string | null
}
interface CheckoutPageData {
  showCouponField:      boolean
  thankYouUrl:          string | null
  orderBumpProductId:   string | null
  orderBumpHeadline:    string | null
  orderBumpDescription: string | null
}

interface Props {
  product: {
    id: string; slug: string; title: string; price: number; currency: string
  }
  checkoutPage: CheckoutPageData | null
  bumpProduct:  BumpProduct | null
  gateways:     Gateway[]
  userEmail:    string
  userName:     string
  userId:       string | null
  isPreview?:   boolean
}

const GATEWAY_ICONS: Record<string, string> = {
  stripe: '💳', paypal: '🅿', manual: '🏦', webhook_only: '🔗', nowpayments: '₿',
}

export default function CheckoutForm({ product, checkoutPage, bumpProduct, gateways, userEmail, userName, userId, isPreview }: Props) {
  const router = useRouter()

  const [email,         setEmail]         = useState(userEmail)
  const [name,          setName]          = useState(userName)
  const [couponCode,    setCouponCode]     = useState('')
  const [couponMsg,     setCouponMsg]      = useState<{ type: 'success' | 'error'; text: string; discount?: number } | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [gatewayId,     setGatewayId]     = useState(gateways.find(g => g.isDefault)?.id ?? gateways[0]?.id ?? '')
  const [addBump,       setAddBump]       = useState(false)
  const [gdpr,          setGdpr]          = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  const showCoupon = checkoutPage?.showCouponField !== false

  const couponDiscount = couponMsg?.type === 'success' && couponMsg.discount !== undefined ? couponMsg.discount : 0
  const bumpTotal      = addBump && bumpProduct ? bumpProduct.price : 0
  const effectiveTotal = Math.max(0, product.price - couponDiscount) + bumpTotal

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    const res  = await fetch('/api/coupons/validate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, productId: product.id }),
    })
    const data = await res.json()
    if (data.valid) {
      setAppliedCoupon(couponCode)
      setCouponMsg({ type: 'success', text: `${data.label} applied!`, discount: data.discountAmount })
    } else {
      setCouponMsg({ type: 'error', text: data.error ?? 'Invalid coupon code.' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email)     { setError('Email is required'); return }
    if (!gatewayId) { setError('Please select a payment method'); return }
    setLoading(true); setError(null)

    const productIds = [product.id]
    if (addBump && bumpProduct) productIds.push(bumpProduct.id)

    const res  = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, name, productIds,
        couponCode:  appliedCoupon ?? undefined,
        gatewayId,
        gdprConsent: gdpr,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    const thankYou = checkoutPage?.thankYouUrl
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl
    } else if (thankYou) {
      window.location.href = thankYou
    } else {
      router.push(`/checkout/${product.slug}/pending?orderId=${data.orderId}`)
    }
  }

  return (
    <form onSubmit={handleSubmit}>

      {/* Your Details */}
      <div style={{ padding: 'var(--s6)', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--s5)' }}>Your Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s4)', marginBottom: 'var(--s4)' }}>
          <Field label="First Name">
            <input type="text" value={name.split(' ')[0] ?? ''} onChange={e => setName(e.target.value + ' ' + (name.split(' ')[1] ?? ''))} placeholder="John" style={inputStyle} />
          </Field>
          <Field label="Last Name">
            <input type="text" value={name.split(' ').slice(1).join(' ')} onChange={e => setName((name.split(' ')[0] ?? '') + ' ' + e.target.value)} placeholder="Smith" style={inputStyle} />
          </Field>
        </div>
        <Field label="Email Address">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
        </Field>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Your access link will be sent to this email after payment.</p>
      </div>

      {/* Order Bump */}
      {bumpProduct && (
        <div style={{ padding: 'var(--s5) var(--s6)', borderBottom: '1px solid var(--border)', background: addBump ? 'rgba(123,47,190,0.04)' : 'transparent', transition: 'background 0.2s' }}>
          <label style={{ display: 'flex', gap: '14px', cursor: 'pointer', alignItems: 'flex-start' }}>
            <div style={{ marginTop: '2px', flexShrink: 0 }}>
              <div onClick={() => setAddBump(!addBump)} style={{
                width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${addBump ? 'var(--brand)' : 'var(--border)'}`,
                background: addBump ? 'var(--brand)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {addBump && <span style={{ color: 'white', fontSize: '12px', fontWeight: 700, lineHeight: 1 }}>✓</span>}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>
                {checkoutPage?.orderBumpHeadline ?? 'Add to your order — one time offer'}
              </p>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>{bumpProduct.title}</p>
              {checkoutPage?.orderBumpDescription && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 6px', lineHeight: 1.5 }}>{checkoutPage.orderBumpDescription}</p>
              )}
              <p style={{ fontSize: '14px', fontWeight: 700, color: addBump ? 'var(--success)' : 'var(--text-muted)', margin: 0 }}>
                + {bumpProduct.currency} {bumpProduct.price.toFixed(2)}
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Coupon */}
      {showCoupon && (
        <div style={{ padding: 'var(--s5) var(--s6)', borderBottom: '1px solid var(--border)' }}>
          <label style={labelStyle}>Coupon Code</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" value={couponCode}
              onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponMsg(null); setAppliedCoupon(null) }}
              placeholder="ARCANE20"
              style={{ ...inputStyle, flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            <button type="button" onClick={handleApplyCoupon} disabled={!couponCode.trim()}
              style={{ padding: '11px 18px', borderRadius: 'var(--r-md)', border: '2px solid var(--brand)', background: 'transparent', color: 'var(--brand)', fontSize: '14px', fontWeight: 600, cursor: couponCode ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-ui)', opacity: couponCode ? 1 : 0.5, transition: 'all 0.15s', flexShrink: 0 }}>
              Apply
            </button>
          </div>
          {couponMsg && (
            <p style={{ fontSize: '13px', color: couponMsg.type === 'success' ? 'var(--success)' : 'var(--danger)', marginTop: '8px', fontWeight: 500 }}>
              {couponMsg.type === 'success' ? '✓ ' : '✗ '}{couponMsg.text}
              {couponMsg.discount && ` — ${product.currency} ${couponMsg.discount.toFixed(2)} off`}
            </p>
          )}
        </div>
      )}

      {/* Payment method */}
      <div style={{ padding: 'var(--s5) var(--s6)', borderBottom: '1px solid var(--border)' }}>
        <label style={labelStyle}>Payment Method</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {gateways.map(gateway => (
            <button key={gateway.id} type="button" onClick={() => setGatewayId(gateway.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: 'var(--s4)', borderRadius: 'var(--r-md)', border: gatewayId === gateway.id ? '2px solid var(--brand)' : '2px solid var(--border)', background: gatewayId === gateway.id ? 'rgba(123,47,190,0.08)' : 'var(--bg-elevated)', cursor: 'pointer', fontFamily: 'var(--font-ui)', transition: 'all 0.15s', textAlign: 'left' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, border: gatewayId === gateway.id ? '2px solid var(--brand)' : '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: gatewayId === gateway.id ? 'var(--brand)' : 'transparent' }}>
                {gatewayId === gateway.id && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'white' }} />}
              </div>
              <span style={{ fontSize: '16px' }}>{GATEWAY_ICONS[gateway.provider] ?? '💳'}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{gateway.name}</span>
              {gateway.isDefault && <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 8px', borderRadius: 'var(--r-pill)', fontWeight: 700 }}>Default</span>}
            </button>
          ))}
        </div>
      </div>

      {/* GDPR + Submit */}
      <div style={{ padding: 'var(--s5) var(--s6)' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: 'var(--s5)' }}>
          <input type="checkbox" checked={gdpr} onChange={e => setGdpr(e.target.checked)} style={{ marginTop: '3px', flexShrink: 0, width: '16px', height: '16px' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Add me to the Perseus Arcane Academy email list for course updates and arcane knowledge. Unsubscribe any time.{' '}
            <a href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</a>.
          </span>
        </label>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: '14px', color: 'var(--danger)', marginBottom: 'var(--s4)' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || !email || isPreview}
          style={{ width: '100%', background: isPreview ? 'var(--bg-elevated)' : loading ? 'var(--bg-elevated)' : 'var(--brand)', color: isPreview ? 'var(--text-muted)' : loading ? 'var(--text-muted)' : 'white', border: isPreview ? '2px dashed var(--border)' : 'none', borderRadius: 'var(--r-md)', padding: '15px', fontSize: '16px', fontWeight: 700, cursor: isPreview ? 'not-allowed' : loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', transition: 'all 0.15s', marginBottom: '12px' }}>
          {isPreview ? `Preview only — Pay ${product.currency} ${effectiveTotal.toFixed(2)}` : loading ? 'Processing…' : `Pay ${product.currency} ${effectiveTotal.toFixed(2)} — Get Instant Access`}
        </button>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
          🔒 Secure payment · {checkoutPage?.guaranteeText ?? '30-day money-back guarantee'}
        </p>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--s4)' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px',
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)', padding: '11px 16px', fontSize: '15px', color: 'var(--text-primary)',
  outline: 'none', fontFamily: 'var(--font-ui)', transition: 'border-color 0.15s',
}
