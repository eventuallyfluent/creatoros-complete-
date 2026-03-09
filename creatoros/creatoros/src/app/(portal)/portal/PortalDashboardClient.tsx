'use client'
import Link from 'next/link'
import Image from 'next/image'

type CourseItem = {
  id: string; slug: string; title: string; thumbnailUrl: string | null
  progress: number; total: number; completed: number
}

type LibraryItem = {
  id: string; type: string; title: string; thumbnailUrl: string | null
  slug: string; instructor: string | null; courses: CourseItem[]; enrolledAt: Date
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct === 100 ? '#10b981' : pct > 0 ? 'var(--brand)' : 'var(--bg-elevated)'
  return (
    <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
    </div>
  )
}

function ProductCard({ item }: { item: LibraryItem }) {
  const isBundle   = item.type === 'BUNDLE' && item.courses.length > 1
  const overallPct = item.courses.length > 0
    ? Math.round(item.courses.reduce((s, c) => s + c.progress, 0) / item.courses.length)
    : 0

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      <Link href={`/portal/courses/${item.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{ height: '160px', background: 'linear-gradient(135deg, #1A0A2E, #2D1045)', position: 'relative', overflow: 'hidden' }}>
          {item.thumbnailUrl && <Image src={item.thumbnailUrl} alt={item.title} fill style={{ objectFit: 'cover' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,13,26,0.8) 0%, transparent 60%)' }} />
          {isBundle && <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--brand)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px' }}>BUNDLE</span>}
          {overallPct === 100 && <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#10b981', color: '#0D0D1A', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px' }}>✓ COMPLETE</span>}
        </div>
      </Link>
      <div style={{ padding: '18px 18px 14px' }}>
        <Link href={`/portal/courses/${item.slug}`} style={{ textDecoration: 'none' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>{item.title}</h3>
        </Link>
        {item.instructor && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{item.instructor}</p>}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {overallPct === 0 ? 'Not started' : overallPct === 100 ? 'Completed' : `${overallPct}% complete`}
            </span>
            {!isBundle && item.courses[0] && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.courses[0].completed}/{item.courses[0].total} lessons</span>
            )}
          </div>
          <ProgressBar pct={overallPct} />
        </div>
        {isBundle && (
          <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {item.courses.map(c => (
              <Link key={c.id} href={`/portal/courses/${c.slug}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '5px 8px', borderRadius: '6px', background: 'var(--bg-elevated)' }}>
                <span style={{ fontSize: '9px', color: c.progress === 100 ? '#10b981' : c.progress > 0 ? 'var(--brand)' : 'var(--text-muted)' }}>
                  {c.progress === 100 ? '✓' : '▶'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.progress}%</span>
              </Link>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href={`/portal/courses/${item.slug}`}
            style={{ flex: 1, display: 'block', padding: '9px', textAlign: 'center', background: overallPct === 100 ? 'var(--bg-elevated)' : 'var(--brand)', color: overallPct === 100 ? 'var(--text-secondary)' : 'white', borderRadius: '8px', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            {overallPct === 0 ? 'Start →' : overallPct === 100 ? 'Revisit' : 'Continue →'}
          </Link>
          {overallPct === 100 && (
            <Link href={`/portal/courses/${item.slug}/review`}
              style={{ padding: '9px 10px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}>
              ★ Review
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function Shelf({ label, items }: { label: string; items: LibraryItem[] }) {
  return (
    <section style={{ marginBottom: '48px' }}>
      <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
        {label}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {items.map(item => <ProductCard key={item.id} item={item} />)}
      </div>
    </section>
  )
}

export default function PortalDashboardClient({
  firstName,
  libraryItems,
}: {
  firstName: string
  libraryItems: LibraryItem[]
}) {
  const inProgress = libraryItems.filter(i => i.courses.some(c => c.progress > 0 && c.progress < 100))
  const notStarted = libraryItems.filter(i => i.courses.every(c => c.progress === 0))
  const completed  = libraryItems.filter(i => i.courses.length > 0 && i.courses.every(c => c.progress === 100))

  return (
    <div style={{ padding: '40px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Welcome back, {firstName} ✦
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>
          {inProgress.length > 0
            ? `${inProgress.length} course${inProgress.length > 1 ? 's' : ''} in progress.`
            : libraryItems.length > 0 ? 'Your library is waiting.' : 'Start your arcane journey below.'}
        </p>
      </div>

      {libraryItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 32px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✦</div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Your library is empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px' }}>Browse the Academy and enrol in your first course.</p>
          <Link href="/courses" style={{ display: 'inline-flex', background: 'var(--brand)', color: 'white', padding: '12px 28px', borderRadius: '8px', fontWeight: 600, fontSize: '15px', textDecoration: 'none' }}>
            Browse Courses →
          </Link>
        </div>
      )}

      {inProgress.length > 0 && <Shelf label="Continue Learning" items={inProgress} />}
      {notStarted.length > 0 && <Shelf label="Not Started" items={notStarted} />}
      {completed.length > 0  && <Shelf label="Completed ✓"  items={completed}  />}
    </div>
  )
}
