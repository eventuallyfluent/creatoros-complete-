export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { getSiteSettings } from '@/lib/settings/site-settings'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import HomepageEditor from './HomepageEditor'

export const metadata: Metadata = { title: 'Homepage — Admin' }

export default async function AdminHomepagePage() {
  const [settings, courses, testimonials] = await Promise.all([
    getSiteSettings(),
    prisma.course.findMany({
      where:   { status: 'PUBLISHED' },
      select:  { id: true, title: true, thumbnailUrl: true },
      orderBy: { title: 'asc' },
    }),
    prisma.testimonial.findMany({
      where:   { status: 'APPROVED' },
      select:  { id: true, authorName: true, authorRole: true, quote: true, isFeatured: true },
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
      <HomepageEditor settings={settings} courses={courses} testimonials={testimonials} />
    </div>
  )
}
