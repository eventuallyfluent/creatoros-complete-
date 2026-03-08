export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

interface Params { params: { productId: string; checkoutPageId: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  try {
    const page = await prisma.checkoutPage.update({
      where: { id: params.checkoutPageId },
      data:  {
        label:               body.label,
        isDefault:           body.isDefault,
        headline:            body.headline ?? null,
        subtext:             body.subtext ?? null,
        guaranteeText:       body.guaranteeText ?? null,
        showCouponField:     body.showCouponField,
        thankYouHeadline:    body.thankYouHeadline ?? null,
        thankYouUrl:         body.thankYouUrl ?? null,
        orderBumpProductId:  body.orderBumpProductId ?? null,
        orderBumpHeadline:   body.orderBumpHeadline ?? null,
        orderBumpDescription:body.orderBumpDescription ?? null,
        orderBumpPrice:      body.orderBumpPrice ?? null,
      },
    })
    return NextResponse.json(page)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Never delete the default page
  const page = await prisma.checkoutPage.findUnique({ where: { id: params.checkoutPageId } })
  if (page?.isDefault) return NextResponse.json({ error: 'Cannot delete the default checkout page' }, { status: 400 })

  await prisma.checkoutPage.delete({ where: { id: params.checkoutPageId } })
  return NextResponse.json({ ok: true })
}
