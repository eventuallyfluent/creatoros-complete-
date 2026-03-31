export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'

export default async function CourseSalesPageRedirect({ params }: { params: { courseId: string } }) {
  const pc = await prisma.productCourse.findFirst({
    where: { courseId: params.courseId },
    select: { productId: true },
  }).catch(() => null)

  if (pc?.productId) {
    redirect(`/admin/products/${pc.productId}/sales-page`)
  }

  redirect('/admin/products')
}
