'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function AdminLoginForm({ error }: { error?: string }) {
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [err,      setErr]      = useState<string | null>(error ?? null)

  const ADMIN_EMAIL = 'perseusarcaneacademy@gmail.com'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true); setErr(null)
    const res = await signIn('admin-credentials', {
      email:       ADMIN_EMAIL,
      password,
      callbackUrl: '/admin',
      redirect:    false,
    })
    setLoading(false)
    if (res?.error) { setErr('Incorrect password. Please try again.'); return }
    if (res?.url) window.location.href = res.url
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(123,47,190,0.3)',
    borderRadius: '8px', fontSize: '15px',
    color: '#F0EAF8', outline: 'none',
    fontFamily: 'var(--font-ui)', boxSizing: 'border-box',
    letterSpacing: '0.1em',
  }

  return (
    <form onSubmit={handleSubmit}>
      {err && (
        <div style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '8px', padding: '11px 14px', fontSize: '13px', color: '#fca5a5', marginBottom: '18px' }}>
          {err}
        </div>
      )}

      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9B8CC4', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Admin Password
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter admin password"
          autoFocus
          required
          style={inp}
        />
      </div>

      <button type="submit" disabled={loading || !password}
        style={{ width: '100%', padding: '12px', background: loading ? 'rgba(123,47,190,0.5)' : '#7B2FBE', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: loading || !password ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', transition: 'background 0.15s' }}>
        {loading ? 'Signing in…' : 'Sign In to Admin'}
      </button>
    </form>
  )
}
