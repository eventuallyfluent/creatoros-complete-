import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { getSiteSettings } from '@/lib/settings/site-settings'
import CourseCard from '@/components/course/CourseCard'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return { title: s.metaTitle, description: s.metaDescription }
}

export default async function HomePage() {
  const [session, settings] = await Promise.all([
    getServerSession(authOptions),
    getSiteSettings(),
  ])
  const userId = (session?.user as any)?.id

  // Featured reviews from DB (replaces old testimonial model)
  const featuredTestimonials = await prisma.courseReview.findMany({
    where:   { status: 'APPROVED', isFeatured: true },
    orderBy: { createdAt: 'desc' },
    select:  { id: true, rating: true, comment: true,
               user:   { select: { name: true } },
               course: { select: { title: true } } },
  }).then(rows => rows.map(r => ({
    id: r.id, authorName: r.user.name ?? 'Student', authorRole: `Student — ${r.course.title}`,
    quote: r.comment ?? '', course: r.course,
  }))).catch(() => [])

  // Products (source of truth for pricing + slugs)
  const allProducts = await prisma.product.findMany({
    where:   { status: 'PUBLISHED' },
    include: {
      instructor: true,
      courses: {
        orderBy: { sortOrder: 'asc' },
        include: { course: { select: { id: true, slug: true, title: true, description: true, thumbnailUrl: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
  const displayMode  = (settings as any).coursesDisplayMode ?? 'all'
  const featuredIds  = settings.featuredCourseIds ?? []
  const featuredList = featuredIds.map(id => allProducts.find(p => p.id === id || p.courses.some((pc: any) => pc.courseId === id))).filter(Boolean) as typeof allProducts
  const rest         = allProducts.filter(p => !featuredList.includes(p))
  // courses = what to show in the course grid section (mode-dependent)
  const courses = displayMode === 'featured'
    ? featuredList
    : [...featuredList, ...rest]  // 'all' and 'collections' both use full list as fallback

  // Collections — only need basic info + count for card display
  const collections = await prisma.collection.findMany({
    where:   { isPublished: true },
    include: { _count: { select: { courses: true } } },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
  })

  let enrollments: { courseId: string }[] = []
  if (userId) {
    enrollments = await prisma.enrollment.findMany({ where: { userId, status: 'ACTIVE' } })
  }
  const enrolledIds = new Set(enrollments.map((e: any) => e.courseId))

  return (
    <>
      {/* HERO */}
      <section className="hero-bg" style={{ padding: 'var(--s9) 0' }}>
        <div className="platform-container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {settings.heroEyebrow && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 'var(--s4)' }}>
              {settings.heroEyebrow}
            </p>
          )}
          <h1 className="display-heading" style={{ fontSize: 'clamp(32px, 6vw, 64px)', background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent) 70%, var(--accent-gold) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 'var(--s4)' }}>
            {settings.heroHeadline}
          </h1>
          {settings.heroSubtext && (
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto var(--s7)', lineHeight: 1.7 }}>
              {settings.heroSubtext}
            </p>
          )}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {settings.heroPrimaryLabel && (
              <Link href={settings.heroPrimaryHref || '/courses'} style={{ background: 'var(--brand)', color: 'white', padding: '14px 32px', borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: '16px', textDecoration: 'none' }}>
                {settings.heroPrimaryLabel}
              </Link>
            )}
            {settings.heroSecondaryLabel && !session && (
              <Link href={settings.heroSecondaryHref || '/login'} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '14px 32px', borderRadius: 'var(--r-md)', fontWeight: 600, fontSize: '16px', textDecoration: 'none', border: '1px solid var(--border)' }}>
                {settings.heroSecondaryLabel}
              </Link>
            )}
          </div>
          {(settings.heroBadges ?? []).length > 0 && (
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: 'var(--s5)', flexWrap: 'wrap' }}>
              {settings.heroBadges.map((badge: string, i: number) => (
                <p key={i} style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                  {badge}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* COLLECTIONS — card grid, click to browse. Shown in collections mode, or all mode when collections exist */}
      {displayMode === 'collections' && (
        <section className="section-padding">
          <div className="platform-container">
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--s6)' }}>Collections</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--s5)' }} className="collection-overview-grid">
              {collections.map((collection: any) => (
                <Link key={collection.id} href={`/collection/${collection.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="collection-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-hover))' }}>
                      {collection.bannerImageUrl
                        ? <img src={collection.bannerImageUrl} alt={collection.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }} className="collection-card-img" />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 2.5vw, 24px)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.06em', lineHeight: 1.2 }}>{collection.name}</p>
                          </div>
                      }
                    </div>
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{collection.name}</p>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{collection._count?.courses ?? 0} courses →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* COURSE GRID — shown in 'all'/'featured' mode, or collections mode with no collections */}
      {displayMode !== 'collections' && courses.length > 0 && (
        <section className="section-padding">
          <div className="platform-container">
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--s6)' }}>All Courses</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--s5)' }}>
              {courses.map((product: any) => {
                const firstCourse = product.courses?.[0]?.course
                return (
                  <CourseCard
                    key={product.id}
                    slug={product.slug}
                    title={product.title}
                    description={product.description ?? firstCourse?.description ?? undefined}
                    thumbnailUrl={product.thumbnailUrl ?? firstCourse?.thumbnailUrl ?? undefined}
                    price={Number(product.price)}
                    compareAtPrice={product.compareAtPrice ? Number(product.compareAtPrice) : undefined}
                    currency={product.currency}
                    instructor={product.instructor ? { name: product.instructor.displayName } : undefined}
                    isFree={Number(product.price) === 0}
                    enrollment={firstCourse && enrolledIds.has(firstCourse.id) ? { progressPercent: 0, lessonsCompleted: 0, totalLessons: 0 } : undefined}
                  />
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* EXTRA CONTENT SECTIONS */}
      {(settings.homepageSections ?? []).map((section: any) => {
        if (section.type === 'divider') return (
          <div key={section.id} style={{ textAlign: 'center', padding: 'var(--s6) 0', color: 'var(--text-muted)', letterSpacing: '0.5em', fontSize: '14px' }}>✦ ✦ ✦</div>
        )
        if (section.type === 'text') {
          const imgUrl = section.imageUrl?.trim() || null
          const imgPos = section.imagePosition ?? 'right'
          const isTop  = imgPos === 'top'
          return (
            <section key={section.id} className="section-padding">
              <div className="platform-container" style={{ maxWidth: imgUrl && !isTop ? '960px' : '720px', margin: '0 auto' }}>
                {imgUrl && isTop && (
                  <img src={imgUrl} alt={section.heading ?? ''} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px', marginBottom: 'var(--s5)', display: 'block' }} />
                )}
                <div style={{ display: imgUrl && !isTop ? 'flex' : 'block', flexDirection: imgPos === 'left' ? 'row-reverse' : 'row', gap: 'var(--s7)', alignItems: 'center', flexWrap: 'wrap', textAlign: imgUrl ? 'left' : 'center' }}>
                  <div style={{ flex: 1, minWidth: '240px', margin: imgUrl ? undefined : '0 auto' }}>
                    {section.heading && <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--text-primary)', marginBottom: 'var(--s4)' }}>{section.heading}</h2>}
                    {section.body && <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{section.body}</p>}
                  </div>
                  {imgUrl && !isTop && (
                    <div style={{ flexShrink: 0, width: 'clamp(200px, 40%, 420px)' }}>
                      <img src={imgUrl} alt={section.heading ?? ''} style={{ width: '100%', borderRadius: '12px', display: 'block', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )
        }
        if (section.type === 'testimonials') {
          // Use pinned reviewIds if set, otherwise fall back to featured DB reviews
          const dbItems = featuredTestimonials.map(t => ({
            name:  t.authorName,
            role:  t.authorRole ?? '',
            quote: t.quote,
          }))
          const displayItems = dbItems.length > 0 ? dbItems : (section.items ?? []).filter((i: any) => i.quote)
          if (displayItems.length === 0) return null
          return (
            <section key={section.id} className="section-padding">
              <div className="platform-container">
                {section.heading && (
                  <div style={{ textAlign: 'center', marginBottom: 'var(--s6)' }}>
                    <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 'var(--s3)' }}>✦ Testimonials</p>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3vw, 32px)', color: 'var(--text-primary)' }}>{section.heading}</h2>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--s5)' }}>
                  {displayItems.map((item: any, i: number) => (
                    <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 'var(--s6)', display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
                      <p style={{ fontSize: '11px', color: 'var(--accent-gold)', letterSpacing: '0.1em' }}>★ ★ ★ ★ ★</p>
                      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.75, fontStyle: 'italic', flex: 1 }}>"{item.quote}"</p>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{item.name}</p>
                        {item.role && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{item.role}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )
        }
        return null
      })}

      {/* EMAIL OPTIN */}
      {settings.showEmailOptin && (
        <section style={{ padding: 'var(--s8) 0', background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-base) 100%)' }}>
          <div className="platform-container" style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
            <p style={{ fontSize: '20px', color: 'var(--accent-gold)', marginBottom: 'var(--s3)' }}>✦</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--text-primary)', marginBottom: '12px' }}>{settings.emailOptinHeadline}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--s5)', fontSize: '15px' }}>{settings.emailOptinSubtext}</p>
            <form action="/api/subscribers" method="POST" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <input type="email" name="email" placeholder="your@email.com" required style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: '15px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-ui)' }} />
              <button type="submit" style={{ background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', padding: '12px 24px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' }}>Join Free</button>
            </form>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', maxWidth: '400px', margin: '0 auto' }}>
              <input type="checkbox" required style={{ marginTop: '3px', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, textAlign: 'left' }}>
                I agree to receive emails from {settings.siteName}. Unsubscribe any time.{' '}
                <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>.
              </span>
            </label>
          </div>
        </section>
      )}
    <style>{`
      .collection-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important; transform: translateY(-2px); }
      .collection-card:hover .collection-card-img { transform: scale(1.03); }
      @media (max-width: 900px)  { .collection-overview-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      @media (max-width: 560px)  { .collection-overview-grid { grid-template-columns: 1fr !important; } }
    `}</style>
    </>
  )
}
