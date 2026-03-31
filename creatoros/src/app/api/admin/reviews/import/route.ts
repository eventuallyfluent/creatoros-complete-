export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { courseId, rows } = await req.json()
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })
  if (!rows?.length) return NextResponse.json({ error: 'No rows provided' }, { status: 400 })

  // Find or create a placeholder user per email, then upsert review
  let imported = 0
  let skipped  = 0
  const createdReviews: any[] = []

  for (const row of rows) {
    // Payhip CSV headers vary — try common field names
    const email   = row['buyer email'] || row['customer email'] || row['email'] || ''
    const name    = row['buyer name']  || row['customer name']  || row['name']  || email.split('@')[0] || 'Anonymous'
    const ratingRaw = row['rating'] || row['stars'] || row['score'] || ''
    const comment   = row['review'] || row['comment'] || row['feedback'] || row['message'] || ''
    const rating    = parseInt(ratingRaw)

    if (!email || !rating || rating < 1 || rating > 5) { skipped++; continue }

    try {
      // Find or create user by email
      let user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        user = await prisma.user.create({
          data: { email, name, role: 'STUDENT', emailVerified: new Date() },
        })
      }

      // Upsert review (skip if already exists for this user+course)
      const existing = await prisma.courseReview.findUnique({
        where: { courseId_userId: { courseId, userId: user.id } },
      })
      if (existing) { skipped++; continue }

      const review = await prisma.courseReview.create({
        data: { courseId, userId: user.id, rating, comment: comment || null, status: 'APPROVED' },
        include: {
          user:   { select: { name: true, email: true } },
          course: { select: { id: true, title: true, slug: true } },
        },
      })
      createdReviews.push(review)
      imported++
    } catch {
      skipped++
    }
  }

  return NextResponse.json({ imported, skipped, reviews: createdReviews })
}
