export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import {
  getRevenueStats, getRevenueByDay,
  getStudentStats, getSignupsByDay,
  getCourseStats,  getOrderSummary,
} from '@/lib/analytics/analytics-service'
import AnalyticsDashboard from './AnalyticsDashboard'

export const metadata: Metadata = { title: 'Analytics — Admin' }

export default async function AdminAnalyticsPage() {
  const [revenueStats, revenueByDay, studentStats, signupsByDay, courseStats, orderSummary] =
    await Promise.all([
      getRevenueStats().catch(() => ({ totalAllTime:0, last30Days:0, last7Days:0, today:0, pctChange30:0 })),
      getRevenueByDay(30).catch(() => []),
      getStudentStats().catch(() => ({ total:0, last30Days:0, last7Days:0, today:0, pctChange30:0 })),
      getSignupsByDay(30).catch(() => []),
      getCourseStats().catch(() => []),
      getOrderSummary().catch(() => ({ pending:0, paid:0, failed:0, refunded:0 })),
    ])

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title="Analytics" description="Last 30 days · updates on each page load" />
      <AnalyticsDashboard
        revenueStats={revenueStats}
        revenueByDay={revenueByDay}
        studentStats={studentStats}
        signupsByDay={signupsByDay}
        courseStats={courseStats}
        orderSummary={orderSummary}
      />
    </div>
  )
}
