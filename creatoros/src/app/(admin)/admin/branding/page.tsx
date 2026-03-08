import { Metadata } from 'next'
import { getSiteSettings } from '@/lib/settings/site-settings'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import BrandingEditor from './BrandingEditor'

export const metadata: Metadata = { title: 'Branding — Admin' }

export default async function AdminBrandingPage() {
  const settings = await getSiteSettings()
  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title="Branding" description="Site identity, colours, and logo" />
      <BrandingEditor settings={settings} />
    </div>
  )
}
