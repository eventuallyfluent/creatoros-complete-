export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import GatewayManager from './GatewayManager'

export const metadata: Metadata = { title: 'Payments — Admin' }

export default async function AdminPaymentsPage() {
  const gateways = await prisma.paymentGateway.findMany({ orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] }).catch(() => [])
  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title="Payment Gateways" description="Configure how students pay for courses" />
      <GatewayManager gateways={gateways.map(g => ({ ...g, config: g.config as any ?? {} }))} />
    </div>
  )
}
