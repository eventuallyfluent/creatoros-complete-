export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string; moduleId: string; lessonId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { title, type, videoProvider, videoId, videoUrl, content, duration, sortOrder, isFree, isPublished, dripDaysAfterEnrollment } = body

  const lesson = await prisma.lesson.update({
    where: { id: params.lessonId },
    data: {
      ...(title         !== undefined && { title }),
      ...(type          !== undefined && { type }),
      ...(videoProvider !== undefined && { videoProvider }),
      ...(videoId       !== undefined && { videoId: videoId || null }),
      ...(videoUrl      !== undefined && { videoUrl: videoUrl || null }),
      ...(content       !== undefined && { content: content || null }),
      ...(duration      !== undefined && { duration: duration ? Number(duration) : null }),
      ...(sortOrder     !== undefined && { sortOrder }),
      ...(isFree        !== undefined && { isFree }),
      ...(isPublished   !== undefined && { isPublished }),
      ...(dripDaysAfterEnrollment !== undefined && {
        dripDaysAfterEnrollment: dripDaysAfterEnrollment ? Number(dripDaysAfterEnrollment) : null,
      }),
    },
  })

  return NextResponse.json(lesson)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string; moduleId: string; lessonId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.lesson.delete({ where: { id: params.lessonId } })
  return NextResponse.json({ deleted: true })
}
