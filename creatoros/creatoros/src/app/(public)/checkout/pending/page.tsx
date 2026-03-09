import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Payment Pending' }

export default function CheckoutPendingPage({
  searchParams,
}: {
  searchParams: { orderId?: string }
}) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-base)', padding: 'var(--s5)',
    }}>
      <div style={{
        width: '100%', maxWidth: '480px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        padding: 'var(--s8)', textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--s5)' }}>⏳</div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Awaiting Payment Confirmation
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--s6)' }}>
          Your order has been received. Once payment is confirmed, you&apos;ll receive an email with your course access link.
        </p>
        {searchParams.orderId && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--s5)', fontFamily: 'var(--font-mono)' }}>
            Order ID: {searchParams.orderId}
          </p>
        )}
        <Link href="/" style={{
          display: 'inline-block', color: 'var(--accent)',
          fontSize: '14px', fontWeight: 600, textDecoration: 'none',
        }}>
          ← Return to Academy
        </Link>
      </div>
    </div>
  )
}
