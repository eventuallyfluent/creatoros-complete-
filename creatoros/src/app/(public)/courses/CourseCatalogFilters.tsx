'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface Props {
  collections: { id: string; name: string; slug: string }[]
  instructors: { id: string; displayName: string; slug: string }[]
  currentFilters: Record<string, string | undefined>
}

export default function CourseCatalogFilters({ collections, instructors, currentFilters }: Props) {
  const router     = useRouter()
  const params     = useSearchParams()

  const updateFilter = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`/courses?${next.toString()}`)
  }, [params, router])

  const filterLabel = {
    fontSize: '11px', fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: '10px',
    display: 'block',
  }

  const filterOption = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 12px', borderRadius: 'var(--r-md)',
    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
    background: active ? 'var(--accent-soft)' : 'none',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    border: active ? '1px solid rgba(192,132,252,0.25)' : '1px solid transparent',
    transition: 'all 0.15s', width: '100%', textAlign: 'left' as const,
    fontFamily: 'var(--font-ui)',
  })

  return (
    <aside style={{
      position: 'sticky', top: 'calc(var(--nav-height) + 24px)',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: 'var(--s5)',
      display: 'flex', flexDirection: 'column', gap: 'var(--s5)',
    }}>
      {/* Search */}
      <div>
        <span style={filterLabel}>Search</span>
        <input
          type="text"
          placeholder="Search courses..."
          defaultValue={currentFilters.q ?? ''}
          onChange={e => updateFilter('q', e.target.value || null)}
          style={{
            width: '100%', background: 'var(--bg-elevated)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            padding: '9px 12px', fontSize: '13px', color: 'var(--text-primary)',
            outline: 'none', fontFamily: 'var(--font-ui)',
          }}
        />
      </div>

      {/* Sort */}
      <div>
        <span style={filterLabel}>Sort By</span>
        {[
          { label: 'Newest',        value: '' },
          { label: 'Price: Low → High', value: 'price_asc' },
          { label: 'Price: High → Low', value: 'price_desc' },
          { label: 'A → Z',         value: 'az' },
        ].map(({ label, value }) => (
          <button
            key={value}
            onClick={() => updateFilter('sort', value || null)}
            style={filterOption((currentFilters.sort ?? '') === value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Price */}
      <div>
        <span style={filterLabel}>Price</span>
        {[
          { label: 'All',  value: null },
          { label: 'Free', value: 'free' },
          { label: 'Paid', value: 'paid' },
        ].map(({ label, value }) => (
          <button
            key={label}
            onClick={() => updateFilter('price', value)}
            style={filterOption((currentFilters.price ?? null) === value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Collections */}
      {collections.length > 0 && (
        <div>
          <span style={filterLabel}>Collections</span>
          <button onClick={() => updateFilter('collection', null)} style={filterOption(!currentFilters.collection)}>
            All Collections
          </button>
          {collections.map(c => (
            <button
              key={c.id}
              onClick={() => updateFilter('collection', c.slug)}
              style={filterOption(currentFilters.collection === c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Instructors */}
      {instructors.length > 1 && (
        <div>
          <span style={filterLabel}>Instructor</span>
          <button onClick={() => updateFilter('instructor', null)} style={filterOption(!currentFilters.instructor)}>
            All Instructors
          </button>
          {instructors.map(i => (
            <button
              key={i.id}
              onClick={() => updateFilter('instructor', i.slug)}
              style={filterOption(currentFilters.instructor === i.slug)}
            >
              {i.displayName}
            </button>
          ))}
        </div>
      )}

      {/* Clear all */}
      {Object.values(currentFilters).some(Boolean) && (
        <button
          onClick={() => router.push('/courses')}
          style={{
            fontSize: '13px', color: 'var(--danger)', background: 'none',
            border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--r-md)',
            padding: '8px 12px', cursor: 'pointer', fontFamily: 'var(--font-ui)',
            transition: 'all 0.15s',
          }}
        >
          Clear Filters
        </button>
      )}
    </aside>
  )
}
