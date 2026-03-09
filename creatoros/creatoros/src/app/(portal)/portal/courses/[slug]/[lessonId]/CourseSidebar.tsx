'use client'
import Link from 'next/link'
import { CheckCircle, Circle, Play, FileText, Download } from 'lucide-react'

interface Lesson {
  id:        string
  title:     string
  type:      string
  duration:  number | null
}
interface Module {
  id:      string
  title:   string
  lessons: Lesson[]
}
interface Props {
  course:          { slug: string; title: string; modules: Module[] }
  currentLessonId: string
  progressMap:     Record<string, { status: string } | undefined>
  progressPct:     number
}

function fmtDuration(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function LessonIcon({ type }: { type: string }) {
  if (type === 'VIDEO')    return <Play size={13} />
  if (type === 'DOWNLOAD') return <Download size={13} />
  return <FileText size={13} />
}

export default function CourseSidebar({ course, currentLessonId, progressMap, progressPct }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        <Link href={`/portal/courses/${course.slug}`} style={{ textDecoration: 'none' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Course</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{course.title}</p>
        </Link>
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Progress</span>
            <span style={{ color: 'var(--accent)' }}>{progressPct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Module + lesson list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {course.modules.map(module => {
          const allDone = module.lessons.every(l => progressMap[l.id]?.status === 'COMPLETED')
          return (
            <div key={module.id}>
              {/* Module header */}
              <div style={{ padding: '10px var(--s4)', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {allDone
                  ? <CheckCircle size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  : <Circle size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                }
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {module.title}
                </span>
              </div>

              {/* Lessons */}
              {module.lessons.map(lesson => {
                const isCurrent = lesson.id === currentLessonId
                const isDone    = progressMap[lesson.id]?.status === 'COMPLETED'
                return (
                  <Link key={lesson.id} href={`/portal/courses/${course.slug}/${lesson.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '10px var(--s4)',
                      background: isCurrent ? 'var(--accent-soft)' : 'transparent',
                      borderLeft: isCurrent ? '3px solid var(--accent)' : '3px solid transparent',
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.15s',
                    }} className="sidebar-lesson-hover">
                      <div style={{ paddingTop: '2px', flexShrink: 0 }}>
                        {isDone
                          ? <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                          : <span style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-muted)' }}><LessonIcon type={lesson.type} /></span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '13px', fontWeight: isCurrent ? 600 : 400,
                          color: isCurrent ? 'var(--accent)' : isDone ? 'var(--text-secondary)' : 'var(--text-primary)',
                          lineHeight: 1.3, marginBottom: '3px',
                          overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>
                          {lesson.title}
                        </p>
                        {lesson.duration && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {fmtDuration(lesson.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>
      <style>{`.sidebar-lesson-hover:hover { background: var(--bg-elevated) !important; }`}</style>
    </div>
  )
}
