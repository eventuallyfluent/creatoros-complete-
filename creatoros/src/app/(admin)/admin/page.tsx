export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboard() {
  // Fetch each stat independently so one failure doesn't crash the whole page
  const courseCount   = await prisma.course.count({ where: { status: 'PUBLISHED' } }).catch(() => 0)
  const studentCount  = await prisma.user.count({ where: { role: 'STUDENT' } }).catch(() => 0)
  const orderCount    = await prisma.order.count({ where: { status: 'PAID' } }).catch(() => 0)
  const revenueResult = await prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }).catch(() => null)
  const totalRevenue  = Number(revenueResult?._sum?.total ?? 0)

  const recentOrders = await prisma.order.findMany({
    where:   { status: 'PAID' },
    include: { items: { include: { product: true } } },
    orderBy: { paidAt: 'desc' },
    take:    8,
  }).catch(() => [])

  const recentStudents = await prisma.user.findMany({
    where:   { role: 'STUDENT' },
    orderBy: { createdAt: 'desc' },
    take:    8,
    select:  { id: true, email: true, name: true, createdAt: true },
  }).catch(() => [])

  const stats = [
    { label: 'Published Courses',  value: courseCount,                   href: '/admin/products', color: '#7B2FBE' },
    { label: 'Total Students',     value: studentCount,                  href: '/admin/students', color: '#0ea5e9' },
    { label: 'Paid Orders',        value: orderCount,                    href: '/admin/orders',   color: '#10b981' },
    { label: 'Total Revenue',      value: `$${totalRevenue.toFixed(2)}`, href: '/admin/orders',   color: '#f59e0b' },
  ]

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px 24px' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>{stat.label}</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <AdminTable
          title="Recent Orders"
          href="/admin/orders"
          headers={['Product', 'Amount', 'Date']}
          rows={recentOrders.map((o: any) => [
            o.items[0]?.product?.title ?? '—',
            `$${Number(o.total).toFixed(2)}`,
            o.paidAt ? new Date(o.paidAt).toLocaleDateString() : '—',
          ])}
        />
        <AdminTable
          title="New Students"
          href="/admin/students"
          headers={['Email', 'Name', 'Joined']}
          rows={recentStudents.map((s: any) => [
            s.email,
            s.name ?? '—',
            new Date(s.createdAt).toLocaleDateString(),
          ])}
        />
      </div>
    </div>
  )
}

function AdminTable({ title, href, headers, rows }: {
  title: string; href: string; headers: string[]; rows: string[][]
}) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{title}</h2>
        <Link href={href} style={{ fontSize: '13px', color: '#7B2FBE', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} style={{ padding: '24px 16px', textAlign: 'center', fontSize: '14px', color: '#9ca3af' }}>No data yet</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '12px 16px', fontSize: '13px', color: j === 0 ? '#111827' : '#6b7280', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
