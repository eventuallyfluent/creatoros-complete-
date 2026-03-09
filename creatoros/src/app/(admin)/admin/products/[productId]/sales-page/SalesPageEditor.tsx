'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, GripVertical, Trash2, Plus, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb',
  borderRadius: '8px', fontSize: '14px', color: '#111827',
  outline: 'none', fontFamily: 'inherit', background: '#f9fafb', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280',
  marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.05em',
}

const BLOCK_META: Record<string, { icon: string; label: string }> = {
  HERO: { icon: '🌟', label: 'Hero' }, TEXT: { icon: '📝', label: 'Text Block' },
  IMAGE: { icon: '🖼️', label: 'Image' }, BENEFITS: { icon: '✅', label: 'Benefits' },
  CURRICULUM: { icon: '📚', label: 'Content List' }, INSTRUCTOR: { icon: '👤', label: 'Instructor' },
  TESTIMONIALS: { icon: '💬', label: 'Testimonials' }, FAQ: { icon: '❓', label: 'FAQ' },
  CTA: { icon: '🎯', label: 'Call to Action' }, DIVIDER: { icon: '—', label: 'Divider' },
}

function PromptField({ question, questionKey, answer, answerKey, onChange, multiline = false, placeholder = '' }: any) {
  const [editingQ, setEditingQ] = useState(false)
  return (
    <div style={{ marginBottom: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '9px 14px', background: '#f9fafb', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {editingQ ? (
          <input value={question} onChange={e => onChange(questionKey, e.target.value)} onBlur={() => setEditingQ(false)} autoFocus
            style={{ ...inp, padding: '3px 7px', fontSize: '12px', fontWeight: 600, flex: 1 }} />
        ) : (
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151', flex: 1 }}>{question}</span>
        )}
        <button onClick={() => setEditingQ(v => !v)}
          style={{ fontSize: '10px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', fontFamily: 'inherit' }}>
          {editingQ ? 'done' : 'edit question'}
        </button>
      </div>
      <div style={{ padding: '10px 14px' }}>
        {multiline
          ? <textarea value={answer} onChange={e => onChange(answerKey, e.target.value)} placeholder={placeholder} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
          : <input value={answer} onChange={e => onChange(answerKey, e.target.value)} placeholder={placeholder} style={inp} />}
      </div>
    </div>
  )
}

function BlockContentEditor({ type, content, onChange }: { type: string; content: any; onChange: (c: any) => void }) {
  const set = (k: string, v: any) => onChange({ ...content, [k]: v })
  const F = ({ label, children, hint }: any) => (
    <div style={{ marginBottom: '11px' }}>
      <label style={lbl}>{label}</label>{children}
      {hint && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>{hint}</p>}
    </div>
  )
  const Tog = ({ label, field }: any) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginBottom: '6px' }}>
      <input type="checkbox" checked={!!content[field]} onChange={e => set(field, e.target.checked)} style={{ width: '14px', height: '14px', accentColor: '#7B2FBE' }} />
      <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
    </label>
  )
  const ListField = ({ field, placeholder }: { field: string; placeholder: string }) => (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '6px' }}>
        {(content[field] ?? []).map((item: string, i: number) => (
          <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ color: '#9ca3af', flexShrink: 0 }}>·</span>
            <input value={item} onChange={e => { const a = [...(content[field] ?? [])]; a[i] = e.target.value; set(field, a) }} placeholder={placeholder} style={{ ...inp, flex: 1 }} />
            <button onClick={() => set(field, (content[field] ?? []).filter((_: any, idx: number) => idx !== i))} style={{ width: '28px', height: '34px', border: '1px solid #fecaca', borderRadius: '6px', background: 'white', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Trash2 size={10} /></button>
          </div>
        ))}
      </div>
      <button onClick={() => set(field, [...(content[field] ?? []), ''])} style={{ fontSize: '11px', color: '#7B2FBE', background: 'none', border: '1px dashed #d1d5db', borderRadius: '5px', padding: '4px 9px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}><Plus size={10} /> Add</button>
    </div>
  )
  switch (type) {
    case 'HERO': return <><F label="Headline"><input value={content.headline ?? ''} onChange={e => set('headline', e.target.value)} style={inp} /></F><F label="Subheadline"><input value={content.subheadline ?? ''} onChange={e => set('subheadline', e.target.value)} style={inp} /></F><F label="CTA Button Label"><input value={content.ctaLabel ?? ''} onChange={e => set('ctaLabel', e.target.value)} placeholder="Enrol Now" style={inp} /></F><F label="Below-button text"><input value={content.ctaSubtext ?? ''} onChange={e => set('ctaSubtext', e.target.value)} style={inp} /></F><F label="Badge labels"><ListField field="badgeLabels" placeholder="e.g. Lifetime access" /></F></>
    case 'TEXT': return <><F label="Heading (optional)"><input value={content.heading ?? ''} onChange={e => set('heading', e.target.value || undefined)} placeholder="(no heading)" style={inp} /></F><F label="Body"><textarea value={content.body ?? ''} onChange={e => set('body', e.target.value)} rows={5} style={{ ...inp, resize: 'vertical' }} /></F><F label="Alignment"><div style={{ display: 'flex', gap: '6px' }}>{(['left','center'] as const).map(a => <button key={a} onClick={() => set('align', a)} style={{ padding: '5px 12px', borderRadius: '6px', border: content.align === a ? '2px solid #7B2FBE' : '1px solid #e5e7eb', background: content.align === a ? 'rgba(123,47,190,0.06)' : 'white', color: content.align === a ? '#7B2FBE' : '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{a.charAt(0).toUpperCase()+a.slice(1)}</button>)}</div></F></>
    case 'BENEFITS': return <><F label="Section Heading"><input value={content.heading ?? ''} onChange={e => set('heading', e.target.value)} style={inp} /></F><F label="Items"><ListField field="items" placeholder="e.g. Understand the core principles" /></F></>
    case 'CURRICULUM': return <><F label="Section Heading" hint='e.g. "Curriculum", "Programme", "Course Content"'><input value={content.heading ?? ''} onChange={e => set('heading', e.target.value)} style={inp} /></F><Tog label="Show lesson count per module" field="showLessonCount" /><Tog label="Show durations (only when data exists)" field="showDurations" /><Tog label='Show "Free preview" label' field="showFreePreview" /><Tog label="Expand first module by default" field="expandFirst" /></>
    case 'INSTRUCTOR': return <><F label="Section Heading"><input value={content.heading ?? ''} onChange={e => set('heading', e.target.value)} placeholder="Your Instructor" style={inp} /></F><Tog label="Show instructor avatar" field="showAvatar" /><Tog label="Show instructor bio" field="showBio" /><F label="Bio override" hint="Leave blank to use the instructor profile bio"><textarea value={content.bioOverride ?? ''} onChange={e => set('bioOverride', e.target.value || null)} rows={3} placeholder="(uses instructor profile bio)" style={{ ...inp, resize: 'vertical' }} /></F></>
    case 'TESTIMONIALS': return <><F label="Section Heading"><input value={content.heading ?? ''} onChange={e => set('heading', e.target.value)} style={inp} /></F><Tog label="Auto-populate from approved testimonials" field="pullFromApproved" /></>
    case 'FAQ': return <><F label="Section Heading"><input value={content.heading ?? ''} onChange={e => set('heading', e.target.value)} style={inp} /></F><div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '7px' }}>{(content.items ?? []).map((item: any, i: number) => <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px' }}><div style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}><input value={item.question} onChange={e => { const a=[...(content.items??[])]; a[i]={...item,question:e.target.value}; set('items',a) }} placeholder="Question" style={{ ...inp, flex: 1, fontSize: '12px' }} /><button onClick={() => set('items',(content.items??[]).filter((_:any,idx:number)=>idx!==i))} style={{ width:'28px',height:'34px',border:'1px solid #fecaca',borderRadius:'6px',background:'white',color:'#ef4444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Trash2 size={10}/></button></div><textarea value={item.answer} onChange={e => { const a=[...(content.items??[])]; a[i]={...item,answer:e.target.value}; set('items',a) }} rows={2} style={{ ...inp, resize: 'vertical', fontSize: '12px' }} placeholder="Answer"/></div>)}</div><button onClick={() => set('items',[...(content.items??[]),{question:'',answer:''}])} style={{ fontSize:'11px',color:'#7B2FBE',background:'none',border:'1px dashed #d1d5db',borderRadius:'5px',padding:'4px 9px',cursor:'pointer',fontFamily:'inherit',fontWeight:600,display:'flex',alignItems:'center',gap:'3px' }}><Plus size={10}/> Add Q</button></>
    case 'CTA': return <><F label="Heading (optional)"><input value={content.heading ?? ''} onChange={e => set('heading', e.target.value || undefined)} style={inp} /></F><F label="Button Label"><input value={content.buttonLabel ?? ''} onChange={e => set('buttonLabel', e.target.value)} placeholder="Enrol Now" style={inp} /></F><F label="Below-button text"><input value={content.buttonSubtext ?? ''} onChange={e => set('buttonSubtext', e.target.value)} style={inp} /></F></>
    case 'DIVIDER': return <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Ornamental divider — no settings.</p>
    default: return <p style={{ fontSize: '13px', color: '#9ca3af' }}>Unknown type: {type}</p>
  }
}

function BlockRow({ block, onToggle, onDelete, onMove, isFirst, isLast, expanded, onExpand, onUpdateContent }: any) {
  const meta      = BLOCK_META[block.type] ?? { icon: '□', label: block.type }
  const singleton = ['HERO','CURRICULUM','INSTRUCTOR'].includes(block.type)
  const c         = block.content ?? {}
  return (
    <div style={{ background: 'white', border: `1px solid ${expanded ? 'rgba(123,47,190,0.4)' : '#e5e7eb'}`, borderRadius: '10px', overflow: 'hidden', opacity: block.visible ? 1 : 0.55 }}>
      <div onClick={onExpand} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 13px', cursor: 'pointer', background: expanded ? 'rgba(123,47,190,0.03)' : 'white', userSelect: 'none' }}>
        <GripVertical size={13} style={{ color: '#d1d5db', flexShrink: 0 }} />
        <span style={{ fontSize: '15px', flexShrink: 0 }}>{meta.icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', flex: 1 }}>
          {meta.label}
          {!block.visible && <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '7px', fontWeight: 400 }}>hidden</span>}
          {(c.heading || c.headline) && <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '7px', fontWeight: 400 }}>"{c.heading || c.headline}"</span>}
        </span>
        <div style={{ display: 'flex', gap: '2px' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onMove(-1)} disabled={isFirst} style={{ width:'22px',height:'22px',border:'1px solid #e5e7eb',borderRadius:'4px',background:'white',cursor:isFirst?'not-allowed':'pointer',fontSize:'9px',opacity:isFirst?0.4:1 }}>↑</button>
          <button onClick={() => onMove(1)} disabled={isLast} style={{ width:'22px',height:'22px',border:'1px solid #e5e7eb',borderRadius:'4px',background:'white',cursor:isLast?'not-allowed':'pointer',fontSize:'9px',opacity:isLast?0.4:1 }}>↓</button>
        </div>
        <button onClick={e => { e.stopPropagation(); onToggle() }} style={{ width:'26px',height:'26px',border:'1px solid #e5e7eb',borderRadius:'5px',background:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:block.visible?'#7B2FBE':'#d1d5db',flexShrink:0 }}>
          {block.visible ? <Eye size={11}/> : <EyeOff size={11}/>}
        </button>
        {!singleton && <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ width:'26px',height:'26px',border:'1px solid #fecaca',borderRadius:'5px',background:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#ef4444',flexShrink:0 }}><Trash2 size={10}/></button>}
        <span style={{ color: '#9ca3af', fontSize: '10px' }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{ padding: '13px 15px', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
          <BlockContentEditor type={block.type} content={c} onChange={onUpdateContent} />
        </div>
      )}
    </div>
  )
}

export default function SalesPageEditor({ product, allModules = [] }: { product: any; allModules?: any[] }) {
  const router   = useRouter()
  const prompts  = product.salesPrompts ?? {}
  const [promptData, setPromptData] = useState<Record<string,string>>({
    q_headline: prompts.q_headline ?? 'What is the headline for this course?',
    q_subheadline: prompts.q_subheadline ?? 'What is the supporting statement?',
    q_problem: prompts.q_problem ?? 'What problem does this course solve?',
    q_whoIsItFor: prompts.q_whoIsItFor ?? 'Who is this course for?',
    q_benefits: prompts.q_benefits ?? 'What are the main benefits? (one per line)',
    q_transformation: prompts.q_transformation ?? 'What outcome or transformation will students experience?',
    q_whatsIncluded: prompts.q_whatsIncluded ?? 'What is included? (one per line)',
    q_curriculumSummary: prompts.q_curriculumSummary ?? 'Briefly describe the curriculum or structure',
    q_instructorBio: prompts.q_instructorBio ?? 'Why are you the right person to teach this?',
    q_ctaText: prompts.q_ctaText ?? 'What should the call-to-action button say?',
    q_ctaSubtext: prompts.q_ctaSubtext ?? 'Any supporting text below the button?',
    headline: prompts.headline ?? '',
    subheadline: prompts.subheadline ?? '',
    problem: prompts.problem ?? '',
    whoIsItFor: prompts.whoIsItFor ?? '',
    benefits: prompts.benefits ?? '',
    transformation: prompts.transformation ?? '',
    whatsIncluded: prompts.whatsIncluded ?? '',
    curriculumSummary: prompts.curriculumSummary ?? '',
    instructorBio: prompts.instructorBio ?? '',
    ctaText: prompts.ctaText ?? '',
    ctaSubtext: prompts.ctaSubtext ?? '',
  })
  const [blocks,       setBlocks]       = useState<any[]>(product.salesPage?.blocks ?? [])
  const [expandedId,   setExpandedId]   = useState<string|null>(null)
  const [savingP,      setSavingP]      = useState(false)
  const [savingB,      setSavingB]      = useState(false)
  const [savedP,       setSavedP]       = useState(false)
  const [savedB,       setSavedB]       = useState(false)
  const [error,        setError]        = useState<string|null>(null)
  const [promptsOpen,  setPromptsOpen]  = useState(true)

  const setP = (k: string, v: string) => setPromptData(p => ({ ...p, [k]: v }))

  const savePrompts = async () => {
    setSavingP(true); setError(null)
    const res  = await fetch(`/api/admin/products/${product.id}/sales-page/prompts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(promptData) })
    const data = await res.json()
    setSavingP(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    if (data.blocks) setBlocks(data.blocks)
    setSavedP(true); setTimeout(() => setSavedP(false), 2500)
    router.refresh()
  }

  const saveBlocks = async () => {
    setSavingB(true); setError(null)
    const res  = await fetch(`/api/admin/products/${product.id}/sales-page/blocks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks }) })
    const data = await res.json()
    setSavingB(false)
    if (!res.ok) { setError(data.error ?? 'Save failed'); return }
    setSavedB(true); setTimeout(() => setSavedB(false), 2500)
  }

  const updateBlock  = (id: string, c: any) => setBlocks(bs => bs.map(b => b.id === id ? { ...b, content: c } : b))
  const toggleBlock  = (id: string) => setBlocks(bs => bs.map(b => b.id === id ? { ...b, visible: !b.visible } : b))
  const deleteBlock  = (id: string) => setBlocks(bs => bs.filter(b => b.id !== id))
  const moveBlock    = (id: string, dir: -1|1) => {
    const idx = blocks.findIndex(b => b.id === id)
    if (idx + dir < 0 || idx + dir >= blocks.length) return
    const n = [...blocks]; [n[idx], n[idx+dir]] = [n[idx+dir], n[idx]]; setBlocks(n)
  }
  const addBlock = (type: string) => {
    const id = Math.random().toString(36).slice(2)
    const defaults: Record<string,any> = { TEXT: { body:'', align:'left' }, BENEFITS: { heading:'Benefits', items:[] }, TESTIMONIALS: { heading:'Student Reviews', pullFromApproved:true, items:[] }, FAQ: { heading:'FAQ', items:[] }, CTA: { buttonLabel:'Enrol Now', buttonSubtext:'' }, DIVIDER: { symbol:'✦' }, IMAGE: { altText:'' } }
    setBlocks(bs => [...bs, { id, type, visible:true, content: defaults[type]??{}, salesPageId: product.salesPage?.id }])
    setExpandedId(id)
  }

  const saveBtn = (saving: boolean, saved: boolean, label: string) => ({
    style: { padding:'10px 20px', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', background:saved?'#10b981':saving?'#e5e7eb':'#7B2FBE', color:(saved||!saving)?'white':'#9ca3af', transition:'background 0.2s' } as React.CSSProperties,
  })

  const promptFields = [
    { qKey:'q_headline',          aKey:'headline',          multi:false, placeholder:'e.g. Master the Ancient Art of Hermetics' },
    { qKey:'q_subheadline',       aKey:'subheadline',       multi:false, placeholder:'e.g. A practical, structured course for serious students' },
    { qKey:'q_problem',           aKey:'problem',           multi:true,  placeholder:'Describe the problem students face before finding this course…' },
    { qKey:'q_whoIsItFor',        aKey:'whoIsItFor',        multi:true,  placeholder:'This course is for…' },
    { qKey:'q_benefits',          aKey:'benefits',          multi:true,  placeholder:'One benefit per line:\n- Understand the seven principles\n- Apply Hermetic law daily…' },
    { qKey:'q_transformation',    aKey:'transformation',    multi:true,  placeholder:'By the end of this course, students will…' },
    { qKey:'q_whatsIncluded',     aKey:'whatsIncluded',     multi:true,  placeholder:'One item per line:\n- 12 video lessons\n- Downloadable workbook…' },
    { qKey:'q_curriculumSummary', aKey:'curriculumSummary', multi:true,  placeholder:'Optional — describe how the course is structured' },
    { qKey:'q_instructorBio',     aKey:'instructorBio',     multi:true,  placeholder:'Why are you the right person to teach this?' },
    { qKey:'q_ctaText',           aKey:'ctaText',           multi:false, placeholder:'e.g. Enrol Now · Join the Course · Start Learning' },
    { qKey:'q_ctaSubtext',        aKey:'ctaSubtext',        multi:false, placeholder:'e.g. 30-day money-back guarantee' },
  ]

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', maxWidth:'1100px', alignItems:'start' }}>
      {/* Prompts */}
      <div>
        <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:'12px', overflow:'hidden', marginBottom:'14px' }}>
          <button onClick={() => setPromptsOpen(v => !v)} style={{ width:'100%', padding:'13px 17px', background:'#f9fafb', border:'none', borderBottom: promptsOpen?'1px solid #e5e7eb':'none', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', fontFamily:'inherit' }}>
            <div style={{ textAlign:'left' }}>
              <p style={{ fontSize:'14px', fontWeight:700, color:'#111827', margin:0 }}>Content Prompts</p>
              <p style={{ fontSize:'11px', color:'#9ca3af', margin:'2px 0 0' }}>Answer to populate your sales page. Click "edit question" to rename any prompt.</p>
            </div>
            {promptsOpen ? <ChevronDown size={15} style={{ color:'#9ca3af' }}/> : <ChevronRight size={15} style={{ color:'#9ca3af' }}/>}
          </button>
          {promptsOpen && (
            <div style={{ padding:'16px' }}>
              {promptFields.map(f => <PromptField key={f.aKey} question={promptData[f.qKey]} questionKey={f.qKey} answer={promptData[f.aKey]} answerKey={f.aKey} onChange={setP} multiline={f.multi} placeholder={f.placeholder} />)}
            </div>
          )}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          {error && <p style={{ fontSize:'12px', color:'#ef4444', margin:0 }}>{error}</p>}
          <div style={{ marginLeft:'auto', display:'flex', gap:'8px', alignItems:'center' }}>
            <a href={`/courses/${product.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:'12px', color:'#6b7280', textDecoration:'none', display:'flex', alignItems:'center', gap:'3px' }}><ExternalLink size={11}/> Preview</a>
            <button onClick={savePrompts} disabled={savingP} {...saveBtn(savingP,savedP,'')}>
              {savedP ? '✓ Saved!' : savingP ? 'Saving…' : 'Save Prompts'}
            </button>
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div>
        <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'14px 17px', marginBottom:'10px' }}>
          <p style={{ fontSize:'14px', fontWeight:700, color:'#111827', margin:'0 0 3px' }}>Page Blocks</p>
          <p style={{ fontSize:'11px', color:'#9ca3af', margin:0 }}>Reorder, show/hide, or fine-tune each section. Saving prompts auto-updates blocks.</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'10px' }}>
          {blocks.length === 0 ? (
            <div style={{ border:'1px dashed #e5e7eb', borderRadius:'10px', padding:'28px', textAlign:'center' }}>
              <p style={{ color:'#9ca3af', fontSize:'13px', margin:0 }}>No blocks yet. Fill in the prompts and save to generate your page.</p>
            </div>
          ) : blocks.map((block, idx) => (
            <BlockRow key={block.id} block={block} isFirst={idx===0} isLast={idx===blocks.length-1}
              expanded={expandedId===block.id} onExpand={() => setExpandedId(expandedId===block.id?null:block.id)}
              onToggle={() => toggleBlock(block.id)} onDelete={() => deleteBlock(block.id)}
              onMove={dir => moveBlock(block.id, dir)} onUpdateContent={c => updateBlock(block.id, c)} />
          ))}
        </div>
        <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:'9px', padding:'12px 14px', marginBottom:'10px' }}>
          <p style={{ fontSize:'10px', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 7px' }}>Add Section</p>
          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
            {['TEXT','BENEFITS','TESTIMONIALS','FAQ','CTA','DIVIDER','IMAGE'].map(type => {
              const m = BLOCK_META[type]
              return <button key={type} onClick={() => addBlock(type)} style={{ display:'flex', alignItems:'center', gap:'3px', padding:'5px 10px', background:'white', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'11px', fontWeight:600, color:'#374151', cursor:'pointer', fontFamily:'inherit' }}>{m?.icon} {m?.label}</button>
            })}
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button onClick={saveBlocks} disabled={savingB} {...saveBtn(savingB,savedB,'')}>
            {savedB ? '✓ Saved!' : savingB ? 'Saving…' : 'Save Blocks'}
          </button>
        </div>
      </div>
    </div>
  )
}
