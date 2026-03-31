'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  orderId:          string
  gatewayOrderId:   string | null
  gatewayPaymentId: string | null
  total:            number
  currency:         string
  isPending?:       boolean
}

export default function OrderActions({ orderId, total, currency, isPending }: Props) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleAction = async (action: 'refund' | 'mark_paid') => {
    if (action === 'refund' && !confirm(`Refund ${currency} ${total.toFixed(2)}? This will revoke student access.`)) return
    if (action === 'mark_paid' && !confirm('Mark this order as paid? This will enrol the student immediately.')) return

    setLoading(true)
    setError(null)

    const res = await fetch(`/api/orders/${orderId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Action failed'); return }
    router.refresh()
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
      <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>Actions</h2>
      {error && <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '10px' }}>{error}</p>}

      {isPending && (
        <button onClick={() => handleAction('mark_paid')} disabled={loading}
          style={{ width: '100%', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)', marginBottom: '8px' }}>
          {loading ? 'Processing…' : '✓ Mark as Paid'}
        </button>
      )}

      {!isPending && (
        <button onClick={() => handleAction('refund')} disabled={loading}
          style={{ width: '100%', padding: '10px', background: 'white', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
          {loading ? 'Processing…' : `Issue Full Refund (${currency} ${total.toFixed(2)})`}
        </button>
      )}
    </div>
  )
}
