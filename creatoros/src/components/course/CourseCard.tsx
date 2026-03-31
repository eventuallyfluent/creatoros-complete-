import Link from 'next/link'
import Image from 'next/image'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface CourseCardProps {
  slug:         string
  title:        string
  description?: string
  thumbnailUrl?: string
  price:        number
  compareAtPrice?: number
  currency?:    string
  instructor?:  { name: string; avatarUrl?: string }
  // If the current user owns this course
  enrollment?: {
    progressPercent: number
    lessonsCompleted: number
    totalLessons:     number
    lastLessonId?:    string
  }
  isFree?: boolean
  isNew?:  boolean
}

export default function CourseCard({
  slug, title, description, thumbnailUrl,
  price, compareAtPrice, currency = 'USD',
  instructor, enrollment, isFree, isNew,
}: CourseCardProps) {
  const isOwned = !!enrollment

  return (
    <article className="card" style={{ overflow: 'hidden' }}>
      {/* Thumbnail */}
      <Link href={isOwned ? `/portal/courses/${slug}` : `/courses/${slug}`}>
        <div style={{
          height: '180px',
          background: thumbnailUrl
            ? undefined
            : 'linear-gradient(135deg, #1A0A2E, #2D1045)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '11px',
              color: 'rgba(240,234,248,0.35)',
              letterSpacing: '0.1em',
            }}>
              PERSEUS ARCANE
            </div>
          )}
          {isNew && (
            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
              <Badge variant="accent">New</Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div style={{ padding: 'var(--s5)' }}>
        {/* Instructor */}
        {instructor && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', color: 'var(--text-muted)',
            marginBottom: '8px',
          }}>
            <div style={{
              width: '18px', height: '18px',
              borderRadius: '50%',
              background: 'var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 700, color: 'white',
              flexShrink: 0,
            }}>
              {instructor.name[0]}
            </div>
            {instructor.name}
          </div>
        )}

        {/* Title */}
        <Link
          href={isOwned ? `/portal/courses/${slug}` : `/courses/${slug}`}
          style={{ textDecoration: 'none' }}
        >
          <h3 style={{
            fontSize: '16px', fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '8px', lineHeight: 1.4,
          }}>
            {title}
          </h3>
        </Link>

        {/* Description */}
        {description && !isOwned && (
          <p style={{
            fontSize: '13px', color: 'var(--text-secondary)',
            lineHeight: 1.5, marginBottom: '16px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {description}
          </p>
        )}

        {/* Progress bar — owned courses */}
        {isOwned && enrollment && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '12px', color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}>
              <span>{enrollment.progressPercent}% complete</span>
              <span style={{ color: 'var(--accent)' }}>
                {enrollment.lessonsCompleted}/{enrollment.totalLessons} lessons
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${enrollment.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
        }}>
          {isOwned ? (
            <>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {enrollment!.progressPercent === 0 ? 'Not started' : 'In progress'}
              </span>
              <Button
                href={`/portal/courses/${slug}${enrollment?.lastLessonId ? `/${enrollment.lastLessonId}` : ''}`}
                variant="primary"
                size="sm"
              >
                {enrollment!.progressPercent === 0 ? 'Start →' : 'Continue →'}
              </Button>
            </>
          ) : (
            <>
              <div>
                {isFree ? (
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)' }}>Free</span>
                ) : (
                  <>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {currency} {price.toFixed(2)}
                    </span>
                    {compareAtPrice && compareAtPrice > price && (
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '8px' }}>
                        {compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </>
                )}
              </div>
              <Button href={`/courses/${slug}`} variant={isFree ? 'ghost' : 'primary'} size="sm">
                {isFree ? 'Enroll Free' : 'Enroll Now'}
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
