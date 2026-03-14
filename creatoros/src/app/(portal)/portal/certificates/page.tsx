export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Certificates' }

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions)
  const userId  = (session!.user as any).id

  const completed = await prisma.enrollment.findMany({
    where:   { userId, completedAt: { not: null } },
    include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } } },
    orderBy: { completedAt: 'desc' },
  }).catch(() => [])

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Certificates
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Your completed courses and achievements
        </p>
      </div>

      {completed.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)', padding: '56px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No certificates yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Complete a course to earn your certificate.
          </p>
          <Link href="/portal" style={{
            display: 'inline-flex', background: 'var(--brand)', color: 'white',
            padding: '10px 24px', borderRadius: 'var(--r-md)', fontWeight: 600,
            fontSize: '14px', textDecoration: 'none',
          }}>
            Go to My Courses →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {completed.map((e: any) => (
            <div key={e.courseId} style={{
              background: 'linear-gradient(135deg, rgba(123,47,190,0.1), rgba(201,168,76,0.05))',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-xl)', padding: '24px',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏆</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {e.course.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Completed {new Date(e.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <Link href={`/portal/courses/${e.course.slug}`} style={{
                fontSize: '13px', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none',
              }}>
                Revisit Course →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
