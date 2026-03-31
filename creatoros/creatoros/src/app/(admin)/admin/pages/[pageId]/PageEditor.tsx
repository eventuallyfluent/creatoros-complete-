'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PageData {
  id:              string
  slug:            string
  title:           string
  body:            string
  status:          string
  metaTitle:       string | null
  metaDescription: string | null
  ogImageUrl:      string | null
}

const SYSTEM_SLUGS = ['privacy', 'terms', 'cookies', 'gdpr', 'contact', 'unsubscribe']

export default function PageEditor({ page }: { page: PageData | null }) {
  const router   = useRouter()
  const isNew    = !page
  const isSystem = page ? SYSTEM_SLUGS.includes(page.slug) : false

  const [form, setForm] = useState({
    title:           page?.title           ?? '',
    slug:            page?.slug            ?? '',
    body:            page?.body            ?? '',
    status:          page?.status          ?? 'DRAFT',
    metaTitle:       page?.metaTitle       ?? '',
    metaDescription: page?.metaDescription ?? '',
  })

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tab,     setTab]     = useState<'content' | 'seo'>('content')
  const [preview, setPreview] = useState(false)

  const handleTitleChange = (title: string) => {
    setForm(f => ({
      ...f, title,
      slug: isNew
        ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : f.slug,
    }))
  }

  const handleSave = async (publish?: boolean) => {
    if (!form.title.trim()) { setError('Title required'); return }
    if (!form.slug.trim())  { setError('Slug required');  return }
    setSaving(true); setError(null)

    const payload = {
      ...form,
      status: publish ? 'PUBLISHED' : form.status,
    }

    const url = isNew ? '/api/admin/pages' : `/api/admin/pages/${page!.id}`
    const res = await fetch(url, {
      method:  isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    if (isNew) router.push(`/admin/pages/${data.id}`)
    else router.refresh()
  }

  const inp:   React.CSSProperties = { width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)' }
  const label: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

      {/* Left — content */}
      <div>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
          {(['content', 'seo'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 18px', fontSize: '13px', fontWeight: tab === t ? 700 : 500, color: tab === t ? '#7B2FBE' : '#6b7280', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #7B2FBE' : '2px solid transparent', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              {t === 'content' ? '📝 Content' : '🔍 SEO'}
            </button>
          ))}
          <button onClick={() => setPreview(p => !p)} style={{ marginLeft: 'auto', padding: '8px 14px', fontSize: '12px', fontWeight: 600, color: preview ? '#7B2FBE' : '#6b7280', background: preview ? 'rgba(123,47,190,0.06)' : 'none', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {tab === 'content' && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6' }}>
              <label style={label}>Page Title</label>
              <input
                value={form.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="e.g. Privacy Policy"
                style={{ ...inp, fontSize: '18px', fontWeight: 600 }}
              />
            </div>
            <div style={{ padding: '20px' }}>
              <label style={label}>Content</label>
              {preview ? (
                <div
                  style={{ minHeight: '480px', padding: '16px', background: '#fafafa', borderRadius: '8px', border: '1px solid #e5e7eb', lineHeight: 1.8, color: '#374151', fontSize: '15px', whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{ __html: form.body.replace(/\n/g, '<br/>') }}
                />
              ) : (
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={24}
                  placeholder={`Write your page content here.\n\nYou can use simple markdown:\n# Heading 1\n## Heading 2\n**bold text**\n- bullet point\n\nSeparate paragraphs with a blank line.`}
                  style={{ ...inp, resize: 'vertical', lineHeight: 1.7, fontFamily: 'monospace', fontSize: '13px' }}
                />
              )}
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                Supports basic markdown: **bold**, *italic*, # Heading, ## Heading 2, - list item, [link text](url)
              </p>
            </div>
          </div>
        )}

        {tab === 'seo' && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={label}>Meta Title</label>
              <input value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))} placeholder={form.title || 'Page title for search engines'} style={inp} />
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>Defaults to page title if blank. Ideal: 50–60 characters.</p>
            </div>
            <div>
              <label style={label}>Meta Description</label>
              <textarea value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))} rows={3} placeholder="Short description for search engine results…" style={{ ...inp, resize: 'none' }} />
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>Ideal: 120–160 characters. ({form.metaDescription.length} used)</p>
            </div>

            {/* Google preview */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Search Preview</p>
              <p style={{ fontSize: '18px', color: '#1a0dab', margin: '0 0 2px', fontFamily: 'arial, sans-serif' }}>{form.metaTitle || form.title || 'Page Title'}</p>
              <p style={{ fontSize: '13px', color: '#006621', margin: '0 0 4px', fontFamily: 'arial, sans-serif' }}>perseusarcaneacademy.com/{form.slug}</p>
              <p style={{ fontSize: '13px', color: '#545454', margin: 0, fontFamily: 'arial, sans-serif', lineHeight: 1.5 }}>{form.metaDescription || 'No description set.'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Right — settings + save */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* URL Slug */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <label style={label}>URL Slug</label>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <span style={{ padding: '10px 10px', fontSize: '11px', color: '#9ca3af', borderRight: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>site.com/</span>
            <input
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
              disabled={isSystem}
              style={{ ...inp, border: 'none', background: 'transparent', borderRadius: '0', opacity: isSystem ? 0.5 : 1 }}
            />
          </div>
          {isSystem && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>System page — slug cannot be changed.</p>}
        </div>

        {/* Status */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <label style={label}>Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...inp }}>
            <option value="DRAFT">Draft — not visible</option>
            <option value="PUBLISHED">Published — live</option>
          </select>
        </div>

        {/* Save actions */}
        <div>
          {error   && <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '8px' }}>{error}</p>}
          {success && <p style={{ fontSize: '13px', color: '#10b981', marginBottom: '8px' }}>✓ Saved</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => handleSave()} disabled={saving} style={{ width: '100%', background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '15px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            {form.status !== 'PUBLISHED' && (
              <button onClick={() => handleSave(true)} disabled={saving} style={{ width: '100%', background: 'white', color: '#065f46', border: '2px solid #86efac', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
                Save & Publish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
