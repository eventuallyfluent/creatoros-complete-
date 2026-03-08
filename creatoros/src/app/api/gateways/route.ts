export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { provider, name } = await req.json()
  if (!provider || !name) return NextResponse.json({ error: 'provider and name are required' }, { status: 400 })

  const isFirst = (await prisma.paymentGateway.count()) === 0

  const gateway = await prisma.paymentGateway.create({
    data: { provider, name, isActive: true, isDefault: isFirst, config: {} },
  })
  return NextResponse.json(gateway, { status: 201 })
}
