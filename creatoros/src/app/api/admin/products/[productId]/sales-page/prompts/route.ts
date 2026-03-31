export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { generateBlocksFromPrompts } from '@/lib/course/generate-blocks'

export async function POST(req: NextRequest, { params }: { params: { productId: string } })  {

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any

  const product = await prisma.product.findUnique({
    where:   { id: params.productId },
    include: {
      instructor: true,
      salesPage:  true,
      courses: {
        take: 1,
        include: { course: { include: { instructor: true } } },
      },
    },
  })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const isAdmin = user.role === 'ADMIN'
  const isOwner = product.instructor?.userId === user.id
  if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
    where:  { productId: params.productId },
    create: { productId: params.productId, ...promptData },
    update: promptData,
  })

  const prompts = await prisma.salesPagePrompts.findUnique({ where: { productId: params.productId } })
  if (!prompts) return NextResponse.json({ ok: true, blocks: [] })

  // Create salesPage if it doesn't exist yet (older products may not have one)
  const salesPage = product.salesPage ?? await prisma.salesPage.create({
    data: { productId: params.productId, status: 'DRAFT' },
  })

  // generateBlocksFromPrompts expects a course-like shape — adapt product
  const courseShape = {
    id:       params.productId,
    slug:     product.slug,
    title:    product.title,
    subtitle: product.subtitle,
    instructor: product.instructor ?? product.courses[0]?.course.instructor,
  }
  const generatedBlocks = generateBlocksFromPrompts(prompts, courseShape as any)

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