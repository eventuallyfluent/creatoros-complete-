export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest)  {
  try {

  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const subscribers = await prisma.emailSubscriber.findMany({
    where:   { status: 'SUBSCRIBED' },
    orderBy: { subscribedAt: 'desc' },
    select:  { email: true, status: true, source: true, gdprConsent: true, subscribedAt: true },
  })

  const header = 'email,status,source,gdpr_consent,subscribed_at'
  const rows   = subscribers.map(s =>
    [s.email, s.status, s.source ?? '', s.gdprConsent ? 'yes' : 'no', s.subscribedAt.toISOString()].join(',')
  )
  const csv = [header, ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv',
      'Content-Disposition': `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}  } catch (error: any) {
    console.error('Route error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}