'use client'
import { useState } from 'react'
import Image from 'next/image'

type Lesson  = { id: string; title: string; duration: number | null; isFree: boolean; type: string }
type Module  = { id: string; title: string; lessons: Lesson[] }
type Course  = { id: string; slug: string; title: string; thumbnailUrl: string | null; subtitle: string | null; modules: Module[] }
type Product = { id: string; title: string; type: string; price: number; currency: string; instructor: { displayName: string; avatarUrl: string | null } | null; courses: { course: Course }[] }

// ── Demo placeholder data shown when no published courses exist ───────────────
const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-1', title: 'Introduction to Hermetics', type: 'COURSE', price: 97, currency: 'USD',
    instructor: { displayName: 'Simon Robinson', avatarUrl: null },
    courses: [{
      course: {
        id: 'demo-c1', slug: 'intro-hermetics', title: 'Introduction to Hermetics',
        thumbnailUrl: null, subtitle: 'The seven Hermetic principles explained',
        modules: [
          { id: 'm1', title: 'The Hermetic Foundation', lessons: [
            { id: 'l1', title: 'Welcome & Overview', duration: 480,  isFree: true,  type: 'VIDEO' },
            { id: 'l2', title: 'What is Hermeticism?', duration: 1440, isFree: false, type: 'VIDEO' },
            { id: 'l3', title: 'The Kybalion — Text & Context', duration: 2160, isFree: false, type: 'VIDEO' },
          ]},
          { id: 'm2', title: 'The Seven Principles', lessons: [
            { id: 'l4', title: 'Mentalism — All is Mind', duration: 1800, isFree: false, type: 'VIDEO' },
            { id: 'l5', title: 'Correspondence — As Above So Below', duration: 1620, isFree: false, type: 'VIDEO' },
            { id: 'l6', title: 'Vibration — Nothing Rests', duration: 1440, isFree: false, type: 'VIDEO' },
            { id: 'l7', title: 'Polarity — Everything is Dual', duration: 1260, isFree: false, type: 'VIDEO' },
          ]},
          { id: 'm3', title: 'Practical Application', lessons: [
            { id: 'l8', title: 'Daily Practice & Ritual', duration: 2400, isFree: false, type: 'VIDEO' },
            { id: 'l9', title: 'Meditation Techniques', duration: 1800, isFree: false, type: 'VIDEO' },
            { id: 'l10', title: 'Final Integration', duration: 3600, isFree: false, type: 'VIDEO' },
          ]},
        ],
      },
    }],
  },
  {
    id: 'demo-2', title: 'Foundations of Kabbalah', type: 'COURSE', price: 127, currency: 'USD',
    instructor: { displayName: 'Simon Robinson', avatarUrl: null },
    courses: [{
      course: {
        id: 'demo-c2', slug: 'kabbalah-foundations', title: 'Foundations of Kabbalah',
        thumbnailUrl: null, subtitle: 'Tree of Life, Sephiroth and the path of ascent',
        modules: [
          { id: 'm4', title: 'The Tree of Life', lessons: [
            { id: 'l11', title: 'Introduction to the Tree', duration: 720, isFree: true, type: 'VIDEO' },
            { id: 'l12', title: 'The Ten Sephiroth', duration: 2400, isFree: false, type: 'VIDEO' },
            { id: 'l13', title: 'The 22 Paths', duration: 1980, isFree: false, type: 'VIDEO' },
          ]},
          { id: 'm5', title: 'Practical Kabbalah', lessons: [
            { id: 'l14', title: 'Pathworking Basics', duration: 1800, isFree: false, type: 'VIDEO' },
            { id: 'l15', title: 'Gematria & Sacred Numbers', duration: 2160, isFree: false, type: 'VIDEO' },
          ]},
        ],
      },
    }],
  },
]

function fmt(secs: number | null) {
  if (!secs) return ''
  const m = Math.floor(secs / 60)
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct === 100 ? '#10b981' : '#7B2FBE'
  return (
    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.4s' }} />
    </div>
  )
}

