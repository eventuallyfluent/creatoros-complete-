import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import Image from 'next/image'
import Link from 'next/link'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const inst = await prisma.instructorProfile.findUnique({ where: { slug: params.slug } })
  if (!inst) return { title: 'Instructor Not Found' }
  return {
    title:       `${inst.displayName} — Perseus Arcane Academy`,
    description: inst.bio ? inst.bio.slice(0, 155) : `Courses by ${inst.displayName} at Perseus Arcane Academy`,
  }
}

export default async function InstructorPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const userId  = (session?.user as any)?.id

  const instructor = await prisma.instructorProfile.findUnique({
    where:   { slug: params.slug, isPublic: true },
    include: {
      products: {
        where:   { status: 'PUBLISHED' },
        orderBy: { createdAt: 'asc' },
        include: {
          courses: {
            orderBy: { sortOrder: 'asc' },
            include: { course: { select: { id: true, slug: true, thumbnailUrl: true } } },
          },
        },
      },
    },
  })

  if (!instructor) notFound()

  const enrollments = userId ? await prisma.enrollment.findMany({
    where:  { userId, status: 'ACTIVE' },
    select: { courseId: true },
  }) : []
  const enrolledIds = new Set(enrollments.map((e: any) => e.courseId))

  const social = (instructor.socialLinks ?? {}) as Record<string, string>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Banner */}
      {instructor.bannerImageUrl && (
        <div style={{ width: '100%', height: '240px', position: 'relative', overflow: 'hidden' }}>
          <Image src={instructor.bannerImageUrl} alt="" fill style={{ objectFit: 'cover' }} priority />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, var(--bg-base) 100%)' }} />
        </div>
      )}

      {/* Profile section */}
      <div style={{
        background: instructor.bannerImageUrl ? 'transparent' : 'linear-gradient(160deg, var(--bg-elevated) 0%, var(--bg-base) 60%)',
        paddingTop: instructor.bannerImageUrl ? '0' : 'var(--s8)',
        paddingBottom: 'var(--s8)',
        borderBottom: '1px solid var(--border)',
        marginTop: instructor.bannerImageUrl ? '-80px' : '0',
        position: 'relative',
      }}>
        <div className="platform-container">
          <div style={{ display: 'flex', gap: 'var(--s6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{
              width: '120px', height: '120px', borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0,
              border: '3px solid rgba(192,132,252,0.4)',
              background: 'var(--brand)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              position: 'relative',
            }}>
              {instructor.profileImageUrl ? (
                <Image src={instructor.profileImageUrl} alt={instructor.displayName} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: 700, color: 'white' }}>
                  {instructor.displayName[0]}
                </div>
              )}
            </div>

            {/* Name, title, bio, social */}
            <div style={{ flex: 1, minWidth: '280px', paddingTop: instructor.bannerImageUrl ? 'var(--s4)' : '0' }}>
              <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.2 }}>
                {instructor.displayName}
              </h1>

              {instructor.title && (
                <p style={{ fontSize: '16px', color: 'var(--accent)', marginBottom: '16px', fontWeight: 500 }}>
                  {instructor.title}
                </p>
              )}

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 'var(--s5)', marginBottom: '20px', flexWrap: 'wrap' }}>
                <Stat value={instructor.products.length} label="Courses" />
              </div>

              {/* Bio — full text */}
              {instructor.bio && (
                <div style={{ maxWidth: '680px', marginBottom: '24px' }}>
                  {instructor.bio.split('\n\n').map((para, i) => (
                    <p key={i} style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '12px' }}>
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {/* Social links */}
              {Object.keys(social).length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {social.website && (
                    <SocialLink href={social.website} icon="🌐" label="Website" />
                  )}
                  {social.youtube && (
                    <SocialLink href={social.youtube} icon="▶" label="YouTube" />
                  )}
                  {social.instagram && (
                    <SocialLink href={social.instagram} icon="◉" label="Instagram" />
                  )}
                  {social.twitter && (
                    <SocialLink href={social.twitter} icon="𝕏" label="Twitter / X" />
                  )}
                  {social.facebook && (
                    <SocialLink href={social.facebook} icon="f" label="Facebook" />
                  )}
                  {social.linkedin && (
                    <SocialLink href={social.linkedin} icon="in" label="LinkedIn" />
                  )}
                  {social.tiktok && (
                    <SocialLink href={social.tiktok} icon="♪" label="TikTok" />
                  )}
                  {/* Catch-all for any other links stored */}
                  {Object.entries(social)
                    .filter(([k]) => !['website','youtube','instagram','twitter','facebook','linkedin','tiktok'].includes(k))
                    .map(([key, url]) => (
                      <SocialLink key={key} href={url} icon="🔗" label={key} />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Courses grid */}
      <div className="platform-container" style={{ padding: 'var(--s7) var(--s5)' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--s6)' }}>
          Courses by {instructor.displayName}
        </h2>

        {instructor.products.length === 0 ? (
          <div style={{ padding: 'var(--s8)', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No courses published yet.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--s5)',
          }} className="instructor-course-grid">
            {instructor.products.map(product => {
              const firstCourse = product.courses[0]?.course
              const price       = Number(product.price)
              const isOwned     = !!(firstCourse && enrolledIds.has(firstCourse.id))
              const cardSlug    = product.slug
              const href        = isOwned ? `/portal/courses/${firstCourse?.slug ?? cardSlug}` : `/courses/${cardSlug}`
              return (
                <Link key={product.id} href={href} style={{ textDecoration: 'none' }}>
                  <div className="course-card-hover" style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-xl)', overflow: 'hidden',
                    transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'pointer',
                  }}>
                    {/* Thumbnail */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-hover))' }}>
                      {(product.thumbnailUrl ?? firstCourse?.thumbnailUrl) ? (
                        <Image
                          src={product.thumbnailUrl ?? firstCourse!.thumbnailUrl!}
                          alt={product.title}
                          fill
                          sizes="(max-width: 720px) 50vw, 25vw"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ fontFamily: 'var(--font-display)', fontSize: '10px', color: 'rgba(240,234,248,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PERSEUS</p>
                        </div>
                      )}
                      {isOwned && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--success)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px' }}>
                          ENROLLED
                        </div>
                      )}
                    </div>
                    {/* Title + price */}
                    <div style={{ padding: '14px 16px 16px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                        {product.title}
                      </p>
                      {price === 0 ? (
                        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success)' }}>Free</p>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>${price.toFixed(2)}</p>
                          {product.compareAtPrice && Number(product.compareAtPrice) > price && (
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>${Number(product.compareAtPrice).toFixed(2)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) { .instructor-course-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 720px)  { .instructor-course-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px)  { .instructor-course-grid { grid-template-columns: 1fr !important; } }
        .course-card-hover:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important; transform: translateY(-2px); }
      `}</style>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
    </div>
  )
}

function SocialLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '7px',
        padding: '8px 14px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-pill)',
        fontSize: '13px', fontWeight: 500,
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
      className="social-pill-hover"
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      {label}
    </a>
  )
}
