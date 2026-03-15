export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Browse course collections at Perseus Arcane Academy',
}

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    where:   { isPublished: true },
    include: {
      courses: {
        include: { course: { include: { instructor: true, products: { include: { product: { select: { price: true, compareAtPrice: true, currency: true } } }, take: 1 } } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
  })

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--s7) 0 var(--s5)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
      }}>
        <div className="platform-container">
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Collections
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Curated learning paths — courses grouped by subject, tradition, or progression.
          </p>
        </div>
      </div>

      <div className="platform-container" style={{ padding: 'var(--s7) var(--s5)' }}>
        {collections.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 'var(--s9)',
            background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)',
            border: '1px solid var(--border)',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              No collections yet. Check back soon.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s7)' }}>
            {collections.map(collection => (
              <CollectionRow key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CollectionRow({ collection }: { collection: any }) {
  const courses = collection.courses.slice(0, 4).map((cc: any) => cc.course)

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      overflow: 'hidden',
    }}>
      {/* Collection header */}
      <div style={{
        padding: 'var(--s6)',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s5)',
      }}>
        <div>
          <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Collection · {collection.courses.length} courses
          </p>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {collection.name}
          </h2>
          {collection.description && (
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '560px', lineHeight: 1.6 }}>
              {collection.description}
            </p>
          )}
        </div>
        <Link
          href={`/collection/${collection.slug}`}
          style={{
            flexShrink: 0, fontSize: '14px', color: 'var(--accent)',
            background: 'var(--accent-soft)', border: '1px solid rgba(192,132,252,0.25)',
            borderRadius: 'var(--r-md)', padding: '8px 16px',
            textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap',
          }}
        >
          View All →
        </Link>
      </div>

      {/* Course previews */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1px',
        background: 'var(--border)',
      }}>
        {courses.map((course: any) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            style={{ textDecoration: 'none', background: 'var(--bg-surface)', display: 'block' }}
            className="collection-course-hover"
          >
            <div style={{ height: '120px', background: course.thumbnailUrl ? undefined : 'linear-gradient(135deg, var(--bg-elevated), var(--bg-hover))', position: 'relative', overflow: 'hidden' }}>
              {course.thumbnailUrl ? (
                <Image src={course.thumbnailUrl} alt={course.title} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '9px', color: 'rgba(240,234,248,0.3)', letterSpacing: '0.1em' }}>
                  PERSEUS
                </div>
              )}
            </div>
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '4px' }}>
                {course.title}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {course.instructor?.displayName ?? 'Perseus Arcane'}
              </p>
              <p style={{ fontSize: '13px', fontWeight: 700, color: Number(course.products?.[0]?.product?.price ?? 0) === 0 ? 'var(--success)' : 'var(--text-primary)', marginTop: '6px' }}>
                {Number(course.products?.[0]?.product?.price ?? 0) === 0 ? 'Free' : `${course.products?.[0]?.product?.currency ?? 'USD'} ${Number(course.products?.[0]?.product?.price ?? 0).toFixed(2)}`}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <style>{`.collection-course-hover:hover { background: var(--bg-elevated) !important; }`}</style>
    </div>
  )
}
