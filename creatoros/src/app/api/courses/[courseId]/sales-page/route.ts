import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user   = session.user as any
  const course = await prisma.course.findUnique({
    where:   { id: params.courseId },
    include: { instructor: { select: { userId: true } } },
  })
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Allow: admin OR the instructor who owns this course
  const isAdmin      = user.role === 'ADMIN'
  const isOwner      = course.instructor?.userId === user.id
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { blocks, settings } = await req.json()
  if (!Array.isArray(blocks)) {
    return NextResponse.json({ error: 'blocks must be an array' }, { status: 400 })
  }

  const updated = await prisma.course.update({
    where: { id: params.courseId },
    data:  { salesPageData: { blocks, settings } },
  })

  return NextResponse.json({ ok: true, salesPageData: updated.salesPageData })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user   = session.user as any
  const course = await prisma.course.findUnique({
    where:   { id: params.courseId },
    include: { instructor: { select: { userId: true } } },
  })
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isAdmin = user.role === 'ADMIN'
  const isOwner = course.instructor?.userId === user.id
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ salesPageData: course.salesPageData })
}
