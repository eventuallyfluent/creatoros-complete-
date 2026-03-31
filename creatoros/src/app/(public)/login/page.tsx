import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth-options'
import LoginForm from './LoginForm'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Perseus Arcane Academy',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string }
}) {
  const session = await getServerSession(authOptions)
  if (session) redirect(searchParams.callbackUrl ?? '/portal')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(123,47,190,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Header */}
        <div style={{
          padding: '32px 40px 28px',
          textAlign: 'center',
          borderBottom: '1px solid var(--border)',
        }}>
          <Image
            src="/logo.png"
            alt="Perseus Arcane Academy"
            width={100}
            height={40}
            style={{ height: '44px', width: 'auto', objectFit: 'contain', marginBottom: '16px' }}
          />
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Enter your email to receive a magic link
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '32px 40px' }}>
          <LoginForm
            callbackUrl={searchParams.callbackUrl}
            error={searchParams.error}
          />
        </div>
      </div>

    </div>
  )
}
