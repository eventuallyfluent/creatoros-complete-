export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import TestimonialsClient from './TestimonialsClient'

export const metadata: Metadata = { title: 'Testimonials — Admin' }

export default async function TestimonialsPage() {
  const [testimonials, courses] = await Promise.all([
    prisma.testimonial.findMany({
      include: {
        course: { select: { id: true, title: true, slug: true } },
        user:   { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.course.findMany({
      where:   { status: 'PUBLISHED' },
      select:  { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ]).catch(() => [])

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Testimonials"
        description="Manage student testimonials. Featured & approved testimonials appear on the homepage."
      />
      <TestimonialsClient testimonials={testimonials as any} courses={courses} />
    </div>
  )
}
