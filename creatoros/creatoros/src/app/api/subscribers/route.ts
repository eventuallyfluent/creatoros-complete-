export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { syncToEmailOctopus } from '@/lib/email/email-octopus'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId  = (session?.user as any)?.id

  let body: { email?: string; name?: string; source?: string; gdprConsent?: boolean }

  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    body = await req.json()
  } else {
    // Handle HTML form submission
    const formData = await req.formData()
    body = {
      email:       formData.get('email') as string,
      name:        formData.get('name') as string,
      source:      formData.get('source') as string,
      gdprConsent: formData.get('gdprConsent') === 'on',
    }
  }

  const { email, name, source, gdprConsent } = body

  if (!email || !email.includes('@')) {
    return redirect(source, 'invalid')
  }

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined

  // 1. Always save to CreatorOS DB first — we own this data regardless of provider
  try {
    await prisma.emailSubscriber.upsert({
      where:  { email },
      create: {
        email,
        name:          name ?? null,
        userId:        userId ?? null,
        source:        source ?? 'FOOTER',
        sourceUrl:     source,
        gdprConsent:   gdprConsent ?? false,
        gdprConsentAt: gdprConsent ? new Date() : undefined,
        gdprConsentIp: gdprConsent ? ip : undefined,
        status:        'SUBSCRIBED',
      },
      update: {
        // Don't overwrite existing GDPR consent with false
        ...(gdprConsent && {
          gdprConsent:   true,
          gdprConsentAt: new Date(),
          gdprConsentIp: ip,
        }),
        ...(name && { name }),
        status:         'SUBSCRIBED',
        unsubscribedAt: null,
      },
    })
  } catch (e) {
    // Subscriber already exists — that's fine
  }

  // 2. Fire-and-forget sync to EmailOctopus — failure here never blocks the user
  syncToEmailOctopus({ email, name, source }).catch(() => {
    // Silently fail — DB is source of truth
  })

  // Redirect back with success flag for form submissions
  if (contentType.includes('multipart') || contentType.includes('application/x-www-form-urlencoded')) {
    return redirect(source ?? '/', 'success')
  }

  return NextResponse.json({ success: true })
}

function redirect(source: string | undefined, status: string) {
  const base = source ?? '/'
  const sep  = base.includes('?') ? '&' : '?'
  return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${base}${sep}subscribed=${status}`, 303)
}
