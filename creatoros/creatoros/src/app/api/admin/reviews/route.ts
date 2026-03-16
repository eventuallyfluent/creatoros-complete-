export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { courseId, reviewerName, reviewerEmail, rating, comment, isFeatured, reviewDate } = await req.json()

  if (!courseId)       return NextResponse.json({ error: 'courseId required' }, { status: 400 })
  if (!reviewerEmail)  return NextResponse.json({ error: 'reviewerEmail required' }, { status: 400 })
  const ratingNum = parseInt(rating ?? '5')
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5)
    return NextResponse.json({ error: 'rating must be 1–5' }, { status: 400 })

  const email = reviewerEmail.toLowerCase().trim()
  const name  = reviewerName?.trim() || email.split('@')[0]

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({
      data: { email, name, role: 'STUDENT', emailVerified: new Date() },
    })
  } else if (!user.name && name) {
    await prisma.user.update({ where: { id: user.id }, data: { name } })
  }

  const review = await prisma.courseReview.upsert({
    where:  { courseId_userId: { courseId, userId: user.id } },
    create: {
      courseId,
      userId:     user.id,
      rating:     ratingNum,
      comment:    comment?.trim() || null,
      status:     'APPROVED',
      isFeatured: isFeatured === true,
      createdAt:  reviewDate ? new Date(reviewDate) : new Date(),
    },
    update: {
      rating:     ratingNum,
      comment:    comment?.trim() || null,
      status:     'APPROVED',
      isFeatured: isFeatured === true,
    },
    include: {
      user:   { select: { name: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
    },
  })

  return NextResponse.json(review, { status: 201 })
}
