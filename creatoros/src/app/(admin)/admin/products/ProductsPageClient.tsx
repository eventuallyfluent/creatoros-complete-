'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import NewProductModal from './NewProductModal'

interface Product {
  id:            string
  title:         string
  slug:          string
  type:          string
  status:        string
  price:         number
  compareAtPrice:number | null
  currency:      string
  instructor:    { displayName: string } | null
  courses:       { course: { id: string } }[]
  _count:        { enrollments: number; orderItems: number }
}
interface Course     { id: string; title: string; slug: string }
interface Instructor { id: string; displayName: string }

interface Props {
  products:    Product[]
  courses:     Course[]
  instructors: Instructor[]
}

const statusColor: Record<string, string> = {
  PUBLISHED: '#10b981', DRAFT: '#f59e0b', ARCHIVED: '#6b7280',
}
const statusBg: Record<string, string> = {
  PUBLISHED: 'rgba(16,185,129,0.1)', DRAFT: 'rgba(245,158,11,0.1)', ARCHIVED: 'rgba(107,114,128,0.1)',
}

export default function ProductsPageClient({ products, courses, instructors }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  return (
    <div style={{ padding: 'clamp(16px, 3vw, 40px)', maxWidth: '1200px', margin: '0 auto' }}>
      <AdminPageHeader
        title="Products"
        description={`${products.length} product${products.length !== 1 ? 's' : ''} — courses and bundles for sale`}
        action={{ label: '+ New Product', onClick: () => setModalOpen(true) }}
      />

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Product', 'Type', 'Status', 'Price', 'Students', 'Sales', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center' }}>
                  <p style={{ color: '#9ca3af', fontSize: '15px', marginBottom: '12px' }}>No products yet.</p>
                  <button onClick={() => setModalOpen(true)}
                    style={{ color: '#7B2FBE', fontWeight: 600, fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                    Create your first product →
                  </button>
                </td>
              </tr>
            ) : products.map(product => (
              <tr key={product.id} style={{ borderTop: '1px solid #f3f4f6' }} className="admin-row-hover">
                <td style={{ padding: '14px 16px', maxWidth: '260px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.title}
                  </p>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>/courses/{product.slug}</p>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    color: product.type === 'BUNDLE' ? '#7B2FBE' : '#374151',
                    background: product.type === 'BUNDLE' ? 'rgba(123,47,190,0.08)' : '#f3f4f6',
                    padding: '3px 10px', borderRadius: '999px',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {product.type === 'BUNDLE' ? `Bundle · ${product.courses.length}` : 'Course'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    color: statusColor[product.status],
                    background: statusBg[product.status],
                    padding: '3px 10px', borderRadius: '999px',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {product.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151', fontWeight: 500 }}>
                  {Number(product.price) === 0 ? (
                    <span style={{ color: '#10b981', fontWeight: 700 }}>Free</span>
                  ) : (
                    <>
                      {product.currency} {Number(product.price).toFixed(2)}
                      {product.compareAtPrice && (
                        <span style={{ color: '#9ca3af', textDecoration: 'line-through', marginLeft: '6px', fontSize: '12px' }}>
                          {Number(product.compareAtPrice).toFixed(2)}
                        </span>
                      )}
                    </>
                  )}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151' }}>{product._count.enrollments}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151' }}>{product._count.orderItems}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link href={`/admin/products/${product.id}`}
                      style={{ fontSize: '13px', color: '#7B2FBE', fontWeight: 600, textDecoration: 'none' }}>
                      Edit
                    </Link>
                    <span style={{ color: '#e5e7eb' }}>·</span>
                    <Link href={`/courses/${product.slug}`} target="_blank"
                      style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`.admin-row-hover:hover { background: #fafafa !important; }`}</style>

      {modalOpen && (
        <NewProductModal
          courses={courses}
          instructors={instructors}
          onClose={() => setModalOpen(false)}
          onCreated={(id) => router.push(`/admin/products/${id}`)}
        />
      )}
    </div>
  )
}
