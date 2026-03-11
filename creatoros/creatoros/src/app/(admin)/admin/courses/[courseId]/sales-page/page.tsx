export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { createProductForCourse } from '@/lib/product/product-defaults'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import SalesPageEditor from './SalesPageEditor'

export const metadata: Metadata = { title: 'Sales Page — Admin' }

export default async function SalesPageEditorPage({ params }: { params: { courseId: string } }) {
  const course = await prisma.course.findUnique({
    where:   { id: params.courseId },
    include: {
      instructor: true,
      products:   {
        include: {
          product: {
            include: {
              salesPage:    { include: { blocks: { orderBy: { sortOrder: 'asc' } } } },
              salesPrompts: true,
            },
          },
        },
        take: 1,
      },
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
  }).catch(() => null)

  if (!course) notFound()

  // Get or create the product for this course
  let product = course.products[0]?.product ?? null

  if (!product) {
    // Create product + sales page records
    await createProductForCourse(course.id, {
      title: course.title,
      slug:  course.slug ?? course.id,
      price: 0,
    })
    // Reload
    const fresh = await prisma.course.findUnique({
      where:   { id: params.courseId },
      include: {
        instructor: true,
        products: {
          include: {
            product: {
              include: {
                salesPage:    { include: { blocks: { orderBy: { sortOrder: 'asc' } } } },
                salesPrompts: true,
              },
            },
          },
          take: 1,
        },
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
    }).catch(() => null)
    if (!fresh) notFound()
    return renderPage(fresh)
  }

  return renderPage(course)
}

function renderPage(course: any) {
  const product = course.products?.[0]?.product ?? null
  // Flatten for SalesPageEditor — pass product's salesPage/salesPrompts as top-level
  const courseWithPage = {
    ...course,
    salesPage:    product?.salesPage    ?? null,
    salesPrompts: product?.salesPrompts ?? null,
    productId:    product?.id           ?? null,
  }

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title={`Sales Page — ${course.title}`}
        backHref={`/admin/courses/${course.id}/edit`}
        backLabel="← Back to Course"
        action={{ label: 'View Live Page →', href: `/courses/${course.slug}` }}
      />
      <SalesPageEditor course={courseWithPage} />
    </div>
  )
}
