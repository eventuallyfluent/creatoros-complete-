import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { sendEmail, renderBroadcastHtml } from '@/lib/email/email-service'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { to, subject, body } = await req.json()
  if (!to || !subject) return NextResponse.json({ error: 'to and subject required' }, { status: 400 })

  const bodyHtml = (body ?? '(empty)')
    .split('\n\n').map((p: string) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')

  const html = renderBroadcastHtml(`[TEST] ${subject}`, bodyHtml)

  const result = await sendEmail({ to, subject: `[TEST] ${subject}`, html })
  return NextResponse.json(result)
}
