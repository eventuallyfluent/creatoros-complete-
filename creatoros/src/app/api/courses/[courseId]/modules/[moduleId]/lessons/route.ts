export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
)  {
  try {

  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { title, type, videoProvider, videoId, videoUrl, content, duration, sortOrder, isFree, isPublished, dripDaysAfterEnrollment } = body

  const lesson = await prisma.lesson.create({
    data: {
      moduleId:     params.moduleId,
      courseId:     params.courseId,
      title:        title        || 'New Lesson',
      type:         type         || 'VIDEO',
      videoProvider: videoProvider || 'STREAMABLE',
      videoId:      videoId      || null,
      videoUrl:     videoUrl     || null,
      content:      content      || null,
      duration:     duration     ? Number(duration) : null,
      sortOrder:    sortOrder    ?? 0,
      isFree:       isFree       ?? false,
      isPublished:  isPublished  ?? true,
      dripDaysAfterEnrollment: dripDaysAfterEnrollment ? Number(dripDaysAfterEnrollment) : null,
    },
  })

  return NextResponse.json(lesson, { status: 201 })
}  } catch (error: any) {
    console.error('Route error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}