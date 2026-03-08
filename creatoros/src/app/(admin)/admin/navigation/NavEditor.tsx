'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GripVertical, Trash2, Plus } from 'lucide-react'

interface NavItem { label: string; href: string }

interface Props {
  headerNav: NavItem[]
  footerNav:  NavItem[]
}

function NavList({
  items,
  onChange,
  title,
  hint,
}: {
  items:    NavItem[]
  onChange: (items: NavItem[]) => void
  title:    string
  hint:     string
}) {
  const add    = () => onChange([...items, { label: '', href: '' }])
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const update = (i: number, field: keyof NavItem, val: string) =>
    onChange(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const inp: React.CSSProperties = {
    padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: '7px',
    fontSize: '14px', color: '#111827', outline: 'none',
    fontFamily: 'var(--font-ui)', background: '#f9fafb',
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827' }}>{title}</h3>
        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>{hint}</p>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {items.length === 0 && (
          <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>No links yet.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: items.length ? '12px' : 0 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GripVertical size={16} style={{ color: '#d1d5db', flexShrink: 0, cursor: 'grab' }} />
              <input
                value={item.label}
                onChange={e => update(i, 'label', e.target.value)}
                placeholder="Label"
                style={{ ...inp, width: '160px', flexShrink: 0 }}
              />
              <input
                value={item.href}
                onChange={e => update(i, 'href', e.target.value)}
                placeholder="/path or https://..."
                style={{ ...inp, flex: 1 }}
              />
              <button
                onClick={() => remove(i)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #fecaca', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={add}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'white', border: '1px dashed #d1d5db', borderRadius: '7px', fontSize: '13px', fontWeight: 600, color: '#7B2FBE', cursor: 'pointer', fontFamily: 'var(--font-ui)', transition: 'border-color 0.15s' }}
          className="add-link-hover"
        >
          <Plus size={14} /> Add Link
        </button>
      </div>
      <style>{`.add-link-hover:hover { border-color: #7B2FBE !important; }`}</style>
    </div>
  )
}

export default function NavEditor({ headerNav: initHeader, footerNav: initFooter }: Props) {
  const router  = useRouter()
  const [header,  setHeader]  = useState<NavItem[]>(initHeader)
  const [footer,  setFooter]  = useState<NavItem[]>(initFooter)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true); setError(null)
    const res  = await fetch('/api/settings/navigation', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ headerNav: header, footerNav: footer }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    setSaved(true); setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <NavList
        items={header} onChange={setHeader}
        title="Header Navigation"
        hint="Shown in the top navbar on all public pages"
      />
      <NavList
        items={footer} onChange={setFooter}
        title="Footer Navigation"
        hint="Shown in the bottom footer on all public pages"
      />

      {/* Preview */}
      <div style={{ background: '#f8f4ff', border: '1px solid rgba(123,47,190,0.2)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#7B2FBE', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Header Preview</p>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {header.map((item, i) => (
            <span key={i} style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{item.label || '(unnamed)'}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>{error && <p style={{ fontSize: '14px', color: '#ef4444', margin: 0 }}>{error}</p>}</div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '11px 28px', background: saved ? '#10b981' : saving ? '#e5e7eb' : '#7B2FBE', color: saved || !saving ? 'white' : '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', transition: 'background 0.2s' }}
        >
          {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Navigation'}
        </button>
      </div>
    </div>
  )
}
