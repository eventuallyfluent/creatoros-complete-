export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import Image from 'next/image'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await prisma.course.findUnique({ where: { slug: params.slug } }).catch(() => null)
  return { title: course?.title ?? 'Course' }
}

export default async function PortalCourseOverview({ params }: Props) {
  const session = await getServerSession(authOptions)
  const userId  = (session!.user as any).id

  const course = await prisma.course.findUnique({
    where:   { slug: params.slug },
    include: {
      instructor: true,
      modules: {
        where:   { isPublished: true },
        include: { lessons: { where: { isPublished: true }, orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  }).catch(() => null)

  if (!course) notFound()

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  }).catch(() => null)
  if (!enrollment || enrollment.status !== 'ACTIVE') redirect(`/courses/${params.slug}`)

  const allLessons = course.modules.flatMap(m => m.lessons)
  const progressRecords = await prisma.lessonProgress.findMany({
    where:  { userId, courseId: course.id },
    select: { lessonId: true, status: true },
  }).catch(() => [])

  const doneSet        = new Set(progressRecords.filter(p => p.status === 'COMPLETED').map(p => p.lessonId))
  const completedCount = doneSet.size
  const totalCount     = allLessons.length
  const progressPct    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const resumeLesson   = allLessons.find(l => !doneSet.has(l.id)) ?? allLessons[0]

  return (
    <div style={{ padding: 'var(--s7) var(--s6)', maxWidth: '860px' }}>
      <Link href="/portal" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: 'var(--s4)' }}>
        ← Dashboard
      </Link>

      {course.thumbnailUrl && (
        <div style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', marginBottom: 'var(--s5)', height: '240px', position: 'relative' }}>
          <Image src={course.thumbnailUrl} alt={course.title} fill style={{ objectFit: 'cover' }} />
        </div>
      )}

      <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{course.title}</h1>
      {course.instructor && <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 'var(--s4)' }}>by {course.instructor.displayName}</p>}

      <div style={{ marginBottom: 'var(--s5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          <span>{progressPct}% complete</span>
          <span style={{ color: 'var(--accent)' }}>{completedCount} of {totalCount} lessons</span>
        </div>
        <div className="progress-bar" style={{ height: '8px' }}>
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {resumeLesson && progressPct < 100 && (
        <Link href={`/portal/courses/${params.slug}/${resumeLesson.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--brand)', color: 'white', padding: '13px 28px', borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: '16px', textDecoration: 'none', marginBottom: 'var(--s7)' }}>
          {completedCount === 0 ? 'Start Course →' : 'Continue Learning →'}
        </Link>
      )}

      {progressPct === 100 && (
        <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--r-xl)', padding: '20px 24px', marginBottom: 'var(--s7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success)', margin: '0 0 2px' }}>✓ Course completed</p>
            {enrollment.completedAt && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Completed {new Date(enrollment.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/portal/certificates" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'var(--success)', borderRadius: 'var(--r-md)', color: '#0D0D1A', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
              🎓 Certificate
            </Link>
            <Link href={`/portal/courses/${params.slug}/review`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
              ★ Leave a Review
            </Link>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--s5)' }}>Curriculum</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {course.modules.map(module => (
          <div key={module.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--s3) var(--s5)', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>{module.title}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {module.lessons.filter(l => doneSet.has(l.id)).length}/{module.lessons.length}
              </span>
            </div>
            {module.lessons.map(lesson => (
              <Link key={lesson.id} href={`/portal/courses/${params.slug}/${lesson.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px var(--s5)', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
                className="course-lesson-hover"
              >
                <span style={{ flexShrink: 0, color: doneSet.has(lesson.id) ? 'var(--success)' : 'var(--text-muted)', fontSize: '14px' }}>
                  {doneSet.has(lesson.id) ? '✓' : '○'}
                </span>
                <span style={{ fontSize: '14px', color: doneSet.has(lesson.id) ? 'var(--text-secondary)' : 'var(--text-primary)', flex: 1 }}>{lesson.title}</span>
                {lesson.duration && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <style>{`.course-lesson-hover:hover { background: var(--bg-elevated) !important; }`}</style>
    </div>
  )
}
