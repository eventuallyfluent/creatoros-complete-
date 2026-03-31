export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { getRevenueStats, getStudentStats, getOrderSummary, getCourseStats } from '@/lib/analytics/analytics-service'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [revenueStats, studentStats, orderSummary, courseStats] = await Promise.all([
    getRevenueStats(),
    getStudentStats(),
    getOrderSummary(),
    getCourseStats(),
  ])

  return NextResponse.json({ revenueStats, studentStats, orderSummary, courseStats })
}
