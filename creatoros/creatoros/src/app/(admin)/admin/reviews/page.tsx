export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import ReviewsModerationClient from './ReviewsModerationClient'

export const metadata: Metadata = { title: 'Reviews — Admin' }

export default async function ReviewsAdminPage() {
  const reviews = await prisma.courseReview.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      user:   { select: { name: true, email: true } },
      course: { select: { title: true, slug: true } },
    },
  }).catch(() => [])

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title="Reviews" description="Approve or reject student reviews before they appear on sales pages" />
      <ReviewsModerationClient reviews={reviews as any} />
    </div>
  )
}
