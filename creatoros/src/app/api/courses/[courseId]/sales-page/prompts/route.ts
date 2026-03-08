export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { generateBlocksFromPrompts } from '@/lib/course/generate-blocks'

export async function POST(req: NextRequest, { params }: { params: { courseId: string } })  {
  try {

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user   = session.user as any
  const course = await prisma.course.findUnique({
    where:   { id: params.courseId },
    include: { instructor: true, salesPage: true },
  })
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isAdmin = user.role === 'ADMIN'
  const isOwner = course.instructor?.userId === user.id
  if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Save prompts
  const promptFields = ['headline','subheadline','problem','whoIsItFor','benefits','transformation',
    'whatsIncluded','curriculumSummary','instructorBio','ctaText','ctaSubtext',
    'q_headline','q_subheadline','q_problem','q_whoIsItFor','q_benefits','q_transformation',
    'q_whatsIncluded','q_curriculumSummary','q_instructorBio','q_ctaText','q_ctaSubtext']

  const promptData: Record<string, string> = {}
  for (const f of promptFields) {
    if (f in body) promptData[f] = body[f] ?? ''
  }

  await prisma.salesPagePrompts.upsert({
    where:  { courseId: params.courseId },
    create: { courseId: params.courseId, ...promptData },
    update: promptData,
  })

  // Re-fetch prompts and regenerate blocks
  const prompts = await prisma.salesPagePrompts.findUnique({ where: { courseId: params.courseId } })
  if (!prompts || !course.salesPage) {
    return NextResponse.json({ ok: true, blocks: [] })
  }

  const generatedBlocks = generateBlocksFromPrompts(prompts, course)

  // Delete and recreate all blocks (prompts → blocks is a full replace)
  await prisma.salesPageBlock.deleteMany({ where: { salesPageId: course.salesPage.id } })
  const created = await Promise.all(
    generatedBlocks.map((b, i) =>
      prisma.salesPageBlock.create({
        data: { salesPageId: course.salesPage!.id, type: b.type as any, sortOrder: i, visible: true, content: b.content },
      })
    )
  )

  await prisma.salesPage.update({
    where: { id: course.salesPage.id },
    data:  { generatedFromPrompts: true, lastGeneratedAt: new Date() },
  })

  return NextResponse.json({ ok: true, blocks: created })
}  } catch (error: any) {
    console.error('Route error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}