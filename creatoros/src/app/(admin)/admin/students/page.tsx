export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Students — Admin' }

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const page  = Number(searchParams.page ?? 1)
  const take  = 50
  const skip  = (page - 1) * take
  const query = searchParams.q?.trim()

  const where: any = { role: 'STUDENT' }
  if (query) {
    where.OR = [
      { email: { contains: query, mode: 'insensitive' } },
      { name:  { contains: query, mode: 'insensitive' } },
    ]
  }

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: { select: { enrollments: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.ceil(total / take)

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Students"
        description={`${total} total students`}
        action={{ label: 'Import CSV', href: '/admin/students/import' }}
      />

      {/* Search */}
      <form style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by email or name..."
            style={{
              flex: 1, maxWidth: '360px', padding: '9px 14px',
              border: '1px solid #e5e7eb', borderRadius: '8px',
              fontSize: '14px', color: '#111827', background: 'white', outline: 'none',
              fontFamily: 'var(--font-ui)',
            }}
          />
          <button type="submit" style={{
            padding: '9px 20px', background: '#7B2FBE', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '14px',
            fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)',
          }}>
            Search
          </button>
        </div>
      </form>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Email', 'Name', 'Enrollments', 'Orders', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '15px' }}>
                  {query ? `No students match "${query}"` : 'No students yet.'}
                </td>
              </tr>
            ) : students.map(student => (
              <tr key={student.id} style={{ borderTop: '1px solid #f3f4f6' }} className="admin-row-hover">
                <td style={{ padding: '13px 16px', fontSize: '14px', color: '#111827', fontWeight: 500 }}>
                  {student.email}
                </td>
                <td style={{ padding: '13px 16px', fontSize: '14px', color: '#374151' }}>
                  {student.name ?? '—'}
                </td>
                <td style={{ padding: '13px 16px', fontSize: '14px', color: '#374151' }}>
                  {student._count.enrollments}
                </td>
                <td style={{ padding: '13px 16px', fontSize: '14px', color: '#374151' }}>
                  {student._count.orders}
                </td>
                <td style={{ padding: '13px 16px', fontSize: '14px', color: '#6b7280' }}>
                  {new Date(student.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <Link href={`/admin/students/${student.id}`} style={{ fontSize: '13px', color: '#7B2FBE', fontWeight: 600, textDecoration: 'none' }}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
            <span>Page {page} of {totalPages} · {total} students</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {page > 1 && (
                <Link href={`/admin/students?page=${page - 1}${query ? `&q=${query}` : ''}`} style={{ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#374151', textDecoration: 'none', fontSize: '13px' }}>
                  ← Prev
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/students?page=${page + 1}${query ? `&q=${query}` : ''}`} style={{ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#374151', textDecoration: 'none', fontSize: '13px' }}>
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`.admin-row-hover:hover { background: #fafafa !important; }`}</style>
    </div>
  )
}
