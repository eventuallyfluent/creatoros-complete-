'use client'

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px', flexDirection: 'column', gap: '16px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '40px' }}>⚠️</div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
        Something went wrong
      </h2>
      <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '400px' }}>
        {error.message ?? 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={reset}
        style={{
          background: 'var(--brand)', color: 'white', border: 'none',
          padding: '10px 24px', borderRadius: '8px', fontWeight: 600,
          fontSize: '14px', cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}
