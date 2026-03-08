import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

interface StudentRow {
  email:        string
  name?:        string
  course_slug?:  string
  course_title?: string
  product_slug?: string
  enrolled_at?:  string
}

interface ImportStudentsResult {
  total:     number
  created:   number
  enrolled:  number
  skipped:   number
  unmatched: string[]
  errors:    string[]
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return []
  function parseLine(line: string): string[] {
    const vals: string[] = []; let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"' && !inQ)  { inQ = true; continue }
      if (ch === '"' && inQ)   { if (line[i+1] === '"') { cur += '"'; i++ } else inQ = false; continue }
      if (ch === ',' && !inQ)  { vals.push(cur.trim()); cur = ''; continue }
      cur += ch
    }
    vals.push(cur.trim()); return vals
  }
  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[\s\-]+/g,'_').replace(/[^a-z0-9_]/g,''))
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseLine(line)
    const row: Record<string,string> = {}
    headers.forEach((h,j) => { row[h] = (vals[j] ?? '').trim() })
    return row
  })
}

function normaliseRow(raw: Record<string,string>): StudentRow {
  const get = (...keys: string[]) => { for (const k of keys) { const v = raw[k]; if (v) return v }; return '' }
  return {
    email:        get('email','buyer_email','customer_email','user_email'),
    name:         get('name','buyer_name','customer_name','full_name') || undefined,
    course_slug:  get('course_slug','slug') || undefined,
    course_title: get('course_title','product_title','product_name','item_title','item','title','product') || undefined,
    product_slug: get('product_slug') || undefined,
    enrolled_at:  get('enrolled_at','sale_date','purchase_date','order_date','date') || undefined,
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { csv, dryRun = false } = await req.json()
  if (!csv) return NextResponse.json({ error: 'No CSV provided' }, { status: 400 })

  const rawRows = parseCsv(csv)
  const result: ImportStudentsResult = { total: rawRows.length, created: 0, enrolled: 0, skipped: 0, unmatched: [], errors: [] }

  const allCourses  = await prisma.course.findMany({ select: { id: true, slug: true, title: true } })
  const allProducts = await prisma.product.findMany({
    where:   { status: 'PUBLISHED' },
    select:  { id: true, slug: true, title: true, courses: { select: { courseId: true } } },
  })

  function findMatch(row: StudentRow): { courseId: string; productId?: string } | null {
    if (row.course_slug) {
      const c = allCourses.find(c => c.slug === row.course_slug)
      if (c) return { courseId: c.id }
    }
    if (row.product_slug) {
      const p = allProducts.find(p => p.slug === row.product_slug)
      if (p?.courses[0]) return { courseId: p.courses[0].courseId, productId: p.id }
    }
    if (row.course_title) {
      const needle = row.course_title.toLowerCase().replace(/[^a-z0-9 ]/g,'').trim()
      const product = allProducts.find(p => p.title.toLowerCase().replace(/[^a-z0-9 ]/g,'').trim() === needle)
      if (product?.courses[0]) return { courseId: product.courses[0].courseId, productId: product.id }
      const course = allCourses.find(c => c.title.toLowerCase().replace(/[^a-z0-9 ]/g,'').trim() === needle)
      if (course) return { courseId: course.id }
      // Partial match
      const partial = allProducts.find(p => {
        const pt = p.title.toLowerCase().replace(/[^a-z0-9 ]/g,'').trim()
        return pt.includes(needle) || needle.includes(pt)
      })
      if (partial?.courses[0]) return { courseId: partial.courses[0].courseId, productId: partial.id }
    }
    return null
  }

  for (const raw of rawRows) {
    const row = normaliseRow(raw)
    if (!row.email?.includes('@')) { result.errors.push(`Invalid email: "${row.email}"`); continue }

    const match = findMatch(row)
    if (!match) {
      result.unmatched.push(`${row.email} — "${row.course_title || row.course_slug || 'no course specified'}"`)
      continue
    }

    if (dryRun) { result.enrolled++; continue }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email: row.email } })
      const user = await prisma.user.upsert({
        where:  { email: row.email },
        create: { email: row.email, name: row.name ?? null, role: 'STUDENT', emailVerified: new Date() },
        update: row.name && !existingUser?.name ? { name: row.name } : {},
      })
      if (!existingUser) result.created++

      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: match.courseId } },
      })
      if (existing) { result.skipped++; continue }

      await prisma.enrollment.create({
        data: {
          userId:    user.id,
          courseId:  match.courseId,
          productId: match.productId ?? null,
          status:    'ACTIVE',
          enrolledAt: row.enrolled_at ? new Date(row.enrolled_at) : new Date(),
        },
      })
      result.enrolled++
    } catch (err: any) {
      result.errors.push(`${row.email}: ${err.message}`)
    }
  }

  return NextResponse.json(result)
}
