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
  const email   = session!.user!.email!

  // Ensure user row exists (admin may have been created via JWT only)
  const user = await prisma.user.upsert({
    where:  { email },
    create: { email, role: (session!.user as any).role ?? 'STUDENT', emailVerified: new Date() },
    update: {},
    select: { id: true, email: true, name: true, image: true, createdAt: true },
  }).catch(async () => {
    return await prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, email: true, name: true, image: true, createdAt: true },
    })
  })

  const [orders, enrollments] = await Promise.all([
    prisma.order.findMany({
      where:   { userId, status: 'PAID' },
      include: { items: { include: { product: { select: { title: true, slug: true } } } } },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
    prisma.enrollment.findMany({
      where:   { userId, status: 'ACTIVE' },
      include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } } },
      orderBy: { enrolledAt: 'desc' },
    }).catch(() => []),
  ])

  const courseIds = enrollments.map((e: any) => e.courseId)

  const [progressMap, completedCourses, lessonTotals] = await Promise.all([
    prisma.lessonProgress.groupBy({
      by: ['courseId'],
      where: { userId, courseId: { in: courseIds }, status: 'COMPLETED' },
      _count: { courseId: true },
    }).catch(() => []),
    prisma.enrollment.findMany({
      where:  { userId, completedAt: { not: null } },
      select: { courseId: true, completedAt: true },
    }).catch(() => []),
    prisma.lesson.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds }, isPublished: true },
      _count: { id: true },
    }).catch(() => []),
  ])

  const completedMap   = new Map(completedCourses.map((e: any) => [e.courseId, e.completedAt]))
  const progressCounts = new Map(progressMap.map((p: any) => [p.courseId, p._count.courseId]))
  const totalMap       = new Map(lessonTotals.map((l: any) => [l.courseId, l._count.id]))

  const enriched = enrollments.map((e: any) => ({
    course:           e.course,
    enrolledAt:       e.enrolledAt,
    completedAt:      completedMap.get(e.courseId) ?? null,
    lessonsCompleted: progressCounts.get(e.courseId) ?? 0,
    totalLessons:     totalMap.get(e.courseId) ?? 0,
  }))

  // Fallback user object if DB lookup failed entirely
  const safeUser = user ?? {
    id:        userId,
    email:     email,
    name:      session!.user!.name ?? null,
    image:     null,
    createdAt: new Date(),
  }

  return (
    <AccountClient
      user={safeUser as any}
      orders={orders as any}
      enrollments={enriched as any}
    />
  )
}
