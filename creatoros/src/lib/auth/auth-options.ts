import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/db/prisma'
import { sendMagicLinkEmail } from '@/lib/email/magic-link'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    // PRIMARY: Magic link — passwordless email login
    EmailProvider({
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url }) {
        await sendMagicLinkEmail({ email, url, type: 'LOGIN' })
      },
    }),

    // OPTIONAL: Google OAuth
    // Enabled/disabled via GOOGLE_CLIENT_ID in env
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
    // When a new user is created via magic link — set default role
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data:  { role: 'STUDENT' },
      })
    },
  },

  session: { strategy: 'database' },
  secret:  process.env.NEXTAUTH_SECRET,
}
