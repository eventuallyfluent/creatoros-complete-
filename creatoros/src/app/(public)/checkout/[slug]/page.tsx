import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { getActiveGateways } from '@/lib/payments/gateway-registry'
import Image from 'next/image'
import CheckoutForm from './CheckoutForm'

interface Props {
  params:      { slug: string }
  searchParams: { preview?: string }
}

export const metadata: Metadata = { title: 'Checkout' }

export default async function CheckoutPage({ params, searchParams }: Props) {
  const session   = await getServerSession(authOptions)
  const userId    = (session?.user as any)?.id
  const isAdmin   = (session?.user as any)?.role === 'ADMIN'
  const isPreview = isAdmin && searchParams.preview === '1'

  const product = await prisma.product.findFirst({
    where:   isPreview ? { slug: params.slug } : { slug: params.slug, status: 'PUBLISHED' },
    include: {
      instructor: true,
      courses:    {
        orderBy: { sortOrder: 'asc' },
        include: { course: { select: { id: true } } },
      },
      checkoutPages: {
        where:   { isDefault: true },
        take:    1,
      },
    },
  })

  if (!product) notFound()

  // Free products — enrol immediately if logged in, otherwise redirect to login
  if (Number(product.price) === 0 && !isPreview) {
    if (userId) {
      for (const pc of product.courses) {
        await prisma.enrollment.upsert({
          where:  { userId_courseId: { userId, courseId: pc.courseId } },
          create: { userId, courseId: pc.courseId, productId: product.id, status: 'ACTIVE' },
          update: { status: 'ACTIVE' },
        })
      }
      const firstCourseId = product.courses[0]?.course?.id
      redirect(firstCourseId ? `/portal/courses/${product.courses[0]?.course?.id}` : '/portal')
    } else {
      redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout/${params.slug}`)}`)
    }
  }

  // Already enrolled — go to portal (skip in preview)
  if (userId && !isPreview) {
    const courseIds  = product.courses.map(pc => pc.courseId)
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, courseId: { in: courseIds }, status: 'ACTIVE' },
    })
    if (enrollment) redirect(`/portal/courses/${product.courses[0]?.course?.id ?? params.slug}`)
  }

  const liveGateways = await getActiveGateways()

  // Admin preview: inject a mock gateway so the form renders
  const gateways = liveGateways.length > 0 ? liveGateways : isPreview ? [{
    id: 'preview', name: 'Card Payment', provider: 'stripe', isDefault: true,
  }] : []

  if (gateways.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 'var(--s7)' }}>
          <h1 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '12px' }}>Checkout temporarily unavailable</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Please contact us to complete your purchase.</p>
        </div>
      </div>
    )
  }

  const checkoutPage = product.checkoutPages[0]
  const price   = Number(product.price)
  const compare = product.compareAtPrice ? Number(product.compareAtPrice) : null

  let bumpProduct = null
  if (checkoutPage?.orderBumpProductId) {
    bumpProduct = await prisma.product.findFirst({
      where:  { id: checkoutPage.orderBumpProductId, status: 'PUBLISHED' },
      select: { id: true, title: true, price: true, currency: true, thumbnailUrl: true },
    })
  }
  const bumpPrice = checkoutPage?.orderBumpPrice
    ? Number(checkoutPage.orderBumpPrice)
    : bumpProduct ? Number(bumpProduct.price) : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingTop: 'var(--s7)', paddingBottom: 'var(--s8)' }}>
      <div className="platform-container" style={{ maxWidth: '960px' }}>

        {/* Preview banner */}
        {isPreview && (
          <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '8px', padding: '10px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#92400e' }}>
            <span>👁</span>
            <strong>Admin Preview</strong> — this is how your checkout looks to students. The Pay button is disabled in preview mode.
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--s7)' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {checkoutPage?.headline ?? 'Complete Your Enrolment'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {checkoutPage?.subtext ?? 'Secure checkout · Instant access'}
            {checkoutPage?.guaranteeText && ` · ${checkoutPage.guaranteeText}`}
          </p>
        </div>

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--s6)', alignItems: 'start' }}>

          {/* Left — checkout form */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
            <CheckoutForm
              product={{ id: product.id, slug: product.slug, title: product.title, price, currency: product.currency }}
              checkoutPage={checkoutPage ? {
                showCouponField:      checkoutPage.showCouponField,
                thankYouUrl:          checkoutPage.thankYouUrl,
                orderBumpProductId:   checkoutPage.orderBumpProductId,
                orderBumpHeadline:    checkoutPage.orderBumpHeadline,
                orderBumpDescription: checkoutPage.orderBumpDescription,
              } : null}
              bumpProduct={bumpProduct ? { ...bumpProduct, price: bumpPrice! } : null}
              gateways={gateways.map(g => ({ id: g.id, name: g.name, provider: g.provider, isDefault: g.isDefault }))}
              userEmail={session?.user?.email ?? ''}
              userName={session?.user?.name ?? ''}
              userId={userId ?? null}
              isPreview={isPreview}
            />
          </div>

          {/* Right — order summary */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', position: 'sticky', top: 'calc(var(--nav-height) + 24px)' }}>
            <div style={{ height: '160px', background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-hover))', position: 'relative' }}>
              {product.thumbnailUrl ? (
                <Image src={product.thumbnailUrl} alt={product.title} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '11px', color: 'rgba(240,234,248,0.3)', letterSpacing: '0.1em' }}>
                  PERSEUS ARCANE
                </div>
              )}
            </div>

            <div style={{ padding: 'var(--s5)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px' }}>Order Summary</p>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>{product.title}</h3>
              {product.instructor && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--s4)' }}>by {product.instructor.displayName}</p>
              )}
              {product.type === 'BUNDLE' && (
                <p style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: 'var(--s4)' }}>{product.courses.length} courses included</p>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--s4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span>{product.currency} {(compare ?? price).toFixed(2)}</span>
                </div>
                {compare && compare > price && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--success)' }}>
                    <span>Discount</span>
                    <span>− {product.currency} {(compare - price).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                  <span>Total</span>
                  <span>{product.currency} {price.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ marginTop: 'var(--s4)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  'Lifetime access',
                  product.type === 'BUNDLE' ? `Access to all ${product.courses.length} courses` : null,
                  'All future updates',
                  'Certificate on completion',
                  checkoutPage?.guaranteeText ?? '30-day money-back guarantee',
                ].filter(Boolean).map(item => (
                  <div key={item as string} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> {item}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 'var(--s4)', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                🔒 Secure checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
