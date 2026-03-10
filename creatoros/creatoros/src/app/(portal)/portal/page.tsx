export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import PortalDashboardClient from './PortalDashboardClient'

export const metadata: Metadata = { title: 'My Library' }

function fmtPercent(completed: number, total: number) {
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

export default async function PortalDashboard() {
  const session   = await getServerSession(authOptions)
  const userId    = (session!.user as any).id
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there'

  const enrollments = await prisma.enrollment.findMany({
    where:   { userId, status: 'ACTIVE' },
    include: {
      course: {
        select: {
          id: true, slug: true, title: true, thumbnailUrl: true,
          modules: {
            where:   { isPublished: true },
            include: { lessons: { where: { isPublished: true }, select: { id: true } } },
          },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  }).catch(() => [])

  const courseIds = enrollments.map((e: any) => e.courseId)

  const progressRecords = await prisma.lessonProgress.findMany({
    where:  { userId, courseId: { in: courseIds }, status: 'COMPLETED' },
    select: { courseId: true },
  }).catch(() => [])

  const progressMap = new Map<string, number>()
  for (const p of progressRecords) {
    progressMap.set(p.courseId, (progressMap.get(p.courseId) ?? 0) + 1)
  }

  const productIds = [...new Set(enrollments.map((e: any) => e.productId).filter(Boolean))] as string[]
  const products = await prisma.product.findMany({
    where:   { id: { in: productIds } },
    include: {
      instructor: { select: { displayName: true } },
      courses: {
        orderBy: { sortOrder: 'asc' },
        include: { course: { select: { id: true, slug: true, title: true, thumbnailUrl: true } } },
      },
    },
  }).catch(() => [])

  const productMap = new Map(products.map((p: any) => [p.id, p]))
  const seen = new Set<string>()
  const libraryItems: any[] = []

  for (const enrollment of enrollments) {
    const productId = (enrollment as any).productId
    if (productId && productMap.has(productId)) {
      if (seen.has(productId)) continue
      seen.add(productId)
      const product = productMap.get(productId)!
      const courseData = (product as any).courses.map((pc: any) => {
        const courseRecord = enrollment.course.id === pc.courseId ? enrollment.course : null
        const totalLessons = courseRecord
          ? courseRecord.modules.reduce((s: number, m: any) => s + m.lessons.length, 0)
          : 0
        const completed = progressMap.get(pc.courseId) ?? 0
        return {
          id: pc.course.id, slug: pc.course.slug, title: pc.course.title,
          thumbnailUrl: pc.course.thumbnailUrl,
          progress: fmtPercent(completed, totalLessons), total: totalLessons, completed,
        }
      })
      libraryItems.push({
        id: productId, type: (product as any).type, title: (product as any).title,
        thumbnailUrl: (product as any).thumbnailUrl ?? (product as any).courses[0]?.course.thumbnailUrl ?? null,
        slug: (product as any).courses[0]?.course.slug ?? '',
        instructor: (product as any).instructor?.displayName ?? null,
        courses: courseData, enrolledAt: enrollment.enrolledAt,
      })
    } else {
      if (seen.has(enrollment.courseId)) continue
      seen.add(enrollment.courseId)
      const c = enrollment.course
      const totalLessons = c.modules.reduce((s: number, m: any) => s + m.lessons.length, 0)
      const completed = progressMap.get(c.id) ?? 0
      libraryItems.push({
        id: c.id, type: 'COURSE', title: c.title, thumbnailUrl: c.thumbnailUrl, slug: c.slug,
        instructor: null,
        courses: [{ id: c.id, slug: c.slug, title: c.title, thumbnailUrl: c.thumbnailUrl,
          progress: fmtPercent(completed, totalLessons), total: totalLessons, completed }],
        enrolledAt: enrollment.enrolledAt,
      })
    }
  }

  return <PortalDashboardClient firstName={firstName} libraryItems={libraryItems} />
}
