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
      getRevenueStats(),
      getRevenueByDay(30),
      getStudentStats(),
      getSignupsByDay(30),
      getCourseStats(),
      getOrderSummary(),
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
