'use client'
import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Edit2, Check, X } from 'lucide-react'

interface Lesson {
  id:           string
  title:        string
  type:         string
  videoProvider: string
  videoId:      string | null
  videoUrl:     string | null
  duration:     number | null
  isFree:       boolean
  isPublished:  boolean
  sortOrder:    number
  dripDaysAfterEnrollment: number | null
}

interface Module {
  id:         string
  title:      string
  sortOrder:  number
  isPublished: boolean
  lessons:    Lesson[]
}

interface Props {
  courseId: string
  modules:  Module[]
}

const LESSON_TYPES   = ['VIDEO', 'TEXT', 'QUIZ', 'EMBED', 'DOWNLOAD']
const VIDEO_PROVIDERS = ['STREAMABLE', 'VIMEO', 'YOUTUBE', 'LOOM', 'WISTIA', 'CUSTOM']

export default function CurriculumBuilder({ courseId, modules: initialModules }: Props) {
  const [modules,  setModules]  = useState<Module[]>(initialModules)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(initialModules.map(m => m.id)))
  const [saving,   setSaving]   = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)

  // ── Module actions ────────────────────────────────────────

  const addModule = async () => {
    const title = `Module ${modules.length + 1}`
    const res   = await fetch(`/api/courses/${courseId}/modules`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title, sortOrder: modules.length }),
    })
    const data = await res.json()
    if (res.ok) {
      setModules(m => [...m, { ...data, lessons: [] }])
      setExpanded(e => new Set([...e, data.id]))
    }
  }

  const updateModuleTitle = async (moduleId: string, title: string) => {
    setSaving(moduleId)
    await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title }),
    })
    setModules(m => m.map(mod => mod.id === moduleId ? { ...mod, title } : mod))
    setSaving(null)
  }

  const deleteModule = async (moduleId: string) => {
    if (!confirm('Delete this module and all its lessons?')) return
    await fetch(`/api/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' })
    setModules(m => m.filter(mod => mod.id !== moduleId))
  }

  // ── Lesson actions ────────────────────────────────────────

  const addLesson = async (moduleId: string) => {
    const mod   = modules.find(m => m.id === moduleId)!
    const title = `Lesson ${mod.lessons.length + 1}`
    const res   = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title, type: 'VIDEO', videoProvider: 'STREAMABLE', sortOrder: mod.lessons.length }),
    })
    const data = await res.json()
    if (res.ok) {
      setModules(m => m.map(mod =>
        mod.id === moduleId
          ? { ...mod, lessons: [...mod.lessons, data] }
          : mod
      ))
      setEditingLesson(data.id)
    }
  }

  const updateLesson = async (moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
    setSaving(lessonId)
    await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(updates),
    })
    setModules(m => m.map(mod =>
      mod.id === moduleId
        ? { ...mod, lessons: mod.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l) }
        : mod
    ))
    setSaving(null)
  }

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Delete this lesson?')) return
    await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, { method: 'DELETE' })
    setModules(m => m.map(mod =>
      mod.id === moduleId
        ? { ...mod, lessons: mod.lessons.filter(l => l.id !== lessonId) }
        : mod
    ))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {modules.map((mod, modIdx) => (
        <div key={mod.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>

          {/* Module header */}
          <div style={{ padding: '14px 16px', background: '#f9fafb', borderBottom: expanded.has(mod.id) ? '1px solid #e5e7eb' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GripVertical size={16} style={{ color: '#d1d5db', flexShrink: 0, cursor: 'grab' }} />

            <ModuleTitle
              title={mod.title}
              onSave={title => updateModuleTitle(mod.id, title)}
            />

            <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px', whiteSpace: 'nowrap' }}>
              {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}
            </span>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button onClick={() => addLesson(mod.id)} style={iconBtn('#7B2FBE')}>
                <Plus size={14} />
              </button>
              <button onClick={() => deleteModule(mod.id)} style={iconBtn('#ef4444')}>
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setExpanded(e => { const n = new Set(e); n.has(mod.id) ? n.delete(mod.id) : n.add(mod.id); return n })}
                style={iconBtn('#6b7280')}
              >
                {expanded.has(mod.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* Lessons */}
          {expanded.has(mod.id) && (
            <div>
              {mod.lessons.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <button
                    onClick={() => addLesson(mod.id)}
                    style={{ fontSize: '13px', color: '#7B2FBE', background: 'none', border: '1px dashed #d1d5db', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
                  >
                    + Add first lesson
                  </button>
                </div>
              ) : mod.lessons.map((lesson, lessonIdx) => (
                <div key={lesson.id} style={{ borderBottom: lessonIdx < mod.lessons.length - 1 ? '1px solid #f3f4f6' : 'none' }}>

                  {/* Lesson row */}
                  {editingLesson !== lesson.id ? (
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <GripVertical size={14} style={{ color: '#d1d5db', flexShrink: 0, cursor: 'grab' }} />
                      <span style={{ fontSize: '16px' }}>{lessonTypeEmoji(lesson.type)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', color: '#111827', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lesson.title}
                        </p>
                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {lesson.type}
                          {lesson.videoId && ` · ${lesson.videoProvider} ${lesson.videoId}`}
                          {lesson.isFree && ' · Free preview'}
                          {!lesson.isPublished && ' · Hidden'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => setEditingLesson(lesson.id)} style={iconBtn('#7B2FBE')}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => deleteLesson(mod.id, lesson.id)} style={iconBtn('#ef4444')}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Lesson edit form */
                    <LessonEditForm
                      lesson={lesson}
                      onSave={async (updates) => {
                        await updateLesson(mod.id, lesson.id, updates)
                        setEditingLesson(null)
                      }}
                      onCancel={() => setEditingLesson(null)}
                      saving={saving === lesson.id}
                    />
                  )}
                </div>
              ))}

              {/* Add lesson button */}
              {mod.lessons.length > 0 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6' }}>
                  <button
                    onClick={() => addLesson(mod.id)}
                    style={{ fontSize: '13px', color: '#7B2FBE', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> Add Lesson
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add module */}
      <button
        onClick={addModule}
        style={{
          width: '100%', padding: '14px',
          background: 'white', border: '2px dashed #e5e7eb',
          borderRadius: '10px', fontSize: '14px', fontWeight: 600,
          color: '#7B2FBE', cursor: 'pointer', fontFamily: 'var(--font-ui)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'border-color 0.15s',
        }}
        className="add-module-hover"
      >
        <Plus size={16} /> Add Module
      </button>
      <style>{`.add-module-hover:hover { border-color: #7B2FBE !important; background: rgba(123,47,190,0.02) !important; }`}</style>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────

function ModuleTitle({ title, onSave }: { title: string; onSave: (t: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [val,     setVal]     = useState(title)

  if (!editing) {
    return (
      <span
        onDoubleClick={() => setEditing(true)}
        style={{ fontSize: '14px', fontWeight: 600, color: '#111827', cursor: 'text', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title="Double-click to rename"
      >
        {title}
      </span>
    )
  }

  return (
    <input
      autoFocus
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { onSave(val); setEditing(false) }}
      onKeyDown={e => { if (e.key === 'Enter') { onSave(val); setEditing(false) } if (e.key === 'Escape') { setVal(title); setEditing(false) } }}
      style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#111827', background: 'white', border: '1px solid #7B2FBE', borderRadius: '6px', padding: '3px 8px', outline: 'none', fontFamily: 'var(--font-ui)' }}
    />
  )
}

function LessonEditForm({ lesson, onSave, onCancel, saving }: {
  lesson:   Lesson
  onSave:   (updates: Partial<Lesson>) => Promise<void>
  onCancel: () => void
  saving:   boolean
}) {
  const [form, setForm] = useState({
    title:        lesson.title,
    type:         lesson.type,
    videoProvider: lesson.videoProvider,
    videoId:      lesson.videoId ?? '',
    videoUrl:     lesson.videoUrl ?? '',
    duration:     lesson.duration ?? '',
    isFree:       lesson.isFree,
    isPublished:  lesson.isPublished,
    dripDaysAfterEnrollment: lesson.dripDaysAfterEnrollment ?? '',
  })

  const showVideo = form.type === 'VIDEO' || form.type === 'EMBED'

  return (
    <div style={{ padding: '16px', background: '#fafafa', borderLeft: '3px solid #7B2FBE' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={miniLabel}>Lesson Title</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={miniInput} />
        </div>
        <div>
          <label style={miniLabel}>Type</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={miniInput}>
            {LESSON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {showVideo && (
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={miniLabel}>Video Provider</label>
            <select value={form.videoProvider} onChange={e => setForm(f => ({ ...f, videoProvider: e.target.value }))} style={miniInput}>
              {VIDEO_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={miniLabel}>
              {form.videoProvider === 'CUSTOM' ? 'Video URL' : 'Video ID'}
            </label>
            {form.videoProvider === 'CUSTOM' ? (
              <input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://..." style={miniInput} />
            ) : (
              <input value={form.videoId} onChange={e => setForm(f => ({ ...f, videoId: e.target.value }))}
                placeholder={
                  form.videoProvider === 'STREAMABLE' ? 'abc123' :
                  form.videoProvider === 'YOUTUBE'    ? 'dQw4w9WgXcQ' :
                  form.videoProvider === 'VIMEO'      ? '123456789' : 'video-id'
                }
                style={miniInput}
              />
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={miniLabel}>Duration (seconds)</label>
          <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 900" style={miniInput} />
        </div>
        <div>
          <label style={miniLabel}>Drip (days after enrol)</label>
          <input type="number" value={form.dripDaysAfterEnrollment} onChange={e => setForm(f => ({ ...f, dripDaysAfterEnrollment: e.target.value }))} placeholder="Leave blank = immediate" style={miniInput} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
            <input type="checkbox" checked={form.isFree} onChange={e => setForm(f => ({ ...f, isFree: e.target.checked }))} />
            Free preview
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
            <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
            Published
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '7px 16px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', fontSize: '13px', color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
          Cancel
        </button>
        <button
          onClick={() => onSave({
            title:        form.title,
            type:         form.type as any,
            videoProvider: form.videoProvider as any,
            videoId:      form.videoId || null,
            videoUrl:     form.videoUrl || null,
            duration:     form.duration ? Number(form.duration) : null,
            isFree:       form.isFree,
            isPublished:  form.isPublished,
            dripDaysAfterEnrollment: form.dripDaysAfterEnrollment ? Number(form.dripDaysAfterEnrollment) : null,
          })}
          disabled={saving}
          style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: '#7B2FBE', color: 'white', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}
        >
          {saving ? 'Saving...' : 'Save Lesson'}
        </button>
      </div>
    </div>
  )
}

function lessonTypeEmoji(type: string) {
  const map: Record<string, string> = { VIDEO: '▶', TEXT: '📄', QUIZ: '❓', EMBED: '🔗', DOWNLOAD: '⬇' }
  return map[type] ?? '📄'
}

function iconBtn(color: string): React.CSSProperties {
  return {
    width: '28px', height: '28px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid #e5e7eb', borderRadius: '6px',
    background: 'white', cursor: 'pointer', color, transition: 'all 0.12s',
    flexShrink: 0,
  }
}

const miniLabel: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const miniInput: React.CSSProperties = { width: '100%', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)' }
