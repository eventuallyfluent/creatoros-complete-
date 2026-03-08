export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

// GET: public — returns approved reviews for a course
export async function GET(_req: NextRequest, { params }: { params: { courseId: string } }) {
  const reviews = await prisma.courseReview.findMany({
    where:   { courseId: params.courseId, status: 'APPROVED' },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const avg = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null

  // Return first name only for privacy
  const publicReviews = reviews.map(r => ({
    ...r,
    user: { firstName: (r.user.name ?? 'Student').split(' ')[0] },
  }))

  return NextResponse.json({ reviews: publicReviews, averageRating: avg, total: reviews.length })
}

// POST: submit a new review (must be enrolled)
export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Sign in to leave a review' }, { status: 401 })

  const userId = (session.user as any).id
  const { rating, comment } = await req.json()

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
  }

  // Must be enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: params.courseId } },
  })
  if (!enrollment || enrollment.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'You must be enrolled to leave a review' }, { status: 403 })
  }

  // One review per student
  const existing = await prisma.courseReview.findUnique({
    where: { courseId_userId: { courseId: params.courseId, userId } },
  })
  if (existing) {
    // Update existing review
    const updated = await prisma.courseReview.update({
      where: { id: existing.id },
      data:  { rating, comment: comment?.trim() || null, status: 'PENDING', updatedAt: new Date() },
    })
    return NextResponse.json(updated)
  }

  const review = await prisma.courseReview.create({
    data: { courseId: params.courseId, userId, rating, comment: comment?.trim() || null, status: 'PENDING' },
  })

  return NextResponse.json(review, { status: 201 })
}
