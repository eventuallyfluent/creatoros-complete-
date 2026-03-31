import Link from 'next/link'

interface Props {
  title:       string
  description?: string
  action?:     { label: string; href?: string; onClick?: () => void }
  backHref?:   string
  backLabel?:  string
}

export default function AdminPageHeader({ title, description, action, backHref, backLabel }: Props) {
  return (
    <div style={{ marginBottom: '24px' }}>
      {backHref && (
        <Link href={backHref} style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          ← {backLabel ?? 'Back'}
        </Link>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{title}</h1>
          {description && <p style={{ fontSize: '14px', color: '#6b7280' }}>{description}</p>}
        </div>
        {action && (
          action.href ? (
            <Link href={action.href} style={{
              background: '#7B2FBE', color: 'white', padding: '9px 20px',
              borderRadius: '8px', fontWeight: 600, fontSize: '14px',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} style={{
              background: '#7B2FBE', color: 'white', padding: '9px 20px',
              borderRadius: '8px', fontWeight: 600, fontSize: '14px',
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: 'var(--font-ui)',
            }}>
              {action.label}
            </button>
          )
        )}
      </div>
    </div>
  )
}
