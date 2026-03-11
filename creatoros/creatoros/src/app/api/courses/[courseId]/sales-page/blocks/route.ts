export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

async function getSalesPageForCourse(courseId: string) {
  const pc = await prisma.productCourse.findFirst({
    where:   { courseId },
    include: { product: { include: { salesPage: true } } },
  })
  return pc?.product?.salesPage ?? null
}

export async function POST(req: NextRequest, { params }: { params: { courseId: string } })  {
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

  const salesPage = await getSalesPageForCourse(params.courseId)
  if (!salesPage) return NextResponse.json({ error: 'Sales page not found — save the course first' }, { status: 404 })

  const { blocks } = await req.json()
  if (!Array.isArray(blocks)) return NextResponse.json({ error: 'blocks must be array' }, { status: 400 })

  const salesPageId = salesPage.id

  await Promise.all(blocks.map((b: any, i: number) => {
    if (b.id && b.id.length > 5) {
      return prisma.salesPageBlock.upsert({
        where:  { id: b.id },
        create: { id: b.id, salesPageId, type: b.type, sortOrder: i, visible: b.visible ?? true, content: b.content ?? {} },
        update: { sortOrder: i, visible: b.visible ?? true, content: b.content ?? {} },
      })
    } else {
      return prisma.salesPageBlock.create({
        data: { salesPageId, type: b.type, sortOrder: i, visible: b.visible ?? true, content: b.content ?? {} },
      })
    }
  }))

  const submittedIds = blocks.filter((b: any) => b.id && b.id.length > 5).map((b: any) => b.id)
  await prisma.salesPageBlock.deleteMany({
    where: { salesPageId, id: { notIn: submittedIds } },
  })

  const updated = await prisma.salesPageBlock.findMany({
    where:   { salesPageId },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ ok: true, blocks: updated })
}
