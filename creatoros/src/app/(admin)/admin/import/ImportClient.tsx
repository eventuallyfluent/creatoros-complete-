'use client'
import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Download, ExternalLink, X } from 'lucide-react'

interface ImportResult {
  course:    { id: string; slug: string; title: string }
  productId: string | null
  modules:   number
  lessons:   number
  skipped:   string[]
  warnings:  string[]
}

interface ParsedPreview {
  courseTitle: string
  courseSlug:  string
  modules:     { title: string; lessons: string[] }[]
  lessonCount: number
}

// ── CSV template content ──────────────────────────────────────────────────────
// All sales page fields are on the COURSE row only — MODULE and LESSON rows leave them blank
const TEMPLATE_CSV = `row_type,title,description,slug,status,price,compare_at_price,currency,thumbnail_url,sort_order,module_title,lesson_type,video_provider,video_id,video_url,aspect_ratio,duration_seconds,is_free,is_published,drip_days,headline,subheadline,problem,who_is_it_for,benefits,transformation,whats_included,curriculum_summary,instructor_bio,cta_text,cta_subtext,meta_description,certificate_enabled,reviewer_name,reviewer_email,rating,review_text,review_date,is_featured
COURSE,Introduction to Hermetics,The foundational principles of Western esoteric philosophy,introduction-to-hermetics,PUBLISHED,97,,GBP,https://example.com/course-thumbnail.jpg,,,,,,,,,,,,Ancient Wisdom for the Modern Initiate,A structured practical course in Hermetic philosophy,Most people have no clear starting point — scattered books and no coherent system,Anyone serious about Western esotericism who wants a structured foundation,Understand the seven principles - Apply Hermetic law to daily life - Read the Kybalion,Students leave with a working philosophical framework they can build on for life,12 video lessons - Downloadable workbook - Private community access,"Three modules: foundation philosophy, the seven principles, practical application",I have studied Hermetic philosophy for over 20 years and taught hundreds of students,Enrol Now,30-day money-back guarantee,Structured courses in Hermetic philosophy for serious students,false,,,,,,
MODULE,The Hermetic Foundation,,,,,,,,0,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
LESSON,Welcome & Course Overview,Introduction to the course,,,,,,,0,The Hermetic Foundation,VIDEO,STREAMABLE,YOUR_VIDEO_ID,,56.25,480,true,true,,,,,,,,,,,,,,,,,,,,
LESSON,What is Hermeticism?,History of the Hermetic tradition,,,,,,,1,The Hermetic Foundation,VIDEO,STREAMABLE,YOUR_VIDEO_ID,,56.25,1440,false,true,,,,,,,,,,,,,,,,,,,,
LESSON,The Kybalion — Text & Context,Reading and understanding the Kybalion,,,,,,,2,The Hermetic Foundation,VIDEO,STREAMABLE,YOUR_VIDEO_ID,,56.25,2160,false,true,,,,,,,,,,,,,,,,,,,,
MODULE,The Seven Principles,,,,,,,,1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
LESSON,Mentalism — All is Mind,The first Hermetic principle,,,,,,,0,The Seven Principles,VIDEO,STREAMABLE,YOUR_VIDEO_ID,,56.25,1800,false,true,,,,,,,,,,,,,,,,,,,,
LESSON,Correspondence — As Above So Below,The second principle,,,,,,,1,The Seven Principles,VIDEO,STREAMABLE,YOUR_VIDEO_ID,,56.25,1620,false,true,,,,,,,,,,,,,,,,,,,,
REVIEW,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,John Smith,john@example.com,5,This course completely changed how I understand esoteric philosophy. Highly structured and practical.,2024-01-15,true
REVIEW,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,Sarah Jones,sarah@example.com,5,Excellent course. Simon explains complex concepts clearly. Well worth the investment.,2024-02-20,false`

// ── Simple client-side CSV preview parser ────────────────────────────────────
function previewCsv(text: string): ParsedPreview | null {
  try {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
    if (lines.length < 2) return null

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const idx = (col: string) => headers.indexOf(col)

    const rows = lines.slice(1).map(line => {
      const vals = line.split(',')
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = (vals[i] ?? '').trim() })
      return row
    })

    const courseRow = rows.find(r => r.row_type?.toUpperCase() === 'COURSE')
    if (!courseRow) return null

    const slug = courseRow.slug || courseRow.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '?'

    // Build module → lessons map
    const moduleOrder: string[] = []
    const moduleLessons: Record<string, string[]> = {}

    for (const row of rows) {
      const type = row.row_type?.toUpperCase()
      if (type === 'MODULE') {
        moduleOrder.push(row.title)
        moduleLessons[row.title] = []
      }
    }

    for (const row of rows) {
      if (row.row_type?.toUpperCase() === 'LESSON') {
        const mod = row.module_title || moduleOrder[0] || 'Uncategorised'
        if (!moduleLessons[mod]) {
          moduleOrder.push(mod)
          moduleLessons[mod] = []
        }
        moduleLessons[mod].push(row.title)
      }
    }

    const modules = moduleOrder.map(title => ({ title, lessons: moduleLessons[title] ?? [] }))
    const lessonCount = modules.reduce((acc, m) => acc + m.lessons.length, 0)

    return { courseTitle: courseRow.title, courseSlug: slug, modules, lessonCount }
  } catch {
    return null
  }
}

