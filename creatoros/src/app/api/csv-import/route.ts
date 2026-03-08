import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { rows, courseId } = await req.json()

  if (!rows?.length) return NextResponse.json({ error: 'No rows provided' }, { status: 400 })

  let imported = 0
  let skipped  = 0
  const errors: string[] = []

  for (const row of rows as { email: string; name?: string }[]) {
    try {
      const email = row.email.toLowerCase().trim()

      // Upsert user — won't overwrite existing names
      const user = await prisma.user.upsert({
        where:  { email },
        create: {
          email,
          name:          row.name || null,
          role:          'STUDENT',
          emailVerified: new Date(), // Pre-verified — imported from trusted source
        },
        update: {
          // Only fill in name if not already set
          ...(row.name ? { name: { set: undefined } } : {}),
        },
      })

      const isNew = user.createdAt.getTime() > Date.now() - 5000
      if (isNew) imported++
      else skipped++

      // Enrol in course if specified
      if (courseId) {
        await prisma.enrollment.upsert({
          where:  { userId_courseId: { userId: user.id, courseId } },
          create: { userId: user.id, courseId, status: 'ACTIVE' },
          update: { status: 'ACTIVE' },
        })
      }
    } catch (err: any) {
      errors.push(`${row.email}: ${err.message}`)
    }
  }

  return NextResponse.json({ imported, skipped, errors })
}
