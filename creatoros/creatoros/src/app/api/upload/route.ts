export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { nanoid } from 'nanoid'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_FILE_TYPES  = [...ALLOWED_IMAGE_TYPES, 'application/pdf', 'application/zip', 'video/mp4']
const MAX_IMAGE_SIZE = 5  * 1024 * 1024  // 5MB
const MAX_FILE_SIZE  = 50 * 1024 * 1024  // 50MB

const BUCKET      = 'creatoros'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
  }

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const folder   = (formData.get('folder') as string) ?? 'uploads'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const isImage = folder === 'thumbnails' || folder === 'avatars' || folder === 'banners'
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE
  const allowed = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES

  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: `File type ${file.type} not allowed` }, { status: 400 })
  }
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File too large. Max ${maxSize / 1024 / 1024}MB` }, { status: 400 })
  }

  const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const filename = `${folder}/${nanoid(12)}.${ext}`

  const bytes  = await file.arrayBuffer()

  // Use Supabase Storage REST API directly — works with all key formats
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${filename}`
  const uploadRes = await fetch(uploadUrl, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type':  file.type,
      'x-upsert':      'false',
    },
    body: bytes,
  })

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => uploadRes.statusText)
    console.error('Supabase storage upload error:', uploadRes.status, errText)
    return NextResponse.json({ error: `Upload failed: ${errText}` }, { status: 500 })
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${filename}`
  return NextResponse.json({ url: publicUrl, filename })
}
