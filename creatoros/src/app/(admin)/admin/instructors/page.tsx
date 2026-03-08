export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Instructors — Admin' }

export default async function AdminInstructorsPage() {
  const instructors = await prisma.instructorProfile.findMany({
    include: { _count: { select: { products: { where: { status: 'PUBLISHED' } } } } },
    orderBy: { displayName: 'asc' },
  })

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Instructors"
        description="Manage instructor profiles, bios, and social links"
        action={{ label: '+ New Instructor', href: '/admin/instructors/new' }}
      />

      {instructors.length === 0 ? (
        <div style={{ background: 'white', border: '2px dashed #e5e7eb', borderRadius: '12px', padding: '56px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👤</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>No instructors yet</h2>
          <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>Create an instructor profile to link to courses and products.</p>
          <Link href="/admin/instructors/new" style={{ display: 'inline-block', background: '#7B2FBE', color: 'white', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
            Create First Instructor →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {instructors.map(inst => {
            const social = (inst.socialLinks ?? {}) as Record<string, string>
            return (
              <div key={inst.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Avatar */}
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#7B2FBE', position: 'relative', border: '2px solid #e5e7eb' }}>
                  {inst.profileImageUrl ? (
                    <Image src={inst.profileImageUrl} alt={inst.displayName} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: 'white' }}>
                      {inst.displayName[0]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>{inst.displayName}</p>
                    {inst.title && <p style={{ fontSize: '13px', color: '#7B2FBE', margin: 0 }}>{inst.title}</p>}
                    {!inst.isPublic && (
                      <span style={{ fontSize: '11px', background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>Hidden</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>/instructors/{inst.slug}</p>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{inst._count.products} published course{inst._count.products !== 1 ? 's' : ''}</p>
                    {Object.keys(social).length > 0 && (
                      <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                        {Object.keys(social).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <Link href={`/instructors/${inst.slug}`} target="_blank"
                    style={{ fontSize: '13px', color: '#6b7280', padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none', fontWeight: 500 }}>
                    View ↗
                  </Link>
                  <Link href={`/admin/instructors/${inst.id}`}
                    style={{ fontSize: '13px', color: 'white', background: '#7B2FBE', padding: '7px 14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
                    Edit
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
