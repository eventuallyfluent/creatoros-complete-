export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { price, compareAtPrice, currency, instructorId } = await req.json()

  // Find the product linked to this course
  const pc = await prisma.productCourse.findFirst({
    where: { courseId: params.courseId },
    select: { productId: true },
  })
  if (!pc) return NextResponse.json({ error: 'Product not found for course' }, { status: 404 })

  const product = await prisma.product.update({
    where: { id: pc.productId },
    data: {
      price:          price ?? 0,
      compareAtPrice: compareAtPrice ?? null,
      currency:       currency ?? 'USD',
      instructorId:   instructorId || null,
    },
  })

  return NextResponse.json(product)
}
