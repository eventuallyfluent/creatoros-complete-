import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Enrolment Confirmed' }

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string }
}) {
  const order = searchParams.orderId
    ? await prisma.order.findUnique({
        where:   { id: searchParams.orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  courses: {
                    orderBy: { sortOrder: 'asc' },
                    include: { course: { select: { id: true, slug: true, title: true } } },
                  },
                },
              },
            },
          },
        },
      })
    : null

  const firstProduct = order?.items[0]?.product
  const firstCourse  = firstProduct?.courses[0]?.course
  const displayTitle = firstProduct?.title ?? firstCourse?.title ?? null
  const portalSlug   = firstCourse?.slug ?? null

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', padding: 'var(--s5)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(52,211,153,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: '520px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        padding: 'var(--s8)',
        textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <Image src="/logo.png" alt="Perseus Arcane Academy" width={80} height={32}
          style={{ height: '32px', width: 'auto', objectFit: 'contain', marginBottom: 'var(--s6)' }}
        />

        {/* Success mark */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'rgba(52,211,153,0.12)',
          border: '2px solid var(--success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px', margin: '0 auto var(--s5)',
        }}>
          ✓
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
          You&apos;re enrolled!
        </h1>

        {displayTitle ? (
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: 'var(--s6)', lineHeight: 1.6 }}>
            You're enrolled in <strong style={{ color: 'var(--text-primary)' }}>{displayTitle}</strong>.
            We've sent a link to your email — click it and you'll land straight in your course.
          </p>
        ) : (
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: 'var(--s6)', lineHeight: 1.6 }}>
            Your enrolment is confirmed. We've sent a link to your email to access your course.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {portalSlug && (
            <Link href={`/login?callbackUrl=${encodeURIComponent(`/portal/courses/${portalSlug}`)}`} style={{
              display: 'block', background: 'var(--brand)', color: 'white',
              padding: '14px', borderRadius: 'var(--r-md)', textAlign: 'center',
              fontWeight: 700, fontSize: '16px', textDecoration: 'none',
            }}>
              Go to My Course →
            </Link>
          )}
          <Link href={`/login?callbackUrl=${encodeURIComponent('/portal')}`} style={{
            display: 'block', background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
            padding: '13px', borderRadius: 'var(--r-md)', textAlign: 'center',
            fontWeight: 600, fontSize: '15px', textDecoration: 'none',
            border: '1px solid var(--border)',
          }}>
            View My Dashboard
          </Link>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 'var(--s5)', lineHeight: 1.6 }}>
          Didn&apos;t receive an email? Check your spam folder, or{' '}
          <a href="/contact" style={{ color: 'var(--accent)' }}>contact us</a>.
        </p>
      </div>
    </div>
  )
}
