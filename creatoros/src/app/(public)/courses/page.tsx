export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import CourseCard from '@/components/course/CourseCard'

export const metadata: Metadata = {
  title: 'All Courses',
  description: 'Browse all courses at Perseus Arcane Academy',
}

export default async function CoursesPage() {
  const session  = await getServerSession(authOptions)
  const userId   = (session?.user as any)?.id

  const products = await prisma.product.findMany({
    where:   { status: 'PUBLISHED' },
    include: {
      instructor: { select: { displayName: true } },
      courses: {
        orderBy: { sortOrder: 'asc' },
        include: { course: { select: { id: true, slug: true, title: true, description: true, thumbnailUrl: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  let enrolledIds = new Set<string>()
  if (userId) {
    const enrollments = await prisma.enrollment.findMany({
      where:  { userId, status: 'ACTIVE' },
      select: { courseId: true },
    }).catch(() => [])
    enrolledIds = new Set(enrollments.map(e => e.courseId))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--s7) 0 var(--s5)',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-base) 100%)',
      }}>
        <div className="platform-container">
          <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 'var(--s3)' }}>
            All Courses
          </p>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
            Browse the Curriculum
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: 0 }}>
            {products.length} course{products.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* Course grid */}
      <div className="platform-container" style={{ padding: 'var(--s7) var(--s5) var(--s9)' }}>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--s9)', border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>No courses available yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--s5)' }}>
            {products.map(product => {
              const firstCourse = product.courses[0]?.course
              return (
                <CourseCard
                  key={product.id}
                  slug={product.slug}
                  title={product.title}
                  description={firstCourse?.description ?? undefined}
                  thumbnailUrl={product.thumbnailUrl ?? firstCourse?.thumbnailUrl ?? undefined}
                  price={Number(product.price)}
                  compareAtPrice={product.compareAtPrice ? Number(product.compareAtPrice) : undefined}
                  currency={product.currency}
                  instructor={product.instructor ? { name: product.instructor.displayName } : undefined}
                  isFree={Number(product.price) === 0}
                  enrollment={firstCourse && enrolledIds.has(firstCourse.id)
                    ? { progressPercent: 0, lessonsCompleted: 0, totalLessons: 0 }
                    : undefined}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
