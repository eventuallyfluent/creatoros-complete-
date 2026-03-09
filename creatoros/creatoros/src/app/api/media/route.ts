export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE      = 10 * 1024 * 1024 // 10 MB

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest)  {

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId   = (session.user as any).id
  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const courseId = formData.get('courseId') as string | null
  const altText  = formData.get('altText')  as string | null
  const tags     = (formData.get('tags') as string | null)?.split(',').map(t => t.trim()).filter(Boolean) ?? []

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `File type not allowed. Accepted: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum 10 MB.' }, { status: 400 })
  }

  const ext          = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath  = `media/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer       = Buffer.from(await file.arrayBuffer())

  const supabase = supabaseAdmin()
  const { error: uploadError } = await supabase.storage
    .from('creatoros')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('Supabase upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('creatoros')
    .getPublicUrl(storagePath)

  const asset = await prisma.mediaAsset.create({
    data: {
      uploaderId:  userId,
      filename:    file.name,
      url:         publicUrl,
      storagePath,
      mimeType:    file.type,
      size:        file.size,
      altText:     altText || null,
      tags,
      courseId:    courseId || null,
    },
  })

  return NextResponse.json(asset, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  const tag      = searchParams.get('tag')
  const page     = parseInt(searchParams.get('page') ?? '1')
  const limit    = 40

  const assets = await prisma.mediaAsset.findMany({
    where: {
      ...(courseId ? { OR: [{ courseId }, { courseId: null }] } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    skip:    (page - 1) * limit,
    take:    limit,
  })

  return NextResponse.json(assets)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  const asset   = await prisma.mediaAsset.findUnique({ where: { id } })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete from Supabase storage
  const supabase = supabaseAdmin()
  await supabase.storage.from('creatoros').remove([asset.storagePath])

  await prisma.mediaAsset.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}