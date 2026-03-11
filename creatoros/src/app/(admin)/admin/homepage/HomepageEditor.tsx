'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import type { SiteSettings, HomepageSection } from '@/lib/settings/site-settings'

interface Course      { id: string; title: string; thumbnailUrl: string | null }
interface Collection  { id: string; name: string; slug: string }
interface CourseReview { id: string; rating: number; comment: string | null; isFeatured: boolean; user: { name: string | null }; course: { id: string; title: string } }
interface Props { settings: SiteSettings; courses: Course[]; collections: Collection[]; reviews: CourseReview[] }

type Tab = 'hero' | 'courses' | 'sections' | 'optin'

const TAB_LABELS: { id: Tab; label: string; icon: string }[] = [
  { id: 'hero',     label: 'Hero',             icon: '🌟' },
  { id: 'courses',  label: 'Featured Courses', icon: '📚' },
  { id: 'sections', label: 'Content Blocks',   icon: '📝' },
  { id: 'optin',    label: 'Email Sign-up',    icon: '✉️' },
]

export default function HomepageEditor({ settings, courses, collections, reviews }: Props) {
  const router  = useRouter()
  const [tab,    setTab]    = useState<Tab>('hero')
  const [form,   setForm]   = useState({ ...settings })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const set = <K extends keyof SiteSettings>(key: K, val: SiteSettings[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  // Badge helpers
  const addBadge    = () => set('heroBadges', [...form.heroBadges, ''])
  const updateBadge = (i: number, v: string) => set('heroBadges', form.heroBadges.map((b, idx) => idx === i ? v : b))
  const removeBadge = (i: number) => set('heroBadges', form.heroBadges.filter((_, idx) => idx !== i))

  // Featured course helpers
  const toggleCourse = (id: string) => {
    const ids = form.featuredCourseIds
    set('featuredCourseIds', ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }

  // Section helpers
  const addSection = (type: HomepageSection['type']) => {
    const id = Math.random().toString(36).slice(2)
    const base: any = type === 'testimonials'
      ? { id, type, heading: 'What Students Say', items: [] }
      : type === 'divider'
      ? { id, type }
      : { id, type, heading: 'About This Academy', body: '', imageUrl: '', imagePosition: 'right' }
    set('homepageSections', [...form.homepageSections, base])
  }
  const updateSection = (id: string, updates: Partial<HomepageSection>) =>
    set('homepageSections', form.homepageSections.map(s => s.id === id ? { ...s, ...updates } : s))
  const removeSection = (id: string) =>
    set('homepageSections', form.homepageSections.filter(s => s.id !== id))

  const handleSave = async () => {
    setSaving(true); setError(null)
    const res  = await fetch('/api/settings/homepage', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    setSaved(true); setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb',
    borderRadius: '8px', fontSize: '14px', color: '#111827',
    outline: 'none', fontFamily: 'var(--font-ui)', background: '#f9fafb',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280',
    marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em',
  }
  const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
    <div style={{ marginBottom: '18px' }}>
      <label style={lbl}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{hint}</p>}
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', maxWidth: '1060px', alignItems: 'start' }}>

      {/* ── Editor panel ── */}
      <div>
        {/* Tab row */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '5px' }}>
          {TAB_LABELS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '8px 10px', borderRadius: '7px', border: 'none', background: tab === t.id ? '#7B2FBE' : 'transparent', color: tab === t.id ? 'white' : '#6b7280', fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all 0.15s' }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>

          {/* ── HERO TAB ── */}
          {tab === 'hero' && (
            <div>
              <Field label="Eyebrow (small label above headline)" hint="Short, uppercase. E.g. '✦ Western Esoteric Education ✦'">
                <input value={form.heroEyebrow} onChange={e => set('heroEyebrow', e.target.value)} style={inp} />
              </Field>
              <Field label="Headline" hint="The main hero headline. Keep it punchy — 8 words or fewer works best.">
                <textarea value={form.heroHeadline} onChange={e => set('heroHeadline', e.target.value)} rows={2} style={{ ...inp, resize: 'none' }} />
              </Field>
              <Field label="Subtext" hint="1–2 sentence description below the headline.">
                <textarea value={form.heroSubtext} onChange={e => set('heroSubtext', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label style={lbl}>Primary Button Label</label>
                  <input value={form.heroPrimaryLabel} onChange={e => set('heroPrimaryLabel', e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Primary Button Link</label>
                  <input value={form.heroPrimaryHref} onChange={e => set('heroPrimaryHref', e.target.value)} placeholder="/courses" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Secondary Button Label <span style={{ fontWeight: 400, textTransform: 'none' }}>(blank = hide)</span></label>
                  <input value={form.heroSecondaryLabel} onChange={e => set('heroSecondaryLabel', e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Secondary Button Link</label>
                  <input value={form.heroSecondaryHref} onChange={e => set('heroSecondaryHref', e.target.value)} placeholder="/login" style={inp} />
                </div>
              </div>

              <div>
                <label style={{ ...lbl, marginBottom: '8px' }}>Trust Badges <span style={{ fontWeight: 400, textTransform: 'none' }}>(shown below buttons)</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '10px' }}>
                  {form.heroBadges.map((badge, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px' }}>
                      <input value={badge} onChange={e => updateBadge(i, e.target.value)} placeholder="e.g. 500+ students enrolled" style={{ ...inp, flex: 1 }} />
                      <button onClick={() => removeBadge(i)} style={{ width: '34px', height: '34px', border: '1px solid #fecaca', borderRadius: '7px', background: 'white', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={addBadge} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'white', border: '1px dashed #d1d5db', borderRadius: '7px', fontSize: '12px', fontWeight: 600, color: '#7B2FBE', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                  <Plus size={13} /> Add Badge
                </button>
              </div>
            </div>
          )}

          {/* ── FEATURED COURSES TAB ── */}
          {tab === 'courses' && (
            <div>
              {/* Display mode selector */}
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>What to show in the courses section</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {([
                    { value: 'all',         label: 'All published courses',     desc: 'Show every published course in default order' },
                    { value: 'featured',    label: 'Selected courses only',     desc: 'Hand-pick which courses to feature' },
                    { value: 'collections', label: 'Collections',               desc: 'Show collection cards instead of individual courses' },
                  ] as const).map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', border: (form as any).coursesDisplayMode === opt.value ? '2px solid #7B2FBE' : '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', background: (form as any).coursesDisplayMode === opt.value ? 'rgba(123,47,190,0.04)' : 'white', transition: 'all 0.15s' }}>
                      <input type="radio" name="coursesDisplayMode" value={opt.value}
                        checked={(form as any).coursesDisplayMode === opt.value}
                        onChange={() => set('coursesDisplayMode' as any, opt.value)}
                        style={{ marginTop: '2px', accentColor: '#7B2FBE' }} />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{opt.label}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Course picker (featured mode) */}
              {(form as any).coursesDisplayMode === 'featured' && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Select courses to feature</p>
                  {courses.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>No published courses yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {courses.map(course => {
                        const selected = form.featuredCourseIds.includes(course.id)
                        return (
                          <label key={course.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: selected ? '1px solid rgba(123,47,190,0.4)' : '1px solid #e5e7eb', borderRadius: '9px', cursor: 'pointer', background: selected ? 'rgba(123,47,190,0.04)' : 'white' }}>
                            <input type="checkbox" checked={selected} onChange={() => toggleCourse(course.id)} style={{ width: '15px', height: '15px', accentColor: '#7B2FBE', flexShrink: 0 }} />
                            <span style={{ fontSize: '14px', color: '#111827', fontWeight: selected ? 600 : 400 }}>{course.title}</span>
                            {selected && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#7B2FBE' }}>✓ Featured</span>}
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Collections mode info */}
              {(form as any).coursesDisplayMode === 'collections' && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Published collections</p>
                  {collections.length === 0 ? (
                    <div style={{ padding: '16px', background: '#fef9f0', border: '1px solid #fde68a', borderRadius: '9px' }}>
                      <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>No published collections yet. Go to <strong>Admin → Collections</strong> to create some.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      {collections.map(col => (
                        <div key={col.id} style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '9px', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#111827', fontWeight: 600 }}>{col.name}</span>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>/{col.slug}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '10px' }}>All published collections will appear. Manage them in Admin → Collections.</p>
                </div>
              )}
            </div>
          )}

          {/* ── CONTENT SECTIONS TAB ── */}
          {tab === 'sections' && (
            <div>
              <p style={{ fontSize: '14px', color: '#374151', marginBottom: '18px', lineHeight: 1.6 }}>
                Add extra content blocks below the course grid. Useful for an about section, testimonials, or a mission statement.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {form.homepageSections.length === 0 && (
                  <div style={{ border: '1px dashed #e5e7eb', borderRadius: '10px', padding: '28px', textAlign: 'center' }}>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No content blocks yet.</p>
                  </div>
                )}
                {form.homepageSections.map(section => (
                  <div key={section.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {section.type === 'text' ? '📝 Text Block' : section.type === 'testimonials' ? '💬 Testimonials' : '— Divider'}
                      </span>
                      <button onClick={() => removeSection(section.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', border: '1px solid #fecaca', borderRadius: '6px', background: 'white', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      {section.type === 'text' && (
                        <>
                          <div style={{ marginBottom: '10px' }}>
                            <label style={lbl}>Heading</label>
                            <input value={(section as any).heading ?? ''} onChange={e => updateSection(section.id, { heading: e.target.value })} style={inp} />
                          </div>
                          <div style={{ marginBottom: '10px' }}>
                            <label style={lbl}>Body Text</label>
                            <textarea value={(section as any).body ?? ''} onChange={e => updateSection(section.id, { body: e.target.value })} rows={4} style={{ ...inp, resize: 'vertical' }} placeholder="Write your content here…" />
                          </div>
                          <div style={{ marginBottom: '10px' }}>
                            <label style={lbl}>Image URL <span style={{ fontWeight: 400, textTransform: 'none', color: '#9ca3af' }}>(optional)</span></label>
                            <input value={(section as any).imageUrl ?? ''} onChange={e => updateSection(section.id, { imageUrl: e.target.value } as any)} style={inp} placeholder="https://…" />
                          </div>
                          {(section as any).imageUrl && (
                            <div>
                              <label style={lbl}>Image Position</label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {(['left', 'right', 'top'] as const).map(pos => (
                                  <label key={pos} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: (section as any).imagePosition === pos ? '2px solid #7B2FBE' : '1px solid #e5e7eb', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', color: (section as any).imagePosition === pos ? '#7B2FBE' : '#374151', fontWeight: (section as any).imagePosition === pos ? 700 : 400, background: (section as any).imagePosition === pos ? 'rgba(123,47,190,0.05)' : 'white' }}>
                                    <input type="radio" name={`imgPos-${section.id}`} value={pos} checked={(section as any).imagePosition === pos} onChange={() => updateSection(section.id, { imagePosition: pos } as any)} style={{ display: 'none' }} />
                                    {pos === 'left' ? '← Left' : pos === 'right' ? 'Right →' : '↑ Top'}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {section.type === 'testimonials' && (
                        <>
                          <div style={{ marginBottom: '12px' }}>
                            <label style={lbl}>Section Heading</label>
                            <input value={(section as any).heading ?? ''} onChange={e => updateSection(section.id, { heading: e.target.value })} style={inp} />
                          </div>

                          {/* Course filter */}
                          <div style={{ marginBottom: '12px' }}>
                            <label style={lbl}>Filter by course <span style={{ fontWeight: 400, textTransform: 'none', color: '#9ca3af' }}>(optional)</span></label>
                            <select
                              value={(section as any).courseFilter ?? ''}
                              onChange={e => updateSection(section.id, { courseFilter: e.target.value } as any)}
                              style={{ ...inp, width: '100%' }}>
                              <option value="">All courses</option>
                              {courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
                            </select>
                          </div>

                          {/* Review picker */}
                          {(() => {
                            const courseFilter = (section as any).courseFilter
                            const filtered = courseFilter ? reviews.filter(r => r.course.id === courseFilter) : reviews
                            const selected: string[] = (section as any).reviewIds ?? []
                            if (filtered.length === 0) return (
                              <div style={{ padding: '12px', background: '#fef9f0', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '10px' }}>
                                <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>No approved reviews {courseFilter ? 'for this course' : 'yet'}. Approve reviews in <strong>Admin → Reviews</strong>.</p>
                              </div>
                            )
                            return (
                              <div style={{ marginBottom: '12px' }}>
                                <label style={{ ...lbl, marginBottom: '8px' }}>
                                  Pick reviews to display
                                  {selected.length > 0 && <span style={{ fontWeight: 400, color: '#7B2FBE', textTransform: 'none', marginLeft: '6px' }}>({selected.length} selected)</span>}
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto', paddingRight: '2px' }}>
                                  {filtered.map(r => {
                                    const isSelected = selected.includes(r.id)
                                    return (
                                      <label key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: isSelected ? 'rgba(123,47,190,0.05)' : '#f9fafb', border: `1px solid ${isSelected ? 'rgba(123,47,190,0.3)' : '#e5e7eb'}`, borderRadius: '8px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={isSelected}
                                          style={{ marginTop: '2px', accentColor: '#7B2FBE', flexShrink: 0 }}
                                          onChange={e => {
                                            const ids = selected.includes(r.id) ? selected.filter(x => x !== r.id) : [...selected, r.id]
                                            updateSection(section.id, { reviewIds: ids } as any)
                                          }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{r.user.name ?? 'Student'}</span>
                                            <span style={{ fontSize: '11px', color: '#F59E0B' }}>{'★'.repeat(r.rating)}</span>
                                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{r.course.title}</span>
                                            {r.isFeatured && <span style={{ fontSize: '10px', color: '#7B2FBE', fontWeight: 700 }}>⭐ Featured</span>}
                                          </div>
                                          {r.comment && <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{r.comment}"</p>}
                                        </div>
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })()}
                        </>
                      )}
                                            {section.type === 'divider' && (
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Ornamental divider — no configuration needed.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[{ type: 'text' as const, label: '+ Text Block', icon: '📝' }, { type: 'testimonials' as const, label: '+ Testimonials', icon: '💬' }, { type: 'divider' as const, label: '+ Divider', icon: '—' }].map(b => (
                  <button key={b.type} onClick={() => addSection(b.type)} style={{ padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {b.icon} {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── EMAIL OPTIN TAB ── */}
          {tab === 'optin' && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '20px', padding: '12px', border: form.showEmailOptin ? '1px solid rgba(123,47,190,0.3)' : '1px solid #e5e7eb', borderRadius: '8px', background: form.showEmailOptin ? 'rgba(123,47,190,0.04)' : 'white' }}>
                <input type="checkbox" checked={form.showEmailOptin} onChange={e => set('showEmailOptin', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#7B2FBE' }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>Show email sign-up section</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Displayed at the bottom of the homepage</p>
                </div>
              </label>
              <Field label="Headline">
                <input value={form.emailOptinHeadline} onChange={e => set('emailOptinHeadline', e.target.value)} style={{ ...inp, opacity: form.showEmailOptin ? 1 : 0.5 }} disabled={!form.showEmailOptin} />
              </Field>
              <Field label="Subtext">
                <textarea value={form.emailOptinSubtext} onChange={e => set('emailOptinSubtext', e.target.value)} rows={2} style={{ ...inp, resize: 'none', opacity: form.showEmailOptin ? 1 : 0.5 }} disabled={!form.showEmailOptin} />
              </Field>
            </div>
          )}
        </div>

        {/* Save bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div>{error && <p style={{ fontSize: '14px', color: '#ef4444', margin: 0 }}>{error}</p>}</div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <a href="/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
              <ExternalLink size={13} /> Preview live
            </a>
            <button onClick={handleSave} disabled={saving} style={{ padding: '11px 28px', background: saved ? '#10b981' : saving ? '#e5e7eb' : '#7B2FBE', color: saved || !saving ? 'white' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', transition: 'background 0.2s' }}>
              {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Homepage'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right panel: what each field does ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151' }}>What you're editing</h3>
          </div>
          <div style={{ padding: '14px 16px' }}>
            {tab === 'hero' && (
              <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.8 }}>
                <p style={{ marginBottom: '10px', color: '#374151', fontWeight: 600 }}>Hero section — top of page</p>
                <p>· <strong>Eyebrow</strong> — small text above headline</p>
                <p>· <strong>Headline</strong> — the big bold statement</p>
                <p>· <strong>Subtext</strong> — supporting description</p>
                <p>· <strong>Buttons</strong> — primary + optional secondary CTA</p>
                <p>· <strong>Badges</strong> — social proof below buttons</p>
              </div>
            )}
            {tab === 'courses' && (
              <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.8 }}>
                <p style={{ marginBottom: '10px', color: '#374151', fontWeight: 600 }}>Course grid — below hero</p>
                <p>Tick courses to pin them at the top of the homepage grid.</p>
                <br />
                <p>Pinned courses appear first, followed by all other published courses.</p>
                <br />
                <p>If no courses are pinned, all published courses show in their default order.</p>
              </div>
            )}
            {tab === 'sections' && (
              <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.8 }}>
                <p style={{ marginBottom: '10px', color: '#374151', fontWeight: 600 }}>Content blocks — below courses</p>
                <p>· <strong>Text block</strong> — heading + body text. Good for an About section or mission statement.</p>
                <br />
                <p>· <strong>Testimonials</strong> — student quotes displayed in a grid.</p>
                <br />
                <p>· <strong>Divider</strong> — ornamental ✦ separator between sections.</p>
              </div>
            )}
            {tab === 'optin' && (
              <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.8 }}>
                <p style={{ marginBottom: '10px', color: '#374151', fontWeight: 600 }}>Email sign-up — bottom of page</p>
                <p>The subscriber form that collects email addresses. Subscribers appear in Admin → Subscribers.</p>
                <br />
                <p>Toggle it off if you don't want it on the homepage.</p>
              </div>
            )}
          </div>
        </div>

        {/* Live preview — changes per tab */}
        <div style={{ background: '#0D0D1A', border: '1px solid #2E2E4E', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #2E2E4E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#6B5B8A', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Preview — {tab}</span>
            <a href="/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#C084FC', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
              Open <ExternalLink size={10} />
            </a>
          </div>

          {/* Hero preview */}
          {tab === 'hero' && (
            <div style={{ padding: '18px 16px', textAlign: 'center' }}>
              {form.heroEyebrow && <p style={{ fontSize: '9px', color: '#C084FC', letterSpacing: '0.15em', marginBottom: '6px', textTransform: 'uppercase' }}>{form.heroEyebrow}</p>}
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#F0EAF8', lineHeight: 1.3, marginBottom: '6px' }}>{form.heroHeadline || '(no headline)'}</p>
              <p style={{ fontSize: '9px', color: '#A78BCA', lineHeight: 1.5, marginBottom: '10px' }}>{form.heroSubtext?.slice(0, 80)}{(form.heroSubtext?.length ?? 0) > 80 ? '…' : ''}</p>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                {form.heroPrimaryLabel && <span style={{ fontSize: '9px', padding: '4px 10px', background: '#7B2FBE', color: 'white', borderRadius: '5px', fontWeight: 700 }}>{form.heroPrimaryLabel}</span>}
                {form.heroSecondaryLabel && <span style={{ fontSize: '9px', padding: '4px 10px', border: '1px solid #2E2E4E', color: '#A78BCA', borderRadius: '5px' }}>{form.heroSecondaryLabel}</span>}
              </div>
              {(form.badge1 || form.badge2 || form.badge3) && (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[form.badge1, form.badge2, form.badge3].filter(Boolean).map((b, i) => (
                    <span key={i} style={{ fontSize: '8px', padding: '2px 7px', background: 'rgba(123,47,190,0.2)', color: '#C084FC', borderRadius: '4px' }}>{b}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Courses preview */}
          {tab === 'courses' && (
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: '9px', color: '#6B5B8A', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px', fontWeight: 600 }}>Pinned courses</p>
              {(form.featuredCourseIds ?? []).length === 0
                ? <p style={{ fontSize: '10px', color: '#4B4570', fontStyle: 'italic' }}>No courses pinned — all published courses will show</p>
                : (form.featuredCourseIds ?? []).map((id: string) => {
                    const c = courses.find(c => c.id === id)
                    return c ? (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <div style={{ width: '28px', height: '20px', background: '#1E1B2E', borderRadius: '3px', flexShrink: 0 }} />
                        <span style={{ fontSize: '10px', color: '#D4CAFE', fontWeight: 600 }}>{c.title}</span>
                      </div>
                    ) : null
                  })
              }
            </div>
          )}

          {/* Sections preview */}
          {tab === 'sections' && (
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: '9px', color: '#6B5B8A', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px', fontWeight: 600 }}>Content blocks</p>
              {(form.sections ?? []).length === 0
                ? <p style={{ fontSize: '10px', color: '#4B4570', fontStyle: 'italic' }}>No blocks added yet</p>
                : (form.sections ?? []).map((s: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px' }}>{s.type === 'text' ? '📝' : s.type === 'testimonials' ? '💬' : '✦'}</span>
                      <span style={{ fontSize: '10px', color: '#A78BCA' }}>{s.heading || s.type}</span>
                    </div>
                  ))
              }
            </div>
          )}

          {/* Email sign-up preview */}
          {tab === 'optin' && (
            <div style={{ padding: '14px 16px', textAlign: 'center' }}>
              {form.showEmailOptin
                ? <>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#F0EAF8', margin: '0 0 4px' }}>{form.emailOptinHeadline || '(no headline)'}</p>
                    <p style={{ fontSize: '9px', color: '#A78BCA', margin: '0 0 10px', lineHeight: 1.5 }}>{form.emailOptinSubtext?.slice(0, 60) || ''}{(form.emailOptinSubtext?.length ?? 0) > 60 ? '…' : ''}</p>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <div style={{ flex: 1, height: '22px', background: '#1E1B2E', borderRadius: '4px', border: '1px solid #2E2E4E' }} />
                      <span style={{ fontSize: '8px', padding: '4px 8px', background: '#7B2FBE', color: 'white', borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {form.emailOptinButtonLabel || 'Subscribe'}
                      </span>
                    </div>
                  </>
                : <p style={{ fontSize: '10px', color: '#4B4570', fontStyle: 'italic' }}>Sign-up section hidden</p>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
