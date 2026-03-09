'use client'
import { useState } from 'react'
import ImportClient from './ImportClient'
import StudentImportClient from './StudentImportClient'

export default function ImportTabs() {
  const [tab, setTab] = useState<'courses' | 'students'>('courses')

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', fontSize: '14px', fontWeight: 600,
    borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
    background: active ? 'white' : 'transparent',
    color: active ? '#111827' : '#6b7280',
    borderBottom: active ? '2px solid #7B2FBE' : '2px solid transparent',
    fontFamily: 'var(--font-ui)',
    transition: 'color 0.15s',
  })

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '24px', gap: '4px' }}>
        <button style={tabStyle(tab === 'courses')}  onClick={() => setTab('courses')}>📚 Course Import</button>
        <button style={tabStyle(tab === 'students')} onClick={() => setTab('students')}>👥 Student Migration</button>
      </div>
      {tab === 'courses'  && <ImportClient />}
      {tab === 'students' && <StudentImportClient />}
    </div>
  )
}
