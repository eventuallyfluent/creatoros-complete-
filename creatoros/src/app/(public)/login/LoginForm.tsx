'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function LoginForm({
  callbackUrl,
  error,
}: {
  callbackUrl?: string
  error?:       string
}) {
  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await signIn('email', {
      email,
      callbackUrl: callbackUrl ?? '/portal',
      redirect:    false,
    })
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>✉️</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Check your email
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          We sent a magic link to <strong style={{ color: 'var(--accent)' }}>{email}</strong>.
          Click it to sign in.
        </p>
        <button onClick={() => setSubmitted(false)} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
          Try a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: '14px', color: 'var(--danger)', marginBottom: '20px' }}>
          Something went wrong. Please try again.
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoFocus
          style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-ui)', boxSizing: 'border-box' }}
        />
      </div>

      <button type="submit" disabled={loading || !email}
        style={{ width: '100%', padding: '13px', background: loading ? 'rgba(123,47,190,0.5)' : 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', fontSize: '15px', fontWeight: 700, cursor: loading || !email ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
        {loading ? 'Sending…' : 'Send Magic Link'}
      </button>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>
        We'll email you a secure link — no password needed.
      </p>
    </form>
  )
}
