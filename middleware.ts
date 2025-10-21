import { withAuth } from 'next-auth/middleware'
import { UserRole } from '@prisma/client'

export default withAuth(
  function middleware(req) {
    // Middleware logikk kan legges til her senere
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Admin ruter krever ADMIN rolle
        if (pathname.startsWith('/admin')) {
          return token?.role === UserRole.ADMIN
        }

        // Dashboard ruter krever innlogging
        if (pathname.startsWith('/dashboard')) {
          return !!token
        }

        // API ruter som krever autentisering
        if (pathname.startsWith('/api/admin')) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/admin/:path*'
  ]
}