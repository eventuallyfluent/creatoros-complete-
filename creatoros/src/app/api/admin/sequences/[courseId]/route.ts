export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { steps, isActive } = await req.json()

  // Upsert the sequence
  const sequence = await prisma.courseEmailSequence.upsert({
    where:  { courseId: params.courseId },
    create: { courseId: params.courseId, isActive: isActive ?? true },
    update: { isActive: isActive ?? true },
  })

  // Replace all steps
  await prisma.courseEmailStep.deleteMany({ where: { sequenceId: sequence.id } })

  if (steps?.length) {
    await prisma.courseEmailStep.createMany({
      data: steps.map((s: any, i: number) => ({
        sequenceId:  sequence.id,
        trigger:     s.trigger,
        delayHours:  s.delayHours ?? 0,
        subject:     s.subject,
        bodyHtml:    s.bodyHtml,
        isActive:    s.isActive ?? true,
        sortOrder:   i,
      })),
    })
  }

  return NextResponse.json({ ok: true })
}