// ── Portal Library ────────────────────────────────────────────────────────────
function PortalLibrary({ products, progress, onSelect }: {
  products: Product[]
  progress: Record<string, number>
  onSelect: (p: Product) => void
}) {
  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B5B8A', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>My Library</p>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F0EAF8', marginBottom: '20px' }}>Welcome back! 👋</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
        {products.map(product => {
          const course = product.courses[0]?.course
          const allLessons = course?.modules.flatMap(m => m.lessons) ?? []
          const pct = progress[product.id] ?? 0
          return (
            <div key={product.id} onClick={() => onSelect(product)}
              style={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,47,190,0.5)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
              <div style={{ height: '130px', background: 'linear-gradient(135deg, #1A0A2E, #2D1045)', position: 'relative' }}>
                {course?.thumbnailUrl && <Image src={course.thumbnailUrl} alt={product.title} fill style={{ objectFit: 'cover' }} />}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,13,26,0.9) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: '8px', left: '12px', right: '12px' }}>
                  <ProgressBar pct={pct} />
                </div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#F0EAF8', marginBottom: '3px', lineHeight: 1.3 }}>{product.title}</h3>
                <p style={{ fontSize: '11px', color: '#6B5B8A', marginBottom: '10px' }}>{allLessons.length} lessons</p>
                <div style={{ padding: '8px', background: pct > 0 ? '#7B2FBE' : 'rgba(123,47,190,0.15)', borderRadius: '7px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: pct > 0 ? 'white' : '#C084FC' }}>
                  {pct === 0 ? 'Start →' : pct === 100 ? 'Revisit' : 'Continue →'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Course Player ─────────────────────────────────────────────────────────────
function CoursePlayer({ product, completed, onComplete, onBack }: {
  product: Product
  completed: Set<string>
  onComplete: (id: string) => void
  onBack: () => void
}) {
  const course    = product.courses[0]?.course
  const allLessons = course?.modules.flatMap(m => m.lessons) ?? []
  const [activeId, setActiveId] = useState(allLessons[0]?.id ?? null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(course?.modules.map(m => m.id) ?? []))
  const lesson = allLessons.find(l => l.id === activeId)
  const pct    = allLessons.length > 0 ? Math.round((completed.size / allLessons.length) * 100) : 0

  const markComplete = () => {
    if (!activeId) return
    onComplete(activeId)
    const idx = allLessons.findIndex(l => l.id === activeId)
    if (idx < allLessons.length - 1) setActiveId(allLessons[idx + 1].id)
  }

  const toggleMod = (id: string) => {
    const s = new Set(expanded); s.has(id) ? s.delete(id) : s.add(id); setExpanded(s)
  }

  if (!course) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', minHeight: '520px' }}>
      {/* Main */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Top bar */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#6B5B8A', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-ui)' }}>
            ← Library
          </button>
          <span style={{ color: '#2E2E4E', fontSize: '12px' }}>|</span>
          <span style={{ fontSize: '12px', color: '#A78BCA', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</span>
          <span style={{ fontSize: '11px', color: '#6B5B8A', whiteSpace: 'nowrap' }}>{pct}% complete</span>
        </div>
        {/* Video area */}
        <div style={{ background: '#050510', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#2E2E4E' }}>
            <div style={{ fontSize: '44px', marginBottom: '8px' }}>▶</div>
            <p style={{ fontSize: '12px' }}>{lesson?.title ?? 'Select a lesson'}</p>
          </div>
        </div>
        {/* Lesson info */}
        <div style={{ padding: '16px 20px', flex: 1 }}>
          {lesson && <>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F0EAF8', marginBottom: '6px' }}>{lesson.title}</h3>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {lesson.duration && <span style={{ fontSize: '12px', color: '#6B5B8A' }}>⏱ {fmt(lesson.duration)}</span>}
              {completed.has(lesson.id)
                ? <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>✓ Completed</span>
                : <button onClick={markComplete} style={{ padding: '7px 16px', background: '#7B2FBE', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Mark Complete →</button>
              }
            </div>
          </>}
        </div>
      </div>
      {/* Sidebar */}
      <div style={{ overflowY: 'auto' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B5B8A', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Curriculum · {allLessons.length} lessons
          </p>
        </div>
        {course.modules.map(mod => (
          <div key={mod.id}>
            <button onClick={() => toggleMod(mod.id)}
              style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#A78BCA', textAlign: 'left' }}>{mod.title}</span>
              <span style={{ fontSize: '9px', color: '#4B4570' }}>{expanded.has(mod.id) ? '▲' : '▼'}</span>
            </button>
            {expanded.has(mod.id) && mod.lessons.map(l => (
              <button key={l.id} onClick={() => setActiveId(l.id)}
                style={{ width: '100%', padding: '8px 14px 8px 22px', background: activeId === l.id ? 'rgba(123,47,190,0.15)' : 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.03)', borderLeft: activeId === l.id ? '3px solid #7B2FBE' : '3px solid transparent', display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)' }}>
                <span style={{ fontSize: '10px', color: completed.has(l.id) ? '#10b981' : '#4B4570', flexShrink: 0 }}>
                  {completed.has(l.id) ? '✓' : '▶'}
                </span>
                <span style={{ fontSize: '11px', color: activeId === l.id ? '#F0EAF8' : '#9B8CC4', flex: 1, lineHeight: 1.3 }}>{l.title}</span>
                {l.duration && <span style={{ fontSize: '10px', color: '#4B4570', flexShrink: 0 }}>{fmt(l.duration)}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DemoClient({ products: realProducts }: { products: Product[] }) {
  const products   = realProducts.length > 0 ? realProducts : DEMO_PRODUCTS
  const isDemo     = realProducts.length === 0

  const [view,    setView]    = useState<'library' | 'course'>('library')
  const [current, setCurrent] = useState<Product | null>(null)
  // Per-product completed lesson sets
  const [completedMap, setCompletedMap] = useState<Record<string, Set<string>>>({})

  const markComplete = (productId: string, lessonId: string) => {
    setCompletedMap(m => {
      const s = new Set(m[productId] ?? [])
      s.add(lessonId)
      return { ...m, [productId]: s }
    })
  }

  const progress = Object.fromEntries(products.map(p => {
    const all = p.courses[0]?.course.modules.flatMap(m => m.lessons) ?? []
    const done = completedMap[p.id]?.size ?? 0
    return [p.id, all.length > 0 ? Math.round((done / all.length) * 100) : 0]
  }))

  return (
    <div>
      {/* Banner */}
      <div style={{ background: isDemo ? 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(123,47,190,0.07))' : 'linear-gradient(135deg,rgba(123,47,190,0.1),rgba(52,211,153,0.07))', border: `1px solid ${isDemo ? 'rgba(245,158,11,0.3)' : 'rgba(123,47,190,0.2)'}`, borderRadius: '12px', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '20px' }}>{isDemo ? '🎭' : '👁'}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>
            {isDemo ? 'Demo mode — sample courses' : 'Student View Preview'}
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            {isDemo
              ? 'No published courses found, so showing sample data. Publish a product to preview your real courses here.'
              : 'Showing your real published courses exactly as a student sees them. Progress is not saved.'}
          </p>
        </div>
        <a href="/portal" target="_blank" rel="noopener noreferrer"
          style={{ padding: '8px 16px', background: '#7B2FBE', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Open Real Portal →
        </a>
      </div>

      {/* Browser frame */}
      <div style={{ background: '#1A1A2E', border: '2px solid rgba(123,47,190,0.25)', borderRadius: '14px', overflow: 'hidden' }}>
        {/* Fake browser bar */}
        <div style={{ padding: '9px 14px', background: '#0D0D1A', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['#ff5f57','#febc2e','#28c840'].map(col => <div key={col} style={{ width: '9px', height: '9px', borderRadius: '50%', background: col }} />)}
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '3px 10px', fontSize: '11px', color: '#4B4570', marginLeft: '6px' }}>
            courses.perseusarcaneacademy.com/portal
          </div>
        </div>

        {/* Sidebar + content */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr' }}>
          {/* Portal sidebar */}
          <div style={{ background: '#0D0D1A', borderRight: '1px solid rgba(255,255,255,0.07)', minHeight: '520px', paddingTop: '16px' }}>
            <div style={{ padding: '0 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '8px' }}>
              <p style={{ fontSize: '10px', fontWeight: 800, color: '#C084FC', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Perseus Academy</p>
            </div>
            {[
              { icon: '📚', label: 'My Library',   active: view === 'library' },
              { icon: '🎓', label: 'Certificates', active: false },
              { icon: '👤', label: 'My Account',   active: false },
            ].map(item => (
              <div key={item.label}
                onClick={() => { if (item.label === 'My Library') setView('library') }}
                style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', background: item.active ? 'rgba(123,47,190,0.15)' : 'none', borderLeft: item.active ? '3px solid #7B2FBE' : '3px solid transparent', cursor: item.label === 'My Library' ? 'pointer' : 'default' }}>
                <span style={{ fontSize: '13px' }}>{item.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: item.active ? 700 : 400, color: item.active ? '#F0EAF8' : '#6B5B8A' }}>{item.label}</span>
              </div>
            ))}
            {/* Student badge at bottom */}
            <div style={{ position: 'relative', marginTop: '24px', padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#7B2FBE,#C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0 }}>S</div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#D4CAFE', margin: 0 }}>Student</p>
                  <p style={{ fontSize: '10px', color: '#4B4570', margin: 0 }}>student@email.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div style={{ padding: '20px', background: '#0D0D1A', overflowY: 'auto', maxHeight: '580px' }}>
            {view === 'library'
              ? <PortalLibrary products={products} progress={progress} onSelect={p => { setCurrent(p); setView('course') }} />
              : current
                ? <CoursePlayer
                    product={current}
                    completed={completedMap[current.id] ?? new Set()}
                    onComplete={id => markComplete(current.id, id)}
                    onBack={() => setView('library')}
                  />
                : null
            }
          </div>
        </div>
      </div>
    </div>
  )
}
