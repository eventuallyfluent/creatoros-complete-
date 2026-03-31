import { renderMarkdown } from '@/lib/pages/render-page'

interface Props { title: string; updatedAt?: string | null; body: string }

export default function DynamicPage({ title, updatedAt, body }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: 'var(--s7) 0 var(--s6)', background: 'var(--bg-surface)' }}>
        <div className="platform-container">
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{title}</h1>
          {updatedAt && <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Last updated: {new Date(updatedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
        </div>
      </div>
      <div className="platform-container" style={{ padding: 'var(--s7) var(--s5)', maxWidth: '780px' }}>
        <div className="page-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} />
      </div>
      <style>{`
        .page-body { color: var(--text-secondary); line-height: 1.85; font-size: 15px; }
        .page-body h1 { font-size: 26px; font-weight: 700; color: var(--text-primary); margin: 32px 0 12px; }
        .page-body h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 28px 0 10px; }
        .page-body h3 { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 20px 0 8px; }
        .page-body p  { margin: 0 0 14px; }
        .page-body ul { padding-left: 24px; margin: 0 0 16px; display: flex; flex-direction: column; gap: 6px; }
        .page-body li { color: var(--text-secondary); }
        .page-body strong { font-weight: 700; color: var(--text-primary); }
        .page-body hr { border: none; border-top: 1px solid var(--border); margin: 32px 0; }
        .page-body a:hover { opacity: 0.8; }
      `}</style>
    </div>
  )
}
