export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Collections — Admin' }

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    include: { _count: { select: { courses: true } } },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
  })

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Collections"
        description="Group courses into themed collections shown on the /courses page"
        action={{ label: '+ New Collection', href: '/admin/collections/new' }}
      />

      {collections.length === 0 ? (
        <div style={{ background: 'white', border: '2px dashed #e5e7eb', borderRadius: '12px', padding: '56px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📁</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>No collections yet</h2>
          <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>Collections appear as cards on the /courses page.</p>
          <Link href="/admin/collections/new" style={{ display: 'inline-block', background: '#7B2FBE', color: 'white', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
            Create First Collection →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {collections.map(col => (
            <Link key={col.id} href={`/admin/collections/${col.id}/edit`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', transition: 'box-shadow 0.15s', cursor: 'pointer' }} className="col-card">
                <div style={{ height: '160px', background: col.bannerImageUrl ? undefined : 'linear-gradient(135deg, #1A0A2E, #2D1045)', position: 'relative', overflow: 'hidden' }}>
                  {col.bannerImageUrl ? (
                    <Image src={col.bannerImageUrl} alt={col.name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>No image</p>
                    </div>
                  )}
                  {col.isFeatured && (
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#7B2FBE', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>FEATURED</div>
                  )}
                  {!col.isPublished && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#6b7280', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>DRAFT</div>
                  )}
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{col.name}</p>
                  <p style={{ fontSize: '13px', color: '#6b7280' }}>{col._count.courses} course{col._count.courses !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <style>{`.col-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; }`}</style>
    </div>
  )
}
