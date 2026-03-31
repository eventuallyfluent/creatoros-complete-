export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Browse course collections',
}

export default async function CollectionsPage() {
  const session = await getServerSession(authOptions)
  const userId  = (session?.user as any)?.id

  const collections = await prisma.collection.findMany({
    where:   { isPublished: true },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    include: {
      courses: {
        where:   { course: { status: 'PUBLISHED' } },
        orderBy: { sortOrder: 'asc' },
        take:    12,
        include: {
          course: {
            include: {
              products: {
                take:    1,
                include: {
                  product: {
                    select: { id: true, slug: true, price: true, compareAtPrice: true, currency: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const enrollments = userId
    ? await prisma.enrollment.findMany({ where: { userId, status: 'ACTIVE' }, select: { courseId: true } })
    : []
  const enrolledIds = new Set(enrollments.map((e: any) => e.courseId))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Page header */}
      <div style={{
        padding:      'var(--s7) 0 var(--s5)',
        borderBottom: '1px solid var(--border)',
        background:   'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-base) 100%)',
      }}>
        <div className="platform-container">
          <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 'var(--s3)' }}>
            Collections
          </p>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
            Browse by Collection
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: 0 }}>
            {collections.length} collection{collections.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* One horizontal strip per collection */}
      <div style={{ padding: 'var(--s6) 0 var(--s9)' }}>
        {collections.length === 0 ? (
          <div className="platform-container" style={{ textAlign: 'center', padding: 'var(--s9)', border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>No collections yet.</p>
          </div>
        ) : (
          collections.map(col => {
            const courses = col.courses.map(cc => cc.course)
            return (
              <section key={col.id} style={{ marginBottom: 'var(--s8)' }}>
                {/* Collection label + "View all" link */}
                <div className="platform-container" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--s4)', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                      {col.name}
                    </h2>
                    {col.description && (
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>{col.description}</p>
                    )}
                  </div>
                  <Link href={`/collection/${col.slug}`} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    View all →
                  </Link>
                </div>

                {/* Horizontal scrolling course strip */}
                <div className="col-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any, paddingBottom: '8px' }}>
                  <div className="platform-container" style={{ display: 'flex', gap: 'var(--s4)', paddingBottom: '4px' }}>
                    {courses.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '24px 0' }}>No published courses yet.</p>
                    ) : courses.map(course => {
                      const product  = course.products?.[0]?.product
                      const price    = Number(product?.price ?? 0)
                      const cardSlug = product?.slug ?? course.slug
                      const isOwned  = enrolledIds.has(course.id)
                      const href     = isOwned ? `/portal/courses/${cardSlug}` : `/courses/${cardSlug}`
                      const sym      = product?.currency === 'GBP' ? '£' : product?.currency === 'EUR' ? '€' : '$'
                      return (
                        <Link key={course.id} href={href} style={{ textDecoration: 'none', flexShrink: 0, width: '220px' }}>
                          <div className="col-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'pointer' }}>
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-hover))' }}>
                              {course.thumbnailUrl
                                ? <Image src={course.thumbnailUrl} alt={course.title} fill sizes="220px" style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }} className="col-card-img" />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontFamily: 'var(--font-display)', fontSize: '10px', color: 'rgba(240,234,248,0.15)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>COURSE</p></div>
                              }
                              {isOwned && <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--success)', color: 'white', fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.05em' }}>ENROLLED</div>}
                            </div>
                            <div style={{ padding: '12px 14px 14px' }}>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                                {course.title}
                              </p>
                              {price === 0
                                ? <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)', margin: 0 }}>Free</p>
                                : <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{sym}{price.toFixed(0)}</p>
                                    {product?.compareAtPrice && Number(product.compareAtPrice) > price && (
                                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'line-through', margin: 0 }}>{sym}{Number(product.compareAtPrice).toFixed(0)}</p>
                                    )}
                                  </div>
                              }
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </section>
            )
          })
        )}
      </div>

      <style>{`
        .col-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.25) !important; transform: translateY(-2px); }
        .col-card:hover .col-card-img { transform: scale(1.04); }
        .col-scroll::-webkit-scrollbar { height: 4px; }
        .col-scroll::-webkit-scrollbar-track { background: transparent; }
        .col-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      `}</style>
    </div>
  )
}
