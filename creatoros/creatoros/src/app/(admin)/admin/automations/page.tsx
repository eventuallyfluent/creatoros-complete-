export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Email Sequences — Admin' }

const TRIGGER_LABELS: Record<string, string> = {
  ENROLLMENT:      'Student enrols in course',
  PURCHASE:        'Order completed',
  LESSON_COMPLETE: 'Lesson completed',
  COURSE_COMPLETE: 'Course completed',
  SIGNUP:          'New account created',
  TAG_ADDED:       'Tag added to subscriber',
}

const TRIGGER_ICONS: Record<string, string> = {
  ENROLLMENT:      '🎓',
  PURCHASE:        '💳',
  LESSON_COMPLETE: '✓',
  COURSE_COMPLETE: '🏆',
  SIGNUP:          '👤',
  TAG_ADDED:       '🏷',
}

export default async function AdminAutomationsPage() {
  const automations = await prisma.automation.findMany({
    include: {
      steps:      { orderBy: { sortOrder: 'asc' } },
      executions: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => [])

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Email Sequences"
        description="Automated emails sent when a student enrols, completes a lesson, or finishes a course. Drip content is controlled per-lesson in the course editor."
        action={{ label: '+ New Automation', href: '/admin/automations/new' }}
      />

      {automations.length === 0 ? (
        <div style={{ background: 'white', border: '2px dashed #e5e7eb', borderRadius: '12px', padding: '56px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>No automations yet</h2>
          <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>Send welcome emails, drip content, and tag students automatically.</p>
          <Link href="/admin/automations/new" style={{ display: 'inline-block', background: '#7B2FBE', color: 'white', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
            Create First Automation →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {automations.map(auto => {
            const total     = auto.executions.length
            const completed = auto.executions.filter(e => e.status === 'COMPLETED').length
            const failed    = auto.executions.filter(e => e.status === 'FAILED').length

            return (
              <div key={auto.id} style={{ background: 'white', border: `1px solid ${auto.isActive ? '#e5e7eb' : '#f3f4f6'}`, borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', opacity: auto.isActive ? 1 : 0.6 }}>
                <span style={{ fontSize: '28px', flexShrink: 0 }}>{TRIGGER_ICONS[auto.trigger] ?? '⚡'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>{auto.name}</h3>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', color: auto.isActive ? '#10b981' : '#6b7280', background: auto.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)' }}>
                      {auto.isActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                    Trigger: {TRIGGER_LABELS[auto.trigger] ?? auto.trigger} · {auto.steps.length} step{auto.steps.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '24px', flexShrink: 0, textAlign: 'center' }}>
                  {[{ label: 'Runs', value: total }, { label: 'Done', value: completed }, { label: 'Failed', value: failed }].map(stat => (
                    <div key={stat.label}>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{stat.value}</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
                <Link href={`/admin/automations/${auto.id}/edit`} style={{ padding: '8px 18px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#374151', textDecoration: 'none', flexShrink: 0 }}>
                  Edit
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
