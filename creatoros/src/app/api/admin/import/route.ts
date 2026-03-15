export const dynamic = 'force-dynamic'
export const maxDuration = 60 // seconds — allow longer imports on Vercel Pro/hobby

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { createCourseDefaults, generateSalesPageFromPrompts } from '@/lib/course/course-defaults'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'creatoros'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Fetch an external image URL and upload it to Supabase Storage.
 * Returns the new permanent URL, or the original URL if upload fails.
 */
async function mirrorImage(externalUrl: string, folder = 'thumbnails'): Promise<string> {
  const supabase = getSupabase()
  if (!supabase) return externalUrl

  // Single attempt with 8s timeout to stay within Vercel's 10s function limit
  // If the image server is slow, we fall back to the original URL gracefully
  for (const timeout of [8000]) {
    try {
      const res = await fetch(externalUrl, {
        signal: AbortSignal.timeout(timeout),
        headers: { 'User-Agent': 'Mozilla/5.0 CreatorOS-Importer/1.0' },
      })
      if (!res.ok) continue

      // Accept any image content type, fall back to jpeg
      const contentType = res.headers.get('content-type') ?? ''
      const isImage = contentType.startsWith('image/') || externalUrl.match(/\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i)
      if (!isImage) return externalUrl

      // Derive extension from URL if content-type is unhelpful
      const urlExt = externalUrl.match(/\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i)?.[1]?.toLowerCase()
      const ctExt  = contentType.split('/')[1]?.split(';')[0]?.replace('jpeg','jpg') ?? 'jpg'
      const ext    = urlExt ?? ctExt

      const buffer = await res.arrayBuffer()
      if (buffer.byteLength === 0) continue

      // Stable filename = hash of URL, so re-imports reuse the same file
      const hash     = Buffer.from(externalUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)
      const filename = `${folder}/${hash}.${ext}`
      const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`

      const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
        contentType:  mimeType,
        cacheControl: '31536000',
        upsert:       true,
      })

      if (error) {
        console.error('Supabase upload error:', error.message)
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
      return publicUrl
    } catch (err: any) {
      console.warn(`mirrorImage attempt failed (timeout ${timeout}ms):`, err?.message)
      // continue to next retry
    }
  }
  return externalUrl // all retries exhausted — use original URL as fallback
}

// ── Types ────────────────────────────────────────────────────────────────────

interface CsvRow {
  row_type:        string
  title:           string
  description:     string   // used as course subtitle
  sort_order:      string
  module_title:    string
  lesson_type:     string
  video_provider:  string
  video_id:        string
  video_url:       string
  aspect_ratio:    string   // e.g. "56.25" (16:9), "150" (portrait 2:3)
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
  // ── Sales page content ────────────────────────────────────────────────────
  headline:           string  // main hero headline (defaults to title)
  subheadline:        string  // supporting statement below headline
  problem:            string  // what problem does this course solve
  who_is_it_for:      string  // target audience
  benefits:           string  // bullet-point benefits (one per line)
  transformation:     string  // outcome students experience
  whats_included:     string  // what's in the course (one per line)
  curriculum_summary: string  // brief description of structure
  instructor_bio:     string  // why you're the right teacher
  cta_text:           string  // button label e.g. "Enrol Now"
  cta_subtext:        string  // below button e.g. "30-day guarantee"
  // ── Course settings ───────────────────────────────────────────────────────
  meta_description:     string  // SEO description
  certificate_enabled:  string  // true/false
  // ── Review rows (row_type=REVIEW) ─────────────────────────────────────────
  reviewer_name:  string  // display name
  reviewer_email: string  // used to find/create user account
  rating:         string  // 1-5
  review_text:    string  // the review comment
  review_date:    string  // ISO date or blank
  is_featured:    string  // true/false
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
  const rows = parseCsv(text) as unknown as CsvRow[]

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

  // ── 2. Mirror thumbnail to Supabase Storage ─────────────────────────────
  // Download the external image and re-upload so it lives permanently with us.
  // Falls back to the original URL if Supabase is not configured or fetch fails.
  let thumbnailUrl: string | null = null
  if (courseRow.thumbnail_url?.trim()) {
    const raw = courseRow.thumbnail_url.trim()
    // Only mirror external URLs — skip if already on our Supabase bucket
    const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    if (raw.startsWith(supabaseBase)) {
      thumbnailUrl = raw // already on our storage
    } else {
      thumbnailUrl = await mirrorImage(raw, 'thumbnails')
      if (thumbnailUrl === raw) {
        warnings.push('Thumbnail could not be saved to storage — using original URL as fallback.')
      }
    }
  }

  // ── 3. Upsert the Course ──────────────────────────────────────────────────
  // Course is content-only. Price/currency belong on Product (created below via createCourseDefaults).
  const courseData = {
    title:        courseTitle,
    subtitle:     courseRow.description?.trim() || null,
    slug:         courseSlug,
    status:       (['DRAFT','PUBLISHED','ARCHIVED'].includes(courseRow.status?.toUpperCase())
                    ? courseRow.status.toUpperCase()
                    : 'DRAFT') as any,
    thumbnailUrl,
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
    thumbnailUrl:   thumbnailUrl,
    })
    productId = defaults.productId
  } catch (err: any) {
    warnings.push(`Product/SalesPage setup warning: ${err.message ?? 'unknown error'}`)
  }

  // ── 4. Populate sales page prompts from CSV if provided ──────────────────
  if (productId) {
    const hasPromptData = [
      courseRow.headline, courseRow.subheadline, courseRow.problem,
      courseRow.who_is_it_for, courseRow.benefits, courseRow.transformation,
      courseRow.whats_included, courseRow.curriculum_summary,
      courseRow.instructor_bio, courseRow.cta_text,
    ].some(v => v?.trim())

    if (hasPromptData) {
      try {
        await prisma.salesPagePrompts.update({
          where: { productId },
          data: {
            headline:          courseRow.headline?.trim()          || course.title,
            subheadline:       courseRow.subheadline?.trim()       || course.subtitle || null,
            problem:           courseRow.problem?.trim()           || null,
            whoIsItFor:        courseRow.who_is_it_for?.trim()     || null,
            benefits:          courseRow.benefits?.trim()          || null,
            transformation:    courseRow.transformation?.trim()    || null,
            whatsIncluded:     courseRow.whats_included?.trim()    || null,
            curriculumSummary: courseRow.curriculum_summary?.trim()|| null,
            instructorBio:     courseRow.instructor_bio?.trim()    || null,
            ctaText:           courseRow.cta_text?.trim()          || 'Enrol Now',
            ctaSubtext:        courseRow.cta_subtext?.trim()       || null,
          },
        })
      } catch (err: any) {
        warnings.push(`Sales page prompts: ${err.message ?? 'could not save'}`)
      }
    }

    // Auto-generate sales page blocks from the prompts
    if (hasPromptData) {
      try {
        await generateSalesPageFromPrompts(productId)
      } catch (err: any) {
        warnings.push(`Sales page blocks: ${err.message ?? 'could not generate'}`)
      }
    }
  }

  // ── 5. Apply course-level settings ───────────────────────────────────────
  const certEnabled = courseRow.certificate_enabled?.trim().toLowerCase()
  const metaDesc    = courseRow.meta_description?.trim() || null
  if (certEnabled || metaDesc) {
    await prisma.course.update({
      where: { id: course.id },
      data:  {
        ...(metaDesc    ? { metaDescription: metaDesc } : {}),
        ...(certEnabled ? { certificateEnabled: certEnabled === 'true' || certEnabled === '1' || certEnabled === 'yes' } : {}),
      },
    }).catch(() => {})
  }

  // If overwriting, delete existing modules (cascades to lessons)
  if (existing && overwrite) {
    await prisma.module.deleteMany({ where: { courseId: course.id } })
    warnings.push(`Existing modules and lessons for "${courseSlug}" were replaced.`)
  }

  // ── 6. Group MODULE + LESSON rows ─────────────────────────────────────────
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
      moduleEntry = moduleMap.get('__default__') ?? Array.from(moduleMap.values())[0] ?? null
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

  // ── 7. Process REVIEW rows ──────────────────────────────────────────────
  const reviewRows = rows.filter(r => r.row_type?.toUpperCase() === 'REVIEW')
  let reviewsImported = 0

  for (const rr of reviewRows) {
    const rating  = parseInt(rr.rating ?? '5')
    const comment = rr.review_text?.trim() || null
    const name    = rr.reviewer_name?.trim() || 'Student'
    const email   = rr.reviewer_email?.trim()
    if (!email || isNaN(rating) || rating < 1 || rating > 5) continue

    try {
      let reviewUser = await prisma.user.findUnique({ where: { email } })
      if (!reviewUser) {
        reviewUser = await prisma.user.create({
          data: { email, name, role: 'STUDENT', emailVerified: rr.review_date ? new Date(rr.review_date) : new Date() },
        })
      } else if (!reviewUser.name && name) {
        await prisma.user.update({ where: { id: reviewUser.id }, data: { name } })
      }

      await prisma.courseReview.upsert({
        where:  { courseId_userId: { courseId: course.id, userId: reviewUser.id } },
        create: {
          courseId:   course.id,
          userId:     reviewUser.id,
          rating,
          comment,
          status:     'APPROVED',
          isFeatured: rr.is_featured?.toLowerCase() === 'true',
          createdAt:  rr.review_date ? new Date(rr.review_date) : new Date(),
        },
        update: { rating, comment, status: 'APPROVED', isFeatured: rr.is_featured?.toLowerCase() === 'true' },
      })
      reviewsImported++
    } catch (err: any) {
      warnings.push(`Review from ${email}: ${err.message ?? 'skipped'}`)
    }
  }

  const result: any = {
    course:    { id: course.id, slug: course.slug, title: course.title },
    productId: productId,
    modules:   moduleMap.size,
    lessons:   lessonCount,
    reviews:   reviewsImported,
    skipped,
    warnings,
  }

  return NextResponse.json(result, { status: 201 })
}