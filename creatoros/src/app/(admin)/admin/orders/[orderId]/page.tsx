import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import OrderActions from './OrderActions'

export const metadata: Metadata = { title: 'Order — Admin' }

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const order = await prisma.order.findUnique({
    where:   { id: params.orderId },
    include: {
      items:  { include: { course: true } },
      coupon: true,
      user:   { select: { id: true, email: true, name: true } },
    },
  })
  if (!order) notFound()

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ width: '180px', flexShrink: 0, fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#111827' }}>{value}</span>
    </div>
  )

  return (
    <div style={{ padding: '32px', maxWidth: '860px' }}>
      <AdminPageHeader title={`Order ${order.id.slice(0, 8)}…`} backHref="/admin/orders" backLabel="All Orders" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

        {/* Main details */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>Order Details</h2>
          <Row label="Order ID"     value={<span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{order.id}</span>} />
          <Row label="Status"       value={
            <span style={{ fontSize: '12px', fontWeight: 700, color: order.status === 'PAID' ? '#10b981' : '#f59e0b', background: order.status === 'PAID' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', padding: '3px 10px', borderRadius: '999px' }}>
              {order.status}
            </span>
          } />
          <Row label="Customer"     value={order.email} />
          <Row label="Name"         value={order.user?.name ?? order.email.split('@')[0]} />
          <Row label="Subtotal"     value={`${order.currency} ${Number(order.subtotal).toFixed(2)}`} />
          {Number(order.discountAmount) > 0 && (
            <Row label="Discount"   value={`− ${order.currency} ${Number(order.discountAmount).toFixed(2)}${order.coupon ? ` (${order.coupon.code})` : ''}`} />
          )}
          <Row label="Total Paid"   value={<strong>{order.currency} {Number(order.total).toFixed(2)}</strong>} />
          <Row label="Gateway"      value={order.gatewayId ?? 'manual'} />
          {order.gatewayOrderId && <Row label="Gateway Order" value={<span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{order.gatewayOrderId}</span>} />}
          <Row label="Created"      value={new Date(order.createdAt).toLocaleString()} />
          {order.paidAt && <Row label="Paid at"  value={new Date(order.paidAt).toLocaleString()} />}
          {order.ipAddress && <Row label="IP"    value={order.ipAddress} />}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Items */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Items</h2>
            </div>
            {order.items.map(item => (
              <div key={item.id} style={{ padding: '12px 18px', borderBottom: '1px solid #f3f4f6' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>{item.course.title}</p>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>{order.currency} {Number(item.priceAtPurchase).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          {order.status === 'PAID' && (
            <OrderActions orderId={order.id} gatewayOrderId={order.gatewayOrderId} gatewayPaymentId={order.gatewayPaymentId} total={Number(order.total)} currency={order.currency} />
          )}

          {/* Manual mark paid */}
          {order.status === 'PENDING' && (
            <OrderActions orderId={order.id} gatewayOrderId={null} gatewayPaymentId={null} total={Number(order.total)} currency={order.currency} isPending />
          )}
        </div>
      </div>
    </div>
  )
}
