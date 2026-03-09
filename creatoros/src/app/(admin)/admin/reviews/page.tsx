export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import ReviewsModerationClient from './ReviewsModerationClient'

export const metadata: Metadata = { title: 'Reviews — Admin' }

export default async function ReviewsAdminPage() {
  const [reviews, courses] = await Promise.all([
    prisma.courseReview.findMany({
      orderBy: [{ isFeatured: 'desc' }, { status: 'asc' }, { createdAt: 'desc' }],
      include: {
        user:   { select: { name: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    }).catch(() => []),
    prisma.course.findMany({
      select:  { id: true, title: true },
      orderBy: { title: 'asc' },
    }).catch(() => []),
  ])

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Reviews"
        description="Approve student reviews, feature them on sales pages, or import from Payhip"
      />
      <ReviewsModerationClient reviews={reviews as any} courses={courses} />
    </div>
  )
}
