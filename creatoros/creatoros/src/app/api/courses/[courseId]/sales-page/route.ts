export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

async function getProductForCourse(courseId: string) {
  const pc = await prisma.productCourse.findFirst({
    where:   { courseId },
    include: {
      product: {
        include: {
          salesPage:    { include: { blocks: { orderBy: { sortOrder: 'asc' } } } },
          salesPrompts: true,
        },
      },
    },
  })
  return pc?.product ?? null
}

async function authCheck(courseId: string, userId: string, role: string) {
  const course = await prisma.course.findUnique({
    where:   { id: courseId },
    include: { instructor: { select: { userId: true } } },
  })
  if (!course) return { course: null, ok: false }
  const ok = role === 'ADMIN' || course.instructor?.userId === userId
  return { course, ok }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const { course, ok } = await authCheck(params.courseId, user.id, user.role)
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!ok)     return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const product = await getProductForCourse(params.courseId)
  if (!product) return NextResponse.json({ error: 'Product not found for this course' }, { status: 404 })

  return NextResponse.json({
    salesPage:    product.salesPage,
    salesPrompts: product.salesPrompts,
    productId:    product.id,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const { course, ok } = await authCheck(params.courseId, user.id, user.role)
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!ok)     return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const product = await getProductForCourse(params.courseId)
  if (!product?.salesPage) return NextResponse.json({ error: 'Sales page not found — save the course first' }, { status: 404 })

  const body = await req.json()
  const { status, metaTitle, metaDescription } = body

  const updated = await prisma.salesPage.update({
    where: { id: product.salesPage.id },
    data: {
      ...(status          !== undefined && { status }),
      ...(metaTitle       !== undefined && { metaTitle }),
      ...(metaDescription !== undefined && { metaDescription }),
    },
    include: { blocks: { orderBy: { sortOrder: 'asc' } } },
  })

  return NextResponse.json({ ok: true, salesPage: updated })
}
