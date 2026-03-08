export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const { name } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const user = await prisma.user.update({
    where:  { id: userId },
    data:   { name: name.trim() },
    select: { id: true, name: true, email: true },
  })

  return NextResponse.json(user)
}
