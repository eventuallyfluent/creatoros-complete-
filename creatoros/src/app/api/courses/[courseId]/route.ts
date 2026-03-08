export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const {
    title, subtitle, slug, description, thumbnailUrl,
    status, instructorId, certificateEnabled, metaTitle, metaDescription,
  } = body

  if (slug) {
    const conflict = await prisma.course.findFirst({
      where: { slug, NOT: { id: params.courseId } },
    })
    if (conflict) return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const course = await prisma.course.update({
    where: { id: params.courseId },
    data: {
      ...(title              !== undefined && { title }),
      ...(subtitle           !== undefined && { subtitle:           subtitle || null }),
      ...(slug               !== undefined && { slug }),
      ...(description        !== undefined && { description:        description || null }),
      ...(thumbnailUrl       !== undefined && { thumbnailUrl:       thumbnailUrl || null }),
      ...(status             !== undefined && { status }),
      ...(instructorId       !== undefined && { instructorId:       instructorId || null }),
      ...(certificateEnabled !== undefined && { certificateEnabled }),
      ...(metaTitle          !== undefined && { metaTitle:          metaTitle || null }),
      ...(metaDescription    !== undefined && { metaDescription:    metaDescription || null }),
    },
  })

  return NextResponse.json(course)
}

export async function DELETE(req: NextRequest, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Archive rather than hard delete — preserves student records and SEO URLs
  await prisma.course.update({
    where: { id: params.courseId },
    data:  { status: 'ARCHIVED' },
  })

  return NextResponse.json({ archived: true })
}
