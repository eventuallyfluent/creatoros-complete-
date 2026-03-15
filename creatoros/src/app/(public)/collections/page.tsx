export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Browse course collections',
}

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    where:   { isPublished: true },
    include: { _count: { select: { courses: true } } },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--s7) 0 var(--s5)',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-base) 100%)',
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

      {/* Collection cards */}
      <div className="platform-container" style={{ padding: 'var(--s7) var(--s5) var(--s9)' }}>
        {collections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--s9)', border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>No collections yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--s5)' }} className="collection-overview-grid">
            {collections.map(col => (
              <Link key={col.id} href={`/collection/${col.slug}`} style={{ textDecoration: 'none' }}>
                <div className="collection-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'pointer' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-hover))' }}>
                    {col.bannerImageUrl ? (
                      <Image src={col.bannerImageUrl} alt={col.name} fill style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }} className="collection-card-img" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 2.5vw, 26px)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.06em', lineHeight: 1.2 }}>
                          {col.name}
                        </p>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{col.name}</p>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{(col as any)._count.courses} courses →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .collection-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important; transform: translateY(-2px); }
        .collection-card:hover .collection-card-img { transform: scale(1.03); }
        @media (max-width: 900px) { .collection-overview-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px) { .collection-overview-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
