export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

function adminGuard(session: any) {
  return !!(session && session.user?.role === 'ADMIN')
}

export async function GET()  {
  try {

  const collections = await prisma.collection.findMany({
    where:   { isPublished: true },
    include: { _count: { select: { courses: true } } },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
  })
  return NextResponse.json(collections)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!adminGuard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, slug, description, bannerImageUrl, sortOrder, isFeatured, isPublished, courseIds } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!slug?.trim()) return NextResponse.json({ error: 'Slug is required' },  { status: 400 })

  const existing = await prisma.collection.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })

  const collection = await prisma.collection.create({
    data: {
      name,
      slug,
      description:    description    || null,
      bannerImageUrl: bannerImageUrl || null,
      sortOrder:      sortOrder      ?? 0,
      isFeatured:     isFeatured     ?? false,
      isPublished:    isPublished    ?? true,
    },
  })

  // Assign courses
  if (Array.isArray(courseIds) && courseIds.length > 0) {
    await prisma.courseCollection.createMany({
      data: courseIds.map((courseId: string, i: number) => ({
        collectionId: collection.id,
        courseId,
        sortOrder:    i,
      })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json(collection, { status: 201 })
}  } catch (error: any) {
    console.error('Route error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}