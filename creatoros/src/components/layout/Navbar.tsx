'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, ChevronDown, LayoutDashboard, User, LogOut, Shield } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import SearchOverlay from '@/components/search/SearchOverlay'
import Button from '@/components/ui/Button'

const NAV_LINKS = [
  { label: 'Courses',     href: '/courses' },
  { label: 'Collections', href: '/collection' },
  { label: 'Instructors', href: '/instructors' },
]

export default function Navbar({ session }: { session: any }) {
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [userMenuOpen,  setUserMenuOpen]  = useState(false)
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <>
      {/* Admin bar — ADMIN role only */}
      {isAdmin && (
        <div style={{
          background: 'var(--brand)',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          fontSize: '12px',
          fontWeight: '600',
          color: 'white',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
        }}>
          <Shield size={12} />
          Admin Mode
          <Link href="/" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
            View Site
          </Link>
          <span style={{ opacity: 0.4 }}>·</span>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
            Admin Panel
          </Link>
        </div>
      )}

      {/* Main navbar */}
      <header
        style={{
          position: 'fixed',
          top: isAdmin ? '32px' : '0',
          left: 0,
          right: 0,
          height: 'var(--nav-height)',
          background: 'var(--nav-bg, rgba(13,13,26,0.92))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          zIndex: 50,
          transition: 'background 0.2s',
        }}
      >
        <div
          className="platform-container"
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Logo — top left */}
          <Link href="/" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <Image
              src="/logo.png"
              alt="Perseus Arcane Academy"
              width={120}
              height={48}
              style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
              priority
            />
          </Link>

          {/* Nav links — desktop centre */}
          <nav
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              gap: '4px',
            }}
            className="hide-mobile"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  padding: '8px 12px',
                  borderRadius: 'var(--r-sm)',
                  transition: 'color 0.15s',
                  fontWeight: 500,
                }}
                className="nav-link-hover"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
            <SearchOverlay />
            {session ? (
              /* Logged in — avatar dropdown */
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-pill)',
                    padding: '6px 12px 6px 6px',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: 'white',
                    flexShrink: 0,
                  }}>
                    {session.user?.name?.[0]?.toUpperCase() ?? session.user?.email?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {session.user?.name?.split(' ')[0] ?? 'Account'}
                  </span>
                  <ChevronDown size={14} />
                </button>

                {userMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-lg)',
                    padding: '8px',
                    minWidth: '180px',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                    zIndex: 100,
                  }}>
                    <Link href="/portal" onClick={() => setUserMenuOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: 'var(--r-md)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}
                      className="dropdown-item"
                    >
                      <LayoutDashboard size={14} /> My Courses
                    </Link>
                    <Link href="/portal/account" onClick={() => setUserMenuOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: 'var(--r-md)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}
                      className="dropdown-item"
                    >
                      <User size={14} /> Account
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: 'var(--r-md)', color: 'var(--accent)', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}
                        className="dropdown-item"
                      >
                        <Shield size={14} /> Admin Panel
                      </Link>
                    )}
                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: 'var(--r-md)', color: 'var(--danger)', fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                      className="dropdown-item"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Logged out */
              <div style={{ display: 'flex', gap: '8px' }} className="hide-mobile">
                <Button href="/login" variant="ghost" size="sm">Login</Button>
                <Button href="/courses" variant="primary" size="sm">Browse Courses</Button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)',
                padding: '8px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'none',
              }}
              className="show-mobile"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--bg-base)',
          zIndex: 45,
          paddingTop: 'calc(var(--nav-height) + 24px)',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px 24px 40px',
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  padding: '14px 16px',
                  borderRadius: 'var(--r-md)',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '24px' }}>
            {session ? (
              <Button href="/portal" variant="primary" size="lg" fullWidth onClick={() => setMobileOpen(false)}>
                My Courses
              </Button>
            ) : (
              <>
                <Button href="/login" variant="secondary" size="lg" fullWidth onClick={() => setMobileOpen(false)}>
                  Login
                </Button>
                <Button href="/courses" variant="primary" size="lg" fullWidth onClick={() => setMobileOpen(false)}>
                  Browse Courses
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .nav-link-hover:hover { color: var(--text-primary) !important; }
        .dropdown-item:hover { background: var(--bg-elevated) !important; color: var(--text-primary) !important; }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  )
}
