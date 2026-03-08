'use client'
import { useState, useEffect, useRef } from 'react'
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react'

interface MediaAsset {
  id:       string
  url:      string
  filename: string
  altText:  string | null
  width:    number | null
  height:   number | null
  size:     number
}

interface Props {
  value?:    string | null      // current mediaAssetId
  onChange:  (id: string | null, url: string | null) => void
  courseId?: string
  label?:    string
}

export default function MediaPicker({ value, onChange, courseId, label = 'Choose Image' }: Props) {
  const [open,       setOpen]       = useState(false)
  const [assets,     setAssets]     = useState<MediaAsset[]>([])
  const [loading,    setLoading]    = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [selected,   setSelected]   = useState<MediaAsset | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Load current asset info if value is set
  useEffect(() => {
    if (value && open) loadAssets()
    if (!value) setSelected(null)
  }, [value, open])

  const loadAssets = async () => {
    setLoading(true)
    const url = `/api/media${courseId ? `?courseId=${courseId}` : ''}`
    const res  = await fetch(url)
    const data = await res.json()
    setAssets(Array.isArray(data) ? data : [])
    if (value) {
      const current = data.find((a: MediaAsset) => a.id === value)
      if (current) setSelected(current)
    }
    setLoading(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError(null)

    const form = new FormData()
    form.append('file', file)
    if (courseId) form.append('courseId', courseId)

    const res  = await fetch('/api/media', { method: 'POST', body: form })
    const data = await res.json()
    setUploading(false)

    if (!res.ok) { setError(data.error ?? 'Upload failed'); return }

    setAssets(prev => [data, ...prev])
    handleSelect(data)
    e.target.value = ''
  }

  const handleSelect = (asset: MediaAsset) => {
    setSelected(asset)
    onChange(asset.id, asset.url)
    setOpen(false)
  }

  const handleClear = () => {
    setSelected(null)
    onChange(null, null)
  }

  return (
    <>
      {/* Trigger */}
      <div>
        {selected ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={selected.url} alt={selected.altText ?? selected.filename}
              style={{ width: '100%', maxWidth: '280px', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'block' }} />
            <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '4px' }}>
              <button onClick={() => { setOpen(true); loadAssets() }}
                style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                Change
              </button>
              <button onClick={handleClear}
                style={{ background: 'white', border: '1px solid #fecaca', borderRadius: '6px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}>
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setOpen(true); loadAssets() }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1px dashed #d1d5db', borderRadius: '8px', background: 'white', color: '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
            <ImageIcon size={14} /> {label}
          </button>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '720px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>Media BookOpen</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            {/* Upload area */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleUpload} style={{ display: 'none' }} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: uploading ? '#f3f4f6' : '#7B2FBE', color: uploading ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
                <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload Image'}
              </button>
              {error && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>{error}</p>}
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>JPG, PNG, WebP, GIF · Max 10 MB</p>
            </div>

            {/* Asset grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {loading ? (
                <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>Loading…</p>
              ) : assets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <ImageIcon size={40} style={{ color: '#e5e7eb', marginBottom: '12px' }} />
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>No images uploaded yet.</p>
                  <p style={{ color: '#d1d5db', fontSize: '12px' }}>Upload your first image above.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                  {assets.map(asset => (
                    <button key={asset.id} onClick={() => handleSelect(asset)}
                      style={{ position: 'relative', border: asset.id === value ? '2px solid #7B2FBE' : '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#f9fafb', cursor: 'pointer', padding: 0, aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={asset.url} alt={asset.altText ?? asset.filename}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {asset.id === value && (
                        <div style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: '#7B2FBE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={11} color="white" />
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '16px 6px 4px', fontSize: '10px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {asset.filename}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
