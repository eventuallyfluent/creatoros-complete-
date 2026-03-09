export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

function adminGuard(session: any) {
  return !!(session && session.user?.role === 'ADMIN')
}

export async function PATCH(req: NextRequest, { params }: { params: { collectionId: string } })  {

  const session = await getServerSession(authOptions)
  if (!adminGuard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, slug, description, bannerImageUrl, sortOrder, isFeatured, isPublished, courseIds } = body

  if (slug) {
    const conflict = await prisma.collection.findFirst({
      where: { slug, NOT: { id: params.collectionId } },
    })
    if (conflict) return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const collection = await prisma.collection.update({
    where: { id: params.collectionId },
    data: {
      ...(name           !== undefined && { name }),
      ...(slug           !== undefined && { slug }),
      ...(description    !== undefined && { description:    description    || null }),
      ...(bannerImageUrl !== undefined && { bannerImageUrl: bannerImageUrl || null }),
      ...(sortOrder      !== undefined && { sortOrder }),
      ...(isFeatured     !== undefined && { isFeatured }),
      ...(isPublished    !== undefined && { isPublished }),
    },
  })

  // Re-sync course assignments if provided
  if (Array.isArray(courseIds)) {
    await prisma.courseCollection.deleteMany({ where: { collectionId: params.collectionId } })
    if (courseIds.length > 0) {
      await prisma.courseCollection.createMany({
        data: courseIds.map((courseId: string, i: number) => ({
          collectionId: params.collectionId,
          courseId,
          sortOrder:    i,
        })),
        skipDuplicates: true,
      })
    }
  }

  return NextResponse.json(collection)
}

export async function DELETE(req: NextRequest, { params }: { params: { collectionId: string } }) {
  const session = await getServerSession(authOptions)
  if (!adminGuard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.collection.delete({ where: { id: params.collectionId } })
  return NextResponse.json({ deleted: true })
}