'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, FolderOpen, Users, ShoppingBag,
  Tag, CreditCard, Zap, Webhook, Mail, UserPlus, BarChart2,
  Palette, Navigation, Settings, ExternalLink, ChevronRight, Package, Import,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Content',
    items: [
      { label: 'Dashboard',   href: '/admin',             icon: LayoutDashboard },
      { label: 'Products',    href: '/admin/products',    icon: Package },
      { label: 'Courses',     href: '/admin/courses',     icon: BookOpen },
      { label: 'Collections', href: '/admin/collections', icon: FolderOpen },
      { label: 'Instructors', href: '/admin/instructors', icon: UserCircle },
      { label: 'Homepage',    href: '/admin/homepage',    icon: ExternalLink },
      { label: 'Reviews',     href: '/admin/reviews',     icon: MessageSquare },
      { label: 'Testimonials', href: '/admin/testimonials', icon: Star },
      { label: 'Pages',       href: '/admin/pages',       icon: FileText },
      { label: 'Import',      href: '/admin/import',      icon: Import },
    ],
  },
  {
    label: 'Students',
    items: [
      { label: 'Students',    href: '/admin/students',    icon: Users },
      { label: 'Orders',      href: '/admin/orders',      icon: ShoppingBag },
      { label: 'Coupons',     href: '/admin/coupons',     icon: Tag },
      { label: 'Payments',    href: '/admin/payments',    icon: CreditCard },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Automations', href: '/admin/automations', icon: Zap },
      { label: 'Webhooks',    href: '/admin/webhooks',    icon: Webhook },
      { label: 'Emails',      href: '/admin/emails',      icon: Mail },
      { label: 'Subscribers', href: '/admin/subscribers', icon: UserPlus },
      { label: 'Analytics',   href: '/admin/analytics',   icon: BarChart2 },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Branding',    href: '/admin/branding',    icon: Palette },
      { label: 'Navigation',  href: '/admin/navigation',  icon: Navigation },
      { label: 'Settings',    href: '/admin/settings',    icon: Settings },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="admin-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <Image src="/logo.png" alt="Perseus" width={80} height={28}
          style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
        />
        <span style={{
          fontSize: '10px', fontWeight: 700,
          color: '#7B2FBE', background: 'rgba(123,47,190,0.1)',
          padding: '2px 8px', borderRadius: '999px',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Admin
        </span>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: '20px' }}>
            <p style={{
              fontSize: '10px', fontWeight: 700,
              color: '#9ca3af', textTransform: 'uppercase',
              letterSpacing: '0.1em', padding: '0 8px',
              marginBottom: '4px',
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
                    padding: '7px 10px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#7B2FBE' : '#374151',
                    background: isActive ? 'rgba(123,47,190,0.08)' : 'transparent',
                    textDecoration: 'none', transition: 'all 0.12s',
                    marginBottom: '1px',
                  }}
                  className="admin-nav-hover"
                >
                  <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* View site */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #e5e7eb' }}>
        <Link href="/" target="_blank" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 10px', borderRadius: '8px',
          fontSize: '13px', color: '#6b7280',
          textDecoration: 'none', transition: 'all 0.12s',
        }}
          className="admin-nav-hover"
        >
          <ExternalLink size={14} />
          View Public Site
          <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
        </Link>
      </div>

      <style>{`
        .admin-nav-hover:hover {
          background: #f3f4f6 !important;
          color: #111827 !important;
        }
      `}</style>
    </aside>
  )
}
