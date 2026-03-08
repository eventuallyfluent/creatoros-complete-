export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { gatewayId: string } })  {
  try {

  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, isActive, isDefault, config, webhookSecret } = body

  // If setting as default, unset all others first
  if (isDefault) {
    await prisma.paymentGateway.updateMany({ data: { isDefault: false } })
  }

  const gateway = await prisma.paymentGateway.update({
    where: { id: params.gatewayId },
    data: {
      ...(name          !== undefined && { name }),
      ...(isActive      !== undefined && { isActive }),
      ...(isDefault     !== undefined && { isDefault }),
      ...(webhookSecret !== undefined && { webhookSecret }),
      ...(config        !== undefined && { config }),
    },
  })
  return NextResponse.json(gateway)
}

export async function DELETE(req: NextRequest, { params }: { params: { gatewayId: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.paymentGateway.delete({ where: { id: params.gatewayId } })
  return NextResponse.json({ deleted: true })
}  } catch (error: any) {
    console.error('Route error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}