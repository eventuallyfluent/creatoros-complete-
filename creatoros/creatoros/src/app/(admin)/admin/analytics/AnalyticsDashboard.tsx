'use client'
import { useState } from 'react'
import { TrendingUp, TrendingDown, Users, DollarSign, BookOpen, ShoppingCart } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
interface RevenueStats  { totalAllTime: number; last30Days: number; last7Days: number; today: number; pctChange30: number }
interface StudentStats  { total: number; last30Days: number; last7Days: number; activeStudents: number }
interface DayRevenue    { date: string; revenue: number }
interface DaySignups    { date: string; signups: number }
interface CourseRow     { id: string; title: string; slug: string; enrolled: number; completed: number; completionRate: number; revenue: number; lessonCount: number }
interface OrderSummary  { paid: number; pending: number; refunded: number; failed: number; total: number }

interface Props {
  revenueStats:  RevenueStats
  revenueByDay:  DayRevenue[]
  studentStats:  StudentStats
  signupsByDay:  DaySignups[]
  courseStats:   CourseRow[]
  orderSummary:  OrderSummary
}

// ── Mini sparkline (SVG) ──────────────────────────────────────
function Sparkline({ data, color = '#7B2FBE' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 120; const h = 36; const pad = 2
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - (v / max) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Bar chart (SVG) ───────────────────────────────────────────
function BarChart({ data, valueKey, color = '#7B2FBE', height = 180 }: {
  data: Record<string, any>[]
  valueKey: string
  color?: string
  height?: number
}) {
  const values = data.map(d => Number(d[valueKey]) || 0)
  const max    = Math.max(...values, 1)
  const w      = 100
  const barW   = Math.max(2, (w / data.length) - 1)
  const gap    = w / data.length

  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      {values.map((v, i) => {
        const barH = (v / max) * (height - 10)
        const x    = i * gap + (gap - barW) / 2
        const y    = height - barH
        return (
          <rect key={i} x={x} y={y} width={barW} height={barH}
            fill={color} opacity={0.85} rx="1"
          >
            <title>{data[i].date}: {v}</title>
          </rect>
        )
      })}
    </svg>
  )
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, icon, sparkData, color = '#7B2FBE' }: {
  label:     string
  value:     string
  sub?:      string
  trend?:    number
  icon:      React.ReactNode
  sparkData?: number[]
  color?:    string
}) {
  const up = (trend ?? 0) >= 0
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>{label}</span>
        <span style={{ color, opacity: 0.7 }}>{icon}</span>
      </div>
      <div>
        <p style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: '13px', color: '#9ca3af', margin: '4px 0 0' }}>{sub}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {trend !== undefined ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '13px', fontWeight: 600, color: up ? '#10b981' : '#ef4444' }}>
            {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}% vs prev 30d
          </span>
        ) : <span />}
        {sparkData && <Sparkline data={sparkData} color={color} />}
      </div>
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────
export default function AnalyticsDashboard({ revenueStats, revenueByDay, studentStats, signupsByDay, courseStats, orderSummary }: Props) {
  const [courseSort, setCourseSort] = useState<'enrolled' | 'revenue' | 'completionRate'>('revenue')

  const fmt  = (n: number) => `$${n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toFixed(2)}`
  const revSpark = revenueByDay.map(d => d.revenue)
  const sigSpark = signupsByDay.map(d => d.signups)

  const sortedCourses = [...courseStats].sort((a, b) => b[courseSort] - a[courseSort])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Revenue (All Time)" value={fmt(revenueStats.totalAllTime)}
          sub={`${fmt(revenueStats.today)} today`} trend={revenueStats.pctChange30}
          icon={<DollarSign size={18} />} sparkData={revSpark}
        />
        <StatCard
          label="Revenue (Last 30 Days)" value={fmt(revenueStats.last30Days)}
          sub={`${fmt(revenueStats.last7Days)} last 7 days`}
          icon={<TrendingUp size={18} />} sparkData={revSpark} color="#10b981"
        />
        <StatCard
          label="Total Students" value={studentStats.total.toLocaleString()}
          sub={`+${studentStats.last30Days} this month`}
          icon={<Users size={18} />} sparkData={sigSpark} color="#6366f1"
        />
        <StatCard
          label="Orders" value={orderSummary.paid.toLocaleString()}
          sub={`${orderSummary.pending} pending · ${orderSummary.refunded} refunded`}
          icon={<ShoppingCart size={18} />} color="#f59e0b"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {[
          { title: 'Revenue — Last 30 Days',  data: revenueByDay,  key: 'revenue',  color: '#7B2FBE' },
          { title: 'New Students — Last 30 Days', data: signupsByDay, key: 'signups', color: '#6366f1' },
        ].map(chart => (
          <div key={chart.title} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '16px' }}>{chart.title}</h3>
            <BarChart data={chart.data} valueKey={chart.key} color={chart.color} height={140} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
              <span>{chart.data[0]?.date?.slice(5)}</span>
              <span>{chart.data[chart.data.length - 1]?.date?.slice(5)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Course table */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} style={{ color: '#7B2FBE' }} /> Course Performance
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['revenue', 'enrolled', 'completionRate'] as const).map(s => (
              <button key={s} onClick={() => setCourseSort(s)}
                style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)', background: courseSort === s ? '#7B2FBE' : 'white', color: courseSort === s ? 'white' : '#374151' }}>
                {s === 'completionRate' ? 'Completion' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Course', 'Enrolled', 'Completed', 'Completion %', 'Revenue', 'Lessons'].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedCourses.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No published courses yet.</td></tr>
            ) : sortedCourses.map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '13px 16px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{c.title}</p>
                </td>
                <td style={{ padding: '13px 16px', fontSize: '14px', color: '#374151' }}>{c.enrolled}</td>
                <td style={{ padding: '13px 16px', fontSize: '14px', color: '#374151' }}>{c.completed}</td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, maxWidth: '80px', height: '6px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.completionRate}%`, background: c.completionRate >= 60 ? '#10b981' : c.completionRate >= 30 ? '#f59e0b' : '#7B2FBE', borderRadius: '999px' }} />
                    </div>
                    <span style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>{c.completionRate}%</span>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>{fmt(c.revenue)}</td>
                <td style={{ padding: '13px 16px', fontSize: '14px', color: '#6b7280' }}>{c.lessonCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
