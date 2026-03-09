'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface SearchResult {
  type:  'course' | 'instructor' | 'collection'
  id:    string; slug: string; title: string; meta: string; image: string | null; href: string
}

const TYPE_LABEL: Record<string,string> = { course: 'Course', instructor: 'Instructor', collection: 'Collection' }
const TYPE_ICON:  Record<string,string> = { course: '📚',     instructor: '👤',         collection: '📂' }

export default function SearchOverlay() {
  const [open,     setOpen]     = useState(false)
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<SearchResult[]>([])
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(-1)
  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const router      = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50) }
    else       { setQuery(''); setResults([]); setSelected(-1) }
  }, [open])

  const search = useCallback((q: string) => {
    clearTimeout(debounceRef.current)
    if (q.length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? []); setLoading(false); setSelected(-1)
    }, 180)
  }, [])

  const handleKey = (e: React.KeyboardEvent) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, -1)) }
    if (e.key === 'Enter' && selected >= 0) { router.push(results[selected].href); setOpen(false) }
  }

  const SearchIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  )

  if (!open) return (
    <button onClick={() => setOpen(true)} title="Search (⌘K)" style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 'var(--r-pill)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-ui)', transition: 'all 0.15s' }} className="search-trigger-hover">
      <SearchIcon />
      <span className="hide-mobile">Search</span>
      <kbd className="hide-mobile" style={{ fontSize: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', padding: '1px 5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>⌘K</kbd>
    </button>
  )

  return (
    <>
      <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', width: 'min(620px, calc(100vw - 32px))', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', zIndex: 201, overflow: 'hidden' }}>

        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: query ? '1px solid var(--border)' : '1px solid transparent' }}>
          <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><SearchIcon /></span>
          <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); search(e.target.value) }} onKeyDown={handleKey}
            placeholder="Search courses, instructors, collections…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '16px', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }} />
          {loading && <div style={{ width: '16px', height: '16px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', flexShrink: 0 }} />}
          <kbd onClick={() => setOpen(false)} style={{ fontSize: '11px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px 7px', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {results.map((r, i) => (
              <Link key={r.id} href={r.href} onClick={() => setOpen(false)} onMouseEnter={() => setSelected(i)}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 20px', textDecoration: 'none', background: i === selected ? 'var(--accent-soft)' : 'transparent', transition: 'background 0.1s' }}
                className="search-result-hover">
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {r.image ? <Image src={r.image} alt={r.title} fill style={{ objectFit: 'cover' }} sizes="44px" /> : <span style={{ fontSize: '20px' }}>{TYPE_ICON[r.type]}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{r.meta}</p>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '2px 8px', flexShrink: 0 }}>{TYPE_LABEL[r.type]}</span>
              </Link>
            ))}
          </div>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>No results for "{query}"</p>
          </div>
        )}

        {results.length > 0 && (
          <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '16px' }}>
            {[['↑↓','navigate'],['↵','open'],['ESC','close']].map(([key,label]) => (
              <span key={key} style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <kbd style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 5px' }}>{key}</kbd>{label}
              </span>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .search-result-hover:hover{background:var(--accent-soft)!important;} .search-trigger-hover:hover{background:rgba(255,255,255,0.1)!important;border-color:rgba(192,132,252,0.3)!important;color:var(--text-primary)!important;}`}</style>
    </>
  )
}
