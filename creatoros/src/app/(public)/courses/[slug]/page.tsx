import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import Link from 'next/link'
import EnrollButton from './EnrollButton'
import CourseReviews from '@/components/course/CourseReviews'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where:   { slug: params.slug },
    include: { salesPage: true },
  })
  if (!product) return { title: 'Not Found' }
  return {
    title:       product.salesPage?.metaTitle ?? product.metaTitle ?? product.title,
    description: product.salesPage?.metaDescription ?? product.metaDescription ?? product.description ?? undefined,
  }
}

function fmtDuration(s: number | null): string | null {
  if (!s || s <= 0) return null
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m}m`
  return null
}

export default async function CourseSalesPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const userId  = (session?.user as any)?.id

  // ── Load Product (primary record for this slug) ─────────────────────────
  const product = await prisma.product.findUnique({
    where:   { slug: params.slug, status: 'PUBLISHED' },
    include: {
      instructor: true,
      salesPage:  { include: { blocks: { where: { visible: true }, orderBy: { sortOrder: 'asc' } } } },
      courses: {
        orderBy: { sortOrder: 'asc' },
        include: {
          course: {
            include: {
              modules: {
                where:   { isPublished: true },
                orderBy: { sortOrder: 'asc' },
                include: {
                  lessons: {
                    where:   { isPublished: true },
                    orderBy: { sortOrder: 'asc' },
                    select:  { id: true, title: true, type: true, duration: true, isFree: true },
                  },
                },
              },
              reviews: { where: { status: 'APPROVED' } },
            },
          },
        },
      },
    },
  })

  if (!product) notFound()

  // ── Enrollment check ────────────────────────────────────────────────────
  // Enrolled in any of the product's courses = enrolled in product
  const courseIds = product.courses.map(pc => pc.courseId)
  let isEnrolled  = false
  if (userId && courseIds.length > 0) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, courseId: { in: courseIds }, status: 'ACTIVE' },
    })
    isEnrolled = !!enrollment
  }

  // ── Aggregate lesson/duration data across all courses in product ────────
  const allModules  = product.courses.flatMap(pc => pc.course.modules)
  const allLessons  = allModules.flatMap(m => m.lessons)
  const totalDur    = allLessons.reduce((s, l) => s + (l.duration ?? 0), 0)
  const durationLabel = fmtDuration(totalDur)

  // Portal entry point: first course's slug
  const firstCourse  = product.courses[0]?.course
  const portalSlug   = firstCourse?.slug ?? params.slug

  // Reviews come from all courses in the product
  const allCourseIds = courseIds

  // Pricing
  const price   = Number(product.price)
  const compare = product.compareAtPrice ? Number(product.compareAtPrice) : null
  const isFree  = price === 0

  const blocks = product.salesPage?.blocks ?? []

  const S = {
    container: { maxWidth: '1080px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px)' } as React.CSSProperties,
    section:   { padding: 'clamp(40px, 6vw, 72px) 0' } as React.CSSProperties,
  }

  // ── BUY BOX ─────────────────────────────────────────────────────────────
  function BuyBox({ ctaLabel }: { ctaLabel: string }) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '24px', position: 'sticky', top: '84px' }}>
        <div style={{ marginBottom: '18px' }}>
          {isFree
            ? <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Free</p>
            : <>
                <p style={{ fontSize: '34px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>{product.currency} {price.toFixed(2)}</p>
                {compare && <p style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'line-through', marginTop: '4px' }}>{product.currency} {compare.toFixed(2)}</p>}
              </>}
        </div>
        {isEnrolled
          ? <>
              <Link href={`/portal/courses/${portalSlug}`} style={{ display: 'block', padding: '13px', textAlign: 'center', background: 'var(--success)', color: '#0D0D1A', borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: '15px', textDecoration: 'none', marginBottom: '8px' }}>Go to Course →</Link>
              <Link href={`/portal/courses/${portalSlug}/review`} style={{ display: 'block', padding: '11px', textAlign: 'center', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--r-md)', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>★ Leave a Review</Link>
            </>
          : <EnrollButton
              productId={product.id}
              productSlug={product.slug}
              portalSlug={portalSlug}
              price={price}
              currency={product.currency}
              label={ctaLabel}
            />}
        {/* Auto-includes */}
        {allLessons.length > 0 && (
          <ul style={{ listStyle: 'none', marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {[
              `${allLessons.length} lesson${allLessons.length > 1 ? 's' : ''}`,
              durationLabel ? `${durationLabel} of content` : null,
              product.type === 'BUNDLE' ? `${product.courses.length} courses included` : null,
              'Lifetime access',
            ].filter(Boolean).map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--success)', fontSize: '10px', flexShrink: 0 }}>✓</span>{item}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // ── BLOCK RENDERERS ──────────────────────────────────────────────────────
  function renderHero(block: any) {
    const c        = block.content ?? {}
    const headline = c.headline?.trim()    || product.title
    const sub      = c.subheadline?.trim() || product.subtitle || null
    const ctaLabel = c.ctaLabel?.trim()    || 'Enrol Now'
    const badges   = (c.badgeLabels ?? []).filter(Boolean)
    return (
      <section key={block.id} className="hero-bg" style={{ padding: 'var(--s9) 0 var(--s7)' }}>
        <div style={S.container}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--s8)', alignItems: 'start' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 46px)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: sub ? '14px' : '24px' }}>{headline}</h1>
              {sub && <p style={{ fontSize: '19px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: badges.length ? '20px' : '0' }}>{sub}</p>}
              {badges.length > 0 && (
                <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginTop: '16px' }}>
                  {badges.map((b: string, i: number) => (
                    <span key={i} style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />{b}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}><BuyBox ctaLabel={ctaLabel} /></div>
          </div>
        </div>
      </section>
    )
  }

  function renderText(block: any) {
    const c = block.content ?? {}
    if (!c.body?.trim() && !c.heading?.trim()) return null
    return (
      <section key={block.id} style={S.section}>
        <div style={{ ...S.container, maxWidth: '720px', textAlign: c.align === 'center' ? 'center' : 'left', margin: c.align === 'center' ? '0 auto' : undefined }}>
          {c.heading && <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>{c.heading}</h2>}
          {c.body && <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{c.body}</p>}
        </div>
      </section>
    )
  }

  function renderImage(block: any) {
    const c = block.content ?? {}
    // src may be stored as src or url depending on version
    const src = c.src?.trim() || c.url?.trim()
    if (!src) return null
    const layout = c.layout ?? 'full-width'
    const isSide = layout === 'image-left' || layout === 'image-right'
    return (
      <section key={block.id} style={S.section}>
        <div style={S.container}>
          {isSide ? (
            <div style={{ display: 'flex', flexDirection: layout === 'image-right' ? 'row-reverse' : 'row', gap: 'clamp(24px, 5vw, 56px)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0, width: 'clamp(200px, 44%, 440px)' }}>
                <img src={src} alt={c.altText ?? ''} style={{ width: '100%', borderRadius: '12px', display: 'block', objectFit: 'cover' }} />
              </div>
              {c.text && (
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <p style={{ fontSize: '17px', color: 'var(--text-secondary)', lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0 }}>{c.text}</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <img src={src} alt={c.altText ?? ''} style={{ maxWidth: '100%', borderRadius: '12px', display: 'block', margin: '0 auto' }} />
            </div>
          )}
          {c.caption && <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px', fontStyle: 'italic' }}>{c.caption}</p>}
        </div>
      </section>
    )
  }

  function renderVideo(block: any) {
    const c = block.content ?? {}
    if (!c.url?.trim()) return null
    // Convert YouTube watch URL to embed URL
    let embedUrl = c.url.trim()
    const ytMatch = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`
    return (
      <section key={block.id} style={S.section}>
        <div style={{ ...S.container, maxWidth: '800px' }}>
          {c.heading && <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', textAlign: 'center' }}>{c.heading}</h2>}
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
            <iframe src={embedUrl} title={c.caption ?? 'Video'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
          </div>
          {c.caption && <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px', fontStyle: 'italic' }}>{c.caption}</p>}
        </div>
      </section>
    )
  }

  function renderBenefits(block: any) {
    const c     = block.content ?? {}
    const items = (c.items ?? []).filter(Boolean)
    if (items.length === 0) return null
    return (
      <section key={block.id} style={S.section}>
        <div style={S.container}>
          {c.heading && <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>{c.heading}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
            {items.map((item: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                <span style={{ color: 'var(--accent)', fontSize: '11px', marginTop: '3px', flexShrink: 0 }}>✦</span>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  function renderCurriculum(block: any) {
    if (allModules.length === 0) return null
    const c = block.content ?? {}
    // For bundles, group by course
    const isBundleView = product.type === 'BUNDLE' && product.courses.length > 1
    return (
      <section key={block.id} style={{ ...S.section, background: 'rgba(26,26,46,0.5)' }}>
        <div style={S.container}>
          {c.heading && <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{c.heading}</h2>}
          {allLessons.length > 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {allLessons.length} lesson{allLessons.length > 1 ? 's' : ''}
              {isBundleView && ` across ${product.courses.length} courses`}
              {c.showDurations && durationLabel && ` · ${durationLabel} total`}
            </p>
          )}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
            {isBundleView
              ? product.courses.map((pc, ci) => (
                  <details key={pc.courseId} open={ci === 0} style={{ borderBottom: ci < product.courses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <summary style={{ padding: '15px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', listStyle: 'none', userSelect: 'none' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{pc.course.title}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pc.course.modules.flatMap(m => m.lessons).length} lessons</span>
                    </summary>
                    {pc.course.modules.map((mod: any) => (
                      <div key={mod.id}>
                        <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{mod.title}</span>
                        </div>
                        {mod.lessons.map((lesson: any) => (
                          <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 20px 9px 32px', borderTop: '1px solid rgba(46,46,78,0.4)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
                              {lesson.type === 'VIDEO' ? '▶' : lesson.type === 'TEXT' ? '📄' : '📎'}
                            </span>
                            <span style={{ fontSize: '13px', color: lesson.isFree ? 'var(--accent)' : 'var(--text-secondary)', flex: 1 }}>{lesson.title}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </details>
                ))
              : allModules.map((mod: any, mIdx: number) => (
                  <details key={mod.id} open={c.expandFirst && mIdx === 0} style={{ borderBottom: mIdx < allModules.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <summary style={{ padding: '15px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', listStyle: 'none', userSelect: 'none' }}>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{mod.title}</span>
                      {c.showLessonCount && <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '12px' }}>{mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}</span>}
                    </summary>
                    <div>
                      {mod.lessons.map((lesson: any) => {
                        const dur = c.showDurations ? fmtDuration(lesson.duration) : null
                        return (
                          <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px 10px 28px', borderTop: '1px solid rgba(46,46,78,0.4)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
                              {lesson.type === 'VIDEO' ? '▶' : lesson.type === 'TEXT' ? '📄' : '📎'}
                            </span>
                            <span style={{ fontSize: '13px', color: lesson.isFree ? 'var(--accent)' : 'var(--text-secondary)', flex: 1 }}>{lesson.title}</span>
                            {c.showFreePreview && lesson.isFree && <span style={{ fontSize: '10px', padding: '2px 7px', background: 'rgba(52,211,153,0.1)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--r-pill)', fontWeight: 700, flexShrink: 0 }}>FREE</span>}
                            {dur && <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>{dur}</span>}
                          </div>
                        )
                      })}
                    </div>
                  </details>
                ))
            }
          </div>
        </div>
      </section>
    )
  }

  function renderInstructor(block: any) {
    const inst = product.instructor
    if (!inst) return null
    const c   = block.content ?? {}
    const bio = c.bioOverride?.trim() || inst.bio || null
    return (
      <section key={block.id} style={S.section}>
        <div style={{ ...S.container, maxWidth: '720px' }}>
          {c.heading && <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>{c.heading}</h2>}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {c.showAvatar && (
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: 'white', flexShrink: 0, border: '2px solid var(--border-bright)', overflow: 'hidden' }}>
                {inst.profileImageUrl
                  ? <img src={inst.profileImageUrl} alt={inst.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : inst.displayName.charAt(0)}
              </div>
            )}
            <div>
              <p style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>{inst.displayName}</p>
              {inst.title && <p style={{ fontSize: '14px', color: 'var(--accent)', margin: '0 0 12px' }}>{inst.title}</p>}
              {c.showBio && bio && <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{bio}</p>}
            </div>
          </div>
        </div>
      </section>
    )
  }

  async function TestimonialsBlock({ block }: { block: any }) {
    const c = block.content ?? {}
    let items: any[] = c.items ?? []
    if (c.pullFromApproved && allCourseIds.length > 0) {
      const approved = await prisma.testimonial.findMany({
        where:   { courseId: { in: allCourseIds }, status: 'APPROVED' },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        take:    6,
      })
      items = approved.map(t => ({ name: t.authorName, quote: t.quote, role: t.authorRole }))
    }
    const visible = items.filter((i: any) => i.quote?.trim())
    if (visible.length === 0) return null
    return (
      <section style={{ ...S.section, background: 'rgba(26,26,46,0.5)' }}>
        <div style={S.container}>
          {c.heading && <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '28px', textAlign: 'center' }}>{c.heading}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
            {visible.map((item: any, i: number) => (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '22px' }}>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '14px', fontStyle: 'italic' }}>"{item.quote}"</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{item.name}</p>
                {item.role && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.role}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  function renderFaq(block: any) {
    const c     = block.content ?? {}
    const items = (c.items ?? []).filter((i: any) => i.question?.trim())
    if (items.length === 0) return null
    return (
      <section key={block.id} style={S.section}>
        <div style={{ ...S.container, maxWidth: '720px' }}>
          {c.heading && <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', textAlign: 'center' }}>{c.heading}</h2>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item: any, i: number) => (
              <details key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' }}>
                <summary style={{ padding: '15px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
                  {item.question}<span style={{ color: 'var(--text-muted)', marginLeft: '12px', flexShrink: 0 }}>+</span>
                </summary>
                <p style={{ padding: '0 20px 15px', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    )
  }

  function renderCta(block: any) {
    const c        = block.content ?? {}
    const ctaLabel = c.buttonLabel?.trim() || 'Enrol Now'
    const priceStr = c.showPrice && !isFree ? ` — ${product.currency} ${price.toFixed(2)}` : ''
    if (isEnrolled) return null
    return (
      <section key={block.id} style={{ ...S.section, background: 'linear-gradient(135deg, #1A0A2E 0%, var(--bg-base) 100%)', textAlign: 'center' }}>
        <div style={{ ...S.container, maxWidth: '580px', margin: '0 auto' }}>
          {c.heading && <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--text-primary)', marginBottom: '20px' }}>{c.heading}</h2>}
          <EnrollButton productId={product.id} productSlug={product.slug} portalSlug={portalSlug} price={price} currency={product.currency} label={ctaLabel + priceStr} />
          {c.buttonSubtext && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '10px' }}>{c.buttonSubtext}</p>}
        </div>
      </section>
    )
  }

  function renderDivider(block: any) {
    return <div key={block.id} style={{ textAlign: 'center', padding: 'var(--s5) 0', color: 'var(--text-muted)', letterSpacing: '0.5em', fontSize: '13px' }}>✦ ✦ ✦</div>
  }

  async function renderBlock(block: any) {
    switch (block.type) {
      case 'HERO':         return renderHero(block)
      case 'TEXT':         return renderText(block)
      case 'IMAGE':        return (block.content as any)?.blockKind === 'VIDEO' ? renderVideo(block) : renderImage(block)
      case 'BENEFITS':     return renderBenefits(block)
      case 'CURRICULUM':   return renderCurriculum(block)
      case 'INSTRUCTOR':   return renderInstructor(block)
      case 'TESTIMONIALS': return <TestimonialsBlock key={block.id} block={block} />
      case 'FAQ':          return renderFaq(block)
      case 'CTA':          return renderCta(block)
      case 'DIVIDER':      return renderDivider(block)
      default:             return null
    }
  }

  const hasHero       = blocks.some(b => b.type === 'HERO')
  const renderedBlocks = await Promise.all(blocks.map(renderBlock))

  return (
    <div style={{ minHeight: '100vh' }}>
      {!hasHero && (
        <section className="hero-bg" style={{ padding: 'var(--s9) 0 var(--s7)' }}>
          <div style={S.container}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--s8)', alignItems: 'start' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(24px, 4vw, 46px)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: '14px' }}>{product.title}</h1>
                {product.subtitle && <p style={{ fontSize: '19px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{product.subtitle}</p>}
              </div>
              <BuyBox ctaLabel="Enrol Now" />
            </div>
          </div>
        </section>
      )}
      {renderedBlocks}
      {firstCourse && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <CourseReviews courseId={firstCourse.id} isEnrolled={!!isEnrolled} />
        </div>
      )}
    </div>
  )
}
