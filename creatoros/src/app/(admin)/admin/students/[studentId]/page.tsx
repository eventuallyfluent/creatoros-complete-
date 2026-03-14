export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Student — Admin' }

interface Props { params: { studentId: string } }

export default async function StudentDetailPage({ params }: Props) {
  const student = await prisma.user.findUnique({
    where: { id: params.studentId },
    include: {
      enrollments: {
        include: {
          course: {
            select: { id: true, title: true, slug: true, thumbnailUrl: true, status: true },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      },
      orders: {
        include: {
          items: { include: { product: { select: { title: true } } } },
          coupon: { select: { code: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  }).catch(() => null)

  if (!student) notFound()

  // Lesson progress per course
  const courseIds = student.enrollments.map(e => e.courseId)
  const [progressData, lessonTotals] = await Promise.all([
    prisma.lessonProgress.groupBy({
      by: ['courseId'],
      where: { userId: student.id, courseId: { in: courseIds }, status: 'COMPLETED' },
      _count: { courseId: true },
    }).catch(() => []),
    prisma.lesson.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds }, isPublished: true },
      _count: { id: true },
    }).catch(() => []),
  ])

  const progressMap = new Map<string, number>(progressData.map((p: any) => [p.courseId as string, Number(p._count.courseId)]))
  const totalMap    = new Map<string, number>(lessonTotals.map((l: any) => [l.courseId as string, Number(l._count.id)]))

  const totalRevenue = student.orders
    .filter(o => o.status === 'PAID')
    .reduce((sum, o) => sum + Number(o.total), 0)

  const td: React.CSSProperties = { padding: '13px 16px', fontSize: '14px', color: '#374151', verticalAlign: 'top' }
  const th: React.CSSProperties = { padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }

  return (
    <div style={{ padding: '32px', maxWidth: '960px' }}>
      <AdminPageHeader
        title={student.name ?? student.email}
        backHref="/admin/students"
        backLabel="All Students"
      />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '32px' }}>
        {[
          { label: 'Enrolled Courses', value: student.enrollments.length, color: '#7B2FBE' },
          { label: 'Orders',           value: student.orders.length,      color: '#0ea5e9' },
          { label: 'Total Spent',      value: `$${totalRevenue.toFixed(2)}`, color: '#f59e0b' },
          { label: 'Member Since',     value: new Date(student.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), color: '#10b981' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 20px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: card.color, margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Profile */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {[
            { label: 'Email',  value: student.email },
            { label: 'Name',   value: student.name ?? '—' },
            { label: 'Role',   value: student.role },
            { label: 'ID',     value: student.id },
            { label: 'Email Verified', value: student.emailVerified ? new Date(student.emailVerified).toLocaleDateString() : 'Not verified' },
            { label: 'Last Active',    value: '—' },
          ].map(row => (
            <div key={row.label}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>{row.label}</p>
              <p style={{ fontSize: row.label === 'ID' ? '12px' : '14px', color: '#111827', margin: 0, fontFamily: row.label === 'ID' ? 'monospace' : undefined }}>{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Courses enrolled */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>
            Enrolled Courses ({student.enrollments.length})
          </h2>
        </div>
        {student.enrollments.length === 0 ? (
          <p style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Not enrolled in any courses yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Course', 'Status', 'Progress', 'Enrolled', 'Completed'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {student.enrollments.map(e => {
                const done  = progressMap.get(e.courseId) ?? 0
                const total = totalMap.get(e.courseId) ?? 0
                const pct   = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                  <tr key={e.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ ...td, fontWeight: 500, color: '#111827' }}>
                      <Link href={`/admin/courses/${e.courseId}/edit`} style={{ color: '#7B2FBE', textDecoration: 'none', fontWeight: 600 }}>
                        {e.course.title}
                      </Link>
                      <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{e.course.status}</span>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: e.status === 'ACTIVE' ? '#10b981' : '#6b7280', background: e.status === 'ACTIVE' ? '#d1fae5' : '#f3f4f6', padding: '3px 9px', borderRadius: '999px' }}>
                        {e.status}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#f3f4f6', borderRadius: '3px', minWidth: '80px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#10b981' : '#7B2FBE', borderRadius: '3px', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{done}/{total} ({pct}%)</span>
                      </div>
                    </td>
                    <td style={{ ...td, color: '#6b7280' }}>{new Date(e.enrolledAt).toLocaleDateString()}</td>
                    <td style={{ ...td, color: '#6b7280' }}>{e.completedAt ? new Date(e.completedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Orders */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>
            Order History ({student.orders.length})
          </h2>
        </div>
        {student.orders.length === 0 ? (
          <p style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No orders yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Order ID', 'Product(s)', 'Amount', 'Coupon', 'Status', 'Date'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {student.orders.map(order => (
                <tr key={order.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>
                    <Link href={`/admin/orders/${order.id}`} style={{ color: '#7B2FBE', textDecoration: 'none' }}>
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td style={td}>
                    {order.items.map((item, i) => (
                      <span key={i} style={{ display: 'block', fontSize: '13px' }}>{item.product?.title ?? '—'}</span>
                    ))}
                  </td>
                  <td style={{ ...td, fontWeight: 600, color: '#111827' }}>
                    {order.currency} {Number(order.total).toFixed(2)}
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: '12px' }}>
                    {order.coupon?.code ?? '—'}
                  </td>
                  <td style={td}>
                    <span style={{ fontSize: '12px', fontWeight: 700,
                      color: order.status === 'PAID' ? '#10b981' : order.status === 'REFUNDED' ? '#6b7280' : '#f59e0b',
                      background: order.status === 'PAID' ? '#d1fae5' : order.status === 'REFUNDED' ? '#f3f4f6' : '#fef3c7',
                      padding: '3px 9px', borderRadius: '999px' }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ ...td, color: '#6b7280' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
