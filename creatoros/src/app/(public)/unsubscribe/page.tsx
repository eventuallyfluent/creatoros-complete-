import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { email?: string; token?: string }
}) {
  let status: 'success' | 'invalid' | 'already' = 'invalid'
  let email = searchParams.email ?? ''

  if (email) {
    const subscriber = await prisma.emailSubscriber.findUnique({ where: { email } })

    if (!subscriber) {
      status = 'invalid'
    } else if (subscriber.status === 'UNSUBSCRIBED') {
      status = 'already'
    } else {
      await prisma.emailSubscriber.update({
        where: { email },
        data:  { status: 'UNSUBSCRIBED' },
      })
      status = 'success'
    }
  }

  const messages = {
    success: { icon: '✓', title: "You've been unsubscribed", body: "You won't receive any more marketing emails from Perseus Arcane Academy. You'll still receive important account emails like purchase confirmations." },
    already: { icon: '○', title: 'Already unsubscribed', body: "You're already unsubscribed from our mailing list." },
    invalid: { icon: '✗', title: 'Invalid link', body: 'This unsubscribe link is invalid or has expired. Please contact us if you need help.' },
  }

  const msg = messages[status]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 'var(--s8)', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--s4)' }}>{msg.icon}</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>{msg.title}</h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--s6)' }}>{msg.body}</p>
        <Link href="/" style={{ display: 'inline-block', fontSize: '14px', color: 'var(--accent)', fontWeight: 600 }}>
          ← Return to Perseus Arcane Academy
        </Link>
      </div>
    </div>
  )
}
