export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import NewProductClient from './NewProductClient'

export const metadata: Metadata = { title: 'New Product — Admin' }

export default async function NewProductPage() {
  const [courses, instructors] = await Promise.all([
    prisma.course.findMany({
      select:  { id: true, title: true, slug: true },
      orderBy: { title: 'asc' },
    }),
    prisma.instructorProfile.findMany({
      select:  { id: true, displayName: true },
      orderBy: { displayName: 'asc' },
    }),
  ])

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="New Product"
        backHref="/admin/products"
        backLabel="All Products"
      />
      <NewProductClient courses={courses} instructors={instructors} />
    </div>
  )
}
