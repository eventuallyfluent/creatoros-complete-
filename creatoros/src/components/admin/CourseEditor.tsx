'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Instructor { id: string; displayName: string }

interface CourseData {
  id?:             string
  title?:          string
  subtitle?:       string
  slug?:           string
  description?:    string
  thumbnailUrl?:   string
  status?:         string
  instructorId?:   string
  certificateEnabled?: boolean
  metaTitle?:      string
  metaDescription?: string
}

interface Props {
  course?:      CourseData
  instructors:  Instructor[]
  productId?:   string   // if known, show link to product editor for pricing
}

export default function CourseEditor({ course, instructors, productId }: Props) {
  const router  = useRouter()
  const isNew   = !course?.id
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title:              course?.title              ?? '',
    subtitle:           course?.subtitle           ?? '',
    slug:               course?.slug               ?? '',
    description:        course?.description        ?? '',
    thumbnailUrl:       course?.thumbnailUrl        ?? '',
    status:             course?.status             ?? 'DRAFT',
    instructorId:       course?.instructorId        ?? '',
    certificateEnabled: course?.certificateEnabled ?? false,
    metaTitle:          course?.metaTitle           ?? '',
    metaDescription:    course?.metaDescription     ?? '',
  })

  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)

  const handleTitleChange = (title: string) => {
    setForm(f => ({
      ...f,
      title,
      slug: isNew
        ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : f.slug,
    }))
  }

  const handleThumbnailUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    if (file.size > 5 * 1024 * 1024)    { setError('Image must be under 5MB');      return }
    setUploading(true); setError(null)
    const formData = new FormData()
    formData.append('file',   file)
    formData.append('folder', 'thumbnails')
    const res  = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (res.ok && data.url) setForm(f => ({ ...f, thumbnailUrl: data.url }))
    else setError(data.error ?? 'Upload failed')
    setUploading(false)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.slug.trim())  { setError('Slug is required');  return }
    setSaving(true); setError(null)
    const url    = isNew ? '/api/courses' : `/api/courses/${course!.id}`
    const method = isNew ? 'POST' : 'PATCH'
    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    setSuccess(true); setTimeout(() => setSuccess(false), 3000)
    if (isNew && data.id) router.push(`/admin/courses/${data.id}/edit`)
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>

      {/* Pricing notice — points to Product editor */}
      {!isNew && (
        <div style={{ padding: '12px 20px', background: '#f0fdf4', borderBottom: '1px solid #d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: '#065f46', margin: 0 }}>
            <strong>Pricing, checkout, and sales page</strong> are managed on the Product editor.
          </p>
          {productId ? (
            <Link href={`/admin/products/${productId}`} style={{ fontSize: '12px', fontWeight: 600, color: '#065f46', textDecoration: 'none', whiteSpace: 'nowrap', padding: '5px 12px', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
              Edit Product →
            </Link>
          ) : (
            <Link href="/admin/products" style={{ fontSize: '12px', fontWeight: 600, color: '#065f46', textDecoration: 'none', whiteSpace: 'nowrap', padding: '5px 12px', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
              Products →
            </Link>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px' }}>

        {/* Left — content fields */}
        <div style={{ padding: '28px', borderRight: '1px solid #e5e7eb' }}>
          <Field label="Course Title *">
            <input value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="e.g. Introduction to Hermetics" style={inputStyle} />
          </Field>

          <Field label="Subtitle">
            <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="A short tagline shown on the sales page" style={inputStyle} />
          </Field>

          <Field label="URL Slug *">
            <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              <span style={{ padding: '10px 12px', fontSize: '13px', color: '#9ca3af', borderRight: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>/courses/</span>
              <input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                placeholder="introduction-to-hermetics"
                style={{ ...inputStyle, border: 'none', background: 'transparent', borderRadius: '0' }}
              />
            </div>
          </Field>

          <Field label="Description">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what students will learn..." rows={6} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </Field>

          {/* SEO */}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>SEO (optional)</p>
            <Field label="Meta Title">
              <input value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))} placeholder={form.title} style={inputStyle} />
            </Field>
            <Field label="Meta Description">
              <textarea value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'none' }} />
            </Field>
          </div>
        </div>

        {/* Right — thumbnail, status, instructor, certificate */}
        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Thumbnail */}
          <div>
            <label style={labelStyle}>Thumbnail</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ width: '100%', aspectRatio: '16/9', background: form.thumbnailUrl ? undefined : '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s' }}
              className="thumbnail-drop-hover"
            >
              {form.thumbnailUrl
                ? <Image src={form.thumbnailUrl} alt="Thumbnail" fill style={{ objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>🖼️</div>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>{uploading ? 'Uploading...' : 'Click to upload'}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>JPG, PNG, WebP · max 5MB</p>
                  </div>
              }
              {form.thumbnailUrl && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }} className="thumbnail-overlay">
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>Change Image</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])} />
            {form.thumbnailUrl && (
              <button type="button" onClick={() => setForm(f => ({ ...f, thumbnailUrl: '' }))} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px', fontFamily: 'var(--font-ui)' }}>
                Remove image
              </button>
            )}
          </div>

          <Field label="Status">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>

          {instructors.length > 0 && (
            <Field label="Instructor">
              <select value={form.instructorId} onChange={e => setForm(f => ({ ...f, instructorId: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">— None —</option>
                {instructors.map(i => <option key={i.id} value={i.id}>{i.displayName}</option>)}
              </select>
            </Field>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.certificateEnabled} onChange={e => setForm(f => ({ ...f, certificateEnabled: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Enable completion certificate</span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 28px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          {error   && <p style={{ fontSize: '14px', color: '#ef4444', margin: 0 }}>{error}</p>}
          {success && <p style={{ fontSize: '14px', color: '#10b981', margin: 0 }}>✓ Saved successfully</p>}
        </div>
        <button onClick={handleSave} disabled={saving} style={{ background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
          {saving ? 'Saving...' : isNew ? 'Create Course' : 'Save Changes'}
        </button>
      </div>

      <style>{`
        .thumbnail-drop-hover:hover { border-color: #7B2FBE !important; }
        .thumbnail-drop-hover:hover .thumbnail-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px',
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb',
  borderRadius: '8px', padding: '10px 14px', fontSize: '14px',
  color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)', transition: 'border-color 0.15s',
}
