import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import Link from 'next/link'
import Image from 'next/image'

interface Props {
  params:      { slug: string }
  searchParams: { page?: string }
}

const PAGE_SIZE = 16

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const col = await prisma.collection.findFirst({ where: { slug: params.slug } })
  if (!col) return { title: 'Collection Not Found' }
  return {
    title:       `${col.name} — Perseus Arcane Academy`,
    description: col.description ?? `Browse ${col.name} courses at Perseus Arcane Academy`,
  }
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions)
  const userId  = (session?.user as any)?.id
  const page    = Math.max(1, parseInt(searchParams.page ?? '1', 10))

  // Load ALL published collections for the tab bar
  const allCollections = await prisma.collection.findMany({
    where:   { isPublished: true },
    select:  { id: true, name: true, slug: true },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
  })

  // Load the active collection with ALL its courses (many-to-many — a course can be in multiple collections)
  const collection = await prisma.collection.findFirst({
    where: { slug: params.slug, isPublished: true },
  })

  if (!collection) notFound()

  // Count total for pagination
  const totalCourses = await prisma.courseCollection.count({
    where: {
      collectionId: collection.id,
      course:       { status: 'PUBLISHED' },
    },
  })

  // Fetch this page's courses via the join table
  const courseCollections = await prisma.courseCollection.findMany({
    where: {
      collectionId: collection.id,
      course:       { status: 'PUBLISHED' },
    },
    orderBy: { sortOrder: 'asc' },
    skip:    (page - 1) * PAGE_SIZE,
    take:    PAGE_SIZE,
    include: {
      course: {
        include: {
          // Get the first published product for pricing
          products: {
            take:    1,
            include: {
              product: {
                select: { id: true, slug: true, price: true, compareAtPrice: true, currency: true, status: true },
              },
            },
          },
        },
      },
    },
  })

  const courses    = courseCollections.map(cc => cc.course)
  const totalPages = Math.ceil(totalCourses / PAGE_SIZE)

  // Enrollment check
  const enrollments = userId ? await prisma.enrollment.findMany({
    where:  { userId, status: 'ACTIVE' },
    select: { courseId: true },
  }) : []
  const enrolledIds = new Set(enrollments.map((e: any) => e.courseId))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Collection tab bar — matches live site horizontal nav */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        background:   'var(--bg-surface)',
        padding:      '0',
        overflowX:    'auto',
        WebkitOverflowScrolling: 'touch' as any,
      }}>
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexWrap:       'wrap',
          gap:            '0',
          padding:        '0 var(--s5)',
          minWidth:       'max-content',
          margin:         '0 auto',
        }}>
          {/* All Courses tab */}
          <Link
            href="/courses"
            style={{
              display:    'inline-block',
              padding:    '18px 20px',
              fontSize:   '13px',
              fontWeight: 500,
              color:      'var(--text-secondary)',
              textDecoration: 'none',
              borderBottom:   '2px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
            }}
            className="collection-tab"
          >
            All Courses
          </Link>

          {/* Separator */}
          <span style={{ width: '1px', height: '16px', background: 'var(--border)', flexShrink: 0 }} />

          {allCollections.map((col, i) => {
            const isActive = col.slug === params.slug
            return (
              <span key={col.id} style={{ display: 'flex', alignItems: 'center' }}>
                <Link
                  href={`/collection/${col.slug}`}
                  style={{
                    display:        'inline-block',
                    padding:        '18px 20px',
                    fontSize:       '13px',
                    fontWeight:     isActive ? 700 : 500,
                    color:          isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    borderBottom:   isActive ? '2px solid var(--brand)' : '2px solid transparent',
                    whiteSpace:     'nowrap',
                    transition:     'color 0.15s',
                  }}
                  className={isActive ? '' : 'collection-tab'}
                >
                  {col.name}
                </Link>
                {i < allCollections.length - 1 && (
                  <span style={{ width: '1px', height: '16px', background: 'var(--border)', flexShrink: 0 }} />
                )}
              </span>
            )
          })}
        </div>
      </div>

      {/* Course grid */}
      <div className="platform-container" style={{ padding: 'var(--s7) var(--s5)' }}>

        {/* Collection header */}
        {collection.description && (
          <p style={{
            fontSize:     '15px',
            color:        'var(--text-secondary)',
            marginBottom: 'var(--s6)',
            maxWidth:     '640px',
          }}>
            {collection.description}
          </p>
        )}

        {courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--s9)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>No courses in this collection yet.</p>
          </div>
        ) : (
          <>
            {/* 4-column grid matching live site */}
            <div style={{
              display:               'grid',
              gridTemplateColumns:   'repeat(auto-fill, minmax(240px, 1fr))',
              gap:                   'var(--s5)',
            }} className="course-collection-grid">
              {courses.map(course => {
                const product  = course.products?.[0]?.product
                const price    = Number(product?.price ?? 0)
                const cardSlug = product?.slug ?? course.slug
                const isOwned  = enrolledIds.has(course.id)
                return (
                  <CollectionCourseCard
                    key={course.id}
                    slug={cardSlug}
                    title={course.title}
                    thumbnailUrl={course.thumbnailUrl ?? undefined}
                    price={price}
                    compareAtPrice={product?.compareAtPrice ? Number(product.compareAtPrice) : undefined}
                    currency={product?.currency ?? 'USD'}
                    isOwned={isOwned}
                  />
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display:        'flex',
                justifyContent: 'center',
                alignItems:     'center',
                gap:            '8px',
                marginTop:      'var(--s8)',
              }}>
                {page > 1 && (
                  <Link href={`/collection/${params.slug}?page=${page - 1}`} style={paginationBtn(false)}>
                    ← Prev
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Link
                    key={p}
                    href={`/collection/${params.slug}?page=${p}`}
                    style={paginationBtn(p === page)}
                  >
                    {p}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link href={`/collection/${params.slug}?page=${page + 1}`} style={paginationBtn(false)}>
                    Next →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .collection-tab:hover { color: var(--text-primary) !important; }
        @media (max-width: 1024px) {
          .course-collection-grid { grid-template-columns: repeat(3, minmax(200px, 1fr)) !important; }
        }
        @media (max-width: 720px) {
          .course-collection-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .course-collection-grid { grid-template-columns: 1fr !important; }
        }
        .course-card-hover:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}

// Simple card matching live site: thumbnail + title + price, no description/instructor
function CollectionCourseCard({
  slug, title, thumbnailUrl, price, compareAtPrice, currency, isOwned,
}: {
  slug:           string
  title:          string
  thumbnailUrl?:  string
  price:          number
  compareAtPrice?: number
  currency:       string
  isOwned:        boolean
}) {
  const href = isOwned ? `/portal/courses/${slug}` : `/courses/${slug}`
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        className="course-card-hover"
        style={{
          background:    'var(--bg-surface)',
          border:        '1px solid var(--border)',
          borderRadius:  'var(--r-xl)',
          overflow:      'hidden',
          transition:    'box-shadow 0.2s, transform 0.2s',
          cursor:        'pointer',
        }}
      >
        {/* Thumbnail */}
        <div style={{
          position:    'relative',
          width:       '100%',
          aspectRatio: '4/3',
          overflow:    'hidden',
          background:  'linear-gradient(135deg, var(--bg-elevated), var(--bg-hover))',
        }}>
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              sizes="(max-width: 480px) 100vw, (max-width: 720px) 50vw, (max-width: 1024px) 33vw, 25vw"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'rgba(240,234,248,0.25)', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.1em' }}>
                PERSEUS
              </p>
            </div>
          )}
          {isOwned && (
            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--success)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', letterSpacing: '0.05em' }}>
              ENROLLED
            </div>
          )}
        </div>

        {/* Title + price */}
        <div style={{ padding: '14px 16px 16px' }}>
          <p style={{
            fontSize:     '14px',
            fontWeight:   600,
            color:        'var(--text-primary)',
            lineHeight:   1.3,
            marginBottom: '8px',
            display:      '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any,
            overflow:     'hidden',
          }}>
            {title}
          </p>

          {price === 0 ? (
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success)' }}>Free</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                ${price.toFixed(2)}
              </p>
              {compareAtPrice && compareAtPrice > price && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  ${compareAtPrice.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function paginationBtn(active: boolean): React.CSSProperties {
  return {
    display:       'inline-flex',
    alignItems:    'center',
    justifyContent: 'center',
    minWidth:      '40px',
    height:        '40px',
    padding:       '0 12px',
    borderRadius:  'var(--r-md)',
    border:        active ? '2px solid var(--brand)' : '1px solid var(--border)',
    background:    active ? 'rgba(123,47,190,0.1)' : 'var(--bg-surface)',
    color:         active ? 'var(--accent)' : 'var(--text-secondary)',
    fontSize:      '14px',
    fontWeight:    active ? 700 : 500,
    textDecoration: 'none',
    transition:    'all 0.15s',
  }
}
