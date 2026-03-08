import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { updateSiteSettings } from '@/lib/settings/site-settings'

const HOMEPAGE_KEYS = [
  'heroEyebrow', 'heroHeadline', 'heroSubtext',
  'heroPrimaryLabel', 'heroPrimaryHref',
  'heroSecondaryLabel', 'heroSecondaryHref',
  'heroBadges', 'featuredCourseIds',
  'showEmailOptin', 'emailOptinHeadline', 'emailOptinSubtext',
  'homepageSections',
] as const

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Only allow homepage-related keys through this endpoint
  const updates: Record<string, any> = {}
  for (const key of HOMEPAGE_KEYS) {
    if (key in body) updates[key] = body[key]
  }

  const settings = await updateSiteSettings(updates as any)
  return NextResponse.json(settings)
}