export default function ImportClient() {
  const [file,      setFile]      = useState<File | null>(null)
  const [preview,   setPreview]   = useState<ParsedPreview | null>(null)
  const [overwrite, setOverwrite] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result,    setResult]    = useState<ImportResult | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [dragging,  setDragging]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.endsWith('.csv')) {
      setError('Please upload a .csv file.')
      return
    }
    setFile(f)
    setResult(null)
    setError(null)
    const text = await f.text()
    setPreview(previewCsv(text))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleImport = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    setResult(null)

    const form = new FormData()
    form.append('file', file)
    form.append('overwrite', String(overwrite))

    const res  = await fetch('/api/admin/import', { method: 'POST', body: form })
    const data = await res.json()
    setUploading(false)

    if (!res.ok) { setError(data.error ?? 'Import failed.'); return }
    setResult(data)
  }

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'creatoros-course-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setOverwrite(false)
  }

  const inp: React.CSSProperties = {
    background: 'white', border: '1px solid #e5e7eb',
    borderRadius: '8px', padding: '10px 14px',
    fontSize: '14px', color: '#111827',
    fontFamily: 'var(--font-ui)',
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div style={{ maxWidth: '600px' }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '14px', padding: '28px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <CheckCircle size={28} color="#16a34a" />
            <div>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#14532d', margin: 0 }}>Import successful</p>
              <p style={{ fontSize: '14px', color: '#166534', margin: 0 }}>{result.course.title}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
            {[
              { label: 'Modules',  value: result.modules },
              { label: 'Lessons',  value: result.lessons },
              { label: 'Reviews',  value: result.reviews ?? 0 },
              { label: 'Skipped',  value: result.skipped.length },
            ].map(stat => (
              <div key={stat.label}>
                <p style={{ fontSize: '28px', fontWeight: 800, color: '#14532d', margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: '12px', color: '#166534', margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {result.productId && (
              <a href={`/admin/products/${result.productId}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: '#16a34a', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                Edit Product <ExternalLink size={13} />
              </a>
            )}
            <a href={`/admin/products`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'white', color: '#166534', border: '1px solid #86efac', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              Go to Products
            </a>
            <a href={`/courses/${result.course.slug}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'white', color: '#166534', border: '1px solid #86efac', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              Preview Sales Page <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {result.warnings.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>Warnings</p>
            {result.warnings.map((w, i) => <p key={i} style={{ fontSize: '13px', color: '#92400e', margin: '2px 0' }}>· {w}</p>)}
          </div>
        )}

        {result.skipped.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b', marginBottom: '6px' }}>Skipped rows</p>
            {result.skipped.map((s, i) => <p key={i} style={{ fontSize: '13px', color: '#991b1b', margin: '2px 0' }}>· {s}</p>)}
          </div>
        )}

        <button onClick={reset} style={{ padding: '9px 18px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
          Import another course
        </button>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '680px' }}>
      {/* Template download */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 3px' }}>Download CSV template</p>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>One file per course. Includes an example with modules and Streamable lessons.</p>
        </div>
        <button onClick={downloadTemplate}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' }}>
          <Download size={13} /> Get Template
        </button>
      </div>

      {/* Drop zone */}
      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#7B2FBE' : '#d1d5db'}`,
            borderRadius: '14px',
            padding: '48px 32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(123,47,190,0.03)' : 'white',
            transition: 'all 0.15s',
            marginBottom: '16px',
          }}>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <Upload size={32} color={dragging ? '#7B2FBE' : '#9ca3af'} style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>
            {dragging ? 'Drop CSV here' : 'Drag & drop your CSV, or click to browse'}
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>One .csv file per course</p>
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
          {/* File header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={18} color="#7B2FBE" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{file.name}</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
              <X size={16} />
            </button>
          </div>

          {/* Preview */}
          {preview ? (
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px' }}>Course</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>{preview.courseTitle}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>/{preview.courseSlug}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px' }}>Modules</p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0 }}>{preview.modules.length}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px' }}>Lessons</p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0 }}>{preview.lessonCount}</p>
                </div>
              </div>

              {/* Module tree */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {preview.modules.map((mod, i) => (
                  <div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 14px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', margin: '0 0 4px' }}>
                      📁 {mod.title}
                    </p>
                    {mod.lessons.slice(0, 4).map((lesson, j) => (
                      <p key={j} style={{ fontSize: '12px', color: '#6b7280', margin: '1px 0 1px 16px' }}>
                        ▶ {lesson}
                      </p>
                    ))}
                    {mod.lessons.length > 4 && (
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '1px 0 1px 16px' }}>
                        +{mod.lessons.length - 4} more lessons
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                <AlertCircle size={16} />
                <p style={{ fontSize: '13px', margin: 0 }}>Could not preview — check the CSV has a COURSE row and correct headers.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '14px', color: '#991b1b', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Options + submit */}
      {file && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
            <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)}
              style={{ width: '15px', height: '15px', accentColor: '#7B2FBE' }} />
            Replace existing modules & lessons if course slug already exists
          </label>
          <button onClick={handleImport} disabled={uploading || !preview}
            style={{
              padding: '11px 28px', background: uploading ? '#e5e7eb' : '#7B2FBE',
              color: uploading ? '#9ca3af' : 'white',
              border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
              cursor: uploading || !preview ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-ui)',
            }}>
            {uploading ? 'Importing…' : 'Import Course'}
          </button>
        </div>
      )}

      {/* Column reference */}
      <div style={{ marginTop: '32px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#374151' }}>CSV column reference</p>
        </div>
        <div style={{ padding: '16px 18px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                {['Column', 'Used on', 'Notes'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: '#6b7280', fontWeight: 700, borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['row_type',         'all',      'COURSE, MODULE, or LESSON (required)'],
                ['title',            'all',      'Name of the course/module/lesson (required)'],
                ['description',      'all',      'Course subtitle, module desc, or TEXT lesson body'],
                ['sort_order',       'all',      'Integer — order within parent (0-based)'],
                ['module_title',     'LESSON',   'Must match exactly the MODULE title in this file'],
                ['lesson_type',      'LESSON',   'VIDEO, TEXT, EMBED (default: VIDEO)'],
                ['video_provider',   'LESSON',   'STREAMABLE, VIMEO, YOUTUBE (default: STREAMABLE)'],
                ['video_id',         'LESSON',   'Provider video ID — auto-extracted from URL if blank'],
                ['video_url',        'LESSON',   'Full embed URL — ID auto-extracted for known providers'],
                ['duration_seconds', 'LESSON',   'Integer seconds (e.g. 1800 = 30 min)'],
                ['is_free',          'LESSON',   'true/false — free preview lesson (default: false)'],
                ['is_published',     'all',      'true/false (default: true)'],
                ['drip_days',        'LESSON',   'Days after enrollment to unlock (blank = no drip)'],
                ['price',            'COURSE',   'Decimal e.g. 97 or 97.00'],
                ['compare_at_price', 'COURSE',   'Strike-through price e.g. 147'],
                ['currency',         'COURSE',   'USD, GBP, EUR etc. (default: USD)'],
                ['slug',             'COURSE',   'URL slug e.g. intro-to-hermetics (auto-generated if blank)'],
                ['status',           'COURSE',   'DRAFT or PUBLISHED (default: DRAFT)'],
                ['thumbnail_url',    'COURSE',   'Full URL to cover image — automatically saved to your storage'],
                ['headline',         'COURSE',   'Sales page hero headline'],
                ['subheadline',      'COURSE',   'Supporting statement below headline'],
                ['problem',          'COURSE',   'What problem does this course solve'],
                ['who_is_it_for',    'COURSE',   'Target audience description'],
                ['benefits',         'COURSE',   'One benefit per line or dash-separated'],
                ['transformation',   'COURSE',   'Outcome students experience'],
                ['whats_included',   'COURSE',   'Course contents, one item per line'],
                ['curriculum_summary','COURSE',  'Brief description of course structure'],
                ['instructor_bio',   'COURSE',   'Why you are the right person to teach this'],
                ['cta_text',         'COURSE',   'Button label e.g. Enrol Now'],
                ['cta_subtext',      'COURSE',   'Below-button text e.g. 30-day guarantee'],
                ['meta_description', 'COURSE',   'SEO description'],
                ['certificate_enabled','COURSE', 'true or false (default: false)'],
                ['reviewer_name',    'REVIEW',   'Display name of the reviewer'],
                ['reviewer_email',   'REVIEW',   'Required — used to create/find reviewer account'],
                ['rating',           'REVIEW',   '1 to 5 (default: 5)'],
                ['review_text',      'REVIEW',   'The review comment'],
                ['review_date',      'REVIEW',   'ISO date e.g. 2024-01-15 (blank = today)'],
                ['is_featured',      'REVIEW',   'true or false — featured reviews appear on sales page'],
              ].map(([col, used, notes]) => (
                <tr key={col}>
                  <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: '#7B2FBE', fontWeight: 600 }}>{col}</td>
                  <td style={{ padding: '5px 8px', color: '#6b7280' }}>{used}</td>
                  <td style={{ padding: '5px 8px', color: '#374151' }}>{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
