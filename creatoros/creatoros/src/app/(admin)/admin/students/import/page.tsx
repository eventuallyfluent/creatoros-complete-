export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import CSVImporter from './CSVImporter'

export const metadata: Metadata = { title: 'Import Students — Admin' }

export default async function ImportStudentsPage({
  searchParams,
}: {
  searchParams: { courseId?: string }
}) {
  const courses = await prisma.course.findMany({
    where:   { status: { not: 'ARCHIVED' } },
    select:  { id: true, title: true, slug: true },
    orderBy: { title: 'asc' },
  }).catch(() => [])

  const preselectedCourse = courses.find(c => c.id === searchParams.courseId)

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title={preselectedCourse ? `Import Students — ${preselectedCourse.title}` : 'Import Students'}
        description="Upload a CSV of emails. Students will be created and enrolled instantly."
        backHref={preselectedCourse ? `/admin/courses/${preselectedCourse.id}/edit` : '/admin/students'}
        backLabel={preselectedCourse ? 'Back to Course' : 'Students'}
      />
      <CSVImporter courses={courses} preselectedCourseId={searchParams.courseId} />
    </div>
  )
}
