import { Metadata } from 'next'
import { getSiteSettings } from '@/lib/settings/site-settings'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import SettingsEditor from './SettingsEditor'

export const metadata: Metadata = { title: 'Settings — Admin' }

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings()
  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title="Settings" description="General platform settings" />
      <SettingsEditor settings={settings} />
    </div>
  )
}
