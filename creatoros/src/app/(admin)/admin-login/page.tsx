import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth-options'
import AdminLoginForm from './AdminLoginForm'

export const metadata: Metadata = { title: 'Admin Sign In — Perseus Arcane Academy' }

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const session = await getServerSession(authOptions)
  if (session && (session.user as any)?.role === 'ADMIN') redirect('/admin')

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D1A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Subtle glow */}
      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: '500px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(123,47,190,0.18) 0%, transparent 70%)',
        pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: '400px',
        background: '#1A1A2E',
        border: '1px solid rgba(123,47,190,0.3)',
        borderRadius: '16px', overflow: 'hidden',
        position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ padding: '28px 36px 24px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>⚙️</div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#F0EAF8', marginBottom: '4px' }}>Admin Sign In</h1>
          <p style={{ fontSize: '13px', color: '#6B5B8A', margin: 0 }}>Perseus Arcane Academy — Admin Panel</p>
        </div>
        <div style={{ padding: '28px 36px' }}>
          <AdminLoginForm error={searchParams.error} />
        </div>
        <div style={{ padding: '14px 36px', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
          <a href="/login" style={{ fontSize: '12px', color: '#6B5B8A', textDecoration: 'none' }}>
            ← Student login
          </a>
        </div>
      </div>
    </div>
  )
}
