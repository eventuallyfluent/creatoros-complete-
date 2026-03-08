export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Handles post-purchase magic links (access links emailed after payment)
// Standard login magic links are handled by NextAuth automatically
export async function GET(req: NextRequest)  {
  try {

  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  if (!token || !email) {
    return NextResponse.redirect(new URL('/login?error=InvalidToken', req.url))
  }

  const verificationToken = await prisma.verificationToken.findUnique({ where: { token } })
  if (!verificationToken) {
    return NextResponse.redirect(new URL('/login?error=TokenNotFound', req.url))
  }
  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } })
    return NextResponse.redirect(new URL('/login?error=TokenExpired', req.url))
  }
  if (verificationToken.identifier !== email) {
    return NextResponse.redirect(new URL('/login?error=InvalidToken', req.url))
  }

  // Token valid — consume it
  await prisma.verificationToken.delete({ where: { token } })

  // Get or create user
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({
      data: { email, role: 'STUDENT', emailVerified: new Date() },
    })
  }

  const metadata   = verificationToken.metadata as any
  let redirectTo   = metadata?.redirectTo ?? '/portal'

  if (verificationToken.type === 'POST_PURCHASE' && metadata?.orderId) {
    const order = await prisma.order.findUnique({
      where:   { id: metadata.orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                courses: {
                  orderBy: { sortOrder: 'asc' },
                  include: { course: { select: { id: true, slug: true } } }, // select: { slug: true }
                },
              },
            },
          },
        },
      },
    })

    if (order && order.status === 'PAID') {
      // Fulfil via product → enrol in all included courses
      for (const item of order.items) {
        if (!item.product) continue
        for (const pc of item.product.courses) {
          await prisma.enrollment.upsert({
            where:  { userId_courseId: { userId: user.id, courseId: pc.courseId } },
            create: { userId: user.id, courseId: pc.courseId, productId: item.productId, orderId: order.id, status: 'ACTIVE' },
            update: { status: 'ACTIVE' },
          })
        }
      }
      // Redirect to first course of first product
      const firstCourse = order.items[0]?.product?.courses[0]?.course
      if (firstCourse) redirectTo = `/portal/courses/${firstCourse.slug}`
    }
  }

  return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(redirectTo)}`, req.url))
}  } catch (error: any) {
    console.error('Route error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}