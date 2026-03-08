export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { code, type, value, maxUses, expiresAt, startsAt, minimumOrderAmount, isActive, applicableCourseIds } = body

  if (!code?.trim()) return NextResponse.json({ error: 'Code is required' }, { status: 400 })
  if (!value)        return NextResponse.json({ error: 'Value is required' }, { status: 400 })

  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  if (existing) return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })

  const coupon = await prisma.coupon.create({
    data: {
      code:                code.toUpperCase(),
      type:                type ?? 'PERCENTAGE',
      value:               Number(value),
      maxUses:             maxUses ? Number(maxUses) : null,
      expiresAt:           expiresAt ? new Date(expiresAt) : null,
      startsAt:            startsAt  ? new Date(startsAt)  : null,
      minimumOrderAmount:  minimumOrderAmount ? Number(minimumOrderAmount) : null,
      isActive:            isActive ?? true,
      applicableCourseIds: applicableCourseIds ?? [],
    },
  })
  return NextResponse.json(coupon, { status: 201 })
}
