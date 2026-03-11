export const dynamic = 'force-dynamic'
export const maxDuration = 60 // seconds — allow longer imports on Vercel Pro/hobby

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { createCourseDefaults } from '@/lib/course/course-defaults'

// ── Types ────────────────────────────────────────────────────────────────────

interface CsvRow {
  row_type:        string
  title:           string
  description:     string
  sort_order:      string
  module_title:    string
  lesson_type:     string
  video_provider:  string
  video_id:        string
  video_url:       string
  aspect_ratio:    string  // e.g. "56.25" (16:9), "150" (portrait 2:3) — or paste full embed code here
  duration_seconds:string
  is_free:         string
  is_published:    string
  drip_days:       string
  price:           string
  compare_at_price:string
  currency:        string
  slug:            string
  status:          string
  thumbnail_url:   string
}

interface ImportResult {
  course:   { id: string; slug: string; title: string }
  modules:  number
  lessons:  number
  skipped:  string[]
  warnings: string[]
}

// ── CSV parser (no external deps) ───────────────────────────────────────────

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim()
    })
    rows.push(row)
  }

  return rows
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function bool(val: string, fallback = true): boolean {
  if (!val) return fallback
  return val.toLowerCase() !== 'false' && val !== '0'
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function videoProvider(val: string) {
  const v = val.toUpperCase()
  const valid = ['STREAMABLE','VIMEO','YOUTUBE','MUXASSET','MUXPLAYBACK','BUNNY']
  return valid.includes(v) ? v : 'STREAMABLE'
}

function lessonType(val: string) {
  const v = val.toUpperCase()
  const valid = ['VIDEO','TEXT','QUIZ','EMBED']
  return valid.includes(v) ? v : 'VIDEO'
}

/**
 * Parse aspect ratio from either:
 *  - A plain number string: "56.25", "150", "75"
 *  - A full Streamable/generic embed code containing padding-bottom:X%
 *  - A raw embed URL (no ratio info → returns null → defaults to 16:9)
 * Returns a string like "56.25" or null.
 */
function parseAspectRatio(val: string): string | null {
  if (!val?.trim()) return null

  // Already a plain number
  const asNum = parseFloat(val)
  if (!isNaN(asNum) && asNum > 0 && asNum <= 400) return String(asNum)

  // Extract padding-bottom from embed code: padding-bottom:150.000% or padding-bottom:56.25%
  const pbMatch = val.match(/padding-bottom\s*:\s*([\d.]+)%/i)
  if (pbMatch) return String(parseFloat(pbMatch[1]))

  // Extract src URL from embed code for video_url fallback
  // (handled separately in lesson creation — here we just return null)
  return null
}

/**
 * Extract the src URL from a full embed code if the cell contains an iframe tag.
 * Returns null if the value is already a plain URL or empty.
 */
function extractEmbedSrc(val: string): string | null {
  if (!val?.trim()) return null
  if (val.trim().startsWith('<')) {
    const srcMatch = val.match(/src=["']([^"']+)["']/i)
    return srcMatch ? srcMatch[1] : null
  }
  return null
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest)  {

  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData  = await req.formData()
  const file      = formData.get('file') as File | null
  const overwrite = formData.get('overwrite') === 'true'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseCsv(text) as CsvRow[]

  if (rows.length === 0) {
    return NextResponse.json({ error: 'CSV is empty or has no data rows' }, { status: 400 })
  }

  const warnings: string[] = []
  const skipped:  string[] = []

  // ── 1. Find the COURSE row ────────────────────────────────────────────────
  const courseRow = rows.find(r => r.row_type?.toUpperCase() === 'COURSE')
  if (!courseRow) {
    return NextResponse.json({ error: 'No COURSE row found in CSV. Add a row with row_type=COURSE.' }, { status: 400 })
  }

  const courseTitle = courseRow.title?.trim()
  if (!courseTitle) {
    return NextResponse.json({ error: 'COURSE row is missing a title.' }, { status: 400 })
  }

  const rawSlug    = courseRow.slug?.trim() || slugify(courseTitle)
  const courseSlug = rawSlug || slugify(courseTitle)

  // Check for existing course
  const existing = await prisma.course.findUnique({ where: { slug: courseSlug } })
  if (existing && !overwrite) {
    return NextResponse.json(
      { error: `A course with slug "${courseSlug}" already exists. Set overwrite=true to replace its modules and lessons.` },
      { status: 409 }
    )
  }

  // ── 2. Upsert the Course ──────────────────────────────────────────────────
  const courseData = {
    title:          courseTitle,
    subtitle:       courseRow.description?.trim() || null,
    slug:           courseSlug,
    status:         (['DRAFT','PUBLISHED','ARCHIVED'].includes(courseRow.status?.toUpperCase())
                      ? courseRow.status.toUpperCase()
                      : 'DRAFT') as any,
    price:          courseRow.price ? parseFloat(courseRow.price) : 0,
    compareAtPrice: courseRow.compare_at_price ? parseFloat(courseRow.compare_at_price) : null,
    currency:       courseRow.currency?.toUpperCase() || 'USD',
    thumbnailUrl:   courseRow.thumbnail_url || null,
  }

  let course = existing
    ? await prisma.course.update({ where: { slug: courseSlug }, data: courseData })
    : await prisma.course.create({ data: courseData })

  // Auto-create Product wrapper, SalesPage, CheckoutPage, EmailSequence
  let productId: string | null = null
  try {
    const defaults = await createCourseDefaults(course.id, {
    title:          course.title,
    slug:           course.slug,
    price:          courseRow.price ? parseFloat(courseRow.price) : 0,
    compareAtPrice: courseRow.compare_at_price ? parseFloat(courseRow.compare_at_price) : null,
    currency:       courseRow.currency?.toUpperCase() || 'USD',
    status:         courseData.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    thumbnailUrl:   courseRow.thumbnail_url || null,
    })
    productId = defaults.productId
  } catch (err: any) {
    warnings.push(`Product/SalesPage setup warning: ${err.message ?? 'unknown error'}`)
  }

  // If overwriting, delete existing modules (cascades to lessons)
  if (existing && overwrite) {
    await prisma.module.deleteMany({ where: { courseId: course.id } })
    warnings.push(`Existing modules and lessons for "${courseSlug}" were replaced.`)
  }

  // ── 3. Group MODULE + LESSON rows ─────────────────────────────────────────
  const moduleRows = rows.filter(r => r.row_type?.toUpperCase() === 'MODULE')
  const lessonRows = rows.filter(r => r.row_type?.toUpperCase() === 'LESSON')

  // Build module title → db record map
  const moduleMap = new Map<string, { id: string; sortOrder: number }>()

  // If no MODULE rows but there ARE lesson rows, auto-create a default module
  if (moduleRows.length === 0 && lessonRows.length > 0) {
    const defaultModule = await prisma.module.create({
      data: {
        courseId:  course.id,
        title:     course.title,
        sortOrder: 0,
      },
    })
    moduleMap.set('__default__', { id: defaultModule.id, sortOrder: 0 })
    warnings.push('No MODULE rows found — all lessons placed in a single default module.')
  }

  // ── 4. Create modules — sequential (need IDs for moduleMap) ──────────────
  // Modules must be sequential (each needs its DB id for the lesson map)
  // But we parallelise where safe using Promise.all on independent rows
  await Promise.all(moduleRows.map(async (row) => {
    const moduleTitle = row.title?.trim()
    if (!moduleTitle) {
      skipped.push(`MODULE row with empty title (sort_order=${row.sort_order}) — skipped.`)
      return
    }
    const sortOrder = parseInt(row.sort_order || '0') || 0
    const mod = await prisma.module.create({
      data: {
        courseId:    course.id,
        title:       moduleTitle,
        description: row.description?.trim() || null,
        sortOrder,
        isPublished: bool(row.is_published, true),
      },
    })
    moduleMap.set(moduleTitle.toLowerCase(), { id: mod.id, sortOrder })
  }))

  // ── 5. Build lesson data array then batch insert ─────────────────────────
  const lessonData: any[] = []

  for (const row of lessonRows) {
    const lessonTitle = row.title?.trim()
    if (!lessonTitle) {
      skipped.push(`LESSON row with empty title — skipped.`)
      continue
    }

    // Resolve module
    const rawModuleTitle = row.module_title?.trim()
    let moduleEntry = rawModuleTitle
      ? (moduleMap.get(rawModuleTitle.toLowerCase()) ?? null)
      : null

    if (!moduleEntry) {
      moduleEntry = moduleMap.get('__default__') ?? [...moduleMap.values()][0] ?? null
    }

    if (!moduleEntry) {
      skipped.push(`Lesson "${lessonTitle}" — could not resolve module "${rawModuleTitle}". Skipped.`)
      continue
    }

    const type     = lessonType(row.lesson_type || 'VIDEO')
    const provider = videoProvider(row.video_provider || 'STREAMABLE')

    const rawVideoUrl    = row.video_url?.trim() || null
    const embedSrc       = rawVideoUrl ? extractEmbedSrc(rawVideoUrl) : null
    const aspectRatioRaw = row.aspect_ratio?.trim() || null

    const aspectRatio =
      parseAspectRatio(aspectRatioRaw ?? '') ??
      (rawVideoUrl ? parseAspectRatio(rawVideoUrl) : null)

    let videoId  = row.video_id?.trim() || null
    let videoUrl = embedSrc ?? rawVideoUrl

    if (!videoId && videoUrl) {
      const streamableMatch = videoUrl.match(/streamable\.com\/([a-z0-9]+)/i)
      if (streamableMatch) videoId = streamableMatch[1]
      const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/i)
      if (vimeoMatch) videoId = vimeoMatch[1]
      const ytMatch = videoUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
      if (ytMatch) videoId = ytMatch[1]
    }

    lessonData.push({
      moduleId:      moduleEntry.id,
      courseId:      course.id,
      title:         lessonTitle,
      type:          type,
      videoProvider: provider,
      videoId:       videoId,
      videoUrl:      videoUrl,
      aspectRatio:   aspectRatio,
      content:       (type === 'TEXT' ? row.description?.trim() : null) || null,
      duration:      row.duration_seconds ? parseInt(row.duration_seconds) : null,
      sortOrder:     parseInt(row.sort_order || '0') || 0,
      isFree:        bool(row.is_free, false),
      isPublished:   bool(row.is_published, true),
      dripDaysAfterEnrollment: row.drip_days ? parseInt(row.drip_days) : null,
    })
  }

  // Batch insert all lessons in one query
  if (lessonData.length > 0) {
    await prisma.lesson.createMany({ data: lessonData })
  }
  const lessonCount = lessonData.length

  const result: any = {
    course:    { id: course.id, slug: course.slug, title: course.title },
    productId: productId,
    modules:   moduleMap.size,
    lessons:   lessonCount,
    skipped,
    warnings,
  }

  return NextResponse.json(result, { status: 201 })
}