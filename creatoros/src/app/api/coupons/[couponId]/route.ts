import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { couponId: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { code, type, value, maxUses, expiresAt, startsAt, minimumOrderAmount, isActive, applicableCourseIds } = body

  if (code) {
    const conflict = await prisma.coupon.findFirst({ where: { code: code.toUpperCase(), NOT: { id: params.couponId } } })
    if (conflict) return NextResponse.json({ error: 'Code already in use' }, { status: 409 })
  }

  const coupon = await prisma.coupon.update({
    where: { id: params.couponId },
    data: {
      ...(code                !== undefined && { code: code.toUpperCase() }),
      ...(type                !== undefined && { type }),
      ...(value               !== undefined && { value: Number(value) }),
      ...(maxUses             !== undefined && { maxUses: maxUses ? Number(maxUses) : null }),
      ...(expiresAt           !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      ...(startsAt            !== undefined && { startsAt:  startsAt  ? new Date(startsAt)  : null }),
      ...(minimumOrderAmount  !== undefined && { minimumOrderAmount: minimumOrderAmount ? Number(minimumOrderAmount) : null }),
      ...(isActive            !== undefined && { isActive }),
      ...(applicableCourseIds !== undefined && { applicableCourseIds }),
    },
  })
  return NextResponse.json(coupon)
}
