'use client'
import { useState } from 'react'
import Image from 'next/image'

type Lesson = { id: string; title: string; duration: number | null; isFree: boolean; type: string }
type Module = { id: string; title: string; lessons: Lesson[] }
type Course = { id: string; slug: string; title: string; thumbnailUrl: string | null; subtitle: string | null; modules: Module[] }
type Product = { id: string; title: string; type: string; price: number; currency: string; instructor: { displayName: string; avatarUrl: string | null } | null; courses: { course: Course }[] }

function fmt(secs: number | null) {
  if (!secs) return ''
  const m = Math.floor(secs / 60)
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`
}

function ProgressBar({ pct, color = 'var(--brand)' }: { pct: number; color?: string }) {
  return (
    <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.4s' }} />
    </div>
  )
}

// ── Portal Dashboard ─────────────────────────────────────────────────────────

function PortalDashboard({ products, onSelect }: { products: Product[]; onSelect: (p: Product) => void }) {
  return (
    <div style={{ background: '#0D0D1A', minHeight: '500px', borderRadius: '12px', padding: '32px', fontFamily: 'var(--font-ui)' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B5B8A', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>My Library</p>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F0EAF8', marginBottom: '24px' }}>
        Welcome back! 👋
      </h2>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#4B4570' }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>📚</p>
          <p>No published courses yet. Publish a product to see the preview.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {products.map(product => {
            const course = product.courses[0]?.course
            const totalLessons = course?.modules.reduce((a, m) => a + m.lessons.length, 0) ?? 0
            const fakePct = Math.floor(Math.random() * 70) // demo progress
            return (
              <div key={product.id}
                onClick={() => onSelect(product)}
                style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,47,190,0.5)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
                {/* Thumbnail */}
                <div style={{ height: '150px', background: 'linear-gradient(135deg, #1A0A2E, #2D1045)', position: 'relative', overflow: 'hidden' }}>
                  {course?.thumbnailUrl && <Image src={course.thumbnailUrl} alt={product.title} fill style={{ objectFit: 'cover' }} />}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,13,26,0.9) 0%, transparent 60%)' }} />
                  <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px' }}>
                    <ProgressBar pct={fakePct} />
                  </div>
                </div>
                {/* Info */}
                <div style={{ padding: '14px 16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#F0EAF8', marginBottom: '4px', lineHeight: 1.3 }}>{product.title}</h3>
                  {product.instructor && <p style={{ fontSize: '11px', color: '#6B5B8A', marginBottom: '10px' }}>{product.instructor.displayName}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#6B5B8A' }}>{totalLessons} lessons</span>
                    <span style={{ fontSize: '11px', color: fakePct > 0 ? '#C084FC' : '#4B4570' }}>{fakePct === 0 ? 'Not started' : `${fakePct}% complete`}</span>
                  </div>
                  <div style={{ padding: '9px', background: fakePct > 0 ? '#7B2FBE' : 'rgba(123,47,190,0.15)', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: fakePct > 0 ? 'white' : '#C084FC' }}>
                    {fakePct === 0 ? 'Start Course →' : 'Continue →'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Course Player ─────────────────────────────────────────────────────────────

function CoursePlayer({ product, onBack }: { product: Product; onBack: () => void }) {
  const course = product.courses[0]?.course
  const allLessons = course?.modules.flatMap(m => m.lessons) ?? []
  const [activeLesson, setActiveLesson] = useState<string | null>(allLessons[0]?.id ?? null)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(course?.modules.map(m => m.id) ?? []))

  const lesson = allLessons.find(l => l.id === activeLesson)
  const pct = allLessons.length > 0 ? Math.round((completed.size / allLessons.length) * 100) : 0

  const toggleModule = (id: string) => {
    const s = new Set(expandedModules)
    s.has(id) ? s.delete(id) : s.add(id)
    setExpandedModules(s)
  }

  const markComplete = () => {
    if (activeLesson) {
      const s = new Set(completed)
      s.add(activeLesson)
      setCompleted(s)
      // Auto-advance
      const idx = allLessons.findIndex(l => l.id === activeLesson)
      if (idx < allLessons.length - 1) setActiveLesson(allLessons[idx + 1].id)
    }
  }

  if (!course) return null

  return (
    <div style={{ background: '#0D0D1A', borderRadius: '12px', overflow: 'hidden', fontFamily: 'var(--font-ui)', display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: '560px' }}>
      {/* Left — video + lesson info */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Back bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#6B5B8A', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            ← Back to library
          </button>
          <span style={{ color: '#2E2E4E' }}>|</span>
          <span style={{ fontSize: '13px', color: '#A78BCA', fontWeight: 600 }}>{product.title}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ProgressBar pct={pct} />
            <span style={{ fontSize: '11px', color: '#6B5B8A', whiteSpace: 'nowrap' }}>{pct}%</span>
          </div>
        </div>

        {/* Video placeholder */}
        <div style={{ background: '#000', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ textAlign: 'center', color: '#4B4570' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>▶</div>
            <p style={{ fontSize: '13px' }}>Demo — video would play here</p>
          </div>
        </div>

        {/* Lesson info */}
        <div style={{ padding: '20px 24px', flex: 1 }}>
          {lesson ? (
            <>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#F0EAF8', marginBottom: '8px' }}>{lesson.title}</h3>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {lesson.duration && <span style={{ fontSize: '13px', color: '#6B5B8A' }}>⏱ {fmt(lesson.duration)}</span>}
                {completed.has(lesson.id) ? (
                  <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>✓ Completed</span>
                ) : (
                  <button onClick={markComplete}
                    style={{ padding: '8px 18px', background: '#7B2FBE', color: 'white', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                    Mark Complete →
                  </button>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: '#4B4570' }}>Select a lesson from the sidebar.</p>
          )}
        </div>
      </div>

      {/* Right — curriculum sidebar */}
      <div style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', maxHeight: '560px' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B5B8A', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Curriculum · {allLessons.length} lessons
          </p>
        </div>
        {course.modules.map(mod => (
          <div key={mod.id}>
            <button onClick={() => toggleModule(mod.id)}
              style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#A78BCA', textAlign: 'left' }}>{mod.title}</span>
              <span style={{ fontSize: '10px', color: '#4B4570' }}>{expandedModules.has(mod.id) ? '▲' : '▼'}</span>
            </button>
            {expandedModules.has(mod.id) && mod.lessons.map(l => (
              <button key={l.id} onClick={() => setActiveLesson(l.id)}
                style={{ width: '100%', padding: '9px 16px 9px 24px', background: activeLesson === l.id ? 'rgba(123,47,190,0.15)' : 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)', borderLeft: activeLesson === l.id ? '3px solid #7B2FBE' : '3px solid transparent', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', transition: 'background 0.1s' }}>
                <span style={{ fontSize: '11px', color: completed.has(l.id) ? '#10b981' : '#4B4570', flexShrink: 0 }}>
                  {completed.has(l.id) ? '✓' : l.type === 'VIDEO' ? '▶' : '📄'}
                </span>
                <span style={{ fontSize: '12px', color: activeLesson === l.id ? '#F0EAF8' : '#9B8CC4', flex: 1, lineHeight: 1.3 }}>{l.title}</span>
                {l.duration && <span style={{ fontSize: '10px', color: '#4B4570', flexShrink: 0 }}>{fmt(l.duration)}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main demo wrapper ────────────────────────────────────────────────────────

export default function DemoClient({ products }: { products: Product[] }) {
  const [view, setView] = useState<'dashboard' | 'course'>('dashboard')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  return (
    <div>
      {/* Info banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(123,47,190,0.1), rgba(52,211,153,0.07))', border: '1px solid rgba(123,47,190,0.2)', borderRadius: '12px', padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '20px' }}>👁</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>Student View Preview</p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            This is exactly what your students see. Click a course card to open the player. Progress is demo-only and not saved.
          </p>
        </div>
        <a href="/portal" target="_blank" rel="noopener noreferrer"
          style={{ padding: '8px 16px', background: '#7B2FBE', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Open Real Portal →
        </a>
      </div>

      {/* Simulated device frame */}
      <div style={{ background: '#1A1A2E', border: '2px solid rgba(123,47,190,0.25)', borderRadius: '16px', overflow: 'hidden' }}>
        {/* Fake browser bar */}
        <div style={{ padding: '10px 16px', background: '#111120', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['#ff5f57','#febc2e','#28c840'].map(col => <div key={col} style={{ width: '10px', height: '10px', borderRadius: '50%', background: col }} />)}
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '5px', padding: '4px 12px', fontSize: '11px', color: '#4B4570', marginLeft: '8px' }}>
            courses.perseusarcaneacademy.com/portal
          </div>
        </div>

        {/* Simulated portal sidebar + main */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: '580px' }}>
          {/* Sidebar */}
          <div style={{ background: '#111120', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '20px 0' }}>
            <div style={{ padding: '0 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#C084FC', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Perseus Academy</p>
            </div>
            {[
              { icon: '📚', label: 'My Library',    active: true },
              { icon: '🎓', label: 'Certificates',  active: false },
              { icon: '👤', label: 'My Account',    active: false },
            ].map(item => (
              <div key={item.label} style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '9px', background: item.active ? 'rgba(123,47,190,0.15)' : 'none', borderLeft: item.active ? '3px solid #7B2FBE' : '3px solid transparent', cursor: 'pointer' }}>
                <span style={{ fontSize: '14px' }}>{item.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: item.active ? 700 : 400, color: item.active ? '#F0EAF8' : '#6B5B8A' }}>{item.label}</span>
              </div>
            ))}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B2FBE, #C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white' }}>S</div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#D4CAFE', margin: 0 }}>Student Name</p>
                <p style={{ fontSize: '10px', color: '#4B4570', margin: 0 }}>student@email.com</p>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div style={{ padding: '24px', overflowY: 'auto' }}>
            {view === 'dashboard' ? (
              <PortalDashboard products={products} onSelect={p => { setSelectedProduct(p); setView('course') }} />
            ) : selectedProduct ? (
              <CoursePlayer product={selectedProduct} onBack={() => setView('dashboard')} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
