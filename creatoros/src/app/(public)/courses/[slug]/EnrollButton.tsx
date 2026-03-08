'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  productId:   string
  productSlug: string
  portalSlug:  string   // first course slug for portal entry
  price:       number
  currency:    string
  label?:      string
}

export default function EnrollButton({ productId, productSlug, portalSlug, price, currency, label }: Props) {
  const router    = useRouter()
  const [loading, setLoading] = useState(false)
  const isFree    = price === 0

  const handleEnroll = async () => {
    if (isFree) {
      setLoading(true)
      const res = await fetch('/api/enrollments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productId }),
      })
      if (res.ok) {
        router.push(`/portal/courses/${portalSlug}`)
      } else {
        const data = await res.json()
        if (data.requiresLogin) router.push(`/login?callbackUrl=/courses/${productSlug}`)
        else setLoading(false)
      }
      return
    }
    router.push(`/checkout/${productSlug}`)
  }

  const btnLabel = label ?? (isFree ? 'Enrol Free →' : `Enrol Now →`)

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      style={{
        display: 'block', width: '100%',
        background: loading ? 'var(--bg-elevated)' : 'var(--brand)',
        color: loading ? 'var(--text-muted)' : 'white',
        border: 'none', borderRadius: 'var(--r-md)',
        padding: '14px', fontSize: '16px', fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-ui)', transition: 'all 0.15s',
        textAlign: 'center',
      }}
    >
      {loading ? 'Processing…' : btnLabel}
    </button>
  )
}
