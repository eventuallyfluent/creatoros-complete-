export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { reviewId: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { status } = await req.json()
  if (!['APPROVED','REJECTED','PENDING'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const review = await prisma.courseReview.update({
    where: { id: params.reviewId },
    data:  { status },
  })
  return NextResponse.json(review)
}
