export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/db/prisma'
import ProductsPageClient from './ProductsPageClient'

export const metadata = { title: 'Products — Admin' }

export default async function AdminProductsPage() {
  const [products, courses, instructors] = await Promise.all([
    prisma.product.findMany({
      include: {
        instructor: { select: { displayName: true } },
        courses:    { include: { course: { select: { id: true } } } },
        _count:     { select: { enrollments: true, orderItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.course.findMany({
      select:  { id: true, title: true, slug: true },
      orderBy: { title: 'asc' },
    }),
    prisma.instructorProfile.findMany({
      select:  { id: true, displayName: true },
      orderBy: { displayName: 'asc' },
    }),
  ]).catch(() => [])

  return (
    <ProductsPageClient
      products={products as any}
      courses={courses}
      instructors={instructors}
    />
  )
}
