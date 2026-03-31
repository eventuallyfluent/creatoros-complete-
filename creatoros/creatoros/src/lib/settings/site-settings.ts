import { prisma } from '@/lib/db/prisma'
import { cache } from 'react'

export interface SiteSettings {
  siteName:          string
  tagline:           string
  logoUrl:           string | null  // legacy fallback
  logoDarkUrl:       string | null  // logo for dark theme
  logoLightUrl:      string | null  // logo for light theme
  faviconUrl:        string | null
  primaryColor:      string
  accentColor:       string
  footerText:              string
  footerDescription:       string
  footerOptinHeading:      string
  footerOptinButtonLabel:  string
  socialLinks:             Record<string, string>
  metaTitle:         string
  metaDescription:   string
  googleAnalyticsId: string | null
  customHeadHtml:    string | null
  customCss:         string | null
  maintenanceMode:   boolean
  headerNav:         { label: string; href: string }[]
  footerNav:         { label: string; href: string }[]

  themeVariant: 'dark' | 'light'

  // Homepage content
  heroEyebrow:          string
  heroHeadline:         string
  heroSubtext:          string
  heroPrimaryLabel:     string
  heroPrimaryHref:      string
  heroSecondaryLabel:   string
  heroSecondaryHref:    string
  heroBadges:           string[]
  heroImageUrl:         string | null
  featuredCourseIds:    string[]
  coursesDisplayMode:   'all' | 'featured' | 'collections'
  collectionsLabel:     string
  collectionsDisplayStyle: 'covers' | 'cards'
  showEmailOptin:       boolean
  emailOptinHeadline:   string
  emailOptinSubtext:    string
  homepageSections:     HomepageSection[]
}

export interface HomepageSection {
  id:      string
  type:    'text' | 'testimonials' | 'divider'
  heading?: string
  body?:    string
  items?:   { name: string; quote: string; role?: string }[]
}

const DEFAULTS: SiteSettings = {
  siteName:          'Perseus Arcane Academy',
  tagline:           'Master the Mysteries',
  logoUrl:           null,
  logoDarkUrl:       null,
  logoLightUrl:      null,
  faviconUrl:        null,
  primaryColor:      '#7B2FBE',
  accentColor:       '#C084FC',
  footerText:             '© Perseus Arcane Academy. All rights reserved.',
  footerDescription:      'Ancient wisdom for the modern initiate. Structured courses in Hermetics, esoteric traditions, and martial arts.',
  footerOptinHeading:     'Stay in the Loop',
  footerOptinButtonLabel: 'Join Free',
  socialLinks:            {},
  metaTitle:         'Perseus Arcane Academy — Master the Mysteries',
  metaDescription:   'Premium occult and esoteric education. Courses in Hermetics, Kabbalah, Tarot, Astrology, and more.',
  googleAnalyticsId: null,
  customHeadHtml:    null,
  customCss:         null,
  maintenanceMode:   false,
  headerNav: [
    { label: 'Courses',     href: '/courses' },
    { label: 'Collections', href: '/collections' },
    { label: 'Instructors', href: '/instructors' },
  ],
  footerNav: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Use',   href: '/terms' },
    { label: 'Contact',        href: '/contact' },
  ],
  themeVariant:       'dark' as const,
  coursesDisplayMode: 'all' as const,
  collectionsLabel:   'Series',
  collectionsDisplayStyle: 'covers' as const,
  heroEyebrow:        '✦ Perseus Arcane Academy ✦',
  heroHeadline:       'Ancient Wisdom for the Modern Initiate',
  heroSubtext:        'Structured courses in Hermetics, esoteric traditions, and martial arts. Join 500+ students on the path.',
  heroPrimaryLabel:   'Browse All Courses →',
  heroPrimaryHref:    '/courses',
  heroSecondaryLabel: 'Sign In',
  heroSecondaryHref:  '/login',
  heroBadges:         ['500+ students enrolled', 'Lifetime access', 'New lessons monthly'],
  heroImageUrl:       null,
  featuredCourseIds:  [],
  showEmailOptin:     true,
  emailOptinHeadline: 'Stay in the Current',
  emailOptinSubtext:  'New courses, insights, and arcane knowledge — free, to your inbox.',
  homepageSections:   [],
}

const SETTINGS_KEY = 'site_config'

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SETTINGS_KEY } })
    if (!row) return DEFAULTS
    return { ...DEFAULTS, ...(row.value as Partial<SiteSettings>) }
  } catch {
    return DEFAULTS
  }
})

export async function updateSiteSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  const existing = await prisma.siteSetting.findUnique({ where: { key: SETTINGS_KEY } })
  const current  = existing ? (existing.value as Partial<SiteSettings>) : {}
  const merged   = { ...current, ...updates }

  await prisma.siteSetting.upsert({
    where:  { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: merged, group: 'BRANDING' },
    update: { value: merged },
  })

  return { ...DEFAULTS, ...merged }
}
