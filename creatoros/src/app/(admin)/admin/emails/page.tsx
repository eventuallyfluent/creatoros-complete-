import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Emails — Admin' }

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: { type?: string; page?: string }
}) {
  const page = Number(searchParams.page ?? 1)
  const take = 50
  const skip = (page - 1) * take

  const where: any = {}
  if (searchParams.type) where.type = searchParams.type

  const [emails, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take, skip,
    }),
    prisma.emailLog.count({ where }),
  ])

  const totalPages = Math.ceil(total / take)

  const STATUS_COLOR: Record<string, string> = {
    SENT: '#10b981', FAILED: '#ef4444', PENDING: '#f59e0b', BOUNCED: '#ef4444',
  }

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Email Log"
        description={`${total} emails sent`}
        action={{ label: '+ New Broadcast', href: '/admin/emails/new' }}
      />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[{ label: 'All', value: '' }, { label: 'Broadcasts', value: 'MARKETING' }, { label: 'Transactional', value: 'TRANSACTIONAL' }, { label: 'Automation', value: 'AUTOMATION' }].map(tab => (
          <Link key={tab.value} href={`/admin/emails${tab.value ? `?type=${tab.value}` : ''}`}
            style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', background: searchParams.type === tab.value || (!searchParams.type && !tab.value) ? '#7B2FBE' : 'white', color: searchParams.type === tab.value || (!searchParams.type && !tab.value) ? 'white' : '#374151', border: '1px solid #e5e7eb' }}>
            {tab.label}
          </Link>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Subject','To','Type','Status','Date'].map(h => (
                <th key={h} style={{ padding: '11px 14px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emails.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '15px' }}>
                No emails sent yet. <Link href="/admin/emails/new" style={{ color: '#7B2FBE', fontWeight: 600 }}>Send a broadcast →</Link>
              </td></tr>
            ) : emails.map(email => (
              <tr key={email.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: 500, color: '#111827', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email.subject}</td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email.to}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6b7280' }}>{email.type}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: STATUS_COLOR[email.status] ?? '#6b7280', background: `${STATUS_COLOR[email.status] ?? '#6b7280'}18`, padding: '3px 10px', borderRadius: '999px' }}>
                    {email.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6b7280' }}>
                  {new Date(email.sentAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280' }}>
            <span>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {page > 1 && <Link href={`/admin/emails?page=${page-1}${searchParams.type?`&type=${searchParams.type}`:''}`} style={{ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#374151', textDecoration: 'none', fontSize: '13px' }}>← Prev</Link>}
              {page < totalPages && <Link href={`/admin/emails?page=${page+1}${searchParams.type?`&type=${searchParams.type}`:''}`} style={{ padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#374151', textDecoration: 'none', fontSize: '13px' }}>Next →</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
