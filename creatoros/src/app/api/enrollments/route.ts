export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

// Free product enrolment (no payment required)
export async function POST(req: NextRequest) {
  // Check session before parsing body — reject unauthenticated requests early
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ requiresLogin: true }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { productId } = body
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

  const userId = (session.user as any).id

  const product = await prisma.product.findUnique({
    where:   { id: productId, status: 'PUBLISHED' },
    include: { courses: { include: { course: { select: { id: true } } } } },
  })

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Only allow free enrolment for free products
  if (Number(product.price) > 0) {
    return NextResponse.json({ error: 'This product requires payment' }, { status: 403 })
  }

  // Enrol in all courses within the product
  for (const pc of product.courses) {
    await prisma.enrollment.upsert({
      where:  { userId_courseId: { userId, courseId: pc.courseId } },
      create: { userId, courseId: pc.courseId, productId: product.id, status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
    })
  }

  return NextResponse.json({ enrolled: true })
}
