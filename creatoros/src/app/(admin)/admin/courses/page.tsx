export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

export const metadata: Metadata = { title: 'Courses — Admin' }

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      instructor: { select: { displayName: true } },
      _count: { select: { enrollments: true, modules: true, lessons: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const statusColor: Record<string, string> = {
    PUBLISHED: '#10b981',
    DRAFT:     '#f59e0b',
    ARCHIVED:  '#6b7280',
  }

  const statusBg: Record<string, string> = {
    PUBLISHED: 'rgba(16,185,129,0.1)',
    DRAFT:     'rgba(245,158,11,0.1)',
    ARCHIVED:  'rgba(107,114,128,0.1)',
  }

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Courses"
        description={`${courses.length} total courses`}
        action={{ label: '+ New Course', href: '/admin/courses/new' }}
      />

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Course', 'Status', 'Price', 'Students', 'Modules', 'Instructor', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center' }}>
                  <p style={{ color: '#9ca3af', fontSize: '15px', marginBottom: '12px' }}>No courses yet.</p>
                  <Link href="/admin/courses/new" style={{ color: '#7B2FBE', fontWeight: 600, fontSize: '14px' }}>
                    Create your first course →
                  </Link>
                </td>
              </tr>
            ) : courses.map(course => (
              <tr key={course.id} style={{ borderTop: '1px solid #f3f4f6' }} className="admin-row-hover">
                <td style={{ padding: '14px 16px', maxWidth: '280px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {course.title}
                  </p>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>/courses/{course.slug}</p>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    color: statusColor[course.status],
                    background: statusBg[course.status],
                    padding: '3px 10px', borderRadius: '999px',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {course.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151', fontWeight: 500 }}>
                  {Number(course.price) === 0 ? 'Free' : `${course.currency} ${Number(course.price).toFixed(2)}`}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151' }}>
                  {course._count.enrollments}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151' }}>
                  {course._count.modules} / {course._count.lessons} lessons
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>
                  {course.instructor?.displayName ?? '—'}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={`/admin/courses/${course.id}/edit`} style={{ fontSize: '13px', color: '#7B2FBE', fontWeight: 600, textDecoration: 'none' }}>
                      Edit
                    </Link>
                    <span style={{ color: '#e5e7eb' }}>·</span>
                    <Link href={`/courses/${course.slug}`} target="_blank" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`.admin-row-hover:hover { background: #fafafa !important; }`}</style>
    </div>
  )
}
