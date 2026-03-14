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
  const featuredIds = settings.featuredCourseIds ?? []
  const featured    = featuredIds.map(id => allProducts.find(p => p.id === id || p.courses.some(pc => pc.courseId === id))).filter(Boolean) as typeof allProducts
  const rest        = allProducts.filter(p => !featured.includes(p))
  const courses     = [...featured, ...rest]

  // Collections
  const collections = await prisma.collection.findMany({
    where:   { isPublished: true },
    include: {
      courses: {
        orderBy: { sortOrder: 'asc' },
        include: {
          course: {
            include: {
              instructor: true,
              products: {
                take:    1,
                include: {
                  product: {
                    select: { id: true, slug: true, price: true, compareAtPrice: true, currency: true },
                  },
                },
              },
            },
          },
        },
      },
    },
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
          <h1 className="display-heading" style={{ fontSize: 'clamp(32px, 6vw, 64px)', background: 'linear-gradient(135deg, #F0EAF8 30%, var(--accent) 70%, var(--accent-gold) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 'var(--s4)' }}>
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

      {/* COLLECTIONS */}
      {collections.map((collection: any) => (
        <section key={collection.id} className="section-padding">
          <div className="platform-container">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'var(--s6)', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>Collection</p>
                <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{collection.name}</h2>
                {collection.description && <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '480px' }}>{collection.description}</p>}
              </div>
              <Link href={`/collection/${collection.slug}`} style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--s5)' }}>
              {collection.courses.slice(0, 3).map(({ course }: any) => {
                const product  = course.products?.[0]?.product
                const price    = Number(product?.price ?? 0)
                const cardSlug = product?.slug ?? course.slug
                return (
                  <CourseCard
                    key={course.id}
                    slug={cardSlug}
                    title={course.title}
                    description={course.description ?? undefined}
                    thumbnailUrl={course.thumbnailUrl ?? undefined}
                    price={price}
                    compareAtPrice={product?.compareAtPrice ? Number(product.compareAtPrice) : undefined}
                    currency={product?.currency ?? 'USD'}
                    instructor={course.instructor ? { name: course.instructor.displayName } : undefined}
                    isFree={price === 0}
                    enrollment={enrolledIds.has(course.id) ? { progressPercent: 0, lessonsCompleted: 0, totalLessons: 0 } : undefined}
                  />
                )
              })}
            </div>
          </div>
        </section>
      ))}

      {/* COURSE GRID (no collections) */}
      {collections.length === 0 && courses.length > 0 && (
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
        if (section.type === 'text') return (
          <section key={section.id} className="section-padding">
            <div className="platform-container" style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
              {section.heading && <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--text-primary)', marginBottom: 'var(--s4)' }}>{section.heading}</h2>}
              {section.body && <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{section.body}</p>}
            </div>
          </section>
        )
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
        <section style={{ padding: 'var(--s8) 0', background: 'linear-gradient(135deg, #1A0A2E 0%, var(--bg-base) 100%)' }}>
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
    </>
  )
}
