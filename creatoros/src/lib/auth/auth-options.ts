import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { prisma } from '@/lib/db/prisma'
import { sendMagicLinkEmail } from '@/lib/email/magic-link'

const ADMIN_EMAIL    = 'perseusarcaneacademy@gmail.com'
const ADMIN_PASSWORD = 'PerseusAdmin2025!'

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
        if (
          credentials?.email    === ADMIN_EMAIL &&
          credentials?.password === ADMIN_PASSWORD
        ) {
          const user = await prisma.user.upsert({
            where:  { email: ADMIN_EMAIL },
            update: { role: 'ADMIN' },
            create: {
              email: ADMIN_EMAIL,
              name:  'Simon Robinson',
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
