'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ExternalLink, Edit2, Lock } from 'lucide-react'

interface Page {
  id:        string
  slug:      string
  title:     string
  status:    string
  type:      string
  updatedAt: string
}

const SYSTEM_SLUGS = ['privacy', 'terms', 'cookies', 'gdpr', 'contact']

export default function PagesClient({ pages }: { pages: Page[] }) {
  if (pages.length === 0) return (
    <div style={{ background: 'white', border: '2px dashed #e5e7eb', borderRadius: '12px', padding: '56px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>No pages yet</p>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '0' }}>Use the <strong>+ New Page</strong> button above to create your first page.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {pages.map(page => {
        const isSystem  = SYSTEM_SLUGS.includes(page.slug)
        const published = page.status === 'PUBLISHED'
        return (
          <div key={page.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Lock icon for system pages */}
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isSystem ? '#f5f3ff' : '#f9fafb', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {isSystem ? <Lock size={14} color="#7B2FBE" /> : <span style={{ fontSize: '14px' }}>📄</span>}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>{page.title}</p>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                  background: published ? '#f0fdf4' : '#f9fafb',
                  color:      published ? '#065f46' : '#6b7280',
                  border:     `1px solid ${published ? '#86efac' : '#e5e7eb'}` }}>
                  {published ? 'Published' : 'Draft'}
                </span>
                {isSystem && <span style={{ fontSize: '11px', color: '#7B2FBE', background: '#f5f3ff', border: '1px solid #e9d5ff', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>System</span>}
              </div>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>/{page.slug} · Updated {new Date(page.updatedAt).toLocaleDateString()}</p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#6b7280', padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none', fontWeight: 500 }}>
                <ExternalLink size={12} /> View
              </a>
              <Link href={`/admin/pages/${page.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'white', background: '#7B2FBE', padding: '7px 14px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
                <Edit2 size={12} /> Edit
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
