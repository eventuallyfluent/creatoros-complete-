export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import InstructorEditor from './InstructorEditor'

export const metadata: Metadata = { title: 'Edit Instructor — Admin' }

export default async function EditInstructorPage({ params }: { params: { instructorId: string } }) {
  const instructor = await prisma.instructorProfile.findUnique({
    where:   { id: params.instructorId },
    include: { _count: { select: { products: true } } },
  })
  if (!instructor) notFound()

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title={instructor.displayName}
        description={`/instructors/${instructor.slug}`}
        backHref="/admin/instructors"
        backLabel="All Instructors"
        action={{ label: 'View Public Page ↗', href: `/instructors/${instructor.slug}` }}
      />
      <InstructorEditor instructor={instructor as any} />
    </div>
  )
}
