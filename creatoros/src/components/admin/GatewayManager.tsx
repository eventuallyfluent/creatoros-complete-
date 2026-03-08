'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp, Copy, Check, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'

interface Gateway {
  id:            string
  name:          string
  provider:      string
  isActive:      boolean
  isDefault:     boolean
  webhookSecret: string | null
  config:        Record<string, string>
}

// Providers with native SDK drivers built and registered
const LIVE_PROVIDERS = ['manual', 'webhook_only']

// Setup guide for known providers — shown as helper when admin types/selects them
const PROVIDER_GUIDES: Record<string, {
  label:       string
  status:      'live' | 'config_only'   // live = driver wired; config_only = store creds, webhook receives
  checkoutNote: string
  setupUrl:    string
  fields:      { key: string; label: string; placeholder: string; secret?: boolean; help?: string }[]
}> = {
  manual: {
    label: 'Manual / Bank Transfer',
    status: 'live',
    checkoutNote: 'Student sees "pending" page. You mark the order paid manually in Orders.',
    setupUrl: '',
    fields: [],
  },
  webhook_only: {
    label: 'Webhook / Custom Integration',
    status: 'live',
    checkoutNote: 'Use the webhook URL below in any payment platform that sends HTTP callbacks (Payhip, Gumroad, ThriveCart, etc.).',
    setupUrl: '',
    fields: [
      { key: 'webhookSecret', label: 'Webhook Secret (optional)', placeholder: 'your-secret-key', secret: true, help: 'Set a shared secret in your payment platform and paste it here. We verify every incoming webhook.' },
    ],
  },
  stripe: {
    label: 'Stripe',
    status: 'config_only',
    checkoutNote: 'Customer clicks Pay → redirected to Stripe Checkout → returns to your site. Webhook fires → student enrolled instantly.',
    setupUrl: 'https://dashboard.stripe.com/apikeys',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_…', help: 'From Stripe Dashboard → Developers → API Keys' },
      { key: 'secretKey',      label: 'Secret Key',      placeholder: 'sk_live_…', secret: true, help: 'Never share this. Server-side only.' },
      { key: 'webhookSecret',  label: 'Webhook Signing Secret', placeholder: 'whsec_…', secret: true, help: 'From Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret' },
    ],
  },
  paypal: {
    label: 'PayPal',
    status: 'config_only',
    checkoutNote: 'Customer clicks Pay → PayPal popup/redirect → returns to your site. Webhook fires → student enrolled.',
    setupUrl: 'https://developer.paypal.com/dashboard/applications/live',
    fields: [
      { key: 'clientId',     label: 'Client ID',     placeholder: 'AX…', help: 'From PayPal Developer Dashboard → My Apps → your app' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'EH…', secret: true },
    ],
  },
  nowpayments: {
    label: 'NOWPayments (Crypto)',
    status: 'config_only',
    checkoutNote: 'Customer selects crypto, pays on-chain. Webhook confirms → student enrolled.',
    setupUrl: 'https://nowpayments.io/',
    fields: [
      { key: 'apiKey',       label: 'API Key',       placeholder: 'xxxx-xxxx-xxxx', help: 'From NOWPayments → Store settings → API key' },
      { key: 'ipnSecretKey', label: 'IPN Secret Key', placeholder: 'your-ipn-secret', secret: true },
    ],
  },
  razorpay: {
    label: 'Razorpay',
    status: 'config_only',
    checkoutNote: 'Customer pays via Razorpay checkout. Webhook confirms → student enrolled.',
    setupUrl: 'https://dashboard.razorpay.com/app/keys',
    fields: [
      { key: 'keyId',     label: 'Key ID',     placeholder: 'rzp_live_…' },
      { key: 'keySecret', label: 'Key Secret', placeholder: 'your-secret', secret: true },
    ],
  },
  paymongo: {
    label: 'PayMongo (Philippines)',
    status: 'config_only',
    checkoutNote: 'Supports GCash, Maya, cards. Customer completes payment on PayMongo-hosted page.',
    setupUrl: 'https://dashboard.paymongo.com',
    fields: [
      { key: 'publicKey',  label: 'Public Key',  placeholder: 'pk_live_…' },
      { key: 'secretKey',  label: 'Secret Key',  placeholder: 'sk_live_…', secret: true },
      { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsk_…', secret: true },
    ],
  },
  ecpay: {
    label: 'ECPay (Taiwan)',
    status: 'config_only',
    checkoutNote: 'Customer redirected to ECPay. Supports ATM, credit card, convenience store.',
    setupUrl: 'https://vendor.ecpay.com.tw',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', placeholder: '2000132' },
      { key: 'hashKey',    label: 'Hash Key',    placeholder: '…', secret: true },
      { key: 'hashIV',     label: 'Hash IV',     placeholder: '…', secret: true },
    ],
  },
  mercadopago: {
    label: 'Mercado Pago (LATAM)',
    status: 'config_only',
    checkoutNote: 'Customer redirected to Mercado Pago checkout. Covers Brazil, Argentina, Mexico and more.',
    setupUrl: 'https://www.mercadopago.com/developers/panel',
    fields: [
      { key: 'accessToken', label: 'Access Token', placeholder: 'APP_USR-…', secret: true },
    ],
  },
}

