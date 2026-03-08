import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, trigger, isActive, steps } = await req.json()
  if (!name?.trim())    return NextResponse.json({ error: 'Name required' },    { status: 400 })
  if (!trigger?.trim()) return NextResponse.json({ error: 'Trigger required' }, { status: 400 })

  const automation = await prisma.automation.create({
    data: {
      name, trigger, isActive: isActive ?? true,
      steps: {
        create: (steps ?? []).map((step: any, i: number) => ({
          action:     step.action,
          actionData: step.actionData ?? {},
          sortOrder:  step.sortOrder ?? i,
        })),
      },
    },
    include: { steps: true },
  })

  return NextResponse.json(automation, { status: 201 })
}
