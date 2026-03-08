export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { updateSiteSettings } from '@/lib/settings/site-settings'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body     = await req.json()
  const settings = await updateSiteSettings(body)
  return NextResponse.json(settings)
}
