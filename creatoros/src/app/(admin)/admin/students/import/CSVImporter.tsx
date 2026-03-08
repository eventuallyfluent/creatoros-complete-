'use client'
import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

interface Course { id: string; title: string; slug: string }

interface ParsedRow {
  email:   string
  name?:   string
  valid:   boolean
  error?:  string
}

interface Props { courses: Course[] }

export default function CSVImporter({ courses }: Props) {
  const fileRef      = useRef<HTMLInputElement>(null)
  const [rows,       setRows]       = useState<ParsedRow[]>([])
  const [filename,   setFilename]   = useState<string | null>(null)
  const [courseId,   setCourseId]   = useState(courses[0]?.id ?? '')
  const [importing,  setImporting]  = useState(false)
  const [result,     setResult]     = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [step,       setStep]       = useState<'upload' | 'preview' | 'done'>('upload')

  const handleFile = async (file: File) => {
    setFilename(file.name)
    const text = await file.text()
    const lines = text.trim().split('\n')
    if (lines.length < 2) { alert('CSV appears empty'); return }

    // Auto-detect header
    const header  = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
    const emailIdx = header.findIndex(h => h.includes('email'))
    const nameIdx  = header.findIndex(h => h.includes('name') || h.includes('first'))

    if (emailIdx === -1) { alert('Could not find email column. CSV must have an "email" header.'); return }

    const parsed: ParsedRow[] = lines.slice(1).map(line => {
      const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      const email = cells[emailIdx]?.toLowerCase().trim()
      const name  = nameIdx >= 0 ? cells[nameIdx]?.trim() : undefined

      if (!email || !email.includes('@')) {
        return { email: email ?? '', name, valid: false, error: 'Invalid email' }
      }
      return { email, name, valid: true }
    }).filter(r => r.email)

    setRows(parsed)
    setStep('preview')
  }

  const handleImport = async () => {
    if (!courseId) { alert('Please select a course'); return }
    setImporting(true)

    const validRows = rows.filter(r => r.valid)

    const res = await fetch('/api/csv-import', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        rows:     validRows.map(r => ({ email: r.email, name: r.name })),
        courseId,
      }),
    })

    const data = await res.json()
    setResult(data)
    setImporting(false)
    setStep('done')
  }

  const validCount   = rows.filter(r => r.valid).length
  const invalidCount = rows.filter(r => !r.valid).length

  if (step === 'done' && result) {
    return (
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '48px', textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
        <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Import Complete</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', margin: '24px 0' }}>
          <div>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>{result.imported}</p>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>Students imported</p>
          </div>
          <div>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>{result.skipped}</p>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>Already existed</p>
          </div>
          {result.errors.length > 0 && (
            <div>
              <p style={{ fontSize: '32px', fontWeight: 700, color: '#ef4444' }}>{result.errors.length}</p>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>Errors</p>
            </div>
          )}
        </div>
        {result.errors.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', textAlign: 'left', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', marginBottom: '6px' }}>Errors:</p>
            {result.errors.slice(0, 5).map((e, i) => (
              <p key={i} style={{ fontSize: '12px', color: '#dc2626' }}>{e}</p>
            ))}
          </div>
        )}
        <button
          onClick={() => { setStep('upload'); setRows([]); setFilename(null); setResult(null) }}
          style={{ padding: '10px 24px', background: '#7B2FBE', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
        >
          Import Another File
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '760px' }}>
      {/* Instructions */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1d4ed8', marginBottom: '6px' }}>📋 CSV Format</p>
        <p style={{ fontSize: '13px', color: '#1e40af', lineHeight: 1.6 }}>
          Your CSV must include an <strong>email</strong> column. Optional: <strong>name</strong> column.
          The first row must be a header row. Payhip member exports work directly — just download and upload.
        </p>
        <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '8px', fontFamily: 'monospace' }}>
          email,name<br />
          student@example.com,John Smith<br />
          another@example.com,Jane Doe
        </p>
      </div>

      {step === 'upload' && (
        <>
          {/* Course selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Enrol imported students in:
            </label>
            <select
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', background: 'white', outline: 'none', fontFamily: 'var(--font-ui)', minWidth: '320px' }}
            >
              <option value="">— Select a course (or skip enrolment) —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed #d1d5db', borderRadius: '12px',
              padding: '48px', textAlign: 'center', cursor: 'pointer',
              background: 'white', transition: 'all 0.15s',
            }}
            className="csv-drop-hover"
            onDragOver={e => { e.preventDefault() }}
            onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFile(file) }}
          >
            <Upload size={36} style={{ color: '#9ca3af', marginBottom: '12px' }} />
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Drop your CSV here or click to browse
            </p>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>Supports .csv files exported from Payhip or any platform</p>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
          <style>{`.csv-drop-hover:hover { border-color: #7B2FBE !important; background: rgba(123,47,190,0.02) !important; }`}</style>
        </>
      )}

      {step === 'preview' && (
        <div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            {/* Preview header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>{filename}</p>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{validCount} valid</span>
                  {invalidCount > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}> · {invalidCount} invalid</span>}
                </p>
              </div>
              <button onClick={() => { setStep('upload'); setRows([]) }} style={{ fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
                ← Choose different file
              </button>
            </div>

            {/* Preview table */}
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f9fafb' }}>
                  <tr>
                    {['', 'Email', 'Name', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 14px', width: '32px' }}>
                        {row.valid
                          ? <CheckCircle size={15} style={{ color: '#10b981' }} />
                          : <AlertCircle size={15} style={{ color: '#ef4444' }} />
                        }
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '13px', color: '#111827' }}>{row.email}</td>
                      <td style={{ padding: '10px 14px', fontSize: '13px', color: '#6b7280' }}>{row.name ?? '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: row.valid ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {row.valid ? 'Ready' : row.error}
                      </td>
                    </tr>
                  ))}
                  {rows.length > 100 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '12px 14px', fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>
                        … and {rows.length - 100} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Course selector for preview step */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 20px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>Enrol in:</label>
            <select
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              style={{ flex: 1, padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', background: 'white', outline: 'none', fontFamily: 'var(--font-ui)' }}
            >
              <option value="">— Create accounts only, no enrolment —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <button
            onClick={handleImport}
            disabled={importing || validCount === 0}
            style={{
              width: '100%', padding: '14px', background: importing || validCount === 0 ? '#e5e7eb' : '#7B2FBE',
              color: importing || validCount === 0 ? '#9ca3af' : 'white',
              border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 700,
              cursor: importing || validCount === 0 ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)',
            }}
          >
            {importing ? 'Importing...' : `Import ${validCount} Students${courseId ? ' & Enrol' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}
