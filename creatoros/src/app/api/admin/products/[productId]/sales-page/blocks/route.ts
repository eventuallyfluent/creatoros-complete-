export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest, { params }: { params: { productId: string } })  {

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any

  const product = await prisma.product.findUnique({
    where:   { id: params.productId },
    include: { instructor: { select: { userId: true } }, salesPage: true },
  })
  if (!product?.salesPage) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const isAdmin = user.role === 'ADMIN'
  const isOwner = product.instructor?.userId === user.id
  if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { blocks } = await req.json()
  if (!Array.isArray(blocks)) return NextResponse.json({ error: 'blocks must be array' }, { status: 400 })

  const salesPageId = product.salesPage.id

  // VIDEO is not in the DB enum — store as IMAGE type with content.blockKind='VIDEO'
  const normaliseType = (t: string) => t === 'VIDEO' ? 'IMAGE' : t
  const normaliseContent = (b: any) => {
    if (b.type === 'VIDEO') return { ...b.content, blockKind: 'VIDEO' }
    if (b.type === 'IMAGE') return { ...b.content, blockKind: 'IMAGE' }
    return b.content ?? {}
  }
  await Promise.all(blocks.map((b: any, i: number) => { b = { ...b, type: normaliseType(b.type), content: normaliseContent(b) };
    if (b.id && b.id.length > 5) {
      return prisma.salesPageBlock.upsert({
        where:  { id: b.id },
        create: { id: b.id, salesPageId, type: b.type, sortOrder: i, visible: b.visible ?? true, content: b.content ?? {} },
        update: { sortOrder: i, visible: b.visible ?? true, content: b.content ?? {} },
      })
    }
    return prisma.salesPageBlock.create({
      data: { salesPageId, type: b.type, sortOrder: i, visible: b.visible ?? true, content: b.content ?? {} },
    })
  }))

  const submittedIds = blocks.filter((b: any) => b.id && b.id.length > 5).map((b: any) => b.id)
  await prisma.salesPageBlock.deleteMany({
    where: { salesPageId, id: { notIn: submittedIds } },
  })

  const updated = await prisma.salesPageBlock.findMany({
    where: { salesPageId }, orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ ok: true, blocks: updated })
}