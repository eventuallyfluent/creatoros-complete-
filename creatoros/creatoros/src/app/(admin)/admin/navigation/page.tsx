export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { getSiteSettings } from '@/lib/settings/site-settings'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import NavEditor from './NavEditor'

export const metadata: Metadata = { title: 'Navigation — Admin' }

export default async function AdminNavigationPage() {
  const settings = await getSiteSettings()
  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title="Navigation" description="Header and footer menu links" />
      <NavEditor
        headerNav={settings.headerNav ?? DEFAULT_HEADER}
        footerNav={settings.footerNav ?? DEFAULT_FOOTER}
      />
    </div>
  )
}

const DEFAULT_HEADER = [
  { label: 'Courses',     href: '/courses' },
  { label: 'Collections', href: '/collections' },
  { label: 'Instructors', href: '/instructors' },
]

const DEFAULT_FOOTER = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Use',   href: '/terms' },
  { label: 'Contact',        href: '/contact' },
]
