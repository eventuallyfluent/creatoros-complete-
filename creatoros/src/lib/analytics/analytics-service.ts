import { prisma } from '@/lib/db/prisma'

// ── Revenue ──────────────────────────────────────────────────
export async function getRevenueStats() {
  const now        = new Date()
  const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0)
  const startOf30  = new Date(now); startOf30.setDate(now.getDate() - 30)
  const startOf7   = new Date(now); startOf7.setDate(now.getDate() - 7)
  const startOfPrev30 = new Date(startOf30); startOfPrev30.setDate(startOfPrev30.getDate() - 30)

  const [total, last30, prev30, last7, today] = await Promise.all([
    prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { status: 'PAID', createdAt: { gte: startOf30 } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { status: 'PAID', createdAt: { gte: startOfPrev30, lt: startOf30 } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { status: 'PAID', createdAt: { gte: startOf7 } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { status: 'PAID', createdAt: { gte: startOfDay } }, _sum: { total: true } }),
  ])

  const rev30   = Number(last30._sum.total ?? 0)
  const revPrev = Number(prev30._sum.total ?? 0)
  const pctChange = revPrev > 0 ? ((rev30 - revPrev) / revPrev) * 100 : 0

  return {
    totalAllTime: Number(total._sum.total ?? 0),
    last30Days:   rev30,
    last7Days:    Number(last7._sum.total ?? 0),
    today:        Number(today._sum.total ?? 0),
    pctChange30:  Math.round(pctChange * 10) / 10,
  }
}

export async function getRevenueByDay(days = 30) {
  const start = new Date(); start.setDate(start.getDate() - days); start.setHours(0,0,0,0)

  const orders = await prisma.order.findMany({
    where:  { status: 'PAID', createdAt: { gte: start } },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  // Build day-by-day map
  const map = new Map<string, number>()
  for (let i = 0; i <= days; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    map.set(d.toISOString().slice(0, 10), 0)
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10)
    map.set(key, (map.get(key) ?? 0) + Number(o.total))
  }

  return Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }))
}

// ── Students ─────────────────────────────────────────────────
export async function getStudentStats() {
  const now       = new Date()
  const startOf30 = new Date(now); startOf30.setDate(now.getDate() - 30)
  const startOf7  = new Date(now); startOf7.setDate(now.getDate() - 7)

  const [total, last30, last7, active] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'STUDENT', createdAt: { gte: startOf30 } } }),
    prisma.user.count({ where: { role: 'STUDENT', createdAt: { gte: startOf7 } } }),
    prisma.enrollment.groupBy({ by: ['userId'], where: { status: 'ACTIVE' }, _count: true }).then(r => r.length),
  ])

  return { total, last30Days: last30, last7Days: last7, activeStudents: active }
}

export async function getSignupsByDay(days = 30) {
  const start = new Date(); start.setDate(start.getDate() - days); start.setHours(0,0,0,0)

  const users = await prisma.user.findMany({
    where:  { role: 'STUDENT', createdAt: { gte: start } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const map = new Map<string, number>()
  for (let i = 0; i <= days; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    map.set(d.toISOString().slice(0, 10), 0)
  }
  for (const u of users) {
    const key = u.createdAt.toISOString().slice(0, 10)
    map.set(key, (map.get(key) ?? 0) + 1)
  }

  return Array.from(map.entries()).map(([date, signups]) => ({ date, signups }))
}

// ── Courses ───────────────────────────────────────────────────
export async function getCourseStats() {
  const courses = await prisma.course.findMany({
    where:   { status: 'PUBLISHED' },
    include: {
      _count:   { select: { enrollments: true, lessons: true } },
      lessons:  { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const courseIds = courses.map(c => c.id)
  const [completions, revenue] = await Promise.all([
    prisma.enrollment.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds }, completedAt: { not: null } },
      _count: { courseId: true },
    }),
    prisma.orderItem.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds }, order: { status: 'PAID' } },
      _sum: { priceAtPurchase: true },
    }),
  ])

  const completionMap = new Map(completions.map(c => [c.courseId, c._count.courseId]))
  const revenueMap    = new Map(revenue.map(r => [r.courseId, Number(r._sum.priceAtPurchase ?? 0)]))

  return courses.map(c => {
    const enrolled   = c._count.enrollments
    const completed  = completionMap.get(c.id) ?? 0
    const complRate  = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0
    return {
      id:               c.id,
      title:            c.title,
      slug:             c.slug,
      enrolled,
      completed,
      completionRate:   complRate,
      revenue:          revenueMap.get(c.id) ?? 0,
      lessonCount:      c._count.lessons,
    }
  })
}

// ── Orders summary ────────────────────────────────────────────
export async function getOrderSummary() {
  const [paid, pending, refunded, failed] = await Promise.all([
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'REFUNDED' } }),
    prisma.order.count({ where: { status: 'FAILED' } }),
  ])
  return { paid, pending, refunded, failed, total: paid + pending + refunded + failed }
}
