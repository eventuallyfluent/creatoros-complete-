'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SiteSettings } from '@/lib/settings/site-settings'

interface Props { settings: SiteSettings }

export default function SettingsEditor({ settings }: Props) {
  const router  = useRouter()
  const [form,   setForm]   = useState({ ...settings })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const set = (key: keyof SiteSettings, val: any) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    setSaving(true); setError(null)
    const res  = await fetch('/api/settings/branding', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    setSaved(true); setTimeout(() => setSaved(false), 2500)
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

  return (
    <div style={{ maxWidth: '600px' }}>
      <Section title="Access">
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', border: form.maintenanceMode ? '1px solid #fca5a5' : '1px solid #e5e7eb', borderRadius: '8px', background: form.maintenanceMode ? '#fff5f5' : 'white', transition: 'all 0.15s' }}>
          <input type="checkbox" checked={form.maintenanceMode} onChange={e => set('maintenanceMode', e.target.checked)} style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 3px' }}>Maintenance Mode</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Non-admin visitors see a maintenance page. Admins can still access everything.</p>
          </div>
        </label>
      </Section>

      <Section title="Custom Code">
        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Custom &lt;head&gt; HTML</label>
          <textarea value={form.customHeadHtml ?? ''} onChange={e => set('customHeadHtml', e.target.value || null)} rows={4}
            placeholder="<!-- Analytics scripts, custom fonts, etc. -->" style={{ ...inp, fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }} />
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Injected into &lt;head&gt; on all public pages.</p>
        </div>
        <div>
          <label style={lbl}>Custom CSS</label>
          <textarea value={form.customCss ?? ''} onChange={e => set('customCss', e.target.value || null)} rows={6}
            placeholder="/* Override any styles */" style={{ ...inp, fontFamily: 'monospace', fontSize: '13px', resize: 'vertical' }} />
        </div>
      </Section>

      <Section title="Analytics">
        <div>
          <label style={lbl}>Google Analytics Measurement ID</label>
          <input value={form.googleAnalyticsId ?? ''} onChange={e => set('googleAnalyticsId', e.target.value || null)} placeholder="G-XXXXXXXXXX" style={inp} />
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Leave blank to disable. Find this in Google Analytics → Admin → Data streams.</p>
        </div>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>{error && <p style={{ fontSize: '14px', color: '#ef4444', margin: 0 }}>{error}</p>}</div>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '11px 28px', background: saved ? '#10b981' : saving ? '#e5e7eb' : '#7B2FBE', color: saved || !saving ? 'white' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', transition: 'background 0.2s' }}>
          {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
