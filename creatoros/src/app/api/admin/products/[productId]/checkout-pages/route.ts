export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest, { params }: { params: { productId: string } })  {
  try {

  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { label, isDefault } = await req.json()

  const page = await prisma.checkoutPage.create({
    data: {
      productId:       params.productId,
      label:           label ?? 'New Checkout',
      isDefault:       isDefault ?? false,
      showCouponField: true,
    },
  })

  return NextResponse.json(page, { status: 201 })
}  } catch (error: any) {
    console.error('Route error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}