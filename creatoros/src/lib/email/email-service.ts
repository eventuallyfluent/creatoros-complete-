import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  return _resend
}

const FROM   = process.env.EMAIL_FROM ?? 'Perseus Arcane Academy <noreply@perseusarcaneacademy.com>'

export interface SendEmailOptions {
  to:       string | string[]
  subject:  string
  html:     string
  replyTo?: string
  tags?:    { name: string; value: string }[]
}

export interface SendEmailResult {
  id:      string | null
  success: boolean
  error?:  string
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const result = await getResend().emails.send({
      from:    FROM,
      to:      Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html:    opts.html,
      replyTo: opts.replyTo,
      tags:    opts.tags,
    })
    return { id: result.data?.id ?? null, success: !result.error, error: result.error?.message }
  } catch (err: any) {
    console.error('sendEmail error:', err)
    return { id: null, success: false, error: err.message }
  }
}

// ── Transactional wrappers ────────────────────────────
export async function sendWelcomeEmail(to: string, name: string, productTitle: string, courseSlug: string) {
  const courseTitle = productTitle
  return sendEmail({
    to, subject: `Welcome to ${productTitle} ✶`,
    html: welcomeTemplate({ name, courseTitle, courseSlug }),
    tags: [{ name: 'type', value: 'welcome' }],
  })
}

export async function sendReviewInviteEmail(to: string, name: string, courseTitle: string, courseSlug: string) {
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const reviewUrl = `${appUrl}/portal/courses/${courseSlug}/review`
  return sendEmail({
    to, subject: `How was ${courseTitle}? We'd love your review`,
    html: baseTemplate(`
      <h1>How was the course, ${name}?</h1>
      <p>You've completed <strong style="color:#F0EAF8">${courseTitle}</strong>. We hope it was everything you were looking for.</p>
      <p>If you have a moment, sharing your experience helps other students decide whether this course is right for them — and it means a great deal to the instructor.</p>
      <p style="text-align:center">
        <a href="${reviewUrl}" class="btn">Leave a Review →</a>
      </p>
      <p>Only your first name is shown publicly. Reviews are moderated before appearing on the course page.</p>
      <p>If you have any questions or feedback for us directly, just reply to this email.</p>
    `),
    tags: [{ name: 'type', value: 'review_invite' }],
  })
}

export async function sendBroadcast(recipients: string[], subject: string, html: string) {
  // Resend supports batch sends — chunk into 100s
  const chunks = chunk(recipients, 100)
  const results: unknown[] = []
  for (const batch of chunks) {
    const result = await getResend().batch.send(
      batch.map(to => ({ from: FROM, to, subject, html }))
    )
    results.push(result)
  }
  return results
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// ── Email templates ─────────────────────────────────
function baseTemplate(content: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin:0; padding:0; background:#0D0D1A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width:560px; margin:0 auto; padding:40px 20px; }
    .card { background:#16162A; border:1px solid rgba(240,234,248,0.08); border-radius:16px; overflow:hidden; }
    .header { background:linear-gradient(135deg,#1A0A2E,#2D1045); padding:32px; text-align:center; }
    .logo { font-family:serif; font-size:11px; color:rgba(240,234,248,0.4); letter-spacing:0.15em; text-transform:uppercase; }
    .body { padding:32px; }
    h1 { color:#F0EAF8; font-size:22px; font-weight:700; margin:0 0 16px; line-height:1.3; }
    p { color:#A89BC2; font-size:15px; line-height:1.7; margin:0 0 16px; }
    .btn { display:inline-block; background:#7B2FBE; color:#ffffff !important; padding:13px 28px; border-radius:8px; font-weight:700; font-size:15px; text-decoration:none; margin:8px 0; }
    .footer { padding:20px 32px; border-top:1px solid rgba(240,234,248,0.06); text-align:center; }
    .footer p { font-size:12px; color:rgba(168,155,194,0.5); margin:0; }
    a { color:#C084FC; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">✶ Perseus Arcane Academy</div>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p>Perseus Arcane Academy &middot; <a href="${appUrl}">perseusarcaneacademy.com</a><br>
        To stop receiving these emails, reply with &ldquo;unsubscribe&rdquo;.</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

function welcomeTemplate({ name, courseTitle, courseSlug }: { name: string; courseTitle: string; courseSlug: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  return baseTemplate(`
    <h1>Welcome, ${name} ✶</h1>
    <p>Your enrolment in <strong style="color:#F0EAF8">${courseTitle}</strong> is confirmed. Your journey into the arcane begins now.</p>
    <p style="text-align:center">
      <a href="${appUrl}/portal/courses/${courseSlug}" class="btn">Begin Your Course →</a>
    </p>
    <p>If you have any questions, simply reply to this email.</p>
  `)
}

export function renderBroadcastHtml(subject: string, bodyHtml: string) {
  return baseTemplate(`<h1>${subject}</h1>${bodyHtml}`)
}

export { baseTemplate }
