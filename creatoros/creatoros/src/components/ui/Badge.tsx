type Variant = 'accent' | 'success' | 'warning' | 'danger' | 'gold' | 'brand' | 'muted'

const styles: Record<Variant, { background: string; color: string }> = {
  accent:  { background: 'var(--accent-soft)',              color: 'var(--accent)' },
  success: { background: 'rgba(52,211,153,0.12)',           color: 'var(--success)' },
  warning: { background: 'rgba(251,191,36,0.12)',           color: 'var(--warning)' },
  danger:  { background: 'rgba(248,113,113,0.12)',          color: 'var(--danger)' },
  gold:    { background: 'var(--gold-soft)',                color: 'var(--accent-gold)' },
  brand:   { background: 'var(--brand-glow)',               color: '#D4AAFF' },
  muted:   { background: 'rgba(240,234,248,0.08)',          color: 'var(--text-secondary)' },
}

interface BadgeProps {
  children:  React.ReactNode
  variant?:  Variant
}

export default function Badge({ children, variant = 'accent' }: BadgeProps) {
  return (
    <span className="badge" style={styles[variant]}>
      {children}
    </span>
  )
}
