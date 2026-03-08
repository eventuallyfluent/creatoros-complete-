export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { automationId: string } })  {

  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, trigger, isActive, steps } = await req.json()

  // Replace all steps (delete + recreate — simpler than diffing)
  await prisma.automationStep.deleteMany({ where: { automationId: params.automationId } })

  const automation = await prisma.automation.update({
    where: { id: params.automationId },
    data: {
      ...(name     !== undefined && { name }),
      ...(trigger  !== undefined && { trigger }),
      ...(isActive !== undefined && { isActive }),
      steps: steps ? {
        create: steps.map((step: any, i: number) => ({
          action:     step.action,
          actionData: step.actionData ?? {},
          sortOrder:  step.sortOrder ?? i,
        })),
      } : undefined,
    },
    include: { steps: true },
  })

  return NextResponse.json(automation)
}

export async function DELETE(req: NextRequest, { params }: { params: { automationId: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.automation.delete({ where: { id: params.automationId } })
  return NextResponse.json({ deleted: true })
}