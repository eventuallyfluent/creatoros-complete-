export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import CSVImporter from './CSVImporter'

export const metadata: Metadata = { title: 'Import Students — Admin' }

export default async function ImportStudentsPage() {
  const courses = await prisma.course.findMany({
    where:   { status: { not: 'ARCHIVED' } },
    select:  { id: true, title: true, slug: true },
    orderBy: { title: 'asc' },
  })

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Import Students"
        description="Bulk import from Payhip or any CSV export"
        backHref="/admin/students"
        backLabel="Students"
      />
      <CSVImporter courses={courses} />
    </div>
  )
}
