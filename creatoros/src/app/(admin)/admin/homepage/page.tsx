export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { getSiteSettings } from '@/lib/settings/site-settings'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import HomepageEditor from './HomepageEditor'

export const metadata: Metadata = { title: 'Homepage — Admin' }

export default async function AdminHomepagePage() {
  const [settings, courses, collections, reviews] = await Promise.all([
    getSiteSettings(),
    prisma.course.findMany({
      where:   { status: 'PUBLISHED' },
      select:  { id: true, title: true, thumbnailUrl: true },
      orderBy: { title: 'asc' },
    }),
    prisma.collection.findMany({
      where:   { isPublished: true },
      select:  { id: true, name: true, slug: true },
      orderBy: { sortOrder: 'asc' },
    }).catch(() => []),
    prisma.courseReview.findMany({
      where:   { status: 'APPROVED' },
      select:  { id: true, rating: true, comment: true, isFeatured: true,
                 user: { select: { name: true } },
                 course: { select: { id: true, title: true } } },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    }).catch(() => []),
  ])

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Homepage"
        description="Edit hero text, featured courses, and content sections"
        action={{ label: 'View Live →', href: '/' }}
      />
      <HomepageEditor settings={settings} courses={courses} collections={collections as any} reviews={reviews as any} />
    </div>
  )
}
