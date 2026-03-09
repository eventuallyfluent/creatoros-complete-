import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Check Your Email' }

export default function VerifyPage({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        padding: 'var(--s8)',
        textAlign: 'center',
      }}>
        <Image src="/logo.png" alt="Perseus Arcane Academy" width={80} height={32}
          style={{ height: '32px', width: 'auto', objectFit: 'contain', marginBottom: 'var(--s6)' }}
        />

        <div style={{ fontSize: '48px', marginBottom: 'var(--s5)' }}>✉️</div>

        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Magic link sent
        </h1>

        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--s5)' }}>
          {searchParams.email ? (
            <>We sent a sign-in link to <strong style={{ color: 'var(--accent)' }}>{searchParams.email}</strong>. Click it to access your account — no password needed.</>
          ) : (
            <>We sent you a sign-in link. Click it to access your account.</>
          )}
        </p>

        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: 'var(--s4)',
          fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6,
          marginBottom: 'var(--s5)',
        }}>
          The link expires in <strong style={{ color: 'var(--text-secondary)' }}>15 minutes</strong>.
          Check your spam folder if you don&apos;t see it.
        </div>

        <Link href="/login" style={{
          display: 'inline-block', fontSize: '14px',
          color: 'var(--accent)', fontWeight: 600,
        }}>
          ← Try a different email
        </Link>
      </div>
    </div>
  )
}
