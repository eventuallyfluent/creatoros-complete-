import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Courses — Perseus Arcane Academy',
  description: 'Browse all course collections at Perseus Arcane Academy',
}

export default async function CoursesPage() {
  const collections = await prisma.collection.findMany({
    where:   { isPublished: true },
    include: { _count: { select: { courses: true } } },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* Same tab bar as collection pages — All Courses is active here */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        background:   'var(--bg-surface)',
        overflowX:    'auto',
        WebkitOverflowScrolling: 'touch' as any,
      }}>
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexWrap:       'wrap',
          padding:        '0 var(--s5)',
          minWidth:       'max-content',
          margin:         '0 auto',
        }}>
          {/* All Courses — active */}
          <span style={{
            display:      'inline-block',
            padding:      '18px 20px',
            fontSize:     '13px',
            fontWeight:   700,
            color:        'var(--text-primary)',
            borderBottom: '2px solid var(--brand)',
            whiteSpace:   'nowrap',
          }}>
            All Courses
          </span>

          <span style={{ width: '1px', height: '16px', background: 'var(--border)', flexShrink: 0 }} />

          {collections.map((col, i) => (
            <span key={col.id} style={{ display: 'flex', alignItems: 'center' }}>
              <Link
                href={`/collection/${col.slug}`}
                style={{
                  display:        'inline-block',
                  padding:        '18px 20px',
                  fontSize:       '13px',
                  fontWeight:     500,
                  color:          'var(--text-secondary)',
                  textDecoration: 'none',
                  borderBottom:   '2px solid transparent',
                  whiteSpace:     'nowrap',
                  transition:     'color 0.15s',
                }}
                className="collection-tab"
              >
                {col.name}
              </Link>
              {i < collections.length - 1 && (
                <span style={{ width: '1px', height: '16px', background: 'var(--border)', flexShrink: 0 }} />
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Collection cards grid */}
      <div className="platform-container" style={{ padding: 'var(--s7) var(--s5) var(--s9)' }}>
        {collections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--s9)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Collections coming soon.</p>
          </div>
        ) : (
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 'var(--s5)',
          }} className="collection-overview-grid">
            {collections.map(col => (
              <CollectionCard key={col.id} collection={col} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .collection-tab:hover { color: var(--text-primary) !important; }
        @media (max-width: 900px)  { .collection-overview-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px)  { .collection-overview-grid { grid-template-columns: 1fr !important; } }
        .collection-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important; transform: translateY(-2px); }
        .collection-card:hover .collection-card-img { transform: scale(1.03); }
      `}</style>
    </div>
  )
}

function CollectionCard({ collection }: { collection: any }) {
  return (
    <Link href={`/collection/${collection.slug}`} style={{ textDecoration: 'none' }}>
      <div className="collection-card" style={{
        background:   'var(--bg-surface)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        overflow:     'hidden',
        transition:   'box-shadow 0.2s, transform 0.2s',
        cursor:       'pointer',
      }}>
        <div style={{
          position:    'relative',
          width:       '100%',
          aspectRatio: '4/3',
          overflow:    'hidden',
          background:  'linear-gradient(135deg, #0D0D1A, #1A0A2E)',
        }}>
          {collection.bannerImageUrl ? (
            <Image
              src={collection.bannerImageUrl}
              alt={collection.name}
              fill
              style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
              className="collection-card-img"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize:   'clamp(18px, 3vw, 28px)',
                fontWeight: 700,
                color:      'white',
                textTransform: 'uppercase',
                textAlign:  'center',
                letterSpacing: '0.06em',
                lineHeight: 1.2,
              }}>
                {collection.name}
              </p>
            </div>
          )}
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {collection.name}
          </p>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {collection._count.courses} courses →
          </span>
        </div>
      </div>
    </Link>
  )
}
