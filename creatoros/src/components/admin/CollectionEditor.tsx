'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { GripVertical, X, Search } from 'lucide-react'

interface Course {
  id:           string
  title:        string
  slug:         string
  thumbnailUrl: string | null
}

interface CollectionData {
  id?:           string
  name?:         string
  slug?:         string
  description?:  string
  bannerImageUrl?: string
  sortOrder?:    number
  isFeatured?:   boolean
  isPublished?:  boolean
}

interface Props {
  collection?:       CollectionData
  courses:           Course[]
  assignedCourseIds?: string[]
}

export default function CollectionEditor({ collection, courses, assignedCourseIds = [] }: Props) {
  const router  = useRouter()
  const isNew   = !collection?.id
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name:          collection?.name          ?? '',
    slug:          collection?.slug          ?? '',
    description:   collection?.description   ?? '',
    bannerImageUrl: collection?.bannerImageUrl ?? '',
    sortOrder:     collection?.sortOrder      ?? 0,
    isFeatured:    collection?.isFeatured     ?? false,
    isPublished:   collection?.isPublished    ?? true,
  })

  // Course assignment — ordered list of courseIds
  const [assigned, setAssigned] = useState<string[]>(assignedCourseIds)
  const [query,    setQuery]    = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)

  const handleNameChange = (name: string) => {
    setForm(f => ({
      ...f,
      name,
      slug: isNew
        ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : f.slug,
    }))
  }

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    if (file.size > 5 * 1024 * 1024)    { setError('Image must be under 5MB'); return }
    setUploading(true); setError(null)
    const fd = new FormData()
    fd.append('file',   file)
    fd.append('folder', 'collections')
    const res  = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (res.ok && data.url) setForm(f => ({ ...f, bannerImageUrl: data.url }))
    else setError(data.error ?? 'Upload failed')
    setUploading(false)
  }

  const addCourse = (courseId: string) => {
    if (!assigned.includes(courseId)) setAssigned(a => [...a, courseId])
    setQuery('')
  }

  const removeCourse = (courseId: string) => setAssigned(a => a.filter(id => id !== courseId))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.slug.trim()) { setError('Slug is required');  return }
    setSaving(true); setError(null)

    const url    = isNew ? '/api/collections' : `/api/collections/${collection!.id}`
    const method = isNew ? 'POST' : 'PATCH'

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...form, courseIds: assigned }),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    if (isNew && data.id) router.push(`/admin/collections/${data.id}/edit`)
  }

  const filteredCourses = courses.filter(c =>
    !assigned.includes(c.id) &&
    c.title.toLowerCase().includes(query.toLowerCase())
  )

  const assignedCourses = assigned
    .map(id => courses.find(c => c.id === id))
    .filter(Boolean) as Course[]

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)', background: '#f9fafb' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

      {/* Left — main fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Basic info */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '18px' }}>Collection Details</p>

          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>Name *</label>
            <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Sixty Skills" style={inp} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>URL Slug *</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              <span style={{ padding: '9px 12px', fontSize: '13px', color: '#9ca3af', borderRight: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>/collection/</span>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="sixty-skills" style={{ ...inp, border: 'none', background: 'transparent', borderRadius: 0 }} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="A short description shown on the collection page…" style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={lbl}>Sort Order</label>
              <input type="number" min="0" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} style={inp} />
            </div>
            <div style={{ display: 'flex', gap: '20px', paddingBottom: '2px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} style={{ width: '15px', height: '15px' }} />
                <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Published</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} style={{ width: '15px', height: '15px' }} />
                <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Featured</span>
              </label>
            </div>
          </div>
        </div>

        {/* Course assignment */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>Courses in this Collection</p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '18px' }}>A course can belong to multiple collections.</p>

          {/* Search to add */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search courses to add…"
              style={{ ...inp, paddingLeft: '34px' }}
            />
            {query && filteredCourses.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                {filteredCourses.map(c => (
                  <button key={c.id} type="button" onClick={() => addCourse(c.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', transition: 'background 0.1s' }}
                    className="search-result-hover"
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0, position: 'relative' }}>
                      {c.thumbnailUrl && <Image src={c.thumbnailUrl} alt="" fill style={{ objectFit: 'cover' }} />}
                    </div>
                    <span style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>{c.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assigned list */}
          {assignedCourses.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>No courses assigned yet. Search above to add.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {assignedCourses.map((course, idx) => (
                <div key={course.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                  <GripVertical size={14} style={{ color: '#d1d5db', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', width: '20px', flexShrink: 0 }}>{idx + 1}</span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '4px', overflow: 'hidden', background: '#e5e7eb', flexShrink: 0, position: 'relative' }}>
                    {course.thumbnailUrl && <Image src={course.thumbnailUrl} alt="" fill style={{ objectFit: 'cover' }} />}
                  </div>
                  <span style={{ fontSize: '13px', color: '#111827', fontWeight: 500, flex: 1 }}>{course.title}</span>
                  <button onClick={() => removeCourse(course.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', border: '1px solid #fecaca', borderRadius: '4px', background: 'white', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right — banner image + save */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <label style={lbl}>Collection Banner Image</label>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ width: '100%', aspectRatio: '4/3', background: form.bannerImageUrl ? undefined : '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s', marginBottom: '12px' }}
            className="banner-upload-hover"
          >
            {form.bannerImageUrl ? (
              <Image src={form.bannerImageUrl} alt="Banner" fill style={{ objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>{uploading ? 'Uploading...' : 'Click to upload banner'}</p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>4:3 ratio · JPG, PNG, WebP · max 5MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
          {form.bannerImageUrl && (
            <button type="button" onClick={() => setForm(f => ({ ...f, bannerImageUrl: '' }))} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              Remove image
            </button>
          )}
        </div>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          {error   && <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '12px' }}>{error}</p>}
          {success && <p style={{ fontSize: '13px', color: '#10b981', marginBottom: '12px' }}>✓ Saved</p>}
          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
            {saving ? 'Saving…' : isNew ? 'Create Collection' : 'Save Changes'}
          </button>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '10px', textAlign: 'center' }}>
            {assigned.length} course{assigned.length !== 1 ? 's' : ''} assigned
          </p>
        </div>
      </div>

      <style>{`
        .banner-upload-hover:hover { border-color: #7B2FBE !important; }
        .search-result-hover:hover { background: #f9fafb !important; }
      `}</style>
    </div>
  )
}
