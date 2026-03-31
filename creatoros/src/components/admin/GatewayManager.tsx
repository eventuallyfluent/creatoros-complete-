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

// Providers with a fully wired driver (live payments work today)
const DRIVER_PROVIDERS = ['manual', 'stripe']
// Providers that receive webhooks but need a driver built for outbound API calls
const WEBHOOK_PROVIDERS = ['webhook_only', 'paypal', 'razorpay', 'nowpayments', 'paymongo', 'ecpay', 'mercadopago']

const PROVIDER_GUIDES: Record<string, {
  label:        string
  mode:         'bank_transfer' | 'webhook' | 'webhook_external' | 'api_driver'
  checkoutNote: string
  setupUrl:     string
  webhookPath:  string   // where in the provider dashboard to paste the webhook URL
  fields:       { key: string; label: string; placeholder: string; secret?: boolean; help?: string }[]
  webhookSteps?: string[]
}> = {
  manual: {
    label: 'Bank Transfer',
    mode: 'bank_transfer',
    checkoutNote: 'Student clicks Pay → sees your bank details + a unique reference → transfers the money → you mark the order paid in Orders → they get course access.',
    setupUrl: '',
    webhookPath: '',
    fields: [
      { key: 'bankName',      label: 'Bank Name',           placeholder: 'e.g. Barclays, HSBC, ANZ' },
      { key: 'accountName',   label: 'Account Name',        placeholder: 'Perseus Arcane Academy Ltd' },
      { key: 'accountNumber', label: 'Account Number',      placeholder: '12345678' },
      { key: 'sortCode',      label: 'Sort Code (UK)',       placeholder: '12-34-56' },
      { key: 'iban',          label: 'IBAN (international)', placeholder: 'GB29 NWBK 6016 1331 9268 19' },
      { key: 'bic',           label: 'BIC / SWIFT',         placeholder: 'NWBKGB2L' },
      { key: 'instructions',  label: 'Extra instructions (optional)', placeholder: 'e.g. Please allow 1–2 business days for confirmation' },
    ],
  },
  generic_api: {
    label: 'Any API Gateway (Generic)',
    mode: 'api_driver',
    checkoutNote: 'Works with any payment provider that has a REST API. Fill in their API URL, your auth credentials, and tell us which field in their response contains the redirect URL. We handle the rest.',
    setupUrl: '',
    webhookPath: 'your payment provider dashboard → Webhooks or IPN settings',
    fields: [
      { key: 'checkoutApiUrl',      label: 'Checkout API URL',         placeholder: 'https://api.myprovider.com/v1/checkout',    help: 'The endpoint we POST to when a student clicks Pay.' },
      { key: 'authHeaderName',      label: 'Auth Header Name',         placeholder: 'Authorization  or  X-Api-Key',              help: 'The HTTP header name your provider uses for authentication.' },
      { key: 'authHeaderValue',     label: 'Auth Header Value',        placeholder: 'Bearer sk_live_xxx  or  sk_live_xxx',       help: 'The full header value including Bearer prefix if required.', secret: true },
      { key: 'checkoutUrlField',    label: 'Redirect URL Field',       placeholder: 'checkout_url  or  data.url',               help: 'The field in their API response that contains the URL to redirect the student to. Use dot notation for nested fields.' },
      { key: 'webhookOrderIdField', label: 'Webhook Order ID Field',   placeholder: 'metadata.orderId  or  reference',          help: 'The field in their webhook payload that contains our order ID. We send this as "reference", "order_id", and inside "metadata.orderId".' },
      { key: 'webhookSigHeader',    label: 'Webhook Signature Header', placeholder: 'x-signature  or  x-webhook-secret',        help: 'The header they send with each webhook for verification. Leave blank to skip signature checking.' },
      { key: 'webhookSecret',       label: 'Webhook Secret',           placeholder: 'your-secret-key',                          help: 'The secret used to verify webhook signatures.', secret: true },
      { key: 'webhookSigAlgorithm', label: 'Signature Algorithm',      placeholder: 'hmac-sha256  (default)',                   help: 'hmac-sha256 (default), hmac-sha1, or none.' },
      { key: 'webhookSigEncoding',  label: 'Signature Encoding',       placeholder: 'hex  (default)',                           help: 'hex (default) or base64.' },
      { key: 'extraCheckoutFields', label: 'Extra Fields (optional)',   placeholder: '{"locale":"en","payment_type":"card"}',    help: 'Any extra fields their checkout API requires. JSON format.' },
    ],
    webhookSteps: [
      'Get the checkout API endpoint URL from your provider docs (usually POST /v1/checkout or similar)',
      'Find the authentication method — most use Authorization: Bearer sk_xxx or X-Api-Key: xxx',
      'Check what field in their response contains the redirect URL (e.g. checkout_url, url, redirect)',
      'Fill in all fields above and save',
      "Copy the Webhook URL below and paste it into your provider's dashboard",
      'Find what field in their webhook contains the order reference — we send it as "reference", "order_id", and "metadata.orderId"',
      'If they sign webhooks, find the signature header name and secret and fill those in too',
    ],
  },
  webhook_only: {
    label: 'Webhook / Custom',
    mode: 'webhook',
    checkoutNote: 'Use with any platform that sends payment webhooks — Payhip, Gumroad, ThriveCart, etc.',
    setupUrl: '',
    webhookPath: 'your payment platform → settings → webhooks',
    fields: [
      { key: 'webhookSecret', label: 'Webhook Secret (optional)', placeholder: 'your-secret-key', secret: true, help: 'Set a shared secret in your payment platform and paste it here. We verify every incoming webhook.' },
    ],
  },
  creem: {
    label: 'Creem (Merchant of Record)',
    mode: 'api_driver',
    checkoutNote: "Customer clicks Pay → redirected to Creem's hosted checkout → pays with card, PayPal, Apple Pay, or local methods → Creem handles all global tax compliance → webhook fires → student enrolled. Creem is a Merchant of Record: they collect VAT/GST in 190+ countries so you never touch a tax form. Fee: 3.9% + 30¢, no monthly cost.",
    setupUrl: 'https://creem.io/dashboard/developers',
    webhookPath: 'Creem Dashboard → Developers → Webhooks → Add Webhook',
    fields: [
      { key: 'apiKey',        label: 'API Key',        placeholder: 'creem_live_…', help: 'Creem Dashboard → Developers → API Keys' },
      { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'creem_whs_…', secret: true, help: 'Generated when you create the webhook endpoint below.' },
      { key: 'testMode',      label: 'Test Mode',      placeholder: 'true or false', help: 'Set to "true" to use Creem sandbox for testing.' },
    ],
    webhookSteps: [
      'Sign up at creem.io — no monthly fee, takes 2 minutes',
      'Create a product in Creem Dashboard matching each of your courses (note the prod_xxx ID)',
      'Go to Creem Dashboard → Developers → API Keys — copy your live API key',
      'Paste it above, save, then copy the Webhook URL below',
      'Go to Creem Dashboard → Developers → Webhooks → Add Webhook',
      'Paste the Webhook URL, select event: checkout.completed',
      'Copy the Webhook Secret shown and paste it above',
      'Done — Creem handles all payments, tax, and compliance automatically',
    ],
  },
  stripe: {
    label: 'Stripe',
    mode: 'api_driver',
    checkoutNote: "Fully wired and ready to go live. Student clicks Pay → CreatorOS calls Stripe API to create a checkout session → student is redirected to Stripe's hosted payment page → pays with card, Apple Pay, Google Pay → Stripe fires a webhook back → student enrolled automatically. You never handle card data.",
    setupUrl: 'https://dashboard.stripe.com/apikeys',
    webhookPath: 'Stripe Dashboard → Developers → Webhooks → Add endpoint',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_…', help: 'Stripe Dashboard → Developers → API Keys' },
      { key: 'secretKey',      label: 'Secret Key',      placeholder: 'sk_live_…', secret: true, help: 'Used server-side to call the Stripe API. Never exposed to students.' },
      { key: 'webhookSecret',  label: 'Webhook Signing Secret', placeholder: 'whsec_…', secret: true, help: 'Generated in step 4. Verifies webhook payloads are genuinely from Stripe.' },
    ],
    webhookSteps: [
      'Go to Stripe Dashboard → Developers → API Keys — copy the Secret Key (sk_live_…)',
      'Paste Secret Key and Publishable Key above and click Save',
      'Go to Stripe Dashboard → Developers → Webhooks → Add endpoint',
      'Paste the Webhook URL below as the endpoint URL',
      'Under "Select events", add: checkout.session.completed and charge.refunded',
      'Save the endpoint — Stripe shows a Signing Secret (whsec_…) — copy and paste it above',
      'Save again. Stripe is now fully live — no further code needed.',
    ],
  },
  paypal: {
    label: 'PayPal',
    mode: 'webhook_external',
    checkoutNote: 'Customer clicks Pay → PayPal payment page → returns to your site. PayPal fires a webhook → student enrolled.',
    setupUrl: 'https://developer.paypal.com/dashboard/applications/live',
    webhookPath: 'PayPal Developer Dashboard → My Apps → your app → Webhooks',
    fields: [
      { key: 'clientId',     label: 'Client ID',     placeholder: 'AX…', help: 'PayPal Developer Dashboard → My Apps → your app → Credentials' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'EH…', secret: true },
    ],
    webhookSteps: [
      'Go to developer.paypal.com → My Apps & Credentials → Create App (Live mode)',
      'Copy Client ID and Client Secret and paste above',
      'In the same app, go to Webhooks → Add Webhook',
      'Paste the Webhook URL below',
      'Tick: PAYMENT.CAPTURE.COMPLETED',
      'Save and you\'re done',
    ],
  },
  razorpay: {
    label: 'Razorpay',
    mode: 'webhook_external',
    checkoutNote: 'Customer pays via Razorpay checkout. Webhook confirms payment → student enrolled.',
    setupUrl: 'https://dashboard.razorpay.com/app/keys',
    webhookPath: 'Razorpay Dashboard → Settings → Webhooks → Add New Webhook',
    fields: [
      { key: 'keyId',     label: 'Key ID',     placeholder: 'rzp_live_…', help: 'Razorpay Dashboard → Settings → API Keys' },
      { key: 'keySecret', label: 'Key Secret', placeholder: 'your-secret', secret: true },
    ],
    webhookSteps: [
      'Go to Razorpay Dashboard → Settings → API Keys → Generate Live Key',
      'Copy Key ID and Key Secret and paste above',
      'Go to Settings → Webhooks → Add New Webhook',
      'Paste the Webhook URL below as the webhook URL',
      'Set secret to the same value as Key Secret',
      'Tick events: payment.captured',
    ],
  },
  nowpayments: {
    label: 'NOWPayments (Crypto)',
    mode: 'webhook_external',
    checkoutNote: 'Customer selects crypto, pays on-chain. Webhook confirms → student enrolled.',
    setupUrl: 'https://nowpayments.io/',
    webhookPath: 'NOWPayments → Store settings → IPN (Instant Payment Notification)',
    fields: [
      { key: 'apiKey',       label: 'API Key',       placeholder: 'xxxx-xxxx-xxxx', help: 'NOWPayments → Store settings → API key' },
      { key: 'ipnSecretKey', label: 'IPN Secret Key', placeholder: 'your-ipn-secret', secret: true },
    ],
    webhookSteps: [
      'Log in to nowpayments.io → Store settings → API Key — copy it',
      'Set an IPN Secret Key in Store settings and paste it above',
      'Go to Store settings → IPN callback URL',
      'Paste the Webhook URL below',
    ],
  },
  paymongo: {
    label: 'PayMongo (Philippines)',
    mode: 'webhook_external',
    checkoutNote: 'Supports GCash, Maya, cards via PayMongo-hosted payment page.',
    setupUrl: 'https://dashboard.paymongo.com',
    webhookPath: 'PayMongo Dashboard → Developers → Webhooks',
    fields: [
      { key: 'publicKey',     label: 'Public Key',     placeholder: 'pk_live_…' },
      { key: 'secretKey',     label: 'Secret Key',     placeholder: 'sk_live_…', secret: true },
      { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsk_…', secret: true, help: 'Generated when you create the webhook in PayMongo dashboard.' },
    ],
    webhookSteps: [
      'Go to PayMongo Dashboard → Developers → API Keys — copy Public and Secret keys',
      'Paste them above and save',
      'Go to Developers → Webhooks → Add webhook',
      'Paste the Webhook URL below, select events: payment.paid',
      'Copy the webhook secret shown and paste it in the Webhook Secret field above',
    ],
  },
  ecpay: {
    label: 'ECPay (Taiwan)',
    mode: 'webhook_external',
    checkoutNote: 'Customer redirected to ECPay. Supports ATM, credit card, convenience store.',
    setupUrl: 'https://vendor.ecpay.com.tw',
    webhookPath: 'ECPay merchant portal → Payment result notification URL',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', placeholder: '2000132' },
      { key: 'hashKey',    label: 'Hash Key',    placeholder: '…', secret: true },
      { key: 'hashIV',     label: 'Hash IV',     placeholder: '…', secret: true },
    ],
    webhookSteps: [
      'Log in to vendor.ecpay.com.tw → Special stores → your store',
      'Copy Merchant ID, Hash Key, and Hash IV and paste above',
      'In ECPay store settings, set the payment result notification URL to the Webhook URL below',
    ],
  },
  mercadopago: {
    label: 'Mercado Pago (LATAM)',
    mode: 'webhook_external',
    checkoutNote: 'Covers Brazil, Argentina, Mexico and more via Mercado Pago checkout.',
    setupUrl: 'https://www.mercadopago.com/developers/panel',
    webhookPath: 'Mercado Pago Developers → Webhooks → Add webhook',
    fields: [
      { key: 'accessToken', label: 'Access Token', placeholder: 'APP_USR-…', secret: true, help: 'Mercado Pago Developers → Credentials → Access token (Production)' },
    ],
    webhookSteps: [
      'Go to mercadopago.com/developers/panel → Credentials → copy Production Access Token',
      'Paste it above and save',
      'Go to Your integrations → Webhooks → Add webhook',
      'Paste the Webhook URL below',
      'Select topic: Payments',
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

      {/* Intro */}
      <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px' }}>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#4c1d95', margin: '0 0 6px' }}>How payments work</p>
        <p style={{ fontSize: '13px', color: '#5b21b6', margin: 0, lineHeight: 1.7 }}>
          Your branded checkout stays on <strong>your site</strong>. The student clicks Pay → goes to the payment provider → completes payment → the provider sends a webhook back here → CreatorOS enrols the student automatically.
          For bank transfer, you get notified and mark the order paid manually.
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
          const isBank    = guide?.mode === 'bank_transfer'
          const isApiDriver = guide?.mode === 'api_driver'
          const isOpen    = expanded === gateway.id
          const isReady   = DRIVER_PROVIDERS.includes(gateway.provider) || WEBHOOK_PROVIDERS.includes(gateway.provider)

          return (
            <div key={gateway.id} style={{ background: 'white', border: gateway.isDefault ? '2px solid #7B2FBE' : '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>

              {/* Header row */}
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
                    {isReady
                      ? <span style={{ fontSize: '11px', color: '#065f46', background: '#d1fae5', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle size={10} /> READY
                        </span>
                      : <span style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <AlertCircle size={10} /> CUSTOM
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

                  {/* Checkout flow note */}
                  {guide && (
                    <div style={{ padding: '12px 18px', background: '#f0fdf4', borderBottom: '1px solid #d1fae5', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>{isBank ? '🏦' : '💳'}</span>
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

                  <div style={{ padding: '18px' }}>

                    {/* Active toggle */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={gateway.isActive}
                          onChange={e => setGateways(g => g.map(gw => gw.id === gateway.id ? { ...gw, isActive: e.target.checked } : gw))}
                          style={{ width: '16px', height: '16px' }} />
                        <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Active — shown as a payment option at checkout</span>
                      </label>
                    </div>

                    {/* BANK TRANSFER: just show the config fields, no webhook section */}
                    {isBank && (
                      <>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px', lineHeight: 1.6 }}>
                          Enter your bank details below. These are shown to the student immediately after they click Pay, along with a unique payment reference so you can match the transfer.
                        </p>
                        {guide.fields.map(field => (
                          <div key={field.key} style={{ marginBottom: '14px' }}>
                            <label style={labelStyle}>{field.label}</label>
                            <input
                              type="text"
                              value={gateway.config[field.key] ?? ''}
                              onChange={e => setGateways(g => g.map(gw => gw.id === gateway.id ? { ...gw, config: { ...gw.config, [field.key]: e.target.value } } : gw))}
                              placeholder={field.placeholder}
                              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)', background: 'white' }} />
                          </div>
                        ))}
                      </>
                    )}

                    {/* WEBHOOK / API DRIVER PROVIDERS: step-by-step setup */}
                    {!isBank && guide && (
                      <>
                        {/* Step-by-step */}
                        {guide.webhookSteps && (
                          <div style={{ marginBottom: '20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Setup steps</p>
                            {guide.webhookSteps.map((step, i) => (
                              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#7B2FBE', color: 'white', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                                <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: 1.5 }}>{step}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* API credential fields */}
                        {guide.fields.map(field => (
                          <div key={field.key} style={{ marginBottom: '14px' }}>
                            <label style={labelStyle}>{field.label}</label>
                            {field.help && <p style={{ fontSize: '12px', color: '#6b7280', margin: '-2px 0 6px', lineHeight: 1.5 }}>{field.help}</p>}
                            <input
                              type={field.secret ? 'password' : 'text'}
                              value={gateway.config[field.key] ?? ''}
                              onChange={e => setGateways(g => g.map(gw => gw.id === gateway.id ? { ...gw, config: { ...gw.config, [field.key]: e.target.value } } : gw))}
                              placeholder={field.placeholder}
                              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: field.secret ? 'monospace' : 'var(--font-ui)', background: 'white' }} />
                          </div>
                        ))}

                        {/* Webhook URL box */}
                        <div style={{ marginTop: '20px', padding: '14px 16px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px' }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: '#4c1d95', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                            Your Webhook URL
                          </p>
                          <p style={{ fontSize: '12px', color: '#5b21b6', margin: '0 0 10px', lineHeight: 1.5 }}>
                            {guide.webhookPath ? `Paste this into: ${guide.webhookPath}` : 'Paste this into your payment provider as the webhook endpoint.'}
                          </p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input readOnly value={webhookBase + gateway.id}
                              style={{ flex: 1, padding: '9px 12px', border: '1px solid #ddd6fe', borderRadius: '8px', fontSize: '13px', color: '#374151', background: 'white', fontFamily: 'monospace', outline: 'none' }} />
                            <button onClick={() => copyToClipboard(webhookBase + gateway.id, gateway.id + '_url')}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', border: '1px solid #ddd6fe', borderRadius: '8px', background: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#7B2FBE', fontFamily: 'var(--font-ui)', flexShrink: 0 }}>
                              {copied === gateway.id + '_url' ? <><Check size={13} style={{ color: '#10b981' }} /> Copied</> : <><Copy size={13} /> Copy</>}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
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
            Choose a known provider below, or type any name to add a custom gateway. Credentials are saved securely — each gateway gets its own webhook URL.
          </p>
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#065f46', margin: '0 0 4px' }}>How any API-based gateway works</p>
            <p style={{ fontSize: '12px', color: '#166534', margin: 0, lineHeight: 1.6 }}>
              1. You enter your API credentials here → 2. When student clicks Pay, CreatorOS calls their API to create a checkout session → 3. Student is redirected to their hosted payment page → 4. Their webhook fires to your Webhook URL → student is enrolled automatically.
              <br />For providers not listed, use <strong>Webhook / Custom</strong> — paste their webhook URL guide in the instructions field and save credentials in the key/value fields.
            </p>
          </div>

          {/* Quick-select */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Choose a provider</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {KNOWN_PROVIDERS.map(p => (
                <button key={p} type="button"
                  onClick={() => { setNewProvider(p); setNewName(PROVIDER_GUIDES[p].label) }}
                  style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 600, border: `1px solid ${newProvider === p ? '#7B2FBE' : '#e5e7eb'}`, borderRadius: '999px', background: newProvider === p ? 'rgba(123,47,190,0.08)' : 'white', color: newProvider === p ? '#7B2FBE' : '#374151', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                  {PROVIDER_GUIDES[p].label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Provider ID <span style={{ fontWeight: 400 }}>(internal, lowercase)</span></label>
              <input value={newProvider}
                onChange={e => {
                  const val = e.target.value
                  setNewProvider(val)
                  const g = PROVIDER_GUIDES[val.trim().toLowerCase().replace(/\s+/g, '_')]
                  if (g) setNewName(g.label)
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

          {suggestedGuide && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
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
