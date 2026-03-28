import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import crypto from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { sendMagicLinkEmail } from '@/lib/email/magic-link'

// Admin credentials — must be set via environment variables.
// ADMIN_EMAIL and ADMIN_PASSWORD are required in production; the server will
// refuse to start without them. Do NOT add fallback values here.
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (process.env.NODE_ENV === 'production' && (!ADMIN_EMAIL || !ADMIN_PASSWORD)) {
  throw new Error(
    'Missing required environment variables: ADMIN_EMAIL and ADMIN_PASSWORD must be set.'
  )
}

/**
 * Timing-safe string comparison — prevents timing-based credential enumeration.
 * Always performs the HMAC even on length mismatch to avoid leaking length info.
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  // Perform a dummy compare on the shorter buffer so execution time is constant
  const maxLen = Math.max(bufA.length, bufB.length)
  const paddedA = Buffer.concat([bufA, Buffer.alloc(maxLen - bufA.length)])
  const paddedB = Buffer.concat([bufB, Buffer.alloc(maxLen - bufB.length)])
  const equal = crypto.timingSafeEqual(paddedA, paddedB)
  // Also check lengths — must both match for a true equal
  return equal && bufA.length === bufB.length
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    // ADMIN: hardcoded password login
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return null
        if (
          credentials?.email === ADMIN_EMAIL &&
          timingSafeStringEqual(credentials?.password ?? '', ADMIN_PASSWORD)
        ) {
          const user = await prisma.user.upsert({
            where:  { email: ADMIN_EMAIL },
            update: { role: 'ADMIN' },
            create: {
              email: ADMIN_EMAIL,
              name:  'Admin',
              role:  'ADMIN',
              gdprConsent: true,
            },
          })
          return { id: user.id, email: user.email, name: user.name, role: user.role }
        }
        return null
      },
    }),

    // STUDENTS: magic link
    EmailProvider({
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url }) {
        await sendMagicLinkEmail({ email, url, type: 'LOGIN' })
      },
    }),
  ],

  pages: {
    signIn:        '/login',
    verifyRequest: '/login/verify',
    error:         '/login/error',
  },

  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id   = (user?.id   ?? token?.id)   as string
        session.user.role = (user?.role ?? token?.role ?? 'STUDENT') as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = (user as any).role ?? 'STUDENT'
      }
      return token
    },
  },

  events: {
    async createUser({ user }) {
      if (user.email !== ADMIN_EMAIL) {
        await prisma.user.update({
          where: { id: user.id },
          data:  { role: 'STUDENT' },
        })
      }
    },
  },

  session: { strategy: 'jwt' },
  secret:  process.env.NEXTAUTH_SECRET,
}
