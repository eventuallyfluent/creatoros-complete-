export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import CouponEditor from '@/components/admin/CouponEditor'

export const metadata: Metadata = { title: 'Edit Coupon — Admin' }

export default async function EditCouponPage({ params }: { params: { couponId: string } }) {
  const [coupon, products] = await Promise.all([
    prisma.coupon.findUnique({ where: { id: params.couponId } }),
    prisma.product.findMany({ where: { status: { not: 'ARCHIVED' } }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
  ])
  if (!coupon) notFound()
  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title={`Edit ${coupon.code}`} backHref="/admin/coupons" backLabel="All Coupons" />
      <CouponEditor coupon={{ ...coupon, value: Number(coupon.value), minimumOrderAmount: coupon.minimumOrderAmount ? Number(coupon.minimumOrderAmount) : null, expiresAt: coupon.expiresAt?.toISOString() ?? null, startsAt: coupon.startsAt?.toISOString() ?? null }} products={products} />
    </div>
  )
}
