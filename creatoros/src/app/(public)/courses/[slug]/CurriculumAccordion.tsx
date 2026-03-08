'use client'
import { useState } from 'react'
import { ChevronDown, Play, FileText, Download, Lock } from 'lucide-react'
import Link from 'next/link'

interface Lesson {
  id:       string
  title:    string
  type:     string
  duration: number | null
  isFree:   boolean
  dripDaysAfterEnrollment: number | null
}

interface Module {
  id:      string
  title:   string
  lessons: Lesson[]
}

interface Props {
  modules:    Module[]
  courseSlug: string
  isEnrolled: boolean
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const lessonIcon = (type: string) => {
  if (type === 'VIDEO')    return <Play size={13} />
  if (type === 'DOWNLOAD') return <Download size={13} />
  return <FileText size={13} />
}

export default function CurriculumAccordion({ modules, courseSlug, isEnrolled }: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set([modules[0]?.id]))

  const toggle = (id: string) => {
    setOpen(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {modules.map(module => (
        <div key={module.id} style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
        }}>
          {/* Module header */}
          <button
            onClick={() => toggle(module.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: 'var(--s4) var(--s5)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-primary)', fontFamily: 'var(--font-ui)',
              textAlign: 'left',
            }}
          >
            <div>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>{module.title}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                {module.lessons.length} lessons
              </span>
            </div>
            <ChevronDown
              size={18}
              style={{
                color: 'var(--text-muted)', flexShrink: 0,
                transform: open.has(module.id) ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {/* Lessons list */}
          {open.has(module.id) && (
            <div style={{ borderTop: '1px solid var(--border)' }}>
              {module.lessons.map((lesson, idx) => {
                const canAccess = isEnrolled || lesson.isFree
                const content = (
                  <div
                    key={lesson.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px var(--s5)',
                      borderBottom: idx < module.lessons.length - 1 ? '1px solid var(--border)' : 'none',
                      background: canAccess ? 'transparent' : 'transparent',
                    }}
                  >
                    <span style={{ color: canAccess ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>
                      {canAccess ? lessonIcon(lesson.type) : <Lock size={13} />}
                    </span>
                    <span style={{
                      fontSize: '14px', flex: 1,
                      color: canAccess ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}>
                      {lesson.title}
                    </span>
                    {lesson.isFree && !isEnrolled && (
                      <span style={{
                        fontSize: '11px', color: 'var(--success)',
                        background: 'rgba(52,211,153,0.1)',
                        padding: '2px 8px', borderRadius: 'var(--r-pill)',
                        fontWeight: 700,
                      }}>
                        Preview
                      </span>
                    )}
                    {lesson.duration && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {formatDuration(lesson.duration)}
                      </span>
                    )}
                  </div>
                )

                if (canAccess && lesson.isFree && !isEnrolled) {
                  return (
                    <Link
                      key={lesson.id}
                      href={`/courses/${courseSlug}/preview/${lesson.id}`}
                      style={{ textDecoration: 'none', display: 'block' }}
                      className="curriculum-row-hover"
                    >
                      {content}
                    </Link>
                  )
                }

                if (isEnrolled) {
                  return (
                    <Link
                      key={lesson.id}
                      href={`/portal/courses/${courseSlug}/${lesson.id}`}
                      style={{ textDecoration: 'none', display: 'block' }}
                      className="curriculum-row-hover"
                    >
                      {content}
                    </Link>
                  )
                }

                return <div key={lesson.id}>{content}</div>
              })}
            </div>
          )}
        </div>
      ))}
      <style>{`.curriculum-row-hover:hover > div { background: var(--bg-elevated) !important; }`}</style>
    </div>
  )
}
