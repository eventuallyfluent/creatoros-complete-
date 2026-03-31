export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import AccountClient from './AccountClient'

export const metadata: Metadata = { title: 'My Account' }

export default async function AccountPage() {
  const session = await getServerSession(authOptions)
  const email   = session!.user!.email!

  // Always look up by email — works for both JWT (admin) and DB (student) sessions
  let user = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, email: true, name: true, image: true, createdAt: true },
  }).catch(() => null)

  // If still missing, create the row (edge case: first admin visit before upsert ran)
  if (!user) {
    user = await prisma.user.create({
      data:   { email, role: (session!.user as any).role ?? 'STUDENT', emailVerified: new Date() },
      select: { id: true, email: true, name: true, image: true, createdAt: true },
    }).catch(() => null)
  }

  // Absolute fallback — render with session data, no crash
  const safeUser = user ?? {
    id: '', email, name: session!.user!.name ?? null, image: null, createdAt: new Date(),
  }

  const uid = user?.id ?? ''

  const [orders, enrollments] = await Promise.all([
    uid ? prisma.order.findMany({
      where:   { userId: uid, status: 'PAID' },
      include: { items: { include: { product: { select: { title: true, slug: true } } } } },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []) : [],
    uid ? prisma.enrollment.findMany({
      where:   { userId: uid, status: 'ACTIVE' },
      include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } } },
      orderBy: { enrolledAt: 'desc' },
    }).catch(() => []) : [],
  ])

  const courseIds = (enrollments as any[]).map(e => e.courseId)

  const [progressMap, completedCourses, lessonTotals] = courseIds.length > 0 ? await Promise.all([
    prisma.lessonProgress.groupBy({
      by: ['courseId'], where: { userId: uid, courseId: { in: courseIds }, status: 'COMPLETED' }, _count: { courseId: true },
    }).catch(() => []),
    prisma.enrollment.findMany({
      where: { userId: uid, completedAt: { not: null } }, select: { courseId: true, completedAt: true },
    }).catch(() => []),
    prisma.lesson.groupBy({
      by: ['courseId'], where: { courseId: { in: courseIds }, isPublished: true }, _count: { id: true },
    }).catch(() => []),
  ]) : [[], [], []]

  const completedMap   = new Map((completedCourses as any[]).map(e => [e.courseId, e.completedAt]))
  const progressCounts = new Map((progressMap as any[]).map(p => [p.courseId, p._count.courseId]))
  const totalMap       = new Map((lessonTotals as any[]).map(l => [l.courseId, l._count.id]))

  const enriched = (enrollments as any[]).map(e => ({
    course: e.course, enrolledAt: e.enrolledAt,
    completedAt: completedMap.get(e.courseId) ?? null,
    lessonsCompleted: progressCounts.get(e.courseId) ?? 0,
    totalLessons: totalMap.get(e.courseId) ?? 0,
  }))

  return <AccountClient user={safeUser as any} orders={orders as any} enrollments={enriched as any} />
}
