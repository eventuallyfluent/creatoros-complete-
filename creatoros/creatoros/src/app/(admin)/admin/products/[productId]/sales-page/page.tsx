export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import SalesPageEditor from './SalesPageEditor'

export const metadata: Metadata = { title: 'Sales Page — Admin' }

export default async function ProductSalesPageEditorPage({ params }: { params: { productId: string } }) {
  const product = await prisma.product.findUnique({
    where:   { id: params.productId },
    include: {
      instructor: true,
      salesPage:  { include: { blocks: { orderBy: { sortOrder: 'asc' } } } },
      salesPrompts: true,
      courses: {
        orderBy: { sortOrder: 'asc' },
        include: {
          course: {
            include: {
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
          },
        },
      },
    },
  }).catch(() => null)

  if (!product) notFound()

  // Flatten modules for curriculum preview
  const allModules = product.courses.flatMap(pc => pc.course.modules)

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title={`Sales Page — ${product.title}`}
        description={`/courses/${product.slug}`}
        backHref={`/admin/products/${product.id}`}
        backLabel="Back to Product"
        action={{ label: 'View Live Page', href: `/courses/${product.slug}` }}
      />
      <SalesPageEditor
        product={product as any}
        allModules={allModules as any}
      />
    </div>
  )
}
