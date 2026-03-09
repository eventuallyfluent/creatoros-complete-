'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, GripVertical } from 'lucide-react'

const TRIGGERS = [
  { value: 'PURCHASE',        label: 'Product purchased',           icon: '💳', level: 'product' },
  { value: 'ENROLLMENT',      label: 'Course access granted',       icon: '🎓', level: 'course'  },
  { value: 'LESSON_COMPLETE', label: 'Lesson completed',            icon: '✓',  level: 'course'  },
  { value: 'COURSE_COMPLETE', label: 'Course completed (100%)',     icon: '🏆', level: 'course'  },
  { value: 'SIGNUP',          label: 'New account created',         icon: '👤', level: 'account' },
  { value: 'COUPON_USED',     label: 'Coupon used',                 icon: '🎟', level: 'product' },
  { value: 'REFUND_ISSUED',   label: 'Refund issued',               icon: '↩️', level: 'product' },
]

const ACTIONS = [
  { value: 'send_email',    label: 'Send Email',          icon: '✉️' },
  { value: 'delay',         label: 'Wait (delay)',         icon: '⏱'  },
  { value: 'add_tag',       label: 'Add Tag',              icon: '🏷'  },
  { value: 'remove_tag',    label: 'Remove Tag',           icon: '✂️' },
  { value: 'webhook_post',  label: 'Zap POST',         icon: '🔗' },
]

const LEVEL_COLORS: Record<string, string> = {
  product: '#7B2FBE',
  course:  '#3B82F6',
  account: '#10B981',
}

interface Step {
  id:         string
  action:     string
  sortOrder:  number
  actionData: Record<string, any>
}

interface AutomationData {
  id?:       string
  name?:     string
  trigger?:  string
  isActive?: boolean
  steps?:    Step[]
}

interface Item    { id: string; title: string }
interface Props   { automation?: AutomationData; courses: Item[]; products: Item[] }

