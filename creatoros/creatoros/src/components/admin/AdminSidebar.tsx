'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, FolderOpen, Users, User, ShoppingBag,
  Tag, CreditCard, Mail, UserPlus, Settings, Package,
  FileText, Search, MessageSquare, BarChart2, Zap,
  ChevronRight, ExternalLink, Shield,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Content',
    items: [
      { label: 'Dashboard',    href: '/admin',              icon: LayoutDashboard },
      { label: 'Products',     href: '/admin/products',     icon: Package },
      { label: 'Courses',      href: '/admin/courses',      icon: BookOpen },
      { label: 'Collections',  href: '/admin/collections',  icon: FolderOpen },
      { label: 'Instructors',  href: '/admin/instructors',  icon: User },
      { label: 'Homepage',     href: '/admin/homepage',     icon: ExternalLink },
      { label: 'Reviews',      href: '/admin/reviews',      icon: MessageSquare },
      { label: 'Testimonials', href: '/admin/testimonials', icon: Tag },
      { label: 'Pages',        href: '/admin/pages',        icon: FileText },
      { label: 'Import',       href: '/admin/import',       icon: Users },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { label: 'Orders',       href: '/admin/orders',       icon: ShoppingBag },
      { label: 'Students',     href: '/admin/students',     icon: Users },
      { label: 'Coupons',      href: '/admin/coupons',      icon: Tag },
      { label: 'Payments',     href: '/admin/payments',     icon: CreditCard },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Email Sequences', href: '/admin/automations',  icon: Zap },
      { label: 'Subscribers',     href: '/admin/subscribers',  icon: Mail },
      { label: 'Broadcasts',      href: '/admin/emails',       icon: Mail },
      { label: 'Analytics',       href: '/admin/analytics',    icon: BarChart2 },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Branding',     href: '/admin/branding',     icon: Settings },
      { label: 'Navigation',   href: '/admin/navigation',   icon: Settings },
      { label: 'Settings',     href: '/admin/settings',     icon: Settings },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <Link href="/admin" style={{ display: 'inline-block' }}>
          <Image
            src="/logo-dark.png"
            alt="Perseus Arcane Academy"
            width={120}
            height={40}
            style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>
      </div>

      {/* Nav groups */}
      <nav style={{ padding: '8px', overflowY: 'auto', flex: 1 }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: '8px' }}>
            <p style={{
              fontSize: '10px', fontWeight: 700, color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '8px 8px 4px', margin: 0,
            }}>
              {group.label}
            </p>
            {group.items.map(({ label, href, icon: Icon }) => {
              const isActive = href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 8px', borderRadius: '6px', marginBottom: '1px',
                    fontSize: '13px', fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#7B2FBE' : '#374151',
                    background: isActive ? 'rgba(123,47,190,0.08)' : 'transparent',
                    textDecoration: 'none',
                  }}
                >
                  <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #e5e7eb' }}>
        <Link href="/" target="_blank" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 8px', borderRadius: '6px',
          fontSize: '13px', color: '#6b7280', textDecoration: 'none',
        }}>
          <ExternalLink size={14} />
          View Site
        </Link>
      </div>
    </aside>
  )
}
