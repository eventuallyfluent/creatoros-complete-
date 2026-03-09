export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { generateBlocksFromPrompts } from '@/lib/course/generate-blocks'

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user   = session.user as any
  const course = await prisma.course.findUnique({
    where:   { id: params.courseId },
    include: { instructor: true },
  })
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isAdmin = user.role === 'ADMIN'
  const isOwner = course.instructor?.userId === user.id
  if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Get product + salesPage via ProductCourse join
  const pc = await prisma.productCourse.findFirst({
    where:   { courseId: params.courseId },
    include: {
      product: {
        include: {
          salesPage:    true,
          salesPrompts: true,
        },
      },
    },
  })
  const salesPage    = pc?.product?.salesPage    ?? null
  const productId    = pc?.product?.id           ?? null

  if (!productId || !salesPage) {
    return NextResponse.json({ error: 'Product/sales page not found — save the course first' }, { status: 404 })
  }

  const body = await req.json()

  const promptFields = [
    'headline','subheadline','problem','whoIsItFor','benefits','transformation',
    'whatsIncluded','curriculumSummary','instructorBio','ctaText','ctaSubtext',
    'q_headline','q_subheadline','q_problem','q_whoIsItFor','q_benefits','q_transformation',
    'q_whatsIncluded','q_curriculumSummary','q_instructorBio','q_ctaText','q_ctaSubtext',
  ]

  const promptData: Record<string, string> = {}
  for (const f of promptFields) {
    if (f in body) promptData[f] = body[f] ?? ''
  }

  await prisma.salesPagePrompts.upsert({
    where:  { productId },
    create: { productId, ...promptData },
    update: promptData,
  })

  const prompts = await prisma.salesPagePrompts.findUnique({ where: { productId } })
  if (!prompts) return NextResponse.json({ ok: true, blocks: [] })

  const generatedBlocks = generateBlocksFromPrompts(prompts, course)

  await prisma.salesPageBlock.deleteMany({ where: { salesPageId: salesPage.id } })
  const created = await Promise.all(
    generatedBlocks.map((b, i) =>
      prisma.salesPageBlock.create({
        data: { salesPageId: salesPage.id, type: b.type as any, sortOrder: i, visible: true, content: b.content },
      })
    )
  )

  await prisma.salesPage.update({
    where: { id: salesPage.id },
    data:  { generatedFromPrompts: true, lastGeneratedAt: new Date() },
  })

  return NextResponse.json({ ok: true, blocks: created })
}
