export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import LessonPlayer from './LessonPlayer'
import CourseSidebar from './CourseSidebar'

interface Props { params: { slug: string; lessonId: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = await prisma.lesson.findUnique({
    where:   { id: params.lessonId },
    include: { course: { select: { title: true } } },
  })
  return { title: lesson ? `${lesson.title} — ${lesson.course.title}` : 'Lesson' }
}

export default async function LessonPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  const userId  = (session!.user as any).id

  const course = await prisma.course.findUnique({
    where:   { slug: params.slug },
    include: {
      modules: {
        where:   { isPublished: true },
        include: { lessons: { where: { isPublished: true }, orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
  if (!course) notFound()

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  })
  if (!enrollment || enrollment.status !== 'ACTIVE') redirect(`/courses/${params.slug}`)

  const allLessons = course.modules.flatMap(m => m.lessons)
  const lesson     = allLessons.find(l => l.id === params.lessonId)
  if (!lesson) {
    if (allLessons[0]) redirect(`/portal/courses/${params.slug}/${allLessons[0].id}`)
    notFound()
  }

  const daysSinceEnroll = Math.floor((Date.now() - enrollment.enrolledAt.getTime()) / 86400000)
  const isDripped = lesson.dripDaysAfterEnrollment !== null && daysSinceEnroll < lesson.dripDaysAfterEnrollment

  const progressRecords = await prisma.lessonProgress.findMany({
    where:  { userId, courseId: course.id },
    select: { lessonId: true, status: true, notes: true },
  })

  const progressMap    = new Map(progressRecords.map(p => [p.lessonId, p]))
  const currentIdx     = allLessons.findIndex(l => l.id === params.lessonId)
  const prevLesson     = allLessons[currentIdx - 1] ?? null
  const nextLesson     = allLessons[currentIdx + 1] ?? null
  const completedCount = progressRecords.filter(p => p.status === 'COMPLETED').length
  const progressPct    = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <LessonPlayer
          lesson={lesson as any}
          courseSlug={params.slug}
          courseTitle={course.title}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          isDripped={isDripped}
          dripDays={lesson.dripDaysAfterEnrollment}
          daysSinceEnroll={daysSinceEnroll}
          isCompleted={progressMap.get(lesson.id)?.status === 'COMPLETED'}
          savedNotes={progressMap.get(lesson.id)?.notes ?? ''}
          progressPct={progressPct}
          completedCount={completedCount}
          totalCount={allLessons.length}
        />
      </div>
      <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-surface)', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}>
        <CourseSidebar
          course={course as any}
          currentLessonId={params.lessonId}
          progressMap={Object.fromEntries(progressMap)}
          progressPct={progressPct}
        />
      </div>
    </div>
  )
}
