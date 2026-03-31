'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'

interface Props {
  value:        string | null | undefined
  onChange:     (url: string | null) => void
  label?:       string
  hint?:        string
  aspectRatio?: string   // e.g. '16/9', '4/3', '1/1'
  folder?:      string   // supabase storage folder
  maxSizeMB?:   number
}

export default function ImageUpload({
  value,
  onChange,
  label       = 'Image',
  hint        = 'JPG, PNG or WebP · max 5MB',
  aspectRatio = '16/9',
  folder      = 'uploads',
  maxSizeMB   = 5,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    if (file.size > maxSizeMB * 1024 * 1024) { setError(`Image must be under ${maxSizeMB}MB`); return }
    setUploading(true); setError(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)
    const res  = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (res.ok && data.url) {
      onChange(data.url)
    } else {
      setError(data.error ?? 'Upload failed. Check Supabase storage is configured.')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280',
    marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && <label style={lbl}>{label}</label>}

      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          width: '100%', aspectRatio, background: value ? undefined : '#f9fafb',
          border: `2px dashed ${error ? '#fca5a5' : '#e5e7eb'}`,
          borderRadius: '10px', overflow: 'hidden', cursor: uploading ? 'wait' : 'pointer',
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.15s',
        }}
        className="image-upload-dropzone"
      >
        {value ? (
          <>
            <Image src={value} alt={label} fill style={{ objectFit: 'cover' }} />
            {/* Hover overlay */}
            <div className="image-upload-overlay" style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.15s',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>
                {uploading ? 'Uploading…' : 'Click to replace'}
              </span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', pointerEvents: 'none' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🖼️</div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: 500 }}>
              {uploading ? 'Uploading…' : 'Click or drag to upload'}
            </p>
            <p style={{ fontSize: '11px', color: '#9ca3af' }}>{hint}</p>
          </div>
        )}
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '13px', color: '#7B2FBE', fontWeight: 600 }}>Uploading…</span>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {error && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px' }}>{error}</p>}

      {value && !uploading && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            Remove
          </button>
        </div>
      )}

      <style>{`
        .image-upload-dropzone:hover { border-color: #7B2FBE !important; }
        .image-upload-dropzone:hover .image-upload-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
