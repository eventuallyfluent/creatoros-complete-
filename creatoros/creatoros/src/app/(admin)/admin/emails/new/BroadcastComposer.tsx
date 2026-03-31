'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'

interface Course { id: string; title: string }

interface Props {
  subscriberCount: number
  courses:         Course[]
}

type Audience = 'all_subscribers' | 'all_students' | `course_${string}`

export default function BroadcastComposer({ subscriberCount, courses }: Props) {
  const router = useRouter()

  const [subject,   setSubject]   = useState('')
  const [body,      setBody]      = useState('')
  const [audience,  setAudience]  = useState<Audience>('all_subscribers')
  const [preview,   setPreview]   = useState(false)
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [testSent,  setTestSent]  = useState(false)

  // Simple markdown-to-html (bold, italic, links, paragraphs)
  const renderPreview = (text: string) => {
    return text
      .split('\n\n').map(p => `<p>${p
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\n/g, '<br>')
      }</p>`).join('')
  }

  const handleSendTest = async () => {
    if (!testEmail || !subject) return
    await fetch('/api/emails/send-test', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ to: testEmail, subject, body }),
    })
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  const handleSend = async () => {
    if (!subject.trim()) { setError('Subject is required'); return }
    if (!body.trim())    { setError('Email body is required'); return }
    if (!confirm(`Send to ${audience === 'all_subscribers' ? `${subscriberCount} subscribers` : 'selected audience'}? This cannot be undone.`)) return

    setSending(true); setError(null)
    const res  = await fetch('/api/emails/broadcast', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ subject, body, audience }),
    })
    const data = await res.json()
    setSending(false)

    if (!res.ok) { setError(data.error ?? 'Send failed'); return }
    setSent(true)
    setTimeout(() => router.push('/admin/emails'), 2000)
  }

  if (sent) {
    return (
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '48px', textAlign: 'center', maxWidth: '560px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>✉️</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Broadcast sent!</h2>
        <p style={{ color: '#6b7280' }}>Redirecting to email log…</p>
      </div>
    )
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827', outline: 'none', fontFamily: 'var(--font-ui)', background: '#f9fafb' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', maxWidth: '1000px', alignItems: 'start' }}>

      {/* Composer */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '18px' }}>
            <label style={lbl}>Audience</label>
            <select value={audience} onChange={e => setAudience(e.target.value as Audience)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="all_subscribers">All subscribers ({subscriberCount})</option>
              <option value="all_students">All enrolled students</option>
              {courses.map(c => <option key={c.id} value={`course_${c.id}`}>Students in: {c.title}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={lbl}>Subject *</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Your email subject line" style={inp} />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={lbl}>Body *</label>
              <button type="button" onClick={() => setPreview(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#7B2FBE', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                <Eye size={13} /> {preview ? 'Edit' : 'Preview'}
              </button>
            </div>

            {preview ? (
              <div style={{ minHeight: '240px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', fontSize: '15px', color: '#374151', lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: renderPreview(body) || '<em style="color:#9ca3af">Nothing to preview yet…</em>' }}
              />
            ) : (
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={12}
                placeholder={`Write your email here.\n\nSupports basic formatting:\n**bold**, *italic*, [link text](https://url.com)\n\nLeave a blank line between paragraphs.`}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
            )}
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>Supports **bold**, *italic*, and [link](url) syntax.</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>{error && <p style={{ fontSize: '13px', color: '#ef4444' }}>{error}</p>}</div>
          <button onClick={handleSend} disabled={sending || !subject || !body}
            style={{ padding: '10px 24px', background: sending || !subject || !body ? '#e5e7eb' : '#7B2FBE', color: sending || !subject || !body ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: sending || !subject || !body ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)' }}>
            {sending ? 'Sending…' : 'Send Broadcast'}
          </button>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Send test */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Send Test Email</h3>
          <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="your@email.com" style={{ ...inp, marginBottom: '10px' }} />
          <button onClick={handleSendTest} disabled={!testEmail || !subject}
            style={{ width: '100%', padding: '9px', background: 'white', color: '#7B2FBE', border: '1px solid rgba(123,47,190,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
            {testSent ? '✓ Test sent!' : 'Send Test →'}
          </button>
        </div>

        {/* Tips */}
        <div style={{ background: '#f8f4ff', border: '1px solid rgba(123,47,190,0.2)', borderRadius: '12px', padding: '18px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#7B2FBE', marginBottom: '10px' }}>✦ Tips</h3>
          <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '13px', color: '#374151', lineHeight: 1.8 }}>
            <li>Keep subject under 50 characters</li>
            <li>Open with a personal greeting</li>
            <li>One clear call-to-action per email</li>
            <li>Always send a test before broadcasting</li>
            <li>Best time: Tuesday–Thursday, 9–11am</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
