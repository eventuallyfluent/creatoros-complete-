export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import CouponEditor from '@/components/admin/CouponEditor'

export const metadata: Metadata = { title: 'New Coupon — Admin' }

export default async function NewCouponPage() {
  const courses = await prisma.course.findMany({ where: { status: { not: 'ARCHIVED' } }, select: { id: true, title: true }, orderBy: { title: 'asc' } }).catch(() => [])
  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title="New Coupon" backHref="/admin/coupons" backLabel="All Coupons" />
      <CouponEditor courses={courses} />
    </div>
  )
}
