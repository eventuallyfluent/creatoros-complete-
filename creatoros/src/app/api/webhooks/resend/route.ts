import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Resend sends webhook events to this endpoint
// Configure in Resend dashboard: https://resend.com/webhooks
// Events: email.bounced, email.complained, email.delivered, email.opened, email.clicked

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const { type, data } = payload

  try {
    if (type === 'email.bounced') {
      const email = data?.to?.[0]
      if (email) {
        await prisma.emailSubscriber.updateMany({
          where: { email },
          data:  { status: 'BOUNCED' },
        })
        await prisma.emailLog.updateMany({
          where: { to: email, status: 'SENT' },
          data:  { status: 'BOUNCED' },
        })
      }
    }

    if (type === 'email.complained') {
      const email = data?.to?.[0]
      if (email) {
        // Spam complaint — unsubscribe immediately (legal requirement)
        await prisma.emailSubscriber.updateMany({
          where: { email },
          data:  { status: 'COMPLAINED' },
        })
      }
    }

    if (type === 'email.delivery_delayed') {
      // Log but don't act — Resend will retry
      console.warn('Email delivery delayed:', data?.email_id)
    }

  } catch (err) {
    console.error('Resend webhook error:', err)
  }

  // Always return 200 — Resend retries on non-2xx
  return NextResponse.json({ received: true })
}
