export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const { code, productId } = await req.json()

  if (!code) return NextResponse.json({ valid: false, error: 'No code provided' })

  const coupon = await prisma.coupon.findFirst({
    where: {
      code:     code.toUpperCase(),
      isActive: true,
      OR:  [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] }],
    },
  })

  if (!coupon) return NextResponse.json({ valid: false, error: 'Invalid or expired coupon code.' })
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ valid: false, error: 'This coupon has reached its usage limit.' })
  }

  if (coupon.applicableProductIds.length > 0 && productId) {
    if (!coupon.applicableProductIds.includes(productId)) {
      return NextResponse.json({ valid: false, error: 'This coupon is not valid for this product.' })
    }
  }

  let discountAmount = 0
  let label          = ''

  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { price: true } })
    const price   = Number(product?.price ?? 0)

    if (coupon.type === 'PERCENTAGE') {
      discountAmount = price * (Number(coupon.value) / 100)
      label = `${coupon.value}% off`
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(Number(coupon.value), price)
      label = 'Fixed discount'
    } else if (coupon.type === 'FREE') {
      discountAmount = price
      label = '100% off — Free!'
    }
  }

  return NextResponse.json({
    valid:          true,
    couponId:       coupon.id,
    label:          label || coupon.code,
    discountAmount: Math.round(discountAmount * 100) / 100,
    type:           coupon.type,
    value:          Number(coupon.value),
  })
}
