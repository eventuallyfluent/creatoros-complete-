export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { reviewId: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const data: any = {}

  if (body.status !== undefined) {
    if (!['APPROVED','REJECTED','PENDING'].includes(body.status))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    data.status = body.status
  }
  if (body.isFeatured !== undefined) {
    data.isFeatured = body.isFeatured
  }

  const review = await prisma.courseReview.update({
    where: { id: params.reviewId },
    data,
  })
  return NextResponse.json(review)
}
