export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = { title: 'My Library' }

function fmtPercent(completed: number, total: number) {
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

export default async function PortalDashboard() {
  const session = await getServerSession(authOptions)
  const userId  = (session!.user as any).id
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there'

  // ── Load owned products via enrollments ────────────────────────────────
  // Get all active enrollments with their product context
  const enrollments = await prisma.enrollment.findMany({
    where:   { userId, status: 'ACTIVE' },
    include: {
      course: {
        select: {
          id: true, slug: true, title: true, thumbnailUrl: true,
          modules: {
            where:   { isPublished: true },
            include: { lessons: { where: { isPublished: true }, select: { id: true } } },
          },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })

  // Aggregate progress
  const courseIds = enrollments.map(e => e.courseId)
  const progressRecords = await prisma.lessonProgress.findMany({
    where:  { userId, courseId: { in: courseIds }, status: 'COMPLETED' },
    select: { courseId: true },
  })
  const progressMap = new Map<string, number>()
  for (const p of progressRecords) {
    progressMap.set(p.courseId, (progressMap.get(p.courseId) ?? 0) + 1)
  }

  // ── Group enrollments by Product ──────────────────────────────────────
  // For each enrollment, find the owning product (or treat as standalone)
  const productIds = [...new Set(enrollments.map(e => e.productId).filter(Boolean))] as string[]
  const products = await prisma.product.findMany({
    where:   { id: { in: productIds } },
    include: {
      instructor: { select: { displayName: true, profileImageUrl: true } },
      courses: {
        orderBy: { sortOrder: 'asc' },
        include: { course: { select: { id: true, slug: true, title: true, thumbnailUrl: true } } },
      },
    },
  })

  const productMap = new Map(products.map(p => [p.id, p]))

  // Build "library items" — one entry per product owned, plus standalone course enrollments
  type LibraryItem = {
    id: string
    type: 'COURSE' | 'BUNDLE'
    title: string
    thumbnailUrl: string | null
    slug: string           // first course slug for portal entry
    instructor: string | null
    courses: {
      id: string; slug: string; title: string; thumbnailUrl: string | null
      progress: number; total: number; completed: number
    }[]
    enrolledAt: Date
  }

  const seen = new Set<string>()
  const libraryItems: LibraryItem[] = []

  for (const enrollment of enrollments) {
    const productId = enrollment.productId
    if (productId && productMap.has(productId)) {
      if (seen.has(productId)) continue
      seen.add(productId)
      const product = productMap.get(productId)!
      const courseItems = product.courses.map(pc => {
        const c     = pc.course
        const allLessons = c as any // we'll use enrollment course data below
        return c
      })
      // Build course data with progress
      const courseData = product.courses.map(pc => {
        const e = enrollments.find(en => en.courseId === pc.courseId)
        const courseRecord = enrollment.course.id === pc.courseId ? enrollment.course : null
        const totalLessons = courseRecord
          ? courseRecord.modules.reduce((s, m) => s + m.lessons.length, 0)
          : 0
        const completed = progressMap.get(pc.courseId) ?? 0
        return {
          id:          pc.course.id,
          slug:        pc.course.slug,
          title:       pc.course.title,
          thumbnailUrl:pc.course.thumbnailUrl,
          progress:    fmtPercent(completed, totalLessons),
          total:       totalLessons,
          completed,
        }
      })
      libraryItems.push({
        id:          productId,
        type:        product.type as any,
        title:       product.title,
        thumbnailUrl:product.thumbnailUrl ?? product.courses[0]?.course.thumbnailUrl ?? null,
        slug:        product.courses[0]?.course.slug ?? '',
        instructor:  product.instructor?.displayName ?? null,
        courses:     courseData,
        enrolledAt:  enrollment.enrolledAt,
      })
    } else {
      // Standalone enrollment (manual grant, no product)
      if (seen.has(enrollment.courseId)) continue
      seen.add(enrollment.courseId)
      const c         = enrollment.course
      const totalLessons = c.modules.reduce((s, m) => s + m.lessons.length, 0)
      const completed    = progressMap.get(c.id) ?? 0
      libraryItems.push({
        id:          c.id,
        type:        'COURSE',
        title:       c.title,
        thumbnailUrl:c.thumbnailUrl,
        slug:        c.slug,
        instructor:  null,
        courses: [{
          id: c.id, slug: c.slug, title: c.title, thumbnailUrl: c.thumbnailUrl,
          progress: fmtPercent(completed, totalLessons), total: totalLessons, completed,
        }],
        enrolledAt: enrollment.enrolledAt,
      })
    }
  }

  const inProgress = libraryItems.filter(item =>
    item.courses.some(c => c.progress > 0 && c.progress < 100)
  )
  const notStarted = libraryItems.filter(item =>
    item.courses.every(c => c.progress === 0)
  )
  const completed  = libraryItems.filter(item =>
    item.courses.length > 0 && item.courses.every(c => c.progress === 100)
  )

  // ── Render helpers ─────────────────────────────────────────────────────

  function ProgressBar({ pct }: { pct: number }) {
    const color = pct === 100 ? 'var(--success)' : pct > 0 ? 'var(--brand)' : 'var(--bg-elevated)'
    return (
      <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
      </div>
    )
  }

  function ProductCard({ item }: { item: LibraryItem }) {
    const isBundle   = item.type === 'BUNDLE' && item.courses.length > 1
    const overallPct = item.courses.length > 0
      ? Math.round(item.courses.reduce((s, c) => s + c.progress, 0) / item.courses.length)
      : 0

    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', transition: 'border-color 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>

        {/* Thumbnail */}
        <Link href={`/portal/courses/${item.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{ height: '160px', background: 'linear-gradient(135deg, #1A0A2E, #2D1045)', position: 'relative', overflow: 'hidden' }}>
            {item.thumbnailUrl && (
              <Image src={item.thumbnailUrl} alt={item.title} fill style={{ objectFit: 'cover' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,13,26,0.8) 0%, transparent 60%)' }} />
            {isBundle && (
              <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--brand)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--r-pill)', letterSpacing: '0.05em' }}>
                BUNDLE
              </span>
            )}
            {overallPct === 100 && (
              <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--success)', color: '#0D0D1A', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--r-pill)' }}>
                ✓ COMPLETE
              </span>
            )}
          </div>
        </Link>

        <div style={{ padding: '18px 18px 14px' }}>
          <Link href={`/portal/courses/${item.slug}`} style={{ textDecoration: 'none' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
              {item.title}
            </h3>
          </Link>
          {item.instructor && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {item.instructor}
            </p>
          )}

          {/* Progress */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {overallPct === 0 ? 'Not started' : overallPct === 100 ? 'Completed' : `${overallPct}% complete`}
              </span>
              {!isBundle && item.courses[0] && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {item.courses[0].completed}/{item.courses[0].total} lessons
                </span>
              )}
            </div>
            <ProgressBar pct={overallPct} />
          </div>

          {/* Bundle: show included courses */}
          {isBundle && (
            <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {item.courses.map(c => (
                <Link key={c.id} href={`/portal/courses/${c.slug}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '5px 8px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', transition: 'background 0.1s' }}>
                  <span style={{ fontSize: '9px', color: c.progress === 100 ? 'var(--success)' : c.progress > 0 ? 'var(--brand)' : 'var(--text-muted)', flexShrink: 0 }}>
                    {c.progress === 100 ? '✓' : '▶'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>{c.progress}%</span>
                </Link>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link href={`/portal/courses/${item.slug}`}
              style={{ flex: 1, display: 'block', padding: '9px', textAlign: 'center', background: overallPct === 100 ? 'var(--bg-elevated)' : 'var(--brand)', color: overallPct === 100 ? 'var(--text-secondary)' : 'white', borderRadius: 'var(--r-md)', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
              {overallPct === 0 ? 'Start →' : overallPct === 100 ? 'Revisit' : 'Continue →'}
            </Link>
            {overallPct === 100 && (
              <>
                <Link href={`/portal/courses/${item.slug}/review`}
                  style={{ padding: '9px 10px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  ★ Review
                </Link>
                <Link href={`/portal/certificates`}
                  style={{ padding: '9px 10px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', color: 'var(--gold)', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  🎓
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 'var(--s7) var(--s6)' }}>

      {/* Header */}
      <div style={{ marginBottom: 'var(--s7)', paddingBottom: 'var(--s5)', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Welcome back, {firstName} ✦
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          {inProgress.length > 0
            ? `${inProgress.length} item${inProgress.length > 1 ? 's' : ''} in progress.`
            : libraryItems.length > 0 ? 'Your library is waiting.' : 'Start your arcane journey below.'}
        </p>
      </div>

      {/* Empty state */}
      {libraryItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--s9)', background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✦</div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Your library is empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Browse the Academy and enrol in your first course.</p>
          <Link href="/courses" style={{ display: 'inline-flex', background: 'var(--brand)', color: 'white', padding: '12px 24px', borderRadius: 'var(--r-md)', fontWeight: 600, fontSize: '15px', textDecoration: 'none' }}>
            Browse Courses →
          </Link>
        </div>
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
        <ShelfSection label="Continue Learning">
          {inProgress.map(item => <ProductCard key={item.id} item={item} />)}
        </ShelfSection>
      )}

      {/* Not Started */}
      {notStarted.length > 0 && (
        <ShelfSection label="Not Started">
          {notStarted.map(item => <ProductCard key={item.id} item={item} />)}
        </ShelfSection>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <ShelfSection label="Completed ✓">
          {completed.map(item => <ProductCard key={item.id} item={item} />)}
        </ShelfSection>
      )}
    </div>
  )
}

function ShelfSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 'var(--s8)' }}>
      <h2 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--s4)' }}>
        {label}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--s5)' }}>
        {children}
      </div>
    </section>
  )
}
