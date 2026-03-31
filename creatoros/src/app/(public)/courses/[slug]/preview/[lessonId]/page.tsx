export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import VideoPlayer from '@/components/video/VideoPlayer'
import type { VideoProvider } from '@/components/video/VideoPlayer'

interface Props { params: { slug: string; lessonId: string } }

export async function generateMetadata({ params }: Props) {
  const lesson = await prisma.lesson.findUnique({ where: { id: params.lessonId }, select: { title: true } }).catch(() => null)
  return { title: lesson ? `Free Preview: ${lesson.title}` : 'Preview' }
}

export default async function FreeLessonPreview({ params }: Props) {
  const product = await prisma.product.findFirst({
    where: { slug: params.slug, status: 'PUBLISHED' },
    select: { id: true, title: true, slug: true, price: true, currency: true },
  })
  if (!product) notFound()

  const lesson = await prisma.lesson.findFirst({
    where:  { id: params.lessonId, isFree: true, isPublished: true },
    include: { module: { select: { title: true } }, course: { select: { id: true } } },
  })
  if (!lesson) notFound()

  // Confirm lesson belongs to this product
  const link = await prisma.productCourse.findFirst({
    where: { productId: product.id, courseId: lesson.course.id },
  })
  if (!link) notFound()

  // Get other free lessons for this product for the sidebar
  const freeLessons = await prisma.lesson.findMany({
    where:  { course: { products: { some: { productId: product.id } } }, isFree: true, isPublished: true },
    select: { id: true, title: true, duration: true },
    orderBy: { sortOrder: 'asc' },
    take: 10,
  })

  const dur = lesson.duration
    ? `${Math.floor(lesson.duration / 60)}m`
    : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Banner */}
      <div style={{ background: 'var(--brand)', padding: '10px 0', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'white', margin: 0 }}>
          Free preview — {product.title}
          {' · '}
          <Link href={`/courses/${product.slug}`} style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, textDecoration: 'underline' }}>
            View full course →
          </Link>
        </p>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'var(--s6) var(--s5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 'var(--s5)', alignItems: 'start' }}>

          {/* Video */}
          <div>
            {lesson.videoId || lesson.videoUrl ? (
              <VideoPlayer
                provider={(lesson.videoProvider as VideoProvider) ?? 'STREAMABLE'}
                videoId={lesson.videoId ?? undefined}
                videoUrl={lesson.videoUrl ?? undefined}
                aspectRatio={lesson.aspectRatio ?? undefined}
                lessonId={lesson.id}
              />
            ) : (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--r-xl)', padding: 'var(--s8)', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No video available for this lesson.</p>
              </div>
            )}

            <div style={{ marginTop: 'var(--s4)' }}>
              <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>
                {lesson.module.title}
              </p>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {lesson.title}
              </h1>
              {dur && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>⏱ {dur}</p>}
            </div>

            {/* Enrol CTA */}
            <div style={{ marginTop: 'var(--s5)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 'var(--s5)', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Enjoying this lesson?
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--s4)' }}>
                Enrol in the full course to access all lessons.
              </p>
              <Link href={`/checkout/${product.slug}`}
                style={{ display: 'inline-block', padding: '13px 32px', background: 'var(--brand)', color: 'white', borderRadius: 'var(--r-md)', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>
                Enrol Now — {product.currency} {Number(product.price).toFixed(0)}
              </Link>
            </div>
          </div>

          {/* Free lessons sidebar */}
          {freeLessons.length > 1 && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', position: 'sticky', top: '80px' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                  Free Previews
                </p>
              </div>
              {freeLessons.map(fl => (
                <Link key={fl.id} href={`/courses/${product.slug}/preview/${fl.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', borderBottom: '1px solid var(--border)', textDecoration: 'none', background: fl.id === lesson.id ? 'rgba(123,47,190,0.08)' : 'transparent', borderLeft: fl.id === lesson.id ? '3px solid var(--brand)' : '3px solid transparent' }}>
                  <span style={{ fontSize: '11px', color: fl.id === lesson.id ? 'var(--brand)' : 'var(--text-muted)', flexShrink: 0 }}>▶</span>
                  <span style={{ fontSize: '13px', color: fl.id === lesson.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: fl.id === lesson.id ? 600 : 400, flex: 1, lineHeight: 1.3 }}>{fl.title}</span>
                  {fl.duration && <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>{Math.floor(fl.duration / 60)}m</span>}
                </Link>
              ))}
              <div style={{ padding: '14px 16px' }}>
                <Link href={`/courses/${product.slug}`}
                  style={{ display: 'block', padding: '10px', textAlign: 'center', background: 'var(--brand)', color: 'white', borderRadius: 'var(--r-md)', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
                  View Full Course →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
