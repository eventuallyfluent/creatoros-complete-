export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import ImportTabs from './ImportTabs'

export const metadata: Metadata = { title: 'Import — Admin' }

export default function ImportPage() {
  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Import"
        description="Import courses from CSV or migrate existing students from Payhip"
      />
      <ImportTabs />
    </div>
  )
}
