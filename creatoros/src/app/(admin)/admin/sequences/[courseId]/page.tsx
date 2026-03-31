export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import SequenceEditor from '@/components/admin/SequenceEditor'

export const metadata: Metadata = { title: 'Email Sequence — Admin' }

export default async function SequenceEditorPage({ params }: { params: { courseId: string } }) {
  const course = await prisma.course.findUnique({
    where:   { id: params.courseId },
    include: {
      emailSequence: {
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  }).catch(() => null)

  if (!course) notFound()

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title={`${course.title} — Email Sequence`}
        description="Drip emails sent automatically at key moments in the student journey"
        backHref="/admin/sequences"
        backLabel="All Sequences"
      />
      <SequenceEditor course={course as any} />
    </div>
  )
}
