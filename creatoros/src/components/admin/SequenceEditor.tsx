'use client'
import { useState } from 'react'
import { Plus, Trash2, GripVertical, CheckCircle } from 'lucide-react'

const TRIGGERS = [
  { value: 'PURCHASED',          label: 'Immediately after purchase',     icon: '💳' },
  { value: 'ENROLLED',           label: 'When course access is granted',   icon: '🎓' },
  { value: 'LESSON_COMPLETE',    label: 'After completing any lesson',     icon: '✓'  },
  { value: 'COURSE_COMPLETE',    label: 'After completing the course',     icon: '🏆' },
  { value: 'NO_PROGRESS_3_DAYS', label: 'No progress for 3 days',         icon: '⏰' },
  { value: 'NO_PROGRESS_7_DAYS', label: 'No progress for 7 days',         icon: '⏰' },
  { value: 'NO_PROGRESS_14_DAYS','label': 'No progress for 14 days',      icon: '⏰' },
]

interface Step {
  id?:         string
  trigger:     string
  delayHours:  number
  subject:     string
  bodyHtml:    string
  isActive:    boolean
  sortOrder:   number
}

interface Props {
  course: {
    id:    string
    title: string
    emailSequence?: {
      id:      string
      isActive: boolean
      steps:   Step[]
    } | null
  }
}

const blank = (): Step => ({
  trigger: 'ENROLLED', delayHours: 0, subject: '', bodyHtml: '', isActive: true, sortOrder: 0,
})

const VARS = [
  { token: '{{name}}',          desc: 'Student first name' },
  { token: '{{course_title}}',  desc: 'Course name' },
  { token: '{{course_url}}',    desc: 'Link to course' },
  { token: '{{dashboard_url}}', desc: 'Student dashboard' },
]

export default function SequenceEditor({ course }: Props) {
  const seq = course.emailSequence
  const [steps,    setSteps]    = useState<Step[]>(seq?.steps ?? [])
  const [active,   setActive]   = useState(seq?.isActive ?? true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(steps.length === 0 ? null : 0)

  const addStep = () => {
    const s = { ...blank(), sortOrder: steps.length }
    setSteps(ss => [...ss, s])
    setExpanded(steps.length)
  }

  const removeStep = (idx: number) => {
    setSteps(ss => ss.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sortOrder: i })))
    setExpanded(null)
  }

  const updateStep = (idx: number, patch: Partial<Step>) => {
    setSteps(ss => ss.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    const res = await fetch(`/api/admin/sequences/${course.id}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ steps, isActive: active }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else { const d = await res.json(); setError(d.error ?? 'Save failed') }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb',
    borderRadius: '8px', fontSize: '14px', color: '#111827',
    outline: 'none', fontFamily: 'var(--font-ui)', background: '#f9fafb',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {steps.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #e5e7eb', borderRadius: '12px', background: 'white' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>✉️</div>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px' }}>No emails yet. Add your first email below.</p>
            <button onClick={addStep}
              style={{ padding: '10px 24px', background: '#7B2FBE', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add First Email
            </button>
          </div>
        )}

        {steps.map((step, idx) => (
          <div key={idx} style={{ background: 'white', border: `1px solid ${expanded === idx ? '#7B2FBE' : '#e5e7eb'}`, borderRadius: '12px', overflow: 'hidden' }}>
            {/* Header */}
            <div
              onClick={() => setExpanded(expanded === idx ? null : idx)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer', userSelect: 'none' }}>
              <GripVertical size={14} color="#d1d5db" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', width: '18px', flexShrink: 0 }}>{idx + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {step.subject || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Untitled email</span>}
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
                  {TRIGGERS.find(t => t.value === step.trigger)?.label ?? step.trigger}
                  {step.delayHours > 0 && ` · after ${step.delayHours >= 24 ? `${step.delayHours / 24}d` : `${step.delayHours}h`}`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <label onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>
                  <input type="checkbox" checked={step.isActive} onChange={e => updateStep(idx, { isActive: e.target.checked })}
                    style={{ accentColor: '#7B2FBE' }} />
                  Active
                </label>
                <button onClick={e => { e.stopPropagation(); removeStep(idx) }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Expanded fields */}
            {expanded === idx && (
              <div style={{ padding: '0 16px 18px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trigger</label>
                    <select value={step.trigger} onChange={e => updateStep(idx, { trigger: e.target.value })} style={inp}>
                      {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Send after</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="number" min={0} value={step.delayHours} onChange={e => updateStep(idx, { delayHours: parseInt(e.target.value) || 0 })}
                        style={{ ...inp, width: '90px' }} />
                      <span style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>hours (0 = immediately)</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject line</label>
                  <input value={step.subject} onChange={e => updateStep(idx, { subject: e.target.value })}
                    placeholder="e.g. Welcome to {{course_title}}! Here's how to get started" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email body</label>
                  <textarea value={step.bodyHtml} onChange={e => updateStep(idx, { bodyHtml: e.target.value })}
                    placeholder={'Hi {{name}},\n\nWelcome to {{course_title}}! Click here to get started:\n\n{{course_url}}'}
                    rows={8}
                    style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                    Variables: {VARS.map(v => <code key={v.token} style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '3px', fontSize: '11px', marginRight: '6px' }} title={v.desc}>{v.token}</code>)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {steps.length > 0 && (
          <button onClick={addStep}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px', background: 'white', border: '2px dashed #e5e7eb', borderRadius: '10px', color: '#7B2FBE', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={14} /> Add Email
          </button>
        )}
      </div>

      {/* Right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}>

        {/* Active toggle */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Sequence Status</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#7B2FBE' }} />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>Active</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Emails will be sent to new students</p>
            </div>
          </label>
        </div>

        {/* Variable reference */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Template Variables</p>
          {VARS.map(v => (
            <div key={v.token} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <code style={{ fontSize: '12px', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', color: '#7B2FBE' }}>{v.token}</code>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>{v.desc}</span>
            </div>
          ))}
        </div>

        {/* Save */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
          {error && <p style={{ fontSize: '13px', color: '#ef4444', margin: '0 0 10px' }}>{error}</p>}
          {saved && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px' }}>
              <CheckCircle size={14} color="#10b981" />
              <p style={{ fontSize: '13px', color: '#10b981', margin: 0 }}>Saved</p>
            </div>
          )}
          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Saving…' : 'Save Sequence'}
          </button>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '10px 0 0', textAlign: 'center' }}>
            {steps.length} email{steps.length !== 1 ? 's' : ''} in sequence
          </p>
        </div>
      </div>
    </div>
  )
}
