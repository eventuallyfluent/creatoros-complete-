'use client'
import { useState, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Lock, BookOpen } from 'lucide-react'
import { markLessonComplete, saveLessonNotes } from './actions'
import VideoPlayer, { type VideoProvider } from '@/components/video/VideoPlayer'

interface Lesson {
  id:            string
  title:         string
  type:          string
  videoProvider: string
  videoId:       string | null
  videoUrl:      string | null
  aspectRatio:   string | null
  content:       string | null
  duration:      number | null
}

interface Props {
  lesson:          Lesson
  courseSlug:      string
  courseTitle:     string
  prevLesson:      { id: string; title: string } | null
  nextLesson:      { id: string; title: string } | null
  isDripped:       boolean
  dripDays:        number | null
  daysSinceEnroll: number
  isCompleted:     boolean
  savedNotes:      string
  progressPct:     number
  completedCount:  number
  totalCount:      number
}

export default function LessonPlayer({
  lesson, courseSlug, courseTitle,
  prevLesson, nextLesson,
  isDripped, dripDays, daysSinceEnroll,
  isCompleted: initialCompleted,
  savedNotes: initialNotes,
  progressPct, completedCount, totalCount,
}: Props) {
  const [completed,  setCompleted]  = useState(initialCompleted)
  const [notes,      setNotes]      = useState(initialNotes)
  const [notesSaved, setNotesSaved] = useState(false)
  const [activeTab,  setActiveTab]  = useState<'overview' | 'notes'>('overview')
  const [isPending,  startTransition] = useTransition()

  const daysRemaining = dripDays !== null ? dripDays - daysSinceEnroll : 0

  const handleMarkComplete = () => {
    startTransition(async () => {
      await markLessonComplete(lesson.id, courseSlug)
      setCompleted(true)
    })
  }

  const handleSaveNotes = () => {
    startTransition(async () => {
      await saveLessonNotes(lesson.id, notes)
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Top bar */}
      <div style={{ padding: '12px var(--s5)', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 'var(--s4)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/portal" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', textDecoration: 'none' }}>
          <ChevronLeft size={16} /> Dashboard
        </Link>
        <span style={{ color: 'var(--border)' }}>·</span>
        <Link href={`/portal/courses/${courseSlug}`} style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {courseTitle}
        </Link>
        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ width: '120px', height: '4px', background: 'var(--border)', borderRadius: 'var(--r-pill)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--brand), var(--accent))', borderRadius: 'var(--r-pill)', transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Drip-locked state */}
      {isDripped ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 'var(--s4)', padding: 'var(--s9)', textAlign: 'center' }}>
          <Lock size={48} style={{ color: 'var(--text-muted)' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            This lesson unlocks in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{lesson.title}</strong> will be available on{' '}
            <strong style={{ color: 'var(--accent)' }}>
              {new Date(Date.now() + daysRemaining * 86400000).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </strong>.
          </p>
          <a
            href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(lesson.title + ' unlocks')}&dates=${(() => { const d = new Date(Date.now() + daysRemaining * 86400000); const s = d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z'; return s+'/'+s })()}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            📅 Add reminder to calendar
          </a>
          {prevLesson && (
            <Link href={`/portal/courses/${courseSlug}/${prevLesson.id}`} style={{ background: 'var(--brand)', color: 'white', padding: '12px 24px', borderRadius: 'var(--r-md)', textDecoration: 'none', fontWeight: 600, fontSize: '15px', marginTop: '8px' }}>
              ← Previous Lesson
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Video */}
          {lesson.type === 'VIDEO' && (
            <VideoPlayer
              provider={lesson.videoProvider as VideoProvider}
              videoId={lesson.videoId}
              videoUrl={lesson.videoUrl}
              aspectRatio={lesson.aspectRatio}
              title={lesson.title}
              onEnded={!completed ? handleMarkComplete : undefined}
            />
          )}

          {/* Content area */}
          <div style={{ flex: 1, padding: 'var(--s6)', maxWidth: '860px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s4)', marginBottom: 'var(--s5)' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {lesson.title}
              </h1>
              <button
                onClick={handleMarkComplete}
                disabled={completed || isPending}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '9px 16px', borderRadius: 'var(--r-md)',
                  background: completed ? 'rgba(52,211,153,0.1)' : 'var(--bg-elevated)',
                  border: completed ? '1px solid var(--success)' : '1px solid var(--border)',
                  color: completed ? 'var(--success)' : 'var(--text-secondary)',
                  fontSize: '13px', fontWeight: 600,
                  cursor: completed ? 'default' : 'pointer',
                  fontFamily: 'var(--font-ui)', transition: 'all 0.15s',
                }}
              >
                {completed ? <><CheckCircle size={16} /> Completed</> : <><Circle size={16} /> Mark Complete</>}
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-pill)', padding: '4px', width: 'fit-content', marginBottom: 'var(--s5)' }}>
              {(['overview', 'notes'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '7px 20px', borderRadius: 'var(--r-pill)', border: 'none',
                  background: activeTab === tab ? 'var(--brand)' : 'none',
                  color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', textTransform: 'capitalize', transition: 'all 0.15s',
                }}>
                  {tab === 'notes' ? <><BookOpen size={12} style={{ display: 'inline', marginRight: '4px' }} />Notes</> : 'Overview'}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && lesson.content && (
              <div style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {lesson.content}
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Your personal notes for this lesson..."
                  rows={10}
                  style={{
                    width: '100%', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                    padding: '14px 16px', fontSize: '15px', color: 'var(--text-primary)',
                    outline: 'none', fontFamily: 'var(--font-ui)', lineHeight: 1.6, resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button onClick={handleSaveNotes} disabled={isPending} style={{
                    background: 'var(--brand)', color: 'white', border: 'none',
                    borderRadius: 'var(--r-md)', padding: '9px 20px',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                  }}>
                    {notesSaved ? '✓ Saved' : 'Save Notes'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prev / Next nav */}
          <div style={{ padding: 'var(--s5) var(--s6)', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', gap: 'var(--s4)', marginTop: 'auto' }}>
            {prevLesson ? (
              <Link href={`/portal/courses/${courseSlug}/${prevLesson.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, padding: '10px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                <ChevronLeft size={16} />
                <span style={{ maxWidth: '200px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{prevLesson.title}</span>
              </Link>
            ) : <div />}
            {nextLesson ? (
              <Link href={`/portal/courses/${courseSlug}/${nextLesson.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600, padding: '10px 16px', background: 'var(--brand)', borderRadius: 'var(--r-md)', marginLeft: 'auto' }}>
                <span style={{ maxWidth: '200px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{nextLesson.title}</span>
                <ChevronRight size={16} />
              </Link>
            ) : completed && (
              // Last lesson + marked complete: course completion panel
              <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/portal/courses/${courseSlug}/review`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                    ★ Leave a Review
                  </Link>
                  <Link href={`/portal/certificates`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'var(--success)', borderRadius: 'var(--r-md)', color: '#0D0D1A', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
                    🎓 Get Certificate →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Course complete banner — shown when last lesson and all done */}
          {!nextLesson && completed && progressPct === 100 && (
            <div style={{ margin: '24px 32px 32px', padding: '24px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--r-xl)', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎓</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                You've completed {courseTitle}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
                Congratulations. Your certificate is ready to download, and we'd love to hear what you thought of the course.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href={`/portal/certificates`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '12px 22px', background: 'var(--success)', borderRadius: 'var(--r-md)', color: '#0D0D1A', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>
                  🎓 Download Certificate
                </Link>
                <Link href={`/portal/courses/${courseSlug}/review`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '12px 22px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                  ★ Leave a Review
                </Link>
                <Link href={`/portal`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '12px 22px', background: 'transparent', borderRadius: 'var(--r-md)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
                  Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
