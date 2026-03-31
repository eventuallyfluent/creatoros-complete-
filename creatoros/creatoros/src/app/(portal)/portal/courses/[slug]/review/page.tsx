export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import CourseReviews from '@/components/course/CourseReviews'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await prisma.course.findUnique({ where: { slug: params.slug } }).catch(() => null)
  return { title: course ? `Review — ${course.title}` : 'Leave a Review' }
}

export default async function CourseReviewPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect(`/login?callbackUrl=/portal/courses/${params.slug}/review`)

  const userId = (session.user as any).id

  const course = await prisma.course.findUnique({
    where:   { slug: params.slug, status: 'PUBLISHED' },
    include: { instructor: { select: { displayName: true } } },
  }).catch(() => null)
  if (!course) notFound()

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  }).catch(() => null)
  // Must be enrolled — otherwise send them to the sales page
  if (!enrollment || enrollment.status !== 'ACTIVE') {
    redirect(`/courses/${params.slug}`)
  }

  // Check if they already reviewed
  const existingReview = await prisma.courseReview.findUnique({
    where: { courseId_userId: { courseId: course.id, userId } },
  }).catch(() => null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={`/portal/courses/${params.slug}`} style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Back to course
        </Link>
        <span style={{ color: 'var(--border)', fontSize: '12px' }}>·</span>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{course.title}</span>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {existingReview ? 'Update Your Review' : 'Leave a Review'}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
          {existingReview
            ? `You reviewed ${course.title} on ${new Date(existingReview.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. You can update your review below.`
            : `Share your experience with ${course.title}. Your review helps other students decide if this course is right for them.`}
        </p>

        {/* Reviews component handles both submit form and existing reviews list */}
        <CourseReviews courseId={course.id} isEnrolled={true} focusForm={true} existingRating={existingReview?.rating ?? null} />

        <div style={{ marginTop: '40px', padding: '20px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Reviews are moderated before appearing publicly. Only your first name is shown. You can update your review at any time from this page.
          </p>
        </div>
      </div>
    </div>
  )
}
