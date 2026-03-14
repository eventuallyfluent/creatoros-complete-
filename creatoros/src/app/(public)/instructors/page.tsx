import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Instructors — Perseus Arcane Academy',
  description: 'Meet the teachers of Perseus Arcane Academy — masters of Hermetics, esoteric traditions, and martial arts.',
}

export default async function InstructorsPage() {
  const instructors = await prisma.instructorProfile.findMany({
    where:   { isPublic: true },
    include: {
      _count: { select: { products: { where: { status: 'PUBLISHED' } } } },
    },
    orderBy: { displayName: 'asc' },
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Header */}
      <div style={{
        padding: 'var(--s8) 0 var(--s7)',
        background: 'linear-gradient(160deg, #1A0A2E 0%, var(--bg-base) 60%)',
        borderBottom: '1px solid var(--border)',
        textAlign: 'center',
      }}>
        <div className="platform-container">
          <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 'var(--s3)' }}>
            ✦ Our Teachers
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Meet the Instructors
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            Masters and practitioners sharing decades of accumulated wisdom across esoteric traditions, martial arts, and occult practice.
          </p>
        </div>
      </div>

      {/* Instructor cards */}
      <div className="platform-container" style={{ padding: 'var(--s8) var(--s5)' }}>
        {instructors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--s9)', border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Instructors coming soon.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
            {instructors.map(inst => {
              const social = (inst.socialLinks ?? {}) as Record<string, string>
              return (
                <Link key={inst.id} href={`/instructors/${inst.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="instructor-card" style={{
                    display: 'flex', gap: 'var(--s6)', alignItems: 'flex-start',
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-xl)', padding: 'var(--s6)',
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                    cursor: 'pointer',
                  }}>

                    {/* Avatar */}
                    <div style={{
                      width: '88px', height: '88px', borderRadius: '50%',
                      flexShrink: 0, overflow: 'hidden',
                      background: 'var(--brand)',
                      border: '2px solid rgba(192,132,252,0.3)',
                      position: 'relative',
                    }}>
                      {inst.profileImageUrl ? (
                        <Image src={inst.profileImageUrl} alt={inst.displayName} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700, color: 'white' }}>
                          {inst.displayName[0]}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {inst.displayName}
                        </h2>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {inst._count.products} course{inst._count.products !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {inst.title && (
                        <p style={{ fontSize: '14px', color: 'var(--accent)', marginBottom: '10px', fontWeight: 500 }}>
                          {inst.title}
                        </p>
                      )}

                      {inst.bio && (
                        <p style={{
                          fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7,
                          marginBottom: '14px',
                          display: '-webkit-box', WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
                        }}>
                          {inst.bio}
                        </p>
                      )}

                      {/* Social pills — small, inline */}
                      {Object.keys(social).length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {social.website  && <MiniSocialLink href={social.website}   icon="🌐" label="Website"   />}
                          {social.youtube  && <MiniSocialLink href={social.youtube}   icon="▶"  label="YouTube"   />}
                          {social.instagram && <MiniSocialLink href={social.instagram} icon="◉"  label="Instagram" />}
                          {social.twitter  && <MiniSocialLink href={social.twitter}   icon="𝕏"  label="X"         />}
                          {social.facebook && <MiniSocialLink href={social.facebook}  icon="f"  label="Facebook"  />}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <span style={{ fontSize: '20px', color: 'var(--text-muted)', flexShrink: 0, alignSelf: 'center' }}>→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        .instructor-card:hover {
          box-shadow: 0 4px 24px rgba(0,0,0,0.25) !important;
          border-color: rgba(192,132,252,0.3) !important;
        }
        .mini-social:hover {
          border-color: var(--accent) !important;
          color: var(--accent) !important;
        }
      `}</style>
    </div>
  )
}

function MiniSocialLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="mini-social"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '4px 10px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-pill)',
        fontSize: '12px', fontWeight: 500,
        color: 'var(--text-muted)',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
    >
      <span>{icon}</span>{label}
    </a>
  )
}
