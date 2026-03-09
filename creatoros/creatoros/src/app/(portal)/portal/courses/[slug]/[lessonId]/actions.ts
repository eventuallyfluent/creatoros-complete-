'use server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function markLessonComplete(lessonId: string, courseSlug: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')
  const userId = (session.user as any).id

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
  if (!lesson) throw new Error('Lesson not found')

  await prisma.lessonProgress.upsert({
    where:  { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, courseId: lesson.courseId, status: 'COMPLETED', completedAt: new Date() },
    update: { status: 'COMPLETED', completedAt: new Date() },
  })

  // Check if all lessons complete — mark enrollment completed
  const [total, done] = await Promise.all([
    prisma.lesson.count({ where: { courseId: lesson.courseId, isPublished: true } }),
    prisma.lessonProgress.count({ where: { userId, courseId: lesson.courseId, status: 'COMPLETED' } }),
  ])
  if (done >= total) {
    await prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId: lesson.courseId } },
      data:  { completedAt: new Date() },
    })
  }

  // Fire automations
  const { runAutomations } = await import('@/lib/automations/automation-engine')
  await runAutomations('LESSON_COMPLETE', { userId, courseId: lesson.courseId, lessonId })
  if (done >= total) {
    await runAutomations('COURSE_COMPLETE', { userId, courseId: lesson.courseId })

    // Send review invite — fetch user email + course slug
    const [user, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
      prisma.course.findUnique({ where: { id: lesson.courseId }, select: { title: true, slug: true } }),
    ])
    if (user?.email && course) {
      const { sendReviewInviteEmail } = await import('@/lib/email/email-service')
      const firstName = user.name?.split(' ')[0] ?? user.email.split('@')[0]
      await sendReviewInviteEmail(user.email, firstName, course.title, course.slug)
    }
  }

  revalidatePath(`/portal/courses/${courseSlug}`)
  revalidatePath(`/portal/courses/${courseSlug}/${lessonId}`)
}

export async function saveLessonNotes(lessonId: string, notes: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')
  const userId = (session.user as any).id

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
  if (!lesson) throw new Error('Lesson not found')

  await prisma.lessonProgress.upsert({
    where:  { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, courseId: lesson.courseId, notes },
    update: { notes },
  })
}
