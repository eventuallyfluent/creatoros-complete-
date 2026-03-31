'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { SiteSettings } from '@/lib/settings/site-settings'

interface Props { settings: SiteSettings }

const SOCIAL_PLATFORMS = ['twitter', 'instagram', 'facebook', 'youtube', 'tiktok', 'linkedin']

export default function BrandingEditor({ settings }: Props) {
  const router  = useRouter()
  const [form,   setForm]   = useState({ ...settings })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  const set = (key: keyof SiteSettings, val: any) => setForm(f => ({ ...f, [key]: val }))

  const handleUpload = async (file: File, field: 'logoUrl' | 'faviconUrl') => {
    setUploading(field)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', field === 'logoUrl' ? 'logos' : 'favicons')
    const res  = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    setUploading(null)
    if (res.ok) set(field, data.url)
  }

  const handleSave = async () => {
    setSaving(true); setError(null)
    const res = await fetch('/api/settings/branding', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)', background: '#f9fafb' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827' }}>{title}</h3>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '16px' }}><label style={lbl}>{label}</label>{children}</div>
  )

  return (
    <div style={{ maxWidth: '680px' }}>

      <Section title="Site Identity">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Site Name">
            <input value={form.siteName} onChange={e => set('siteName', e.target.value)} style={inp} />
          </Field>
          <Field label="Tagline">
            <input value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Master the Mysteries" style={inp} />
          </Field>
        </div>
        <Field label="Footer Text (copyright line)">
          <input value={form.footerText} onChange={e => set('footerText', e.target.value)} style={inp} />
        </Field>
        <Field label="Footer Brand Description">
          <textarea
            value={(form as any).footerDescription ?? ''}
            onChange={e => set('footerDescription' as any, e.target.value)}
            rows={2}
            placeholder="Ancient wisdom for the modern initiate..."
            style={{ ...inp, height: 'auto', resize: 'vertical' }}
          />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Field label="Email Opt-in Heading">
            <input
              value={(form as any).footerOptinHeading ?? ''}
              onChange={e => set('footerOptinHeading' as any, e.target.value)}
              placeholder="Stay in the Loop"
              style={inp}
            />
          </Field>
          <Field label="Opt-in Button Label">
            <input
              value={(form as any).footerOptinButtonLabel ?? ''}
              onChange={e => set('footerOptinButtonLabel' as any, e.target.value)}
              placeholder="Join Free"
              style={inp}
            />
          </Field>
        </div>
      </Section>

      <Section title="Logo & Favicon">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {(['logoUrl', 'faviconUrl'] as const).map(field => (
            <div key={field}>
              <label style={lbl}>{field === 'logoUrl' ? 'Logo' : 'Favicon'}</label>
              <div style={{ border: '2px dashed #e5e7eb', borderRadius: '10px', padding: '20px', textAlign: 'center', position: 'relative' }}>
                {form[field] ? (
                  <div>
                    <Image src={form[field]!} alt={field} width={field === 'faviconUrl' ? 48 : 120} height={48} style={{ objectFit: 'contain', margin: '0 auto 10px' }} />
                    <button onClick={() => set(field, null)} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>Remove</button>
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer' }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, field) }} />
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>{uploading === field ? '⏳' : '+'}</div>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{uploading === field ? 'Uploading…' : 'Click to upload'}</p>
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Colours">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { key: 'primaryColor' as const, label: 'Primary (brand)' },
            { key: 'accentColor'  as const, label: 'Accent (glow)'   },
          ].map(({ key, label }) => (
            <Field key={key} label={label}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="color" value={form[key]} onChange={e => set(key, e.target.value)}
                  style={{ width: '44px', height: '40px', padding: '2px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', background: 'white' }} />
                <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder="#7B2FBE" style={{ ...inp, flex: 1, fontFamily: 'monospace' }} />
              </div>
            </Field>
          ))}
        </div>
      </Section>

      <Section title="SEO">
        <Field label="Meta Title">
          <input value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)} style={inp} />
        </Field>
        <Field label="Meta Description">
          <textarea value={form.metaDescription} onChange={e => set('metaDescription', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} />
        </Field>
        <Field label="Google Analytics ID">
          <input value={form.googleAnalyticsId ?? ''} onChange={e => set('googleAnalyticsId', e.target.value || null)} placeholder="G-XXXXXXXXXX" style={inp} />
        </Field>
      </Section>

      <Section title="Social Links">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {SOCIAL_PLATFORMS.map(platform => (
            <Field key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}>
              <input
                value={(form.socialLinks as Record<string, string>)[platform] ?? ''}
                onChange={e => set('socialLinks', { ...form.socialLinks, [platform]: e.target.value })}
                placeholder={`https://${platform}.com/yourhandle`}
                style={inp}
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="Advanced">
        <Field label="Custom CSS">
          <textarea value={form.customCss ?? ''} onChange={e => set('customCss', e.target.value || null)} rows={5}
            placeholder="/* Custom CSS injected into all public pages */" style={{ ...inp, fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }} />
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.maintenanceMode} onChange={e => set('maintenanceMode', e.target.checked)} style={{ width: '16px', height: '16px' }} />
          <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Maintenance Mode (shows maintenance page to non-admins)</span>
        </label>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 24px' }}>
        <div>{error && <p style={{ fontSize: '14px', color: '#ef4444', margin: 0 }}>{error}</p>}</div>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '11px 28px', background: saved ? '#10b981' : saving ? '#e5e7eb' : '#7B2FBE', color: saved || !saving ? 'white' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', transition: 'background 0.2s' }}>
          {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Branding'}
        </button>
      </div>
    </div>
  )
}