const KNOWN_PROVIDERS = Object.keys(PROVIDER_GUIDES)

export default function GatewayManager({ gateways: initial }: { gateways: Gateway[] }) {
  const router   = useRouter()
  const [gateways, setGateways] = useState<Gateway[]>(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving,   setSaving]   = useState<string | null>(null)
  const [adding,   setAdding]   = useState(false)
  const [newProvider, setNewProvider] = useState('')
  const [newName,     setNewName]     = useState('')
  const [copied,      setCopied]      = useState<string | null>(null)

  const webhookBase = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/` : '/api/webhooks/'

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSave = async (gateway: Gateway) => {
    setSaving(gateway.id)
    await fetch(`/api/gateways/${gateway.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(gateway),
    })
    setSaving(null)
    router.refresh()
  }

  const handleAdd = async () => {
    const providerKey = newProvider.trim().toLowerCase().replace(/\s+/g, '_')
    if (!providerKey) return
    const guide = PROVIDER_GUIDES[providerKey]
    const name  = newName.trim() || guide?.label || providerKey

    const res  = await fetch('/api/gateways', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ provider: providerKey, name }),
    })
    const data = await res.json()
    if (res.ok) {
      setGateways(g => [...g, { ...data, config: data.config ?? {} }])
      setAdding(false)
      setNewProvider('')
      setNewName('')
      setExpanded(data.id)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment gateway?')) return
    await fetch(`/api/gateways/${id}`, { method: 'DELETE' })
    setGateways(g => g.filter(gw => gw.id !== id))
  }

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/gateways/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isDefault: true }),
    })
    setGateways(g => g.map(gw => ({ ...gw, isDefault: gw.id === id })))
  }

  const suggestedProvider = newProvider.trim().toLowerCase().replace(/\s+/g, '_')
  const suggestedGuide    = PROVIDER_GUIDES[suggestedProvider]

  return (
    <div style={{ maxWidth: '760px' }}>

      {/* How it works */}
      <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#4c1d95', margin: '0 0 6px' }}>How checkout works</p>
        <p style={{ fontSize: '13px', color: '#5b21b6', margin: 0, lineHeight: 1.7 }}>
          Your branded checkout page stays on <strong>your site</strong>. When a customer clicks Pay, they're sent to the payment provider (Stripe, PayPal, etc.), complete payment, then return here.
          The payment gateway sends a webhook to your unique URL below → CreatorOS instantly enrols the student. No manual work.
        </p>
      </div>

      {/* Gateway list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {gateways.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px', border: '2px dashed #e5e7eb', borderRadius: '12px' }}>
            No payment gateways yet. Add one below to start accepting payments.
          </div>
        )}
        {gateways.map(gateway => {
          const guide  = PROVIDER_GUIDES[gateway.provider]
          const isLive = LIVE_PROVIDERS.includes(gateway.provider)
          const isOpen = expanded === gateway.id

          return (
            <div key={gateway.id} style={{ background: 'white', border: gateway.isDefault ? '2px solid #7B2FBE' : '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>

              {/* Header */}
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{gateway.name}</span>
                    {gateway.isDefault && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#7B2FBE', background: 'rgba(123,47,190,0.1)', padding: '2px 8px', borderRadius: '999px' }}>DEFAULT</span>
                    )}
                    <span style={{ fontSize: '11px', color: gateway.isActive ? '#10b981' : '#6b7280', background: gateway.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                      {gateway.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    {/* Driver status */}
                    {isLive
                      ? <span style={{ fontSize: '11px', color: '#065f46', background: '#d1fae5', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle size={10} /> DRIVER READY
                        </span>
                      : <span style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <AlertCircle size={10} /> NEEDS DRIVER
                        </span>
                    }
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', fontFamily: 'monospace' }}>{gateway.provider}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  {!gateway.isDefault && (
                    <button onClick={() => handleSetDefault(gateway.id)}
                      style={{ fontSize: '12px', color: '#7B2FBE', background: 'none', border: '1px solid rgba(123,47,190,0.3)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                      Set Default
                    </button>
                  )}
                  <button onClick={() => handleDelete(gateway.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: '1px solid #fecaca', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#ef4444' }}>
                    <Trash2 size={13} />
                  </button>
                  <button onClick={() => setExpanded(isOpen ? null : gateway.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }}>
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Expanded config */}
              {isOpen && (
                <div style={{ borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>

                  {/* Checkout behaviour note */}
                  {guide && (
                    <div style={{ padding: '12px 18px', background: '#f0fdf4', borderBottom: '1px solid #d1fae5', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>💳</span>
                      <div>
                        <p style={{ fontSize: '13px', color: '#166534', margin: '0 0 4px', fontWeight: 600 }}>What happens at checkout</p>
                        <p style={{ fontSize: '13px', color: '#166534', margin: 0, lineHeight: 1.6 }}>{guide.checkoutNote}</p>
                        {guide.setupUrl && (
                          <a href={guide.setupUrl} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '6px', textDecoration: 'none' }}>
                            Open {guide.label} Dashboard <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Driver status warning */}
                  {!isLive && (
                    <div style={{ padding: '12px 18px', background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                      <p style={{ fontSize: '13px', color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                        <strong>⚠ Driver not yet wired:</strong> Credentials are saved and the webhook URL is ready.
                        To activate live payments, a developer needs to create <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>src/lib/payments/drivers/{gateway.provider}.ts</code> and register it in <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>gateway-registry.ts</code>.
                        Until then, <strong>Manual</strong> or <strong>Webhook Only</strong> gateways work today with no code needed.
                      </p>
                    </div>
                  )}

                  <div style={{ padding: '18px' }}>
                    {/* Webhook URL */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={labelStyle}>
                        Your Webhook URL — paste this into your payment provider dashboard
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input readOnly value={webhookBase + gateway.id}
                          style={{ flex: 1, padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', background: 'white', fontFamily: 'monospace', outline: 'none' }} />
                        <button onClick={() => copyToClipboard(webhookBase + gateway.id, gateway.id + '_url')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'var(--font-ui)', flexShrink: 0 }}>
                          {copied === gateway.id + '_url' ? <><Check size={13} style={{ color: '#10b981' }} /> Copied</> : <><Copy size={13} /> Copy</>}
                        </button>
                      </div>
                    </div>

                    {/* Active toggle */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={gateway.isActive}
                          onChange={e => setGateways(g => g.map(gw => gw.id === gateway.id ? { ...gw, isActive: e.target.checked } : gw))}
                          style={{ width: '16px', height: '16px' }} />
                        <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Active (shown as a payment option at checkout)</span>
                      </label>
                    </div>

                    {/* Config fields — from guide if known, otherwise free-form key/value */}
                    {guide?.fields.map(field => (
                      <div key={field.key} style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>{field.label}</label>
                        {field.help && <p style={{ fontSize: '12px', color: '#6b7280', margin: '-4px 0 6px', lineHeight: 1.5 }}>{field.help}</p>}
                        <input
                          type={field.secret ? 'password' : 'text'}
                          value={gateway.config[field.key] ?? ''}
                          onChange={e => setGateways(g => g.map(gw => gw.id === gateway.id ? { ...gw, config: { ...gw.config, [field.key]: e.target.value } } : gw))}
                          placeholder={field.placeholder}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: field.secret ? 'monospace' : 'var(--font-ui)', background: 'white' }} />
                      </div>
                    ))}

                    {/* Unknown provider — free-form config fields */}
                    {!guide && (
                      <div style={{ marginBottom: '16px', padding: '14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 8px', fontWeight: 600 }}>Custom provider — add your API credentials</p>
                        {Object.entries(gateway.config).map(([key, val]) => (
                          <div key={key} style={{ marginBottom: '10px' }}>
                            <label style={{ ...labelStyle, marginBottom: '4px' }}>{key}</label>
                            <input value={val}
                              onChange={e => setGateways(g => g.map(gw => gw.id === gateway.id ? { ...gw, config: { ...gw.config, [key]: e.target.value } } : gw))}
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)', background: 'white' }} />
                          </div>
                        ))}
                        <AddConfigField onAdd={(key) => setGateways(g => g.map(gw => gw.id === gateway.id ? { ...gw, config: { ...gw.config, [key]: '' } } : gw))} />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button onClick={() => handleSave(gateway)} disabled={saving === gateway.id}
                        style={{ padding: '9px 22px', background: '#7B2FBE', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                        {saving === gateway.id ? 'Saving…' : 'Save Gateway'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add gateway */}
      {adding ? (
        <div style={{ background: 'white', border: '2px dashed #7B2FBE', borderRadius: '12px', padding: '22px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>Add Payment Gateway</h3>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 18px', lineHeight: 1.5 }}>
            Enter any provider name — Stripe, PayPal, Razorpay, ECPay, your bank, anything.
            Credentials are saved securely. Each gateway gets its own webhook URL.
          </p>

          {/* Quick-select buttons for common providers */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Quick select a known provider</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {KNOWN_PROVIDERS.map(p => (
                <button key={p} type="button"
                  onClick={() => { setNewProvider(p); setNewName(PROVIDER_GUIDES[p].label) }}
                  style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 600, border: `1px solid ${newProvider === p ? '#7B2FBE' : '#e5e7eb'}`, borderRadius: '999px', background: newProvider === p ? 'rgba(123,47,190,0.08)' : 'white', color: newProvider === p ? '#7B2FBE' : '#374151', cursor: 'pointer', fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {LIVE_PROVIDERS.includes(p) && <span style={{ color: '#10b981', fontSize: '10px' }}>●</span>}
                  {PROVIDER_GUIDES[p].label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: '#10b981', margin: '6px 0 0' }}>● = driver ready (works today, no code needed)</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Provider ID <span style={{ fontWeight: 400 }}>(internal key, lowercase)</span></label>
              <input value={newProvider}
                onChange={e => {
                  const val = e.target.value
                  setNewProvider(val)
                  const guide = PROVIDER_GUIDES[val.trim().toLowerCase().replace(/\s+/g, '_')]
                  if (guide) setNewName(guide.label)
                }}
                placeholder="e.g. stripe, paypal, my_bank"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)' }} />
            </div>
            <div>
              <label style={labelStyle}>Display Name <span style={{ fontWeight: 400 }}>(shown to customers)</span></label>
              <input value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={suggestedGuide?.label ?? 'e.g. Pay by Card'}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)' }} />
            </div>
          </div>

          {/* Live preview of guide for selected provider */}
          {suggestedGuide && (
            <div style={{ marginBottom: '16px', padding: '14px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#065f46', margin: '0 0 4px' }}>
                {LIVE_PROVIDERS.includes(suggestedProvider) ? '✅ Driver ready' : '⚙️ Credentials stored — driver needed to go live'}
              </p>
              <p style={{ fontSize: '13px', color: '#166534', margin: 0, lineHeight: 1.5 }}>{suggestedGuide.checkoutNote}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleAdd} disabled={!newProvider.trim()}
              style={{ padding: '9px 22px', background: newProvider.trim() ? '#7B2FBE' : '#e5e7eb', color: newProvider.trim() ? 'white' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: newProvider.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-ui)' }}>
              Add Gateway
            </button>
            <button onClick={() => { setAdding(false); setNewProvider(''); setNewName('') }}
              style={{ padding: '9px 18px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', background: 'white', border: '2px dashed #e5e7eb', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: '#7B2FBE', cursor: 'pointer', fontFamily: 'var(--font-ui)', width: '100%', justifyContent: 'center', transition: 'border-color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#7B2FBE')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
        >
          <Plus size={16} /> Add Payment Gateway
        </button>
      )}
    </div>
  )
}

function AddConfigField({ onAdd }: { onAdd: (key: string) => void }) {
  const [key, setKey] = useState('')
  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
      <input value={key} onChange={e => setKey(e.target.value)} placeholder="Add field key (e.g. apiKey)"
        style={{ flex: 1, padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'var(--font-ui)' }} />
      <button type="button" onClick={() => { if (key.trim()) { onAdd(key.trim()); setKey('') } }}
        style={{ padding: '7px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'var(--font-ui)' }}>
        + Add
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
}
