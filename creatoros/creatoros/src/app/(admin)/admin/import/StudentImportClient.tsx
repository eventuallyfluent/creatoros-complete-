'use client'
import { useState, useRef, useCallback } from 'react'
import { Upload, CheckCircle, AlertCircle, Download, X, AlertTriangle } from 'lucide-react'

interface DownloadResult {
  total:     number
  created:   number
  enrolled:  number
  skipped:   number
  unmatched: string[]
  errors:    string[]
}

const PAYHIP_TEMPLATE = `email,name,course_title,enrolled_at
john.doe@example.com,John Doe,Sixty Skills - Level 1,2024-01-15
jane.smith@example.com,Jane Smith,Master Course,2024-02-20
alice@example.com,,Sixty Skills Kabbalah,2023-11-05
`

const CUSTOM_TEMPLATE = `email,name,course_slug,enrolled_at
john.doe@example.com,John Doe,sixty-skills-level-1,2024-01-15
jane.smith@example.com,Jane Smith,master-course,2024-02-20
`

export default function StudentDownloadClient() {
  const fileRef  = useRef<HTMLInputElement>(null)
  const [file,        setFile]        = useState<File | null>(null)
  const [csv,         setCsv]         = useState<string>('')
  const [preview,     setPreview]     = useState<{ rows: number; emails: string[] } | null>(null)
  const [dryRun,      setDryRun]      = useState(true)
  const [running,     setRunning]     = useState(false)
  const [result,      setResult]      = useState<DownloadResult | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const [dragging,    setDragging]    = useState(false)

  const readFile = (f: File) => {
    if (!f.name.endsWith('.csv') && f.type !== 'text/csv') {
      setError('Please upload a .csv file'); return
    }
    setFile(f); setResult(null); setError(null)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      setCsv(text)
      // Quick preview parse
      const lines = text.trim().split('\n').filter(l => l.trim())
      const headers = lines[0].toLowerCase()
      const emailIdx = headers.split(',').findIndex(h => h.includes('email'))
      const dataLines = lines.slice(1)
      const emails = dataLines
        .map(l => l.split(',')[emailIdx]?.replace(/"/g,'').trim())
        .filter(Boolean)
        .slice(0, 5)
      setPreview({ rows: dataLines.length, emails })
    }
    reader.readAsText(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) readFile(f)
  }, [])

  const handleRun = async () => {
    if (!csv) return
    setRunning(true); setError(null); setResult(null)
    const res  = await fetch('/api/admin/import/students', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ csv, dryRun }),
    })
    const data = await res.json()
    setRunning(false)
    if (!res.ok) { setError(data.error ?? 'Download failed'); return }
    setResult(data)
  }

  const reset = () => { setFile(null); setCsv(''); setPreview(null); setResult(null); setError(null) }
  const dl = (content: string, name: string) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }))
    a.download = name; a.click()
  }

  return (
    <div style={{ maxWidth: '780px' }}>

      {/* Intro */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'flex', gap: '10px' }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
          <strong>Migrating from Payhip?</strong> Export your orders from Payhip (Dashboard → Sales → Export CSV).
          The importer accepts Payhip's format directly — it matches students to courses by product title automatically.
          Run a <strong>dry run first</strong> to preview results before writing anything to the database.
        </div>
      </div>

      {/* Template downloads */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => dl(PAYHIP_TEMPLATE, 'payhip-format-example.csv')}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: '#374151', fontFamily: 'var(--font-ui)' }}>
          <Download size={14} /> Payhip format example
        </button>
        <button onClick={() => dl(CUSTOM_TEMPLATE, 'custom-format-example.csv')}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: '#374151', fontFamily: 'var(--font-ui)' }}>
          <Download size={14} /> Custom format example
        </button>
      </div>

      {/* Drop zone */}
      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#7B2FBE' : '#d1d5db'}`,
            borderRadius: '12px', padding: '48px', textAlign: 'center',
            cursor: 'pointer', background: dragging ? '#faf5ff' : 'white',
            transition: 'all 0.15s', marginBottom: '20px',
          }}
        >
          <Upload size={32} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
            Drop your CSV here or click to browse
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>Payhip export or custom CSV</p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && readFile(e.target.files[0])} />
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <CheckCircle size={16} color="#10b981" />
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{file.name}</p>
            </div>
            {preview && (
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                {preview.rows} student row{preview.rows !== 1 ? 's' : ''} detected
                {preview.emails.length > 0 && ` — e.g. ${preview.emails.slice(0,3).join(', ')}${preview.emails.length > 3 ? '…' : ''}`}
              </p>
            )}
          </div>
          <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}><X size={16} /></button>
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '14px', color: '#991b1b', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Controls */}
      {file && !result && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#7B2FBE' }} />
            <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>Dry run — preview only, no changes saved</span>
          </label>
          <button onClick={handleRun} disabled={running}
            style={{ padding: '11px 28px', background: running ? '#e5e7eb' : dryRun ? '#4f46e5' : '#7B2FBE', color: running ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
            {running ? 'Running…' : dryRun ? 'Run Dry Run →' : 'Download Students →'}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Total rows',   value: result.total,    color: '#374151', bg: '#f9fafb' },
              { label: dryRun ? 'Would enrol' : 'Enrolled',   value: result.enrolled, color: '#065f46', bg: '#f0fdf4' },
              { label: 'New accounts', value: result.created,  color: '#1e40af', bg: '#eff6ff' },
              { label: 'Skipped',      value: result.skipped,  color: '#92400e', bg: '#fffbeb' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '28px', fontWeight: 800, color, margin: '0 0 4px' }}>{value}</p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              </div>
            ))}
          </div>

          {dryRun && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertTriangle size={16} color="#1d4ed8" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>
                This was a dry run — no data was saved. Uncheck "Dry run" and click Download to apply these changes.
              </p>
            </div>
          )}

          {result.unmatched.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #fcd34d', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#fffbeb', borderBottom: '1px solid #fcd34d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={14} color="#d97706" />
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', margin: 0 }}>
                  {result.unmatched.length} row{result.unmatched.length !== 1 ? 's' : ''} could not be matched to a course
                </p>
              </div>
              <div style={{ padding: '12px 16px', maxHeight: '200px', overflowY: 'auto' }}>
                {result.unmatched.map((msg, i) => (
                  <p key={i} style={{ fontSize: '12px', fontFamily: 'monospace', color: '#374151', margin: '3px 0' }}>{msg}</p>
                ))}
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid #fef3c7', background: '#fffbeb' }}>
                <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
                  Fix these rows by adding a <code>course_slug</code> column with the exact URL slug of the course (e.g. <code>sixty-skills-level-1</code>).
                </p>
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#fef2f2', borderBottom: '1px solid #fca5a5' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b', margin: 0 }}>{result.errors.length} error{result.errors.length !== 1 ? 's' : ''}</p>
              </div>
              <div style={{ padding: '12px 16px' }}>
                {result.errors.map((msg, i) => (
                  <p key={i} style={{ fontSize: '12px', fontFamily: 'monospace', color: '#991b1b', margin: '3px 0' }}>{msg}</p>
                ))}
              </div>
            </div>
          )}

          {!dryRun && result.enrolled > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '14px 18px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#166534', margin: 0 }}>
                <strong>{result.enrolled} student{result.enrolled !== 1 ? 's' : ''} enrolled successfully.</strong> They can now log in using their email address via the magic link login.
              </p>
            </div>
          )}

          <button onClick={reset} style={{ alignSelf: 'flex-start', padding: '9px 20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', color: '#374151', fontFamily: 'var(--font-ui)' }}>
            Download another file
          </button>
        </div>
      )}

      {/* Column reference */}
      <div style={{ marginTop: '32px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151' }}>Accepted column names</p>
        </div>
        <div style={{ padding: '16px 18px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>{['Column', 'Required', 'Notes'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: '#6b7280', fontWeight: 700, borderBottom: '1px solid #f3f4f6' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {[
                ['email / buyer_email',         '✓ Yes', 'Student\'s email address'],
                ['name / buyer_name',            'No',    'Full name — stored if account is new'],
                ['course_title / product_title', 'One of', 'Matched against your product/course titles (fuzzy)'],
                ['course_slug / product_slug',   'One of', 'Exact URL slug — most reliable, no fuzzy matching'],
                ['enrolled_at / sale_date',      'No',    'ISO date e.g. 2024-01-15 — defaults to today'],
              ].map(([col, req, notes]) => (
                <tr key={col}>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: '#7B2FBE', fontWeight: 600, fontSize: '11px' }}>{col}</td>
                  <td style={{ padding: '6px 8px', color: req === '✓ Yes' ? '#065f46' : '#6b7280', fontWeight: req === '✓ Yes' ? 600 : 400 }}>{req}</td>
                  <td style={{ padding: '6px 8px', color: '#374151' }}>{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
