export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder'
  )
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_FILE_TYPES  = [...ALLOWED_IMAGE_TYPES, 'application/pdf', 'application/zip', 'video/mp4']
const MAX_IMAGE_SIZE = 5  * 1024 * 1024  // 5MB
const MAX_FILE_SIZE  = 50 * 1024 * 1024  // 50MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const folder   = (formData.get('folder') as string) ?? 'uploads'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const isImage  = folder === 'thumbnails' || folder === 'avatars' || folder === 'banners'
  const maxSize  = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE
  const allowed  = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES

  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: `File type ${file.type} not allowed` }, { status: 400 })
  }

  if (file.size > maxSize) {
    return NextResponse.json({ error: `File too large. Max ${maxSize / 1024 / 1024}MB` }, { status: 400 })
  }

  // Generate unique filename
  const ext      = file.name.split('.').pop() ?? 'bin'
  const filename = `${folder}/${nanoid(12)}.${ext}`

  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error } = await getSupabase().storage
    .from('creatoros')
    .upload(filename, buffer, {
      contentType:  file.type,
      cacheControl: '3600',
      upsert:       false,
    })

  if (error) {
    console.error('Supabase upload error:', error)
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = getSupabase().storage
    .from('creatoros')
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl, filename })
}
