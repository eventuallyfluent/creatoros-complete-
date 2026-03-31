export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

// POST — manually enrol a student in a course
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, courseId } = await req.json()
  if (!userId || !courseId) {
    return NextResponse.json({ error: 'userId and courseId required' }, { status: 400 })
  }

  // Verify both exist
  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } }),
    prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true } }),
  ])
  if (!user)   return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const enrollment = await prisma.enrollment.upsert({
    where:  { userId_courseId: { userId, courseId } },
    create: { userId, courseId, status: 'ACTIVE' },
    update: { status: 'ACTIVE' },
  })

  return NextResponse.json({ enrollment, message: `Enrolled in ${course.title}` })
}

// DELETE — revoke a student's enrolment
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, courseId } = await req.json()
  if (!userId || !courseId) {
    return NextResponse.json({ error: 'userId and courseId required' }, { status: 400 })
  }

  await prisma.enrollment.updateMany({
    where:  { userId, courseId },
    data:   { status: 'REVOKED' },
  })

  return NextResponse.json({ message: 'Enrolment revoked' })
}
