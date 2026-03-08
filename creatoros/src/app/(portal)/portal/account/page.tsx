export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import AccountClient from './AccountClient'

export const metadata: Metadata = { title: 'My Account' }

export default async function AccountPage() {
  const session = await getServerSession(authOptions)
  const userId  = (session!.user as any).id

  const [user, orders, enrollments] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, email: true, name: true, image: true, createdAt: true },
    }),
    prisma.order.findMany({
      where:   { userId, status: 'PAID' },
      include: { items: { include: { course: { select: { title: true, slug: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.enrollment.findMany({
      where:   { userId, status: 'ACTIVE' },
      include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } } },
      orderBy: { enrolledAt: 'desc' },
    }),
  ])

  const courseIds   = enrollments.map(e => e.courseId)
  const [progressMap, completedCourses] = await Promise.all([
    prisma.lessonProgress.groupBy({
      by:    ['courseId'],
      where: { userId, courseId: { in: courseIds }, status: 'COMPLETED' },
      _count: { courseId: true },
    }),
    prisma.enrollment.findMany({
      where:  { userId, completedAt: { not: null } },
      select: { courseId: true, completedAt: true },
    }),
  ])

  const lessonTotals = await prisma.lesson.groupBy({
    by:    ['courseId'],
    where: { courseId: { in: courseIds }, isPublished: true },
    _count: { id: true },
  })

  const completedMap   = new Map(completedCourses.map(e => [e.courseId, e.completedAt]))
  const progressCounts = new Map(progressMap.map(p => [p.courseId, p._count.courseId]))
  const totalMap       = new Map(lessonTotals.map(l => [l.courseId, l._count.id]))

  const enriched = enrollments.map(e => ({
    course:         e.course,
    enrolledAt:     e.enrolledAt,
    completedAt:    completedMap.get(e.courseId) ?? null,
    lessonsCompleted: progressCounts.get(e.courseId) ?? 0,
    totalLessons:   totalMap.get(e.courseId) ?? 0,
  }))

  return (
    <AccountClient
      user={user!}
      orders={orders as any}
      enrollments={enriched as any}
    />
  )
}
