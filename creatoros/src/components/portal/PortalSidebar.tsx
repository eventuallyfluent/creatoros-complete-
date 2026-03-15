'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, BookOpen,
  Star, Settings, LogOut, ExternalLink, Shield,
} from 'lucide-react'

const BASE_NAV_ITEMS = [
  { label: 'My Library',   href: '/portal',              icon: LayoutDashboard },
  { label: 'Account',      href: '/portal/account',      icon: Settings },
]
const CERT_NAV_ITEM = { label: 'Certificates', href: '/portal/certificates', icon: Star }

export default function PortalSidebar({ session, hasCertificates = false }: { session: any; hasCertificates?: boolean }) {
  const pathname  = usePathname()
  const isAdmin   = session?.user?.role === 'ADMIN'
  const userName  = session?.user?.name ?? session?.user?.email ?? 'Student'
  const initials  = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside className="portal-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Logo */}
      <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: '20px' }}>
          <Image
            src="/logo.png"
            alt="Perseus Arcane Academy"
            width={120}
            height={50}
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            borderRadius: '50%',
            background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName.split(' ')[0]}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isAdmin ? 'Admin' : 'Student'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {[...BASE_NAV_ITEMS, ...(hasCertificates ? [CERT_NAV_ITEM] : [])].map(({ label, href, icon: Icon }) => {
          const isActive = href === '/portal'
            ? pathname === '/portal' || pathname.startsWith('/portal/courses')
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-nav-item${isActive ? ' active' : ''}`}
              style={{ marginBottom: '2px', display: 'flex' }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {label}
            </Link>
          )
        })}


      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <Link href="/courses" className="sidebar-nav-item" style={{ display: 'flex' }}>
          <ExternalLink size={16} style={{ flexShrink: 0 }} />
          Browse Courses
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="sidebar-nav-item"
          style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          Sign Out
        </button>
      </div>

    </aside>
  )
}