export default function AutomationBuilder({ automation, courses, products }: Props) {
  const router = useRouter()
  const isNew  = !automation?.id

  const [name,     setName]     = useState(automation?.name    ?? '')
  const [trigger,  setTrigger]  = useState(automation?.trigger ?? 'PURCHASE')
  const [isActive, setIsActive] = useState(automation?.isActive ?? true)
  const [steps,    setSteps]    = useState<Step[]>(automation?.steps ?? [])
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const addStep = () => {
    const id = Math.random().toString(36).slice(2)
    setSteps(s => [...s, { id, action: 'send_email', sortOrder: s.length, actionData: { subject: '', body: '' } }])
  }

  const updateStep = (id: string, updates: Partial<Step>) =>
    setSteps(s => s.map(step => step.id === id ? { ...step, ...updates } : step))

  const removeStep = (id: string) => setSteps(s => s.filter(step => step.id !== id))

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true); setError(null)
    const url    = isNew ? '/api/automations' : `/api/automations/${automation!.id}`
    const method = isNew ? 'POST' : 'PATCH'
    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, trigger, isActive, steps }) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    router.push('/admin/automations')
    router.refresh()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)', background: '#f9fafb' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  const selectedTrigger = TRIGGERS.find(t => t.value === trigger)

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end', marginBottom: '18px' }}>
            <div>
              <label style={lbl}>Automation Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Post-purchase welcome — Hermetics 101" style={inp} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingBottom: '2px' }}>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Active</span>
            </label>
          </div>

          <div>
            <label style={lbl}>Trigger — when should this run?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px' }}>
              {TRIGGERS.map(t => (
                <button key={t.value} type="button" onClick={() => setTrigger(t.value)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', border: trigger === t.value ? `2px solid ${LEVEL_COLORS[t.level]}` : '1px solid #e5e7eb', background: trigger === t.value ? `${LEVEL_COLORS[t.level]}0F` : 'white', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', transition: 'all 0.12s' }}>
                  <span style={{ fontSize: '18px' }}>{t.icon}</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: trigger === t.value ? 600 : 400, color: trigger === t.value ? LEVEL_COLORS[t.level] : '#374151', margin: 0 }}>{t.label}</p>
                    <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.level}-level</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ padding: '24px' }}>
          <label style={{ ...lbl, marginBottom: '12px' }}>Steps — executed in order</label>

          {steps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed #e5e7eb', borderRadius: '8px', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>No steps yet. Add a step below.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
            {steps.map((step, idx) => (
              <div key={step.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', background: '#fafafa' }}>
                <div style={{ padding: '12px 14px', background: 'white', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <GripVertical size={15} style={{ color: '#d1d5db', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', width: '20px' }}>{idx + 1}</span>
                  <select value={step.action}
                    onChange={e => updateStep(step.id, { action: e.target.value, actionData: defaultData(e.target.value) })}
                    style={{ ...inp, flex: 1, background: 'white' }}>
                    {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
                  </select>
                  <button onClick={() => removeStep(step.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: '1px solid #fecaca', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div style={{ padding: '14px' }}>
                  <StepConfig step={step} onUpdate={d => updateStep(step.id, { actionData: d })} courses={courses} products={products} inp={inp} lbl={lbl} />
                </div>
              </div>
            ))}
          </div>

          <button onClick={addStep} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'white', border: '2px dashed #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#7B2FBE', cursor: 'pointer', fontFamily: 'var(--font-ui)', transition: 'border-color 0.15s' }} className="add-step-hover">
            <Plus size={15} /> Add Step
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>{error && <p style={{ fontSize: '14px', color: '#ef4444' }}>{error}</p>}</div>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '11px 28px', background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
          {saving ? 'Saving…' : isNew ? 'Create Automation' : 'Save Changes'}
        </button>
      </div>
      <style>{`.add-step-hover:hover { border-color: #7B2FBE !important; }`}</style>
    </div>
  )
}

function StepConfig({ step, onUpdate, courses, products, inp, lbl }: {
  step: Step; onUpdate: (d: any) => void
  courses:  { id: string; title: string }[]
  products: { id: string; title: string }[]
  inp: React.CSSProperties; lbl: React.CSSProperties
}) {
  const d = step.actionData

  if (step.action === 'send_email') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={lbl}>Subject</label>
        <input value={d.subject ?? ''} onChange={e => onUpdate({ ...d, subject: e.target.value })} placeholder="Email subject" style={inp} />
      </div>
      <div>
        <label style={lbl}>Body — use {'{{name}}'}, {'{{product_title}}'}, {'{{course_url}}'}</label>
        <textarea value={d.body ?? ''} onChange={e => onUpdate({ ...d, body: e.target.value })} rows={5} placeholder="Write your email…" style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
      </div>
    </div>
  )

  if (step.action === 'delay') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <label style={{ ...lbl, margin: 0, whiteSpace: 'nowrap' }}>Wait</label>
      <input type="number" min="0" step="0.5" value={d.hours ?? 24} onChange={e => onUpdate({ ...d, hours: parseFloat(e.target.value) })} style={{ ...inp, width: '100px' }} />
      <span style={{ fontSize: '14px', color: '#374151', whiteSpace: 'nowrap' }}>hours</span>
    </div>
  )

  if (step.action === 'grant_product') return (
    <div>
      <label style={lbl}>Product to grant access to</label>
      <select value={d.productId ?? ''} onChange={e => onUpdate({ ...d, productId: e.target.value })} style={inp}>
        <option value="">— Select a product —</option>
        {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
      </select>
    </div>
  )

  if (step.action === 'enroll_course') return (
    <div>
      <label style={lbl}>Course to enrol in (direct access grant)</label>
      <select value={d.courseId ?? ''} onChange={e => onUpdate({ ...d, courseId: e.target.value })} style={inp}>
        <option value="">— Select a course —</option>
        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>
    </div>
  )

  if (step.action === 'add_tag' || step.action === 'remove_tag') return (
    <div>
      <label style={lbl}>Tag</label>
      <input value={d.tag ?? ''} onChange={e => onUpdate({ ...d, tag: e.target.value })} placeholder="e.g. completed-hermetics" style={inp} />
    </div>
  )

  if (step.action === 'webhook_post') return (
    <div>
      <label style={lbl}>Zap URL</label>
      <input value={d.url ?? ''} onChange={e => onUpdate({ ...d, url: e.target.value })} placeholder="https://hooks.zapier.com/…" style={inp} />
    </div>
  )

  return null
}

function defaultData(action: string): Record<string, any> {
  if (action === 'send_email')    return { subject: '', body: '' }
  if (action === 'delay')         return { hours: 24 }
  if (action === 'grant_product') return { productId: '' }
  if (action === 'enroll_course') return { courseId: '' }
  if (action === 'add_tag')       return { tag: '' }
  if (action === 'remove_tag')    return { tag: '' }
  if (action === 'webhook_post')  return { url: '' }
  return {}
}
