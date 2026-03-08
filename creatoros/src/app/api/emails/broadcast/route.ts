export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { sendBroadcast, renderBroadcastHtml } from '@/lib/email/email-service'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { subject, body, audience } = await req.json()
  if (!subject?.trim()) return NextResponse.json({ error: 'Subject required' }, { status: 400 })
  if (!body?.trim())    return NextResponse.json({ error: 'Body required' },    { status: 400 })

  // Resolve recipients
  let emails: string[] = []

  if (audience === 'all_subscribers') {
    const subs = await prisma.emailSubscriber.findMany({
      where:  { status: 'SUBSCRIBED' },
      select: { email: true },
    })
    emails = subs.map(s => s.email)
  } else if (audience === 'all_students') {
    const users = await prisma.user.findMany({
      where:  { role: 'STUDENT' },
      select: { email: true },
    })
    emails = users.map(u => u.email)
  } else if (audience?.startsWith('course_')) {
    const courseId = audience.replace('course_', '')
    const enrollments = await prisma.enrollment.findMany({
      where:   { courseId, status: 'ACTIVE' },
      include: { user: { select: { email: true } } },
    })
    emails = enrollments.map(e => e.user.email)
  }

  if (emails.length === 0) return NextResponse.json({ error: 'No recipients in selected audience' }, { status: 400 })

  // Convert body markdown to HTML
  const bodyHtml = body
    .split('\n\n').map((p: string) => `<p>${p
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" style="color:#C084FC">$1</a>')
      .replace(/\n/g, '<br>')
    }</p>`).join('')

  const html = renderBroadcastHtml(subject, bodyHtml)

  // Send via Resend
  const results = await sendBroadcast(emails, subject, html)
  const succeeded = results.length > 0

  // Log to DB (one record per broadcast send)
  await prisma.emailLog.create({
    data: {
      to:      `${emails.length} recipients (${audience})`,
      subject,
      type:    'MARKETING',
      status:  succeeded ? 'SENT' : 'FAILED',
    },
  })

  return NextResponse.json({ sent: emails.length, success: succeeded })
}
