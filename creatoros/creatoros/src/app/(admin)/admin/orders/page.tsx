export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Orders — Admin' }

const STATUS_COLOR: Record<string, string> = {
  PAID: '#10b981', PENDING: '#f59e0b', REFUNDED: '#6b7280',
  PARTIALLY_REFUNDED: '#f59e0b', FAILED: '#ef4444',
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string }
}) {
  const page  = Number(searchParams.page ?? 1)
  const take  = 50
  const skip  = (page - 1) * take
  const query = searchParams.q?.trim()

  const where: any = {}
  if (searchParams.status) where.status = searchParams.status
  if (query) {
    where.OR = [
      { email: { contains: query, mode: 'insensitive' } },
      { id:    { contains: query, mode: 'insensitive' } },
    ]
  }

  const [orders, total, revenue] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: { include: { course: { select: { title: true, slug: true } } } },
        coupon: { select: { code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take, skip,
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }),
  ])

  const totalRevenue = Number(revenue._sum.total ?? 0)
  const totalPages   = Math.ceil(total / take)

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title="Orders" description={`${total} orders · $${totalRevenue.toFixed(2)} total revenue`} />

      {/* Filters */}
      <form style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input name="q" defaultValue={query} placeholder="Search email or order ID..."
          style={{ flex: 1, minWidth: '200px', maxWidth: '320px', padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)' }} />
        <select name="status" defaultValue={searchParams.status ?? ''}
          style={{ padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', background: 'white', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
          <option value="">All statuses</option>
          {['PAID','PENDING','REFUNDED','PARTIALLY_REFUNDED','FAILED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" style={{ padding: '9px 20px', background: '#7B2FBE', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
          Filter
        </button>
      </form>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Order ID','Customer','Course','Amount','Coupon','Status','Date','Actions'].map(h => (
                <th key={h} style={{ padding: '11px 14px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '15px' }}>No orders found.</td></tr>
            ) : orders.map(order => (
              <tr key={order.id} style={{ borderTop: '1px solid #f3f4f6' }} className="admin-row-hover">
                <td style={{ padding: '12px 14px', fontSize: '12px', fontFamily: 'monospace', color: '#6b7280' }}>
                  {order.id.slice(0, 8)}…
                </td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#111827', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {order.email}
                </td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {order.items[0]?.course.title ?? '—'}
                  {order.items.length > 1 && ` +${order.items.length - 1}`}
                </td>
                <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                  {order.currency} {Number(order.total).toFixed(2)}
                  {Number(order.discountAmount) > 0 && (
                    <span style={{ fontSize: '11px', color: '#10b981', marginLeft: '4px' }}>
                      (-{Number(order.discountAmount).toFixed(2)})
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>
                  {order.coupon?.code ?? '—'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: STATUS_COLOR[order.status] ?? '#6b7280', background: `${STATUS_COLOR[order.status] ?? '#6b7280'}18`, padding: '3px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <Link href={`/admin/orders/${order.id}`} style={{ fontSize: '13px', color: '#7B2FBE', fontWeight: 600, textDecoration: 'none' }}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
            <span>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {page > 1 && <Link href={`/admin/orders?page=${page-1}${query?`&q=${query}`:''}${searchParams.status?`&status=${searchParams.status}`:''}`} style={{ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#374151', textDecoration: 'none', fontSize: '13px' }}>← Prev</Link>}
              {page < totalPages && <Link href={`/admin/orders?page=${page+1}${query?`&q=${query}`:''}${searchParams.status?`&status=${searchParams.status}`:''}`} style={{ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#374151', textDecoration: 'none', fontSize: '13px' }}>Next →</Link>}
            </div>
          </div>
        )}
      </div>
      <style>{`.admin-row-hover:hover { background: #fafafa !important; }`}</style>
    </div>
  )
}
