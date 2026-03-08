'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

interface Gateway {
  id:            string
  name:          string
  provider:      string
  isActive:      boolean
  isDefault:     boolean
  webhookSecret: string | null
  config:        Record<string, string>
}

const GATEWAY_TEMPLATES: Record<string, { label: string; fields: { key: string; label: string; placeholder: string; secret?: boolean }[] }> = {
  manual: {
    label: 'Manual / Bank Transfer',
    fields: [],
  },
  stripe: {
    label: 'Stripe',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_…' },
      { key: 'secretKey',      label: 'Secret Key',      placeholder: 'sk_live_…', secret: true },
      { key: 'webhookSecret',  label: 'Webhook Secret',  placeholder: 'whsec_…', secret: true },
    ],
  },
  paypal: {
    label: 'PayPal',
    fields: [
      { key: 'clientId',     label: 'Client ID',     placeholder: 'AX…' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: 'EH…', secret: true },
    ],
  },
  nowpayments: {
    label: 'NOWPayments (Crypto)',
    fields: [
      { key: 'apiKey',        label: 'API Key',         placeholder: 'xxxx-xxxx-xxxx' },
      { key: 'ipnSecretKey',  label: 'IPN Secret Key',  placeholder: 'your-ipn-secret', secret: true },
    ],
  },
  webhook_only: {
    label: 'Custom / Webhook-Only',
    fields: [
      { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'your-secret', secret: true },
    ],
  },
}

export default function GatewayManager({ gateways: initial }: { gateways: Gateway[] }) {
  const router   = useRouter()
  const [gateways, setGateways] = useState<Gateway[]>(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving,   setSaving]   = useState<string | null>(null)
  const [adding,   setAdding]   = useState(false)
  const [newProvider, setNewProvider] = useState('manual')
  const [newName,     setNewName]     = useState('')
  const [copied,      setCopied]      = useState<string | null>(null)

  const webhookBase = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/` : '/api/webhooks/'

  const copyWebhookUrl = (id: string) => {
    navigator.clipboard.writeText(webhookBase + id)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSave = async (gateway: Gateway) => {
    setSaving(gateway.id)
    const res = await fetch(`/api/gateways/${gateway.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(gateway),
    })
    setSaving(null)
    if (res.ok) router.refresh()
  }

  const handleAdd = async () => {
    const name = newName.trim() || GATEWAY_TEMPLATES[newProvider]?.label || newProvider
    const res  = await fetch('/api/gateways', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ provider: newProvider, name }),
    })
    const data = await res.json()
    if (res.ok) {
      setGateways(g => [...g, { ...data, config: data.config ?? {} }])
      setAdding(false)
      setExpanded(data.id)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment gateway?')) return
    await fetch(`/api/gateways/${id}`, { method: 'DELETE' })
    setGateways(g => g.filter(gw => gw.id !== id))
  }

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/gateways/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDefault: true }) })
    setGateways(g => g.map(gw => ({ ...gw, isDefault: gw.id === id })))
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      {/* Info box */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', fontSize: '14px', color: '#166534', lineHeight: 1.6 }}>
        <strong>Gateway-agnostic:</strong> Add any payment provider. Each gateway gets a unique webhook URL.
        When a payment lands, CreatorOS automatically enrols the student — regardless of which gateway processed it.
      </div>

      {/* Gateway list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {gateways.map(gateway => {
          const tmpl     = GATEWAY_TEMPLATES[gateway.provider]
          const isOpen   = expanded === gateway.id

          return (
            <div key={gateway.id} style={{ background: 'white', border: gateway.isDefault ? '2px solid #7B2FBE' : '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{gateway.name}</span>
                    {gateway.isDefault && <span style={{ fontSize: '11px', fontWeight: 700, color: '#7B2FBE', background: 'rgba(123,47,190,0.1)', padding: '2px 8px', borderRadius: '999px' }}>DEFAULT</span>}
                    <span style={{ fontSize: '11px', color: gateway.isActive ? '#10b981' : '#6b7280', background: gateway.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                      {gateway.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', fontFamily: 'monospace' }}>{gateway.provider}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {!gateway.isDefault && (
                    <button onClick={() => handleSetDefault(gateway.id)} style={{ fontSize: '12px', color: '#7B2FBE', background: 'none', border: '1px solid rgba(123,47,190,0.3)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                      Set Default
                    </button>
                  )}
                  <button onClick={() => handleDelete(gateway.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: '1px solid #fecaca', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#ef4444' }}>
                    <Trash2 size={13} />
                  </button>
                  <button onClick={() => setExpanded(isOpen ? null : gateway.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }}>
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Expanded config */}
              {isOpen && (
                <div style={{ padding: '18px', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
                  {/* Webhook URL */}
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Webhook URL (paste this into your gateway dashboard)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input readOnly value={webhookBase + gateway.id} style={{ flex: 1, padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#374151', background: 'white', fontFamily: 'monospace', outline: 'none' }} />
                      <button onClick={() => copyWebhookUrl(gateway.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'var(--font-ui)' }}>
                        {copied === gateway.id ? <><Check size={13} style={{ color: '#10b981' }} /> Copied</> : <><Copy size={13} /> Copy</>}
                      </button>
                    </div>
                  </div>

                  {/* Toggle active */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={gateway.isActive}
                        onChange={e => setGateways(g => g.map(gw => gw.id === gateway.id ? { ...gw, isActive: e.target.checked } : gw))}
                        style={{ width: '16px', height: '16px' }} />
                      <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Active (visible to customers at checkout)</span>
                    </label>
                  </div>

                  {/* Provider-specific config fields */}
                  {tmpl?.fields.map(field => (
                    <div key={field.key} style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field.label}</label>
                      <input
                        type={field.secret ? 'password' : 'text'}
                        value={gateway.config[field.key] ?? ''}
                        onChange={e => setGateways(g => g.map(gw => gw.id === gateway.id ? { ...gw, config: { ...gw.config, [field.key]: e.target.value } } : gw))}
                        placeholder={field.placeholder}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: field.secret ? 'monospace' : 'var(--font-ui)', background: 'white' }}
                      />
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button onClick={() => handleSave(gateway)} disabled={saving === gateway.id}
                      style={{ padding: '9px 22px', background: '#7B2FBE', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                      {saving === gateway.id ? 'Saving…' : 'Save Gateway'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add gateway */}
      {adding ? (
        <div style={{ background: 'white', border: '2px dashed #7B2FBE', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>Add Payment Gateway</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '5px' }}>GATEWAY TYPE</label>
              <select value={newProvider} onChange={e => { setNewProvider(e.target.value); setNewName(GATEWAY_TEMPLATES[e.target.value]?.label ?? '') }}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', background: 'white', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                {Object.entries(GATEWAY_TEMPLATES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '5px' }}>DISPLAY NAME</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={GATEWAY_TEMPLATES[newProvider]?.label}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleAdd} style={{ padding: '9px 22px', background: '#7B2FBE', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              Add Gateway
            </button>
            <button onClick={() => setAdding(false)} style={{ padding: '9px 18px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'white', border: '2px dashed #e5e7eb', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: '#7B2FBE', cursor: 'pointer', fontFamily: 'var(--font-ui)', width: '100%', justifyContent: 'center', transition: 'border-color 0.15s' }}
          className="add-gateway-hover"
        >
          <Plus size={16} /> Add Payment Gateway
        </button>
      )}
      <style>{`.add-gateway-hover:hover { border-color: #7B2FBE !important; }`}</style>
    </div>
  )
}
