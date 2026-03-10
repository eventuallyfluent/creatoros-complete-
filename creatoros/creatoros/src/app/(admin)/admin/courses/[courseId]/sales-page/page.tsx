export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { createCourseDefaults } from '@/lib/course/course-defaults'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import SalesPageEditor from './SalesPageEditor'

export const metadata: Metadata = { title: 'Sales Page — Admin' }

export default async function SalesPageEditorPage({ params }: { params: { courseId: string } }) {
  const course = await prisma.course.findUnique({
    where:   { id: params.courseId },
    include: {
      instructor: true,
      salesPage:  { include: { blocks: { orderBy: { sortOrder: 'asc' } } } },
      salesPrompts: true,
      modules: {
        where:   { isPublished: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          lessons: {
            where:   { isPublished: true },
            orderBy: { sortOrder: 'asc' },
            select:  { id: true, title: true, duration: true, isFree: true, type: true },
          },
        },
      },
    },
  }).catch(() => null)
  if (!course) notFound()

  // Auto-create missing records (idempotent)
  if (!course.salesPage || !course.salesPrompts) {
    await createCourseDefaults(course.id, course.title)
    // Reload
    const fresh = await prisma.course.findUnique({
      where:   { id: params.courseId },
      include: {
        instructor:  true,
        salesPage:   { include: { blocks: { orderBy: { sortOrder: 'asc' } } } },
        salesPrompts: true,
        modules: {
          where:   { isPublished: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              where:   { isPublished: true },
              orderBy: { sortOrder: 'asc' },
              select:  { id: true, title: true, duration: true, isFree: true, type: true },
            },
          },
        },
      },
    }).catch(() => null)
    if (!fresh) notFound()
    return renderPage(fresh)
  }

  return renderPage(course)
}

function renderPage(course: any) {
  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title={`Sales Page — ${course.title}`}
        backHref={`/admin/courses/${course.id}/edit`}
        backLabel="← Back to Course"
        action={{ label: 'View Live Page →', href: `/courses/${course.slug}` }}
      />
      <SalesPageEditor course={course} />
    </div>
  )
}
