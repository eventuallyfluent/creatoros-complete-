export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

function guard(s: any) { return s?.user?.role === 'ADMIN' }

export async function PATCH(req: NextRequest, { params }: { params: { pageId: string } }) {
  const session = await getServerSession(authOptions)
  if (!guard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, slug, body, metaTitle, metaDescription, ogImageUrl, status } = await req.json()

  if (slug) {
    const conflict = await prisma.page.findFirst({ where: { slug, NOT: { id: params.pageId } } })
    if (conflict) return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  // Snapshot existing for revision history (keep last 10)
  const existing = await prisma.page.findUnique({ where: { id: params.pageId } })
  const revisions = [...((existing?.revisions as any[]) ?? [])].slice(-9)
  if (existing) revisions.push({ savedAt: new Date().toISOString(), blocks: existing.blocks })

  const page = await prisma.page.update({
    where: { id: params.pageId },
    data: {
      ...(title            !== undefined && { title }),
      ...(slug             !== undefined && { slug }),
      ...(body             !== undefined && { blocks: [{ id: '1', type: 'TEXT', data: { body }, order: 0 }] }),
      ...(metaTitle        !== undefined && { metaTitle:       metaTitle       || null }),
      ...(metaDescription  !== undefined && { metaDescription: metaDescription || null }),
      ...(ogImageUrl       !== undefined && { ogImageUrl:      ogImageUrl      || null }),
      ...(status           !== undefined && { status, publishedAt: status === 'PUBLISHED' ? new Date() : undefined }),
      revisions,
    },
  })
  return NextResponse.json(page)
}

export async function DELETE(req: NextRequest, { params }: { params: { pageId: string } }) {
  const session = await getServerSession(authOptions)
  if (!guard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Protect system pages from deletion
  const page = await prisma.page.findUnique({ where: { id: params.pageId } })
  if (page && ['privacy', 'terms', 'cookies', 'gdpr', 'contact'].includes(page.slug)) {
    return NextResponse.json({ error: 'System pages cannot be deleted' }, { status: 403 })
  }

  await prisma.page.delete({ where: { id: params.pageId } })
  return NextResponse.json({ deleted: true })
}
