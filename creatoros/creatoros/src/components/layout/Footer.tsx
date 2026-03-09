import Link from 'next/link'
import Image from 'next/image'
import { getSiteSettings } from '@/lib/settings/site-settings'

export default async function Footer() {
  const settings = await getSiteSettings()
  const social   = (settings.socialLinks ?? {}) as Record<string, string>

  return (
    <footer style={{
      background:  'var(--bg-base)',
      borderTop:   '1px solid var(--border)',
      marginTop:   'auto',
      padding:     '64px 0 0',
    }}>
      <div className="platform-container" style={{ padding: '0 24px 32px' }}>

        {/* Main grid — 4 columns */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr 1.4fr',
          gap:                 '48px',
          marginBottom:        '48px',
        }} className="footer-grid">

          {/* Col 1 — Brand */}
          <div>
            <Link href="/" style={{ display: 'inline-block', marginBottom: '16px' }}>
              <Image
                src="/logo.png"
                alt="Perseus Arcane Academy"
                width={140}
                height={56}
                style={{ height: '44px', width: 'auto', objectFit: 'contain', opacity: 0.9 }}
              />
            </Link>
            <p style={{
              fontSize:     '13px',
              color:        'var(--text-muted)',
              lineHeight:   1.7,
              marginBottom: '24px',
              maxWidth:     '240px',
            }}>
              {settings.footerDescription}
            </p>
            {/* Social icons — only platforms with real URLs */}
            <SocialRow social={social} />
          </div>

          {/* Col 2 — Platform */}
          <div>
            <ColHeading>Platform</ColHeading>
            <FooterLink href="/courses">Courses</FooterLink>
            <FooterLink href="/collection">Collections</FooterLink>
            <FooterLink href="/instructors">Instructors</FooterLink>
            <FooterLink href="https://www.perseusarcaneacademy.com/blog" external>Blog</FooterLink>
            <FooterLink href="/faq">FAQ</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </div>

          {/* Col 3 — Legal */}
          <div>
            <ColHeading>Legal</ColHeading>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/terms">Terms of Service</FooterLink>
            <FooterLink href="/cookies">Cookie Policy</FooterLink>
            <FooterLink href="/gdpr">GDPR Data Request</FooterLink>
            <FooterLink href="/unsubscribe">Unsubscribe</FooterLink>
          </div>

          {/* Col 4 — Email opt-in */}
          <div>
            <ColHeading>{settings.footerOptinHeading}</ColHeading>
            <form action="/api/subscribers" method="POST">
              <input
                type="email"
                name="email"
                placeholder="your@email.com"
                required
                style={{
                  width:        '100%',
                  background:   'var(--bg-elevated)',
                  border:       '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  padding:      '11px 14px',
                  fontSize:     '14px',
                  color:        'var(--text-primary)',
                  marginBottom: '10px',
                  outline:      'none',
                  fontFamily:   'var(--font-ui)',
                  boxSizing:    'border-box',
                }}
              />
              <button
                type="submit"
                style={{
                  width:        '100%',
                  background:   'var(--brand)',
                  color:        'white',
                  border:       'none',
                  borderRadius: 'var(--r-md)',
                  padding:      '12px',
                  fontSize:     '15px',
                  fontWeight:   700,
                  cursor:       'pointer',
                  marginBottom: '12px',
                  fontFamily:   'var(--font-ui)',
                  transition:   'opacity 0.15s',
                }}
                className="footer-btn-hover"
              >
                {settings.footerOptinButtonLabel}
              </button>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                By subscribing you agree to our{' '}
                <Link href="/privacy" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Privacy Policy</Link>.
                {' '}Unsubscribe any time.
              </p>
            </form>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop:      '1px solid var(--border)',
          paddingTop:     '24px',
          paddingBottom:  '24px',
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          flexWrap:       'wrap',
          gap:            '12px',
          fontSize:       '12px',
          color:          'var(--text-muted)',
        }}>
          <span>{settings.footerText || `© ${new Date().getFullYear()} Perseus Arcane Academy. All rights reserved.`}</span>
          <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Built on CreatorOS</span>
        </div>
      </div>

      <style>{`
        .footer-link-hover:hover { color: var(--text-primary) !important; }
        .footer-btn-hover:hover  { opacity: 0.88; }
        .social-btn:hover        { border-color: var(--accent) !important; color: var(--accent) !important; background: var(--accent-soft) !important; }
        @media (max-width: 1024px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 560px)  { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  )
}

function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize:      '11px',
      fontWeight:    700,
      color:         'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      marginBottom:  '16px',
    }}>
      {children}
    </p>
  )
}

function FooterLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  const style: React.CSSProperties = {
    display:        'block',
    fontSize:       '14px',
    color:          'var(--text-secondary)',
    marginBottom:   '11px',
    textDecoration: 'none',
    transition:     'color 0.15s',
  }
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style} className="footer-link-hover">
        {children}
      </a>
    )
  }
  return (
    <Link href={href} style={style} className="footer-link-hover">
      {children}
    </Link>
  )
}

// Only renders platforms that are in settings — YouTube, Instagram, Facebook
function SocialRow({ social }: { social: Record<string, string> }) {
  const PLATFORMS = [
    { key: 'youtube',   icon: '▶', label: 'YouTube'   },
    { key: 'instagram', icon: '◉', label: 'Instagram' },
    { key: 'facebook',  icon: 'f', label: 'Facebook'  },
    { key: 'tiktok',    icon: '♪', label: 'TikTok'    },
    { key: 'twitter',   icon: '𝕏', label: 'X/Twitter' },
  ]
  const active = PLATFORMS.filter(p => social[p.key])
  if (active.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {active.map(p => (
        <a
          key={p.key}
          href={social[p.key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={p.label}
          title={p.label}
          className="social-btn"
          style={{
            width:          '34px',
            height:         '34px',
            borderRadius:   'var(--r-sm)',
            background:     'var(--bg-elevated)',
            border:         '1px solid var(--border)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '14px',
            color:          'var(--text-secondary)',
            textDecoration: 'none',
            transition:     'all 0.15s',
            flexShrink:     0,
          }}
        >
          {p.icon}
        </a>
      ))}
    </div>
  )
}
