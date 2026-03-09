export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import CollectionEditor from '@/components/admin/CollectionEditor'

export const metadata: Metadata = { title: 'New Collection — Admin' }

export default async function NewCollectionPage() {
  const courses = await prisma.course.findMany({
    where:   { status: { not: 'ARCHIVED' } },
    select:  { id: true, title: true, slug: true, thumbnailUrl: true },
    orderBy: { title: 'asc' },
  }).catch(() => [])
  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title="New Collection" backHref="/admin/collections" backLabel="Collections" />
      <CollectionEditor courses={courses} />
    </div>
  )
}
