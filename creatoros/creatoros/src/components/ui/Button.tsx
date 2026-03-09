import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children:   React.ReactNode
  variant?:   Variant
  size?:      Size
  href?:      string
  fullWidth?: boolean
  disabled?:  boolean
  type?:      'button' | 'submit' | 'reset'
  onClick?:   (e: React.MouseEvent) => void
  className?: string
}

const variantStyles: Record<Variant, string> = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  gold:      'btn-gold',
  danger:    'btn-danger',
}

const sizeStyles: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export default function Button({
  children, variant = 'primary', size = 'md',
  href, fullWidth, disabled, type = 'button',
  onClick, className,
}: ButtonProps) {
  const classes = cn(
    'btn',
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && 'btn-full',
    className,
  )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classes}
    >
      {children}
    </button>
  )
}
