import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Coupons — Admin' }

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title="Coupons" description={`${coupons.length} coupons`} action={{ label: '+ New Coupon', href: '/admin/coupons/new' }} />

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Code','Type','Value','Used','Max Uses','Expires','Status','Actions'].map(h => (
                <th key={h} style={{ padding: '11px 14px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '15px' }}>
                No coupons yet. <Link href="/admin/coupons/new" style={{ color: '#7B2FBE', fontWeight: 600 }}>Create one →</Link>
              </td></tr>
            ) : coupons.map(c => {
              const isExpired  = c.expiresAt && new Date(c.expiresAt) < new Date()
              const isMaxed    = c.maxUses !== null && c.usedCount >= c.maxUses
              const isActive   = c.isActive && !isExpired && !isMaxed
              return (
                <tr key={c.id} style={{ borderTop: '1px solid #f3f4f6' }} className="admin-row-hover">
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: '#111827', letterSpacing: '0.05em' }}>{c.code}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{c.type}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                    {c.type === 'PERCENTAGE' ? `${Number(c.value)}%` : c.type === 'FREE' ? 'Free' : `$${Number(c.value).toFixed(2)}`}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{c.usedCount}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{c.maxUses ?? '∞'}</td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6b7280' }}>
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', color: isActive ? '#10b981' : '#6b7280', background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)' }}>
                      {isActive ? 'ACTIVE' : isExpired ? 'EXPIRED' : isMaxed ? 'MAXED' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Link href={`/admin/coupons/${c.id}/edit`} style={{ fontSize: '13px', color: '#7B2FBE', fontWeight: 600, textDecoration: 'none' }}>Edit</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <style>{`.admin-row-hover:hover { background: #fafafa !important; }`}</style>
    </div>
  )
}
