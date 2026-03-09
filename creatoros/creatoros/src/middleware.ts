import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Admin routes — require ADMIN role
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/portal', req.url))
      }
    }

    // Portal routes — require any authenticated user
    if (pathname.startsWith('/portal')) {
      if (!token) {
        return NextResponse.redirect(
          new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
        )
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Public routes always pass through
        if (
          pathname.startsWith('/courses') ||
          pathname.startsWith('/collections') ||
          pathname.startsWith('/instructors') ||
          pathname.startsWith('/blog') ||
          pathname.startsWith('/checkout') ||
          pathname.startsWith('/login') ||
          pathname.startsWith('/auth') ||
          pathname.startsWith('/api/webhooks') ||
          pathname === '/' ||
          pathname === '/faq' ||
          pathname === '/about' ||
          pathname === '/contact' ||
          pathname === '/privacy' ||
          pathname === '/terms'
        ) {
          return true
        }
        // Everything else needs a token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/portal/:path*',
    '/admin/:path*',
    '/api/courses/:path*',
    '/api/enrollments/:path*',
    '/api/orders/:path*',
    '/api/users/:path*',
  ],
}
