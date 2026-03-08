'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      padding: '48px 32px', display: 'flex', flexDirection: 'column',
      gap: '16px', maxWidth: '560px',
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
        Page error
      </h2>
      <p style={{ color: '#6b7280', margin: 0, fontSize: '14px', fontFamily: 'monospace', background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        {error.message ?? 'Unknown error'}
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={reset}
          style={{
            background: '#7B2FBE', color: 'white', border: 'none',
            padding: '9px 20px', borderRadius: '8px', fontWeight: 600,
            fontSize: '14px', cursor: 'pointer',
          }}
        >
          Retry
        </button>
        <a href="/admin" style={{
          padding: '9px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
          border: '1px solid #e5e7eb', color: '#374151', textDecoration: 'none',
        }}>
          Back to dashboard
        </a>
      </div>
    </div>
  )
}
