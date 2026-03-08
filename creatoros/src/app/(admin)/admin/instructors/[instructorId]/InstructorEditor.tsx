'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface SocialLinks {
  website?:   string
  youtube?:   string
  instagram?: string
  twitter?:   string
  facebook?:  string
  linkedin?:  string
  tiktok?:    string
  [key: string]: string | undefined
}

interface InstructorData {
  id:              string
  displayName:     string
  slug:            string
  title?:          string | null
  bio?:            string | null
  profileImageUrl?: string | null
  bannerImageUrl?:  string | null
  socialLinks?:    SocialLinks | null
  isPublic:        boolean
}

export default function InstructorEditor({ instructor }: { instructor: InstructorData }) {
  const router    = useRouter()
  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  const social = (instructor.socialLinks ?? {}) as SocialLinks

  const [form, setForm] = useState({
    displayName:     instructor.displayName,
    slug:            instructor.slug,
    title:           instructor.title      ?? '',
    bio:             instructor.bio        ?? '',
    profileImageUrl: instructor.profileImageUrl ?? '',
    bannerImageUrl:  instructor.bannerImageUrl  ?? '',
    isPublic:        instructor.isPublic,
    website:   social.website   ?? '',
    youtube:   social.youtube   ?? '',
    instagram: social.instagram ?? '',
    twitter:   social.twitter   ?? '',
    facebook:  social.facebook  ?? '',
    linkedin:  social.linkedin  ?? '',
    tiktok:    social.tiktok    ?? '',
  })

  const [saving,     setSaving]     = useState(false)
  const [uploading,  setUploading]  = useState<'avatar' | 'banner' | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState(false)

  const uploadImage = async (file: File, field: 'profileImageUrl' | 'bannerImageUrl', type: 'avatar' | 'banner') => {
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return }
    setUploading(type); setError(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'instructors')
    const res  = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (res.ok && data.url) setForm(f => ({ ...f, [field]: data.url }))
    else setError(data.error ?? 'Upload failed')
    setUploading(null)
  }

  const handleSave = async () => {
    if (!form.displayName.trim()) { setError('Display name is required'); return }
    if (!form.slug.trim())        { setError('Slug is required');         return }
    setSaving(true); setError(null)

    const socialLinks: SocialLinks = {}
    if (form.website)   socialLinks.website   = form.website
    if (form.youtube)   socialLinks.youtube   = form.youtube
    if (form.instagram) socialLinks.instagram = form.instagram
    if (form.twitter)   socialLinks.twitter   = form.twitter
    if (form.facebook)  socialLinks.facebook  = form.facebook
    if (form.linkedin)  socialLinks.linkedin  = form.linkedin
    if (form.tiktok)    socialLinks.tiktok    = form.tiktok

    const res = await fetch(`/api/admin/instructors/${instructor.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        displayName:     form.displayName,
        slug:            form.slug,
        title:           form.title     || null,
        bio:             form.bio       || null,
        profileImageUrl: form.profileImageUrl || null,
        bannerImageUrl:  form.bannerImageUrl  || null,
        socialLinks,
        isPublic:        form.isPublic,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    router.refresh()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

      {/* Left — main fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Identity */}
        <Section title="Identity">
          <Field label="Display Name *">
            <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} style={inp} placeholder="e.g. Sifu Mark Rasmus" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="URL Slug *">
              <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <span style={{ padding: '10px 12px', fontSize: '12px', color: '#9ca3af', borderRight: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>/instructors/</span>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} style={{ ...inp, border: 'none', background: 'transparent', borderRadius: '0' }} placeholder="sifu-mark-rasmus" />
              </div>
            </Field>
            <Field label="Title / Role">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} placeholder="e.g. Martial Arts & Esoteric Teacher" />
            </Field>
          </div>
          <Field label="Bio">
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={8}
              placeholder="Full biography. Separate paragraphs with a blank line. This is shown in full on the instructor profile page."
              style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }}
            />
          </Field>
        </Section>

        {/* Social Links */}
        <Section title="Social Links & Website">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="🌐 Website">
              <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} style={inp} placeholder="https://example.com" />
            </Field>
            <Field label="▶ YouTube">
              <input value={form.youtube} onChange={e => setForm(f => ({ ...f, youtube: e.target.value }))} style={inp} placeholder="https://youtube.com/@..." />
            </Field>
            <Field label="◉ Instagram">
              <input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} style={inp} placeholder="https://instagram.com/..." />
            </Field>
            <Field label="𝕏 Twitter / X">
              <input value={form.twitter} onChange={e => setForm(f => ({ ...f, twitter: e.target.value }))} style={inp} placeholder="https://x.com/..." />
            </Field>
            <Field label="f Facebook">
              <input value={form.facebook} onChange={e => setForm(f => ({ ...f, facebook: e.target.value }))} style={inp} placeholder="https://facebook.com/..." />
            </Field>
            <Field label="in LinkedIn">
              <input value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} style={inp} placeholder="https://linkedin.com/in/..." />
            </Field>
            <Field label="♪ TikTok">
              <input value={form.tiktok} onChange={e => setForm(f => ({ ...f, tiktok: e.target.value }))} style={inp} placeholder="https://tiktok.com/@..." />
            </Field>
          </div>
        </Section>
      </div>

      {/* Right — images, visibility, save */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Avatar */}
        <Section title="Profile Photo">
          <div
            onClick={() => avatarRef.current?.click()}
            style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', margin: '0 auto', border: '2px dashed #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'border-color 0.15s' }}
            className="img-hover"
          >
            {form.profileImageUrl ? (
              <Image src={form.profileImageUrl} alt="Avatar" fill style={{ objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '28px' }}>👤</p>
                <p style={{ fontSize: '11px', color: '#9ca3af' }}>{uploading === 'avatar' ? 'Uploading…' : 'Upload'}</p>
              </div>
            )}
          </div>
          <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'profileImageUrl', 'avatar')} />
          {form.profileImageUrl && (
            <button onClick={() => setForm(f => ({ ...f, profileImageUrl: '' }))} style={removeBtn}>Remove photo</button>
          )}
        </Section>

        {/* Banner */}
        <Section title="Banner Image">
          <div
            onClick={() => bannerRef.current?.click()}
            style={{ width: '100%', aspectRatio: '16/5', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '2px dashed #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
            className="img-hover"
          >
            {form.bannerImageUrl ? (
              <Image src={form.bannerImageUrl} alt="Banner" fill style={{ objectFit: 'cover' }} />
            ) : (
              <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '8px' }}>
                {uploading === 'banner' ? 'Uploading…' : 'Click to upload banner\n(wide image)'}
              </p>
            )}
          </div>
          <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'bannerImageUrl', 'banner')} />
          {form.bannerImageUrl && (
            <button onClick={() => setForm(f => ({ ...f, bannerImageUrl: '' }))} style={removeBtn}>Remove banner</button>
          )}
        </Section>

        {/* Visibility */}
        <Section title="Visibility">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isPublic} onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Public — visible on site</span>
          </label>
        </Section>

        {/* Save */}
        <div>
          {error   && <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '10px' }}>{error}</p>}
          {success && <p style={{ fontSize: '13px', color: '#10b981', marginBottom: '10px' }}>✓ Saved</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ width: '100%', background: saving ? '#e5e7eb' : '#7B2FBE', color: saving ? '#9ca3af' : 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '15px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <style>{`.img-hover:hover { border-color: #7B2FBE !important; }`}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
      </div>
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb',
  borderRadius: '8px', padding: '10px 14px', fontSize: '14px',
  color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)',
}

const removeBtn: React.CSSProperties = {
  fontSize: '12px', color: '#ef4444', background: 'none', border: 'none',
  cursor: 'pointer', marginTop: '8px', display: 'block', fontFamily: 'var(--font-ui)',
}
