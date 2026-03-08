import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Subscribers — Admin' }

export default async function AdminSubscribersPage({
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
  if (query) where.email = { contains: query, mode: 'insensitive' }

  const [subscribers, total] = await Promise.all([
    prisma.emailSubscriber.findMany({
      where,
      orderBy: { subscribedAt: 'desc' },
      take, skip,
    }),
    prisma.emailSubscriber.count({ where }),
  ])

  const totalPages = Math.ceil(total / take)

  const STATUS_COLOR: Record<string, string> = {
    SUBSCRIBED:   '#10b981',
    UNSUBSCRIBED: '#6b7280',
    BOUNCED:      '#ef4444',
    COMPLAINED:   '#f59e0b',
  }

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Subscribers"
        description={`${total} total subscribers`}
        action={{ label: 'Export CSV', href: '/api/subscribers/export' }}
      />

      <form style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input name="q" defaultValue={query} placeholder="Search by email…"
          style={{ flex: 1, minWidth: '200px', maxWidth: '320px', padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-ui)' }} />
        <select name="status" defaultValue={searchParams.status ?? ''}
          style={{ padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: 'white', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
          <option value="">All statuses</option>
          {['SUBSCRIBED','UNSUBSCRIBED','BOUNCED','COMPLAINED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" style={{ padding: '9px 20px', background: '#7B2FBE', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
          Filter
        </button>
      </form>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Email','Status','Source','GDPR','Subscribed','Actions'].map(h => (
                <th key={h} style={{ padding: '11px 14px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '15px' }}>No subscribers yet.</td></tr>
            ) : subscribers.map(sub => (
              <tr key={sub.id} style={{ borderTop: '1px solid #f3f4f6' }} className="admin-row-hover">
                <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>{sub.email}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: STATUS_COLOR[sub.status] ?? '#6b7280', background: `${STATUS_COLOR[sub.status] ?? '#6b7280'}18`, padding: '3px 10px', borderRadius: '999px' }}>
                    {sub.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#6b7280' }}>{sub.source ?? '—'}</td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: sub.gdprConsent ? '#10b981' : '#9ca3af' }}>
                  {sub.gdprConsent ? '✓ Yes' : '—'}
                </td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6b7280' }}>
                  {new Date(sub.subscribedAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <Link href={`/admin/subscribers/${sub.id}`} style={{ fontSize: '13px', color: '#7B2FBE', fontWeight: 600, textDecoration: 'none' }}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
            <span>Page {page} of {totalPages} · {total} subscribers</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {page > 1 && <Link href={`/admin/subscribers?page=${page-1}${query?`&q=${query}`:''}${searchParams.status?`&status=${searchParams.status}`:''}`} style={{ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#374151', textDecoration: 'none', fontSize: '13px' }}>← Prev</Link>}
              {page < totalPages && <Link href={`/admin/subscribers?page=${page+1}${query?`&q=${query}`:''}${searchParams.status?`&status=${searchParams.status}`:''}`} style={{ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#374151', textDecoration: 'none', fontSize: '13px' }}>Next →</Link>}
            </div>
          </div>
        )}
      </div>
      <style>{`.admin-row-hover:hover { background: #fafafa !important; }`}</style>
    </div>
  )
}
