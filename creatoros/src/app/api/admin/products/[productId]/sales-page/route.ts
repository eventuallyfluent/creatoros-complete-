export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { productId: string } })  {
  try {

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    include: { instructor: { select: { userId: true } } },
  })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const isAdmin = user.role === 'ADMIN'
  const isOwner = product.instructor?.userId === user.id
  if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { metaTitle, metaDescription } = await req.json()
  await prisma.salesPage.updateMany({
    where: { productId: params.productId },
    data:  { metaTitle, metaDescription },
  })
  return NextResponse.json({ ok: true })
}  } catch (error: any) {
    console.error('Route error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}