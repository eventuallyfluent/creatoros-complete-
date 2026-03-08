'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'

const ADMIN_EMAIL = 'perseusarcaneacademy@gmail.com'

export default function LoginForm({
  callbackUrl,
  error,
}: {
  callbackUrl?: string
  error?:       string
}) {
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const isAdmin = email === ADMIN_EMAIL

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isAdmin) {
      const res = await signIn('admin-credentials', {
        email,
        password,
        callbackUrl: callbackUrl ?? '/admin',
        redirect:    true,
      })
    } else {
      await signIn('email', {
        email,
        callbackUrl: callbackUrl ?? '/portal',
        redirect:    false,
      })
      setLoading(false)
      setSubmitted(true)
    }
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
          Try again
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--r-md)',
          padding: '12px 16px',
          fontSize: '14px',
          color: 'var(--danger)',
          marginBottom: '20px',
        }}>
          Something went wrong. Please try again.
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
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
          style={{
            width: '100%',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '12px 16px',
            fontSize: '15px',
            color: 'var(--text-primary)',
            outline: 'none',
            fontFamily: 'var(--font-ui)',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-glow)' }}
          onBlur={e =>  { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {isAdmin && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Admin password"
            required
            style={{
              width: '100%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '12px 16px',
              fontSize: '15px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'var(--font-ui)',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-glow)' }}
            onBlur={e =>  { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email || (isAdmin && !password)}
        style={{
          width: '100%',
          background: loading ? 'var(--bg-elevated)' : 'var(--brand)',
          color: loading ? 'var(--text-muted)' : 'white',
          border: 'none',
          borderRadius: 'var(--r-md)',
          padding: '13px',
          fontSize: '15px',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-ui)',
          marginBottom: '24px',
        }}
      >
        {loading ? 'Signing in...' : isAdmin ? 'Sign In →' : 'Send Magic Link →'}
      </button>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
        By signing in, you agree to our{' '}
        <a href="/terms" style={{ color: 'var(--accent)' }}>Terms</a>
        {' '}and{' '}
        <a href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</a>.
      </p>
    </form>
  )
}
