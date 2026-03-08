export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import CollectionEditor from '@/components/admin/CollectionEditor'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Edit Collection — Admin' }

export default async function EditCollectionPage({ params }: { params: { collectionId: string } }) {
  const [collection, allCourses] = await Promise.all([
    prisma.collection.findUnique({
      where:   { id: params.collectionId },
      include: {
        courses: {
          orderBy: { sortOrder: 'asc' },
          include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } } },
        },
      },
    }),
    prisma.course.findMany({
      where:   { status: { not: 'ARCHIVED' } },
      select:  { id: true, title: true, slug: true, thumbnailUrl: true },
      orderBy: { title: 'asc' },
    }),
  ])

  if (!collection) notFound()

  const assignedCourseIds = collection.courses.map(cc => cc.courseId)

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title={collection.name}
        description={`/collection/${collection.slug}`}
        backHref="/admin/collections"
        backLabel="Collections"
        action={{ label: 'View Collection', href: `/collection/${collection.slug}` }}
      />
      <CollectionEditor
        collection={collection as any}
        courses={allCourses}
        assignedCourseIds={assignedCourseIds}
      />
    </div>
  )
}
