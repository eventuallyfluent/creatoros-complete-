import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import CourseEditor from '@/components/admin/CourseEditor'

export const metadata: Metadata = { title: 'New Course — Admin' }

export default async function NewCoursePage() {
  const instructors = await prisma.instructorProfile.findMany({
    select: { id: true, displayName: true },
    orderBy: { displayName: 'asc' },
  })

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="New Course"
        backHref="/admin/courses"
        backLabel="All Courses"
      />
      <CourseEditor instructors={instructors} />
    </div>
  )
}
