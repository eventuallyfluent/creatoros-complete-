export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Link from 'next/link'
import ProductEditorClient from './ProductEditorClient'

export const metadata: Metadata = { title: 'Edit Product — Admin' }

export default async function ProductEditorPage({ params }: { params: { productId: string } }) {
  const [product, instructors, allProducts] = await Promise.all([
    prisma.product.findUnique({
      where:   { id: params.productId },
      include: {
        instructor:    true,
        courses: {
          include: {
            course: {
              include: {
                modules: {
                  include: { lessons: { orderBy: { sortOrder: 'asc' } } },
                  orderBy: { sortOrder: 'asc' },
                },
                instructor: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        checkoutPages: { orderBy: { isDefault: 'desc' } },
        salesPage:     { include: { blocks: { orderBy: { sortOrder: 'asc' } } } },
        salesPrompts:  true,
        _count:        { select: { enrollments: true, orderItems: true } },
      },
    })),
    prisma.instructorProfile.findMany({
      select: { id: true, displayName: true }, orderBy: { displayName: 'asc' },
    })),
    prisma.product.findMany({
      where:   { status: 'PUBLISHED' },
      select:  { id: true, title: true, price: true, currency: true },
      orderBy: { title: 'asc' },
    })),
  ])

  if (!product) notFound()

  const statusColor: Record<string, string> = {
    PUBLISHED: '#10b981', DRAFT: '#f59e0b', ARCHIVED: '#6b7280',
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <AdminPageHeader
          title={product.title}
          description={`/courses/${product.slug} · ${product.type === 'BUNDLE' ? `Bundle · ${product.courses.length} courses` : 'Single Course'}`}
          backHref="/admin/products"
          backLabel="All Products"
        />
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'center' }}>
          <Link href={`/checkout/${product.slug}?preview=1`} target="_blank"
            style={{ padding: '9px 18px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#374151', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Preview Checkout →
          </Link>
          <Link href={`/courses/${product.slug}`} target="_blank"
            style={{ padding: '9px 18px', background: '#7B2FBE', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'white', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            View Live Page →
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {[
          { label: 'Students', value: product._count.enrollments },
          { label: 'Sales',    value: product._count.orderItems },
          { label: 'Status',   value: product.status, color: statusColor[product.status] },
          { label: 'Price',    value: Number(product.price) === 0 ? 'Free' : `${product.currency} ${Number(product.price).toFixed(2)}` },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 20px', minWidth: '120px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: (s as any).color ?? '#111827', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <ProductEditorClient
        product={product as any}
        instructors={instructors}
        allProducts={allProducts.filter((p: any) => p.id !== product.id) as any}
      />
    </div>
  )
}
