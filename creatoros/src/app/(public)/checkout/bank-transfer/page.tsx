import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Complete Your Bank Transfer' }

export default function BankTransferPage({
  searchParams,
}: {
  searchParams: {
    orderId?: string; amount?: string; currency?: string
    bankName?: string; accountName?: string; accountNumber?: string
    sortCode?: string; iban?: string; bic?: string
    reference?: string; instructions?: string
  }
}) {
  const {
    orderId, amount, currency = 'USD',
    bankName, accountName, accountNumber,
    sortCode, iban, bic, reference, instructions,
  } = searchParams

  const hasDetails = accountName || accountNumber || iban || bankName

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-base)', padding: '32px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏦</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            Complete Your Bank Transfer
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            Your order is reserved. Please transfer the exact amount below to our account.
            Once we confirm receipt, you&apos;ll receive your course access by email.
          </p>
        </div>

        {/* Amount to pay */}
        <div style={{ background: 'var(--brand)', borderRadius: '12px', padding: '20px 24px', textAlign: 'center', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Amount to Transfer</p>
          <p style={{ fontSize: '32px', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
            {currency} {amount ?? '—'}
          </p>
        </div>

        {/* Reference */}
        {reference && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 18px', textAlign: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
              ⚠ Use this reference exactly — required so we can match your payment
            </p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#78350f', margin: 0, letterSpacing: '0.1em', fontFamily: 'monospace' }}>
              {reference}
            </p>
          </div>
        )}

        {/* Bank details */}
        {hasDetails ? (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bankName && <DetailRow label="Bank" value={bankName} />}
              {accountName && <DetailRow label="Account Name" value={accountName} />}
              {accountNumber && <DetailRow label="Account Number" value={accountNumber} mono />}
              {sortCode && <DetailRow label="Sort Code" value={sortCode} mono />}
              {iban && <DetailRow label="IBAN" value={iban} mono />}
              {bic && <DetailRow label="BIC / SWIFT" value={bic} mono />}
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginBottom: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              Bank details will be sent to your email shortly.
            </p>
          </div>
        )}

        {/* Custom instructions */}
        {instructions && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7 }}>
              {instructions}
            </p>
          </div>
        )}

        {/* What happens next */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What happens next</h3>
          {[
            'Transfer the exact amount shown above to our bank account',
            'Use the reference code so we can identify your payment',
            'We usually confirm within 1–2 business days',
            'You\'ll receive an email with your course access link',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--brand)', color: 'white', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{step}</p>
            </div>
          ))}
        </div>

        {orderId && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '16px', fontFamily: 'monospace' }}>
            Order ID: {orderId}
          </p>
        )}

        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            ← Return to Academy
          </Link>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: mono ? 'monospace' : undefined, letterSpacing: mono ? '0.05em' : undefined }}>
        {value}
      </span>
    </div>
  )
}
