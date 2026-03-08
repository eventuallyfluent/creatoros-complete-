import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/db/prisma'
import { sendMagicLinkEmail } from '@/lib/email/magic-link'

const ADMIN_EMAIL = 'perseusarcaneacademy@gmail.com'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    // PRIMARY: Magic link — passwordless email login
    EmailProvider({
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url }) {
        if (email === ADMIN_EMAIL) {
          // Admin bypass — magic link printed to Vercel logs instead of email
          console.log('=== ADMIN MAGIC LINK ===')
          console.log(url)
          console.log('========================')
          return
        }
        await sendMagicLinkEmail({ email, url, type: 'LOGIN' })
      },
    }),

    // OPTIONAL: Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],

  pages: {
    signIn:        '/login',
    verifyRequest: '/login/verify',
    error:         '/login/error',
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id   = user.id
        session.user.role = (user as any).role ?? 'STUDENT'
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
      const role = user.email === ADMIN_EMAIL ? 'ADMIN' : 'STUDENT'
      await prisma.user.update({
        where: { id: user.id },
        data:  { role },
      })
    },
  },

  session: { strategy: 'database' },
  secret:  process.env.NEXTAUTH_SECRET,
}
