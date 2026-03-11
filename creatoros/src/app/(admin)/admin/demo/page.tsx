export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import DemoClient from './DemoClient'

export const metadata: Metadata = { title: 'Student View Demo — Admin' }

export default async function DemoPage() {
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      instructor: { select: { displayName: true, avatarUrl: true } },
      courses: {
        orderBy: { sortOrder: 'asc' },
        include: {
          course: {
            select: {
              id: true, slug: true, title: true, thumbnailUrl: true, subtitle: true,
              modules: {
                where: { isPublished: true },
                orderBy: { sortOrder: 'asc' },
                include: {
                  lessons: {
                    where: { isPublished: true },
                    orderBy: { sortOrder: 'asc' },
                    select: { id: true, title: true, duration: true, isFree: true, type: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  }).catch(() => [])

  return (
    <div style={{ padding: 'clamp(16px, 3vw, 40px)', maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader
        title="Student View Demo"
        description="Preview exactly what a student sees after enrolling — library, course player, progress. No real enrollment needed."
      />
      <DemoClient products={products as any} />
    </div>
  )
}
