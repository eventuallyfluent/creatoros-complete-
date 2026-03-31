export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Email Sequences — Admin' }

export default async function SequencesPage() {
  const courses = await prisma.course.findMany({
    where:   { status: { not: 'ARCHIVED' } },
    select:  {
      id: true, title: true, slug: true,
      emailSequence: { select: { id: true, isActive: true, _count: { select: { steps: true } } } },
    },
    orderBy: { title: 'asc' },
  }).catch(() => [])

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Email Sequences"
        description="Drip emails sent automatically based on where students are in a course"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {courses.map(course => {
          const seq = course.emailSequence
          return (
            <Link key={course.id} href={`/admin/sequences/${course.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px 20px', cursor: 'pointer' }}
                className="seq-row">
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 3px' }}>{course.title}</p>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                    {seq ? `${seq._count.steps} email${seq._count.steps !== 1 ? 's' : ''} in sequence` : 'No sequence yet'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {seq && (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: seq.isActive ? 'rgba(16,185,129,0.1)' : '#f3f4f6', color: seq.isActive ? '#065f46' : '#6b7280' }}>
                      {seq.isActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  )}
                  <span style={{ fontSize: '13px', color: '#7B2FBE', fontWeight: 600 }}>
                    {seq ? 'Edit →' : 'Set up →'}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
        {courses.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No courses found.</p>
          </div>
        )}
      </div>
      <style>{`.seq-row:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }`}</style>
    </div>
  )
}
