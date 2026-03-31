export const dynamic = 'force-dynamic'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'

export default async function EditCoursePage({ params }: { params: { courseId: string } }) {
  const pc = await prisma.productCourse.findFirst({
    where: { courseId: params.courseId },
    select: { productId: true },
  }).catch(() => null)

  if (pc?.productId) {
    redirect(`/admin/products/${pc.productId}`)
  }

  // No product yet — send to products page where they can create one
  redirect('/admin/products')
}
